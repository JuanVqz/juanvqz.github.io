---
layout: post
title: "Migrate sentry-raven to sentry-ruby gem in rails"
date: 2022-07-01 9:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, rails]
---

To be honest, following the
[`sentry` documentation](https://docs.sentry.io/platforms/ruby/migration)
was pretty straightforward.


## Change Gems

```ruby
# Old
gem "sentry-raven"
```

```ruby
# New
gem "sentry-ruby"
gem "sentry-rails"
```

## Change Initialization

```ruby
# Old
Raven.configure do |config|
  config.dsn = "DSN"
end
```

```ruby
# New
Sentry.init do |config|
  config.dsn = "DSN"
end
```

## Change Raven to Sentry

```ruby
# Old
Raven.capture_message("test", extra: { debug: true })
```

```ruby
# New
Sentry.capture_message("test", extra: { debug: true })
```

## Extra

The only thing I had to check was related to a key called `sanitize_fields` that was removed in this new SDK (sentry-ruby), but they implemented at least three new options:

- Use the new key `send_default_pii = true` to filter params
- Use a filtering method in the initialization config:

```ruby
Sentry.init do |config|
  # ...

  # This example uses Rails' parameter filter to sanitize the event payload
  # For Rails 6+
  filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
  # For Rails 5
  filter = ActionDispatch::Http::ParameterFilter.new(Rails.application.config.filter_parameters)
  config.before_send = lambda do |event, hint|
    filter.filter(event.to_hash)
  end
end
```
- Install the [sentry-sanitizer](https://github.com/mrexox/sentry-sanitizer) gem

Feel free to pick one. We chose the second option.

[more info about sanitize fields](https://github.com/getsentry/sentry-ruby/issues/1140)
