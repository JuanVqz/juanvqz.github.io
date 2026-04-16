---
layout: post
title: "Building System Admin Impersonation for a Multi-Tenant Rails App"
date: 2026-05-19 09:00:00 -0600
last_modified_at: 2026-05-19 09:00:00 -0600
categories: [development]
tags: [rails, multi-tenant, devise, impersonation, doctors-journey]
---

## The Problem

I run a clinical assistance system where each hospital gets its own subdomain, `one.doctors.com`, `two.doctors.com`, and so on. Each hospital has its own doctors, patients, and data. The subdomains are enforced in routes, and sessions are scoped per hospital.

This works great for hospital staff. But as the platform owner, I needed a way to jump into any hospital's admin panel for support and debugging. There was no "system admin" concept, every user belonged to exactly one hospital.

The naive approach would be a separate admin dashboard with a list of hospitals. But that means building and maintaining a second interface. What I actually wanted was to see exactly what a hospital admin sees, the same sidebar, the same patient list, the same PDF settings. Just with the ability to switch between hospitals.

---

## The Design: Impersonation, Not a Dashboard

Instead of building a system admin UI, the system admin signs in on any hospital subdomain and automatically becomes that hospital's admin doctor. The experience is identical to what the real admin sees, with one addition: a hospital switcher dropdown at the bottom of the sidebar.

The flow:

1. Navigate to `one.doctors.com/users/sign_in`
2. Sign in with the system admin credentials
3. Land on the patients page as the hospital's admin doctor
4. Use the sidebar dropdown to switch to another hospital

No separate routes. No separate layout. No separate controllers. The system admin is a ghost that borrows the identity of whichever hospital admin they need to be.

---

## SystemAdmin as an STI Model

The first decision was how to represent the system admin. A boolean on the `User` model felt wrong, it would mean every user carries system admin logic, and 99.9% of them would never use it.

Instead, I created a `SystemAdmin` model using Single Table Inheritance:

```ruby
class SystemAdmin < User
  def system_admin?
    true
  end

  def active_for_authentication?
    true
  end
end
```

`SystemAdmin` doesn't belong to any hospital, `hospital_id` is nil. The `User` model validates hospital presence `unless: :system_admin?`, and since `SystemAdmin` overrides `system_admin?` to return `true`, it passes validation without a hospital.

There will only ever be one `SystemAdmin` record. It exists solely to authenticate and trigger the impersonation flow.

---

## Impersonation Without a Gem

I initially reached for the [Pretender](https://github.com/ankane/pretender) gem, but looking at what it actually does, store a user ID in the session and override `current_user`, it felt like unnecessary dependency for ~30 lines of code. So I wrote an `Impersonatable` concern instead:

```ruby
# app/controllers/concerns/impersonatable.rb
module Impersonatable
  extend ActiveSupport::Concern

  included do
    helper_method :system_admin?
  end

  def true_user
    @true_user ||= if session[:impersonated_user_id]
      warden.user(:user)
    else
      current_user
    end
  end

  def current_user
    if session[:impersonated_user_id]
      @impersonated_user ||= User.find_by(id: session[:impersonated_user_id])
    end || super
  end

  def impersonate_user(user)
    session[:impersonated_user_id] = user.id
    @impersonated_user = user
  end

  def stop_impersonating_user
    session.delete(:impersonated_user_id)
    @impersonated_user = nil
  end

  def impersonating?
    true_user != current_user
  end

  def system_admin?
    impersonating? && true_user.is_a?(SystemAdmin)
  end
end
```

`true_user` returns whoever actually authenticated (the SystemAdmin). `current_user` returns the impersonated doctor if one is set. The session key survives page navigations.

Notice that only `system_admin?` is exposed as a view helper. The rest of the concern, `true_user`, `impersonating?`, `impersonate_user`, `stop_impersonating_user`, stays in controller land where it belongs. Views don't need to know about the impersonation machinery. They just ask one question: "is this a system admin?" That single boolean drives the impersonation banner and the hospital switcher. The entire view-layer integration is two lines:

```erb
<%%= render "layouts/impersonation_banner" if system_admin? %>
<%%= render "layouts/hospital_switcher" if system_admin? %>
```

That's the kind of simplicity worth protecting. When the concern's public surface is one helper method, there's nothing to misuse and nothing to document.

---

## Auto-Impersonation on Sign-In

The magic happens in the sessions controller. When a `SystemAdmin` signs in on a hospital subdomain, we find that hospital's admin doctor, sign in, set up impersonation, and redirect, short-circuiting the regular Devise flow entirely:

```ruby
def create
  self.resource = warden.authenticate!(auth_options)

  if resource.is_a?(SystemAdmin)
    return reject_system_admin(t("system_admin.sign_in_on_subdomain")) unless current_hospital

    admin_doctor = current_hospital.doctors.find_by(role: :admin)
    return reject_system_admin(t("system_admin.no_admin_doctor")) unless admin_doctor

    sign_in(resource_name, resource)
    impersonate_user(admin_doctor)
    return redirect_to patients_path
  end

  if resource.hospital_subdomain != current_hospital&.subdomain
    sign_out(resource)
    return redirect_to new_user_session_path(subdomain: resource.hospital_subdomain),
      alert: t("system_admin.no_permission")
  end

  set_flash_message!(:notice, :signed_in)
  sign_in(resource_name, resource)
  yield resource if block_given?
  respond_with resource, location: after_sign_in_path_for(resource)
end
```

The system admin path is explicit: sign in, impersonate, redirect, return. No falling through to Devise's `respond_with`, that avoids any confusion about which user the response is built for. Error cases use `reject_system_admin` which signs out and redirects back to the form with a message.

If someone tries to sign in as the system admin on the root domain (no hospital context), they get signed out and told to use a hospital subdomain. There's no guessing which hospital to redirect to.

---

## The Hospital Switcher: Shared Cookies vs. Signed Tokens

The only UI addition is a dropdown at the bottom of the sidebar. The partial lists all hospitals. The current one is highlighted. Clicking another hospital sends a PATCH to the impersonation controller, which redirects to the target subdomain. The interesting question is how that cross-subdomain redirect preserves the session.

### The Shared Cookie Approach (v1)

My first implementation used a shared session cookie across all subdomains:

```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: "_doctors_session",
  domain: ENV.fetch("SESSION_COOKIE_DOMAIN") {
    Rails.env.development? || Rails.env.test? ? ".lvh.me" : :all
  }
```

With `domain: ".lvh.me"` in development (or `:all` in production), the browser sends the same session cookie to every subdomain. The controller was simple: stop the current impersonation, start a new one, redirect.

```ruby
def update
  hospital = Hospital.find_by!(subdomain: params[:subdomain])
  admin_doctor = hospital.doctors.find_by!(role: :admin)

  stop_impersonating_user
  impersonate_user(admin_doctor)

  redirect_to patients_url(subdomain: hospital.subdomain), allow_other_host: true
end
```

**Pros of shared cookies:**

- Simple. One cookie, visible everywhere. No extra machinery.
- The session just works across subdomains without any handoff logic.

**Cons of shared cookies:**

- Requires `lvh.me` for local development. `lvh.me` is a third-party domain that resolves to `127.0.0.1`, which works but feels fragile. If the domain ever goes down or gets acquired, local development breaks.
- `localhost` doesn't work. Browsers treat `localhost` as a [public suffix](https://wiki.mozilla.org/Public_Suffix_List) and reject `domain=.localhost` cookies. This means CSRF token validation fails because the session from the GET request isn't sent back with the POST.
- Blocks PWA development. Service workers and install prompts require a secure context. Browsers treat `localhost` as secure but not `lvh.me`. So you can't test PWA features locally with shared cookies.
- Any subdomain can read the session. If a malicious subdomain existed (unlikely in this app, but worth noting), it could read the system admin's session.

### The Signed Token Approach (v2)

When I needed `localhost` subdomains for PWA development, the shared cookie approach broke completely. Instead of fighting the browser, I replaced shared cookies with short-lived signed tokens:

```ruby
class ImpersonationsController < ApplicationController
  skip_before_action :authenticate_user!, only: :show
  before_action :require_system_admin!, only: :update

  # GET /impersonation?token=...
  # Receives a signed token on the target subdomain and sets up the session.
  def show
    payload = Rails.application.message_verifier(:impersonation).verify(
      params[:token], purpose: :impersonation
    )
    system_admin = SystemAdmin.find(payload["system_admin_id"])
    target_user = User.find(payload["user_id"])

    sign_in(:user, system_admin)
    impersonate_user(target_user)

    redirect_to patients_path
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    redirect_to root_path, alert: t("system_admin.unauthorized")
  end

  # PATCH /impersonation
  # Generates a signed token and redirects to the target subdomain.
  def update
    hospital = Hospital.find_by!(subdomain: params[:subdomain])
    admin_doctor = hospital.doctors.find_by!(role: :admin)

    token = Rails.application.message_verifier(:impersonation).generate(
      { system_admin_id: true_user.id, user_id: admin_doctor.id },
      purpose: :impersonation,
      expires_in: 30.seconds
    )

    redirect_to impersonation_url(subdomain: hospital.subdomain, token: token),
      allow_other_host: true
  end

  private

  def require_system_admin!
    unless system_admin?
      redirect_to root_path, alert: t("system_admin.unauthorized")
    end
  end
end
```

The flow: PATCH generates a signed token containing both user IDs, redirects to the target subdomain with the token as a query parameter. The `show` action on the target subdomain verifies the token, signs in the system admin, sets up impersonation, and creates a new session local to that subdomain. The token expires in 30 seconds.

**Pros of signed tokens:**

- Works on any domain. `localhost`, `lvh.me`, real domains. No configuration changes between environments.
- Enables PWA development on `localhost` (secure context).
- Each subdomain gets its own session cookie. No cross-subdomain cookie leakage.
- Security model is explicit: cross-subdomain access requires a fresh, purpose-scoped, time-limited token every time.
- Uses `Rails.application.message_verifier`, which is built into Rails. No database storage, no cleanup jobs.

**Cons of signed tokens:**

- More moving parts. Two controller actions instead of one. A route outside the subdomain constraints.
- Token briefly appears in the URL during the redirect. It expires in 30 seconds and is single-purpose, but it's still visible in browser history and server logs.
- Slightly more code (~30 lines vs ~15 lines).

### Why I chose tokens

The deciding factor was `localhost`. I needed PWA support (service workers, install prompts), and browsers only enable those features in secure contexts. `localhost` is a secure context; `lvh.me` is not. Shared cookies don't work with `localhost` because of the Public Suffix List. Tokens work everywhere.

The session store became simple:

```ruby
Rails.application.config.session_store :cookie_store,
  key: "_doctors_session",
  domain: ENV.fetch("SESSION_COOKIE_DOMAIN") { Rails.env.production? ? :all : nil }
```

In production, `:all` shares cookies across subdomains of the real domain (still useful for general session continuity). In development, `nil` means each subdomain gets its own cookie. The token bridges the gap only during the switch. After that single redirect, the new subdomain has its own session and the token is never used again.

---

## The Turbo CORS Trap

The most surprising issue was Turbo breaking cross-subdomain redirects. When the hospital switcher form submits via Turbo's fetch API and gets a 302 redirect to a different subdomain, the browser sends a CORS preflight `OPTIONS` request, which Rails doesn't handle, returning a routing error.

The fix is simple: disable Turbo on forms that redirect across subdomains.

```erb
<%%= button_to impersonation_path, method: :patch,
  params: { subdomain: hospital.subdomain },
  data: { turbo: false } do %>
```

Same for the sign-in form. Any form that might redirect to a different subdomain needs `data-turbo="false"` to use a standard browser POST instead of a fetch request.

---

## What I Ended Up With

The entire feature is surprisingly small:

- **1 model**: `SystemAdmin` (6 lines)
- **1 concern**: `Impersonatable` (~30 lines, no gem)
- **1 controller**: `ImpersonationsController` (~30 lines, two actions)
- **2 partials**: hospital switcher + impersonation banner
- **~20 lines** of changes to the sessions controller

No admin dashboard. No admin routes namespace. No admin layout. No shared cookie workarounds. The system admin uses the exact same interface as a hospital admin, because they literally become one.

The impersonation banner at the top, a yellow bar showing "System Administrator, Dr. Martinez at Hospital Demo", is the only visual indicator that something unusual is happening. And the hospital switcher in the sidebar is the only extra control.

Sometimes the best admin interface is no admin interface at all.

---

## Should This Be a Gem?

When I started, I reached for [Pretender](https://github.com/ankane/pretender), the most popular impersonation gem at ~1,400 stars and 16M downloads. It's well-maintained, auth-agnostic, and only about 100 lines of code. There's also [devise_masquerade](https://github.com/oivoodoo/devise_masquerade) (~550 stars), but it's locked to Devise and substantially larger.

After using Pretender for a few days, I replaced it with a 30-line concern. Not because Pretender is bad, it's genuinely good, but because the impersonation pattern is so simple that a dependency felt like overhead.

The interesting gap is in the Rails 8 ecosystem. Rails 8 shipped a built-in authentication generator (`bin/rails generate authentication`) that uses a `Current` model pattern instead of Devise. It has zero impersonation support, and there's no plan to add it. Both [GoRails](https://gorails.com/episodes/how-to-add-impersonation-to-rails-authentication-generator) and [RailsDesigner](https://dev.to/railsdesigner/adding-user-impersonation-to-rails-8-authentication-1me3) have published tutorials where people hand-roll ~150 lines of impersonation code to fill this gap.

Pretender *should* work with Rails 8 auth since it's auth-agnostic, but its README doesn't document the integration. People are writing their own solutions with features Pretender doesn't have: automatic session expiry, anti-nesting guards, `impersonated_at` timestamps.

Is there room for a gem? Maybe. A lightweight, Rails 8 auth-native impersonation gem that provides a drop-in concern, session expiry, audit timestamps, and a generator for the controller and routes, that would fill a real niche. Something between "copy-paste a concern from a blog post" and "add Pretender and figure out how to wire it into your Current model."

But honestly, I'm not sure it needs to be a gem. The concern I wrote is 30 lines. Adding expiry and nesting guards would bring it to maybe 50. At that size, a well-documented recipe or a Rails generator template might serve the community better than yet another gem. The Rails 8 auth philosophy is "understand your authentication code", and impersonation is simple enough to understand inline.

For now, I'll keep my concern. If I find myself copying it into a second project, maybe it becomes a gem. Until then, the 30 lines live in the app where they belong.
