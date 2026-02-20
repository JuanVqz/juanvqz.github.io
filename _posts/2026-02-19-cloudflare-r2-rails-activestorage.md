---
layout: post
title: "Cloudflare R2 + Rails: The S3-Compatible Storage That Won't Break the Bank"
date: 2026-02-19 12:00:00 -0500
last_modified_at: 2026-02-19 12:00:00 -0500
categories: [development]
tags: [activestorage, cloudflare, r2, storage, s3]
---

# Cloudflare R2 + Rails: The S3-Compatible Storage That Won't Break the Bank

Let's be honest: AWS S3 is great, but those egress fees? They hurt. Especially when you're building a side project or a startup and every dollar counts.

Enter **Cloudflare R2** — an S3-compatible object storage with **zero egress fees**. Yes, you read that right. Zero. Nada. Nothing.

In this guide, I'll show you how to wire up R2 with Rails' ActiveStorage. And yes, there's a gotcha with the AWS SDK version — I'll save you the headache I went through.

## Why R2?

- **Zero egress fees** — Download all you want, pay $0.
- **S3-compatible API** — Works with everything that supports S3.
- **Built-in CDN** — Global distribution out of the box.
- **Simple pricing** — No complicated tier structures.

## Step 1: Create Your R2 Bucket

Head to your [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **R2** → **Create Bucket**.

Name it something like `my-app-dev` for development and `my-app-prod` for production.

### Configure CORS

In your bucket settings, add this CORS policy so your app can upload files:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

## Step 2: Get Your API Credentials

1. In R2, under **Account Details**, click **Manage API Tokens** → **Create User API Token**.
2. Save your:
   - **Access Key ID**
   - **Secret Access Key** (shown only once — copy it now!)
3. Grab your **Account ID** from the dashboard URL

## Step 3: Add the Gem (⚠️ Important!)

Here's where things get tricky. Add this to your Gemfile:

```ruby
gem "aws-sdk-s3", "~> 1.100.0"
```

**Why version 1.100.0?** Because newer versions (1.120+) have a bug that causes them to send multiple checksums (MD5 + CRC32) to R2, and R2 rejects this with:

```
Aws::S3::Errors::InvalidRequest: You can only specify one checksum at a time.
```

This is a [known Rails issue](https://github.com/rails/rails/issues/54374). For now, pin to `~> 1.100.0`.

Run `bundle install`.

## Step 4: Configure Storage

In `config/storage.yml`:

```yaml
cloudflare:
  service: S3
  endpoint: https://<%= ENV["CLOUDFLARE_R2_ACCOUNT_ID"] %>.r2.cloudflarestorage.com
  access_key_id: <%= ENV["CLOUDFLARE_R2_ACCESS_KEY_ID"] %>
  secret_access_key: <%= ENV["CLOUDFLARE_R2_SECRET_ACCESS_KEY"] %>
  bucket: <%= ENV["CLOUDFLARE_R2_BUCKET"] %>
  region: auto
  http_proxy: ~
```

## Step 5: Set Environment Variables

Add to your `.env`:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET=my-app-dev
```

## Step 6: Update Rails Environments

In `config/environments/development.rb`:

```ruby
config.active_storage.service = :cloudflare
```

Do the same for your production environment!

## Bonus: Organize Files by Store (Multi-Tenant Apps)

If you're building a multi-tenant app (like I did), you might want files organized by tenant. Here's a trick using Rails' built-in `Current` attributes:

Create `app/models/current.rb`:

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :store_subdomain
end
```

Create a concern in `app/controllers/concerns/active_storage_context.rb`:

```ruby
module ActiveStorageContext
  extend ActiveSupport::Concern

  included do
    before_action :set_active_storage_context
  end

  private

  def set_active_storage_context
    Current.store_subdomain = current_store&.subdomain
  end
end
```

Include it in your `ApplicationController`:

```ruby
class ApplicationController < ActionController::Base
  include ActiveStorageContext
  # ...
end
```

Then create `config/initializers/active_storage_service_patch.rb`:

```ruby
require "active_storage/service/s3_service"

Rails.application.config.after_initialize do
  module ActiveStorage
    class Service::S3Service
      alias_method :original_upload, :upload
      # ... alias other methods

      def upload(key, body, **)
        original_upload(prefix_key(key), body, **)
      end

      private

      def prefix_key(key)
        store = ::Current.store_subdomain || "unknown"
        date = Date.today.strftime("%Y/%m")
        "#{store}/attachments/#{date}/#{key}"
      end
    end
  end
end
```

Now your files will be stored as: `oxxo/attachments/2026/02/abc123...`

## Testing It Out

Fire up your Rails server and upload a file. Check your R2 bucket — you should see the file there!

```ruby
# Quick test in console
blob = ActiveStorage::Blob.create_and_upload!(
  io: File.open("test.txt"),
  filename: "test.txt"
)
puts blob.url
```

### Verify Your Configuration

Before testing, make sure your environment variables are loaded:

```bash
# Check they're set
echo $CLOUDFLARE_R2_BUCKET
```

### Test Upload from Rails Console

```bash
rails console
```

```ruby
# Simple upload test
File.write('test_upload.txt', 'Hello from R2!')
blob = ActiveStorage::Blob.create_and_upload!(
  io: File.open('test_upload.txt'),
  filename: 'test_upload.txt',
  content_type: 'text/plain'
)
puts "Upload successful!"
puts "Key: #{blob.key}"
puts "URL: #{blob.url}"
File.delete('test_upload.txt')
```

If everything worked, you should see output like:

```
Upload successful!
Key: abc123def456...
URL: https://your-bucket.your-account-id.r2.cloudflarestorage.com/abc123...
```

### Check Your R2 Bucket

Log into your Cloudflare Dashboard → R2 → Your Bucket. You should see your uploaded file there!

### Test Download

```ruby
blob = ActiveStorage::Blob.last
puts blob.download.read
```

If you get the file content back, you're all set!

### Troubleshooting Common Issues

**"Missing service adapter for S3"**
- Make sure `aws-sdk-s3` is in your Gemfile and run `bundle install`

**"You can only specify one checksum at a time"**
- You're using a newer aws-sdk-s3 version. Pin to `~> 1.100.0`

**CORS errors in browser console**
- Check your bucket's CORS policy includes your origin

**Files go to root instead of prefixed path**
- Make sure the Current attribute is being set (check your controller includes the concern)

## Wrapping Up

Cloudflare R2 + Rails is a solid combo. Zero egress fees alone make it a winner for any project where users download files (think: avatars, documents, images).

The only gotcha? That AWS SDK version. Remember: `~> 1.100.0`.

Happy coding!

---

Questions? Find me on [Twitter](https://twitter.com/juanvqz_). I'd love to hear how R2 works out for you!
