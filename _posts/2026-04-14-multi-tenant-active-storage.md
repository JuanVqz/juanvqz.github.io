---
layout: post
title: "Multi-Tenant Active Storage Done Right"
date: 2026-04-14 09:00:00 -0600
last_modified_at: 2026-04-14 00:00:00 -0600
categories: [development]
tags: [rails, activestorage, s3, cloudflare, r2, multi-tenant, image-processing, doctors-journey]
---

## The Starting Point

The [Doctors app](/blog/upgrading-rails-from-5-to-8-seven-years/) — is a multi-tenant Rails 8.1 application. Each clinic gets its own subdomain: `demo.doctors.com`, `drasmith.doctors.com`, and so on. File storage goes to Cloudflare R2, which speaks the S3 API.

The multi-tenant part means files from different clinics need to live under separate paths in the same bucket. A patient photo for the `demo` clinic should end up at `demo/attachments/user/42/<key>`, not mixed in with everyone else's files.

The original solution was a monkey-patch. An initializer used `prepend` to inject tenant-aware key prefixing into Active Storage's `S3Service`:

```ruby
# config/initializers/active_storage_service_patch.rb
Rails.application.config.after_initialize do
  module ActiveStorage
    module S3ServicePrefix
      def upload(key, io, checksum: nil, **)
        instrument :upload, key: key, checksum: checksum do
          upload_key = prefix_key(key)
          super(upload_key, io, checksum:, **)
        end
      end

      # ... download, delete, exist? — all patched the same way

      private

      def prefix_key(key)
        hospital = ::Current.hospital_subdomain || "unknown"
        blob = ActiveStorage::Blob.find_by(key:)
        return "#{hospital}/attachments/#{key}" unless blob

        attachment = blob.attachments.first
        return "#{hospital}/attachments/#{key}" unless attachment

        model_name = attachment.record_type&.underscore || "unknown"
        record_id = attachment.record_id || 0
        "#{hospital}/attachments/#{model_name}/#{record_id}/#{key}"
      rescue
        "#{hospital}/attachments/#{key}"
      end
    end

    class Service::S3Service
      prepend S3ServicePrefix
    end
  end
end
```

It worked. For a while.

---

## Five Problems With One Monkey-Patch

### 1. Double Upload Logging

Look at the `upload` method above. It wraps the call in `instrument :upload`, but the original `S3Service#upload` already does that. Every upload generated two identical log entries. Not a crash — just noise that made debugging storage issues harder than it needed to be.

### 2. N+1 Queries on Every S3 Operation

The `prefix_key` method runs on **every** S3 call — upload, download, delete, exist check. Each time, it queries for the blob, then the attachment, then walks the record chain. That's at minimum two queries per operation, with no caching. Multiply that by variant generation and you're looking at a lot of unnecessary database load.

### 3. Background Jobs Had No Tenant Context

`Current.hospital_subdomain` comes from the web request. When Active Storage's `AnalyzeJob` runs in the background to extract image metadata, there's no request. `Current.hospital_subdomain` is `nil`. The fallback? `"unknown"`.

Files uploaded correctly from the web ended up with their analyzed versions under `unknown/attachments/...`. The blob metadata (width, height, content type) would fail to save because the `exist?` check looked in the wrong path.

### 4. Variants Were Broken

When Active Storage generates a variant (a resized thumbnail, for example), the "record" attached to the variant's blob is an `ActiveStorage::VariantRecord` — not a `User` or `Patient`. The monkey-patch tried to walk `attachment.record_type`, got `"ActiveStorage::VariantRecord"`, and had no way to find the hospital. Every variant fell through to the `Current.hospital_subdomain` fallback — which, as we just covered, is `nil` in background jobs.

### 5. Signed URLs Were Wrong

The monkey-patch overrode `upload`, `download`, `delete`, and `exist?`. It did **not** override `url`. Signed URLs pointed to the unprefixed key — a path that didn't exist in R2. Files uploaded correctly were undownloadable through Rails' built-in URL generation.

---

## The Solution: TenantS3Service

Instead of patching someone else's class, I wrote a proper subclass:

```ruby
# lib/active_storage/service/tenant_s3_service.rb
require "active_storage/service/s3_service"

module ActiveStorage
  class Service::TenantS3Service < Service::S3Service
    def upload(key, io, checksum: nil, **)
      super(prefixed(key), io, checksum:, **)
    end

    def download(key, &block)
      super(prefixed(key), &block)
    end

    def delete(key)
      super(prefixed(key))
    end

    def exist?(key)
      super(prefixed(key))
    end

    def url(key, **options)
      super(prefixed(key), **options)
    end

    # ... all other S3 methods get the same treatment

    private

    def prefixed(key)
      blob = ActiveStorage::Blob.find_by(key: key)
      return key unless blob

      cached = blob.metadata["storage_prefix"]
      return "#{cached}/#{key}" if cached.present?

      prefix = resolve_prefix(blob)
      cache_prefix!(blob, prefix) if prefix
      prefix ? "#{prefix}/#{key}" : key
    end
  end
end
```

Three things changed fundamentally.

**No monkey-patching.** It's a subclass registered through Rails' own service resolution. In `storage.yml`, you declare `service: TenantS3` and Rails finds `ActiveStorage::Service::TenantS3Service` automatically:

```yaml
cloudflare:
  service: TenantS3
  endpoint: https://<%= ENV["CLOUDFLARE_R2_ACCOUNT_ID"] %>.r2.cloudflarestorage.com
  access_key_id: <%= ENV["CLOUDFLARE_R2_ACCESS_KEY_ID"] %>
  secret_access_key: <%= ENV["CLOUDFLARE_R2_SECRET_ACCESS_KEY"] %>
  bucket: <%= ENV["CLOUDFLARE_R2_BUCKET"] %>
  region: auto
```

**The prefix is cached.** After the first resolution, the prefix gets stored in the blob's `metadata` column as `storage_prefix`. Every subsequent S3 operation for that blob is a single `find_by(key:)` — no attachment walking, no record chain traversal:

```ruby
def resolve_prefix(blob)
  owner, hospital = find_owner_and_hospital(blob)
  return nil unless hospital

  subdomain = hospital.subdomain
  return nil unless subdomain

  if owner
    "#{subdomain}/attachments/#{owner.class.name.underscore}/#{owner.id}"
  else
    "#{subdomain}/attachments"
  end
end

def cache_prefix!(blob, prefix)
  metadata = blob.metadata.merge("storage_prefix" => prefix)
  blob.update_column(:metadata, metadata)
rescue ActiveRecord::ActiveRecordError
  # Non-critical: next request will resolve again
end
```

**Variants resolve correctly.** The `find_owner_and_hospital` method knows how to walk the variant chain:

```ruby
def find_owner_and_hospital(blob)
  attachment = blob.attachments.first

  if attachment
    record = attachment.record

    # Direct attachment to a model with hospital
    if record.respond_to?(:hospital)
      return [record, record.hospital]
    end

    # Variant: walk up to the original blob's owner
    if record.is_a?(ActiveStorage::VariantRecord)
      original_attachment = record.blob.attachments
        .find { |a| a.record_type != "ActiveStorage::VariantRecord" }
      if original_attachment
        owner = original_attachment.record
        return [owner, owner.hospital] if owner.respond_to?(:hospital)
      end
    end
  end

  # Fallback: Current (works during web requests, including initial
  # upload when the attachment record doesn't exist yet)
  if Current.hospital_subdomain
    hospital = Hospital.find_by(subdomain: Current.hospital_subdomain)
    return [nil, hospital] if hospital
  end

  [nil, nil]
end
```

When a variant blob comes in, it walks: VariantRecord → original blob → attachments → User → Hospital. `Current.hospital_subdomain` is the fallback for two cases: background jobs where the attachment chain doesn't lead to a hospital, and — critically — **initial uploads**.

**The upload-timing gotcha:** Active Storage's `attach` creates the blob and uploads it to S3 *before* creating the attachment record. During upload, `blob.attachments` is empty. An early version of this code had `return [nil, nil] unless attachment` which bailed out before reaching the `Current.hospital_subdomain` fallback. The result: blobs uploaded without a prefix, but downloaded with one — `FileNotFoundError` on every file. The fix is to let the method fall through to the `Current` fallback when there's no attachment, which is exactly the situation during initial upload from a web request.

`Current` is a simple `ActiveSupport::CurrentAttributes` class that stores the hospital subdomain for the duration of a request:

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :hospital_subdomain
end
```

An `ActiveStorageContext` concern in the controller sets this from `current_hospital&.subdomain` before any Active Storage operations run. This ensures tenant context is available throughout the request lifecycle.

---

## Avatar Variants and image_processing

With the storage layer fixed, I could actually use Active Storage variants for user avatars. Active Storage delegates image transformations to the `image_processing` gem, which wraps ImageMagick or libvips. Without it, `has_one_attached :avatar` works for storing files, but calling `.variant()` raises an error.

The avatar was moved from `Patient` and `Doctor` (STI children) up to `User` (the STI parent), so every role gets one:

```ruby
class User < ApplicationRecord
  has_one_attached :avatar do |attachable|
    attachable.variant :small, resize_to_fill: [32, 32]
    attachable.variant :thumbnail, resize_to_fill: [40, 40]
    attachable.variant :medium, resize_to_fill: [80, 80]
    attachable.variant :large, resize_to_fill: [150, 150]
  end
end
```

Named variants are lazy. The first time someone requests `user.avatar.variant(:thumbnail)`, Active Storage generates the 40x40 version, uploads it as a separate blob, and links it through a `VariantRecord`. Subsequent requests serve the cached variant directly. This is why the variant chain resolution in `TenantS3Service` matters — without it, the generated variant would end up in the wrong S3 path.

---

## Proxy Mode vs Redirect Mode

The old setup included a custom `ProxyStorageController` that reimplemented file streaming. That controller existed because Active Storage's default behavior in **redirect mode** generates a signed S3 URL and returns a 302 redirect. The browser follows the redirect directly to R2, which means:

- The S3 bucket URL is exposed to the client
- CORS headers must be configured on the bucket
- Signed URLs expire, breaking cached references

**Proxy mode** is the alternative. Rails streams the file through the application server — the browser only ever talks to your domain. One line in the environment config:

```ruby
config.active_storage.resolve_model_to_route = :rails_storage_proxy
```

Clean URLs, no CORS configuration, no exposed bucket URLs. The custom proxy controller was deleted. Rails already had this built in.

---

## The Results

The monkey-patch initializer was deleted. The custom proxy controller was deleted. Its test was deleted. What replaced them:

- **One file**: `lib/active_storage/service/tenant_s3_service.rb` — 117 lines of clean, testable code
- **One config change**: `service: TenantS3` in `storage.yml`
- **One line**: `resolve_model_to_route = :rails_storage_proxy` in `config/application.rb`
- **One concern**: `ActiveStorageContext` to set `Current.hospital_subdomain` from the request

Single upload per file — no double logging. AnalyzeJob works in the background because prefix resolution walks the database, not `Current`. Variants resolve correctly because the service knows how to traverse the VariantRecord chain. The prefix is cached in blob metadata, so repeated operations are fast.

---

## The Lesson

Monkey-patching framework internals with `prepend` feels productive in the moment. You get something working fast, and you move on. But the cost compounds. Every edge case the framework handles — variants, background jobs, signed URLs, direct uploads — is an edge case your patch has to handle too. And it won't, because you didn't know about those edge cases when you wrote it.

Rails' service layer is designed for extension through subclassing. `ActiveStorage::Service::S3Service` is a public class with a public interface. Subclassing it means you get every future improvement to the base class for free, and you only override what you actually need to change.

Sometimes the best refactor is replacing cleverness with the mechanism the framework already provides.
