---
layout: post
title: "The S3 Compatibility Trap: A Cloudflare R2 + Ruby SDK Gotcha"
date: 2026-02-19 12:00:00 -0500
last_modified_at: 2026-02-19 12:00:00 -0500
categories: [development]
tags: [activestorage, cloudflare, r2, storage, s3]
---

## Why even consider R2?

There are plenty of good reasons to use AWS S3 in a Rails application, and for most teams it works perfectly well.

However, one concern that comes up frequently is **cost over time**, especially when it comes to **egress (data transferred out of the service)**. If your application serves many files—images, PDFs, backups, etc.—those costs can grow quickly.

Because of that, I recently tried **Cloudflare R2**, an object storage service that aims to be **compatible with the S3 API** but **does not charge egress fees**.

That makes it especially attractive for:

- personal projects
- side projects
- apps serving a lot of downloads
- workloads already behind Cloudflare

Another nice part: since R2 is **S3-compatible**, you can use the same Ruby gem you would normally use for AWS.

```ruby
gem "aws-sdk-s3"
```

In theory, switching providers should be straightforward.

But I ran into a problem.

---

# Using Cloudflare R2 with Rails Active Storage

Since R2 exposes an **S3-compatible API**, you can configure it in Rails using the normal S3 service in `storage.yml`.

Example configuration:

```yaml
cloudflare:
  service: S3
  access_key_id: <%= ENV["R2_ACCESS_KEY_ID"] %>
  secret_access_key: <%= ENV["R2_SECRET_ACCESS_KEY"] %>
  region: auto
  bucket: <%= ENV["R2_BUCKET"] %>
  endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Then set it in your environment configuration:

```ruby
config.active_storage.service = :cloudflare
```

From Rails’ perspective, this behaves like any other S3-compatible storage provider.

However, this is where the checksum issue appears.

---

# The Checksum Issue

Recent versions of the AWS S3 SDK introduced additional **checksum validation behavior**.

Instead of sending a single checksum, the SDK may include **multiple checksum headers** when uploading files.

For example:

- MD5
- CRC32

This works perfectly with AWS S3, which supports multiple checksum types.

However, **Cloudflare R2 currently rejects requests containing multiple checksums**, which leads to this error:

```
Aws::S3::Errors::InvalidRequest:
You can only specify one checksum at a time.
```

---

## What’s happening under the hood

Here’s a simplified version of what the request flow looks like.

```
Rails App
   │
   │ Upload file
   ▼
aws-sdk-s3 (newer versions)
   │
   │ Adds multiple checksums
   │
   │  Content-MD5
   │  x-amz-checksum-crc32
   ▼
Cloudflare R2
   │
   │ ❌ Rejects request
   │
   ▼
InvalidRequest:
"You can only specify one checksum at a time"
```

With AWS S3, the same request would succeed because S3 supports multiple checksum algorithms.

---

# The Simple Fix

The easiest workaround is to **pin the AWS SDK to an earlier version** that does not automatically add the extra checksum.

```ruby
gem "aws-sdk-s3", "~> 1.100.0"
```

After doing this, uploads to R2 work normally again.

This avoids the automatic multi-checksum behavior introduced in later versions of the SDK.

---

# Quick S3 vs R2 Comparison

| Feature | AWS S3 | Cloudflare R2 |
|------|------|------|
| API | Native | S3-compatible |
| Egress fees | Yes | No |
| Ecosystem | Very mature | Growing |
| SDK compatibility | Full | Mostly compatible |
| Checksum support | Multiple algorithms supported | Limited compatibility |
| Typical use case | Enterprise workloads | Cost-efficient storage + CDN |

---

# A Subtle Problem With "S3-Compatible"

One subtle challenge of “S3-compatible” services is that the AWS SDK continues to evolve alongside S3 itself.

When the SDK introduces new defaults—like additional checksum headers—providers that only partially implement the S3 API can suddenly become incompatible.

This doesn’t mean the provider is broken; it just means the compatibility layer hasn’t caught up with the latest behavior of the SDK.

---

# Final Thoughts

Cloudflare R2 is a compelling alternative to S3, especially for projects that serve a lot of files and want to avoid egress costs.

Because it exposes an **S3-compatible API**, integrating it with Ruby applications is usually straightforward. However, since it’s not a full implementation of every S3 feature, you may run into compatibility issues like the checksum behavior described above.

The good news is that once you know the cause, the workaround is simple.

Sometimes the hardest part is just discovering **why the request fails in the first place**.
