---
layout: post
title: "Contributing to Rails: A PWA Offline Fallback Page"
date: 2026-04-21 10:00:00 -0600
last_modified_at: 2026-04-21 10:00:00 -0600
categories: [development]
tags: [rails, pwa, service-worker, open-source, contribution]
---

Rails 7.2 shipped native PWA scaffolding: a `manifest.json.erb` and a `service-worker.js` under `app/views/pwa/`. Two files, two routes, and your Rails app is installable. But one piece was still missing — the offline fallback page.

On April 16, 2026 [my PR](https://github.com/rails/rails/pull/57184) adding that page to the Rails scaffold was merged into `main`. It even got a mention in [This Week in Rails](https://www.linkedin.com/feed/update/urn:li:activity:7451738710674653184/). Here is the story of how it happened.

---

## Where It Started

On April 13, 2026 I gave a talk at [RubySur](https://www.youtube.com/@rubysur) called **PWA en Rails**. The [slides and demos](https://github.com/JuanVqz/pwa_en_rails) walked through four progressive demos on top of [may_store](https://github.com/JuanVqz/may_store):

1. Installable app (manifest + routes + meta tags)
2. Basic service worker with an offline page
3. Smart caching (Cache First for assets, Network First for HTML)
4. Multi-tenant manifest and cache per subdomain

Preparing demo #2 was the moment the itch started. Every PWA needs an offline fallback — `web.dev` recommends it, MDN documents it — yet Rails generates `manifest.json.erb` and `service-worker.js` and stops there. Every team ends up writing the same offline page from scratch.

After the talk I opened the Rails source to see how hard it would be to add.

---

## The Existing Scaffold

`Rails::PwaController` in `railties` was tiny:

```ruby
class Rails::PwaController < Rails::ApplicationController
  def manifest        = render template: "pwa/manifest", layout: false
  def service_worker  = render template: "pwa/service-worker", layout: false
end
```

And `config/routes.rb.tt` had two commented routes:

```ruby
# get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
# get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
```

The pattern was clear. Add a third action, a third template, a third commented route. Let the developer opt in.

---

## The Contribution

Five files changed. Net +82 lines.

**`railties/lib/rails/pwa_controller.rb`** — one new action:

```ruby
def offline
  render template: "pwa/offline", layout: false
end
```

**`config/routes.rb.tt`** — one commented route alongside the others:

```ruby
# get "offline" => "rails/pwa#offline", as: :pwa_offline
```

**`app/views/pwa/offline.html.erb`** — self-contained fallback. Inline styles, zero external assets, dark mode via `prefers-color-scheme`, a GET form for the retry button:

```erb
<!DOCTYPE html>
<html lang="en">
<head>
  <title>You're offline</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    /* system fonts, flex center, dark mode media query */
  </style>
</head>
<body>
  <div>
    <h1>You're offline</h1>
    <p>Unable to connect to the server. Check your internet connection and try again.</p>
    <form action="." method="get" aria-label="Retry loading this page">
      <button type="submit">Retry</button>
    </form>
  </div>
</body>
</html>
```

**`app/views/pwa/service-worker.js`** — a commented example showing how to cache the offline page on install and serve it when navigation fails:

```js
// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open("offline-v1").then((cache) => cache.add("/offline"))
//   );
// });
//
// self.addEventListener("fetch", (event) => {
//   if (event.request.mode === "navigate") {
//     event.respondWith(
//       fetch(event.request).catch(() => caches.match("/offline"))
//     );
//   }
// });
```

Plus the generator tests — `app_generator_test.rb` and `plugin_generator_test.rb` — both assert the full list of generated files, so the new template had to be added there too.

---

## Review Feedback

The first version shipped with `lang` missing on `<html>` and an inline `onclick="window.location.reload()"` on the retry button. Two things came back in review:

- **Accessibility:** the offline page renders outside `application.html.erb`, so it does not inherit `lang="en"`. Screen readers need it explicit.
- **CSP:** inline `onclick` is blocked by any strict Content Security Policy that disallows `unsafe-inline` scripts.

The CSP catch is worth a footnote. Guille (from Rails Core) had enabled the AI reviewer on the repo, and it flagged the retry button with this comment:

> The inline `onclick` handler will be blocked by strict Content Security Policies (no `unsafe-inline`) and makes the retry affordance less robust. Consider implementing retry as a normal navigation (e.g., a link or a GET form submit) so it works even when inline JS is disallowed.

Fix one: add `lang="en"`.
Fix two: replace the button-with-onclick by a GET form pointing at `.` — a plain navigation, no JavaScript, works everywhere.

```erb
<form action="." method="get" aria-label="Retry loading this page">
  <button type="submit">Retry</button>
</form>
```

Added `aria-label` on the form so assistive tech can describe the retry control.

Small review, big lesson: defaults that Rails ships get inherited by thousands of apps. The bar for "works without JS, passes strict CSP, reads well to a screen reader" is not optional at that scale.

---

## The Result

Merged on April 16, 2026. Five commits. Four files added or modified plus a CHANGELOG entry.

A week later, [This Week in Rails](https://www.linkedin.com/feed/update/urn:li:activity:7451738710674653184/) called it out. Seeing your name in that newsletter is a small thing but it lands well.

From Rails `main` forward, `rails new` scaffolds:

```
app/views/pwa/
  manifest.json.erb
  service-worker.js
  offline.html.erb   <- new
```

And `config/routes.rb` ships a third commented PWA route ready to uncomment.

---

## What I Took Away

**Ship the demo, then ship the framework.** The talk forced me to stare at the gap long enough to feel it. Without the demo, I would not have noticed the scaffold was incomplete.

**Match the existing pattern.** The PR was accepted fast partly because it did not invent anything. Same controller style, same route style, same opt-in-by-comment convention. Consistency is a merge accelerator.

**Accessibility and CSP are not edge cases.** A template that Rails generates by default has to pass both. Inline handlers and missing `lang` attributes look harmless in isolation and get ugly at framework scale.

---

## Try It

On Rails `main` (or whichever version ships this next):

```bash
rails new my_pwa
# edit config/routes.rb, uncomment the three PWA routes
# edit app/views/pwa/service-worker.js, uncomment the offline cache block
# visit /offline
```

If you run a PWA in production and still hand-roll your offline page, you will not need to anymore.

---

[PR #57184](https://github.com/rails/rails/pull/57184) — Add offline fallback page to the PWA scaffold
[Talk: PWA en Rails](https://github.com/JuanVqz/pwa_en_rails) — slides, demos, and video
