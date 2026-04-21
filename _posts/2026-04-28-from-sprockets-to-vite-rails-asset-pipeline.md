---
layout: post
title: "From Sprockets to Vite: Evolving a Rails Asset Pipeline"
date: 2026-04-28 09:00:00 -0600
last_modified_at: 2026-04-28 09:00:00 -0600
categories: [development]
tags: [rails, vite, sprockets, javascript, asset-pipeline, importmaps, doctors-journey]
---

## The Original Setup

When I started this Rails app back in 2018, Sprockets was the only game in town. It bundled your JavaScript, compiled your CSS, fingerprinted assets for cache busting — and you never thought about it.

The directory structure was classic Rails:

```
app/assets/
├── config/manifest.js
├── javascripts/
│   ├── application.js
│   ├── patients.js
│   ├── hospitalizations.js
│   └── search.js
└── stylesheets/
    ├── application.css
    ├── custom.css
    └── patients.css
```

You'd add `//= require` directives at the top of `application.js`, reference a gem like `font-awesome-sass` in your Gemfile, and everything just worked. No `node_modules`, no build step, no bundler config.

It was simple. Then the frontend ecosystem moved on, and Sprockets didn't.

---

## Where Sprockets Fell Short

### No modern JavaScript

Sprockets concatenates files. It doesn't understand ES modules, `import` statements, tree shaking, or code splitting. As the app grew and I needed Stimulus controllers, Turbo, and Trix, I was fighting the pipeline instead of using it.

### Gem-based frontend dependencies

Need Font Awesome? Add `font-awesome-sass` to your Gemfile. Need a JavaScript library? Hope someone wrapped it in a gem. When they stopped maintaining the gem, you were stuck on an old version while npm had the latest.

I hit this exact wall with Font Awesome — the gem was lagging behind, so I removed it and switched to the npm package. But Sprockets couldn't consume npm packages natively.

### Slow asset compilation

On every deploy, Sprockets recompiled everything. As the asset count grew, so did deploy times. There was no HMR (Hot Module Replacement) in development — change a CSS file, wait for the full recompile, refresh the page.

### The Webpacker detour (that I skipped)

Rails 6 introduced **Webpacker** as the answer to Sprockets' JavaScript limitations. It wrapped Webpack in a Rails-friendly API. Many apps adopted it.

I looked at Webpacker and decided against it. The configuration was complex — `webpacker.yml`, `babel.config.js`, `postcss.config.js`, a whole Webpack config hidden behind abstractions. When something broke, you were debugging Webpack through a Rails wrapper. Friends who adopted it spent more time configuring Webpacker than writing application code.

Rails eventually deprecated Webpacker in Rails 7. That validated the decision to wait.

---

## The Vite Migration

In August 2023, I migrated directly from Sprockets to **Vite** via the `vite_rails` gem. No Webpacker in between.

### Why Vite?

Vite is a modern build tool created by Evan You (of Vue.js fame). It uses native ES modules in development for instant server start and lightning-fast HMR, then bundles with Rollup for production.

`vite_rails` (by Max Stoiber) integrates Vite into Rails with minimal configuration:

```ruby
gem "vite_rails"
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import ViteRails from 'vite-plugin-rails'

export default defineConfig({
  plugins: [
    ViteRails({
      sri: false,
    }),
  ],
})
```

That's the entire config. Compare that to a typical Webpack setup.

### The migration

The core change was moving from `app/assets/` to `app/frontend/`:

```
app/frontend/
├── entrypoints/
│   ├── application.js
│   ├── application.css
│   └── fontawesome.css
└── javascripts/
    └── controllers/
        ├── application.js
        ├── index.js
        ├── sidebar_controller.js
        ├── search_controller.js
        └── ... (11 Stimulus controllers)
```

Layout helpers changed from Sprockets to Vite:

```haml
-# Before (Sprockets)
= stylesheet_link_tag 'application', media: 'all'
= javascript_include_tag 'application'

-# After (Vite)
= vite_client_tag
= vite_javascript_tag 'application'
```

The development `Procfile.dev` now runs Vite alongside Rails:

```
web: bundle exec rails server -b 0.0.0.0 -p 3000
vite: bin/vite dev
```

### What I cleaned up after

The migration wasn't perfectly clean. Old Sprockets files lingered for months:

- **August 2023** — Installed Vite, moved entrypoints
- **February 2024** — Finally removed old `app/assets/javascripts/*.js` files
- **February 2024** — Removed `config.assets.compile = false` from production config

Six months of dead files. Don't be like me — clean up immediately.

---

## What Vite Changed Day-to-Day

### Development is instant

Save a Stimulus controller → the browser updates in milliseconds. No full page reload, no waiting for compilation. This alone justified the migration.

### npm packages work natively

```json
{
  "dependencies": {
    "@fortawesome/fontawesome-free": "^7.2.0",
    "@hotwired/stimulus": "^3.2.2",
    "@hotwired/turbo": "^8.0.23",
    "tailwindcss": "^4.2.1",
    "trix": "^2.1.17"
  }
}
```

No wrapper gems. No version lag. `npm install` and import.

### PostCSS and Tailwind integration

Vite handles PostCSS natively. Adding Tailwind was just:

```json
{
  "@tailwindcss/postcss": "^4.2.1",
  "postcss": "^8.5.8",
  "tailwindcss": "^4.2.1"
}
```

No Sprockets hacks, no separate build pipeline for CSS.

### Production builds are fast

Vite uses Rollup for production bundling with tree shaking, code splitting, and asset fingerprinting. The output is smaller and builds are faster than Sprockets.

---

## The Trade-offs

Not everything is better:

| | Sprockets | Vite |
|---|---|---|
| **Setup complexity** | Zero config | Config file + Procfile |
| **Dev server** | Built into Rails | Separate process |
| **Node.js required** | No | Yes |
| **CI setup** | Just Ruby | Ruby + Node.js |
| **HMR** | No | Yes, instant |
| **npm packages** | Via gems (if available) | Native |
| **Tree shaking** | No | Yes |
| **Learning curve** | Almost none | Low (but exists) |

The biggest practical annoyance: **two processes in development**. You need both `rails server` and `vite dev` running. `Procfile.dev` with `foreman` handles it, but it's one more thing.

CI also got slightly more complex — GitHub Actions now needs a Node.js setup step before running tests. Not a big deal, but it's a step that didn't exist before.

---

## What's Next: Import Maps and Propshaft

Rails 8 defaults to **Import Maps** (`importmap-rails`) and **Propshaft** instead of Sprockets. No Node.js, no bundler, no build step. The browser loads ES modules directly.

```ruby
# config/importmap.rb
pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
```

This is compelling for several reasons:

**No Node.js dependency.** The app goes back to being pure Ruby for deployment. No `npm install` in CI, no `node_modules` in worktrees, no `package-lock.json` merge conflicts.

**No build step.** Assets are served directly with fingerprinting via Propshaft. Development and production use the same mechanism — no more "works in dev, breaks in prod" asset issues.

**Rails-native.** It's the default. DHH and the Rails team are betting on this direction. When the framework pushes one way, swimming with the current is usually the right call.

### But there are questions

**Tailwind CSS** — the current setup uses Tailwind via npm + PostCSS. With Import Maps, you'd need `tailwindcss-rails` which bundles a standalone Tailwind CLI. This works, but it's a different compilation model.

**Third-party packages** — not everything is available as an ES module you can pin. Complex packages with many dependencies still need a bundler. The Import Maps ecosystem is growing but not complete.

**Stimulus controllers** — currently registered manually in an index file. Import Maps has its own controller loading convention. Migration means touching every controller registration.

### My plan

I'm planning the migration in phases:

1. **Replace Vite with Propshaft** — switch the asset pipeline, keep the JS structure
2. **Switch Tailwind to the Rails gem** — `tailwindcss-rails` instead of npm
3. **Evaluate Import Maps** — try pinning the core dependencies, see what breaks

The goal is the same as every migration in this series: fewer dependencies, simpler deployment, less tooling to maintain. Sprockets → Vite was about gaining modern JavaScript. Vite → Import Maps would be about shedding the JavaScript toolchain entirely.

---

## The Pattern

Looking back at the full journey:

- **Sprockets** (2018-2023) — zero config, but trapped in an old world
- **Vite** (2023-present) — modern tooling, fast HMR, but adds Node.js
- **Import Maps** (next) — back to zero config, native browser modules

It's a circle. The Rails asset pipeline started simple, got complex to solve real problems, and is now returning to simplicity — but with the browser doing the heavy lifting instead of the server.

The best tool is the one you don't have to think about. Sprockets was that until it wasn't. Vite is great but it's still a build tool. Import Maps might be the closest thing to "just works" since the early Sprockets days.

We'll see. That's a post for another day.
