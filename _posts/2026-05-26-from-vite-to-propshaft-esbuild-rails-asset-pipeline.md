---
layout: post
title: "From Vite to Propshaft + esbuild: Simplifying a Rails Asset Pipeline"
date: 2026-05-26 09:00:00 -0600
last_modified_at: 2026-05-25 09:00:00 -0600
categories: [development]
tags: [rails, propshaft, esbuild, vite, asset-pipeline, importmaps, pwa, doctors-journey]
---

## The Problem

My Rails app was running Vite. It worked — HMR in development, fingerprinted assets in production, Tailwind through PostCSS. But Vite is a JavaScript tool that happens to serve a Rails app. The `vite_rails` gem, `vite.config.ts`, `config/vite.json`, a separate dev server on port 3036 — all to do what Rails can do natively.

I wanted to simplify toward a zero-Node future, where the app is pure Ruby in production. Not because Node is bad, but because every dependency is a liability, and this app doesn't need a JavaScript build tool to serve server-rendered HTML with Turbo and Stimulus.

The question was: can I get there without rewriting everything at once?

---

## The Journey: Sprockets → Vite → Propshaft + esbuild → Importmaps

This is actually the third asset pipeline this app has used. It started on Sprockets (the Rails default for years), moved to Vite when I wanted Tailwind and modern JS tooling, and now it's moving to Propshaft + esbuild as a stepping stone toward importmaps.

Each migration solved a real problem:

| Migration | Why |
|---|---|
| Sprockets → Vite | Needed Tailwind, modern JS bundling, HMR |
| Vite → Propshaft + esbuild | Remove non-Rails tooling, prepare for zero-Node |
| esbuild → Importmaps (future) | Eliminate Node entirely |

The key insight is that **Propshaft doesn't care how your assets are built.** It just fingerprints files and serves them. This means you can swap the builder (esbuild → importmaps) without touching the server.

---

## Understanding Propshaft + esbuild

This is the part that confused me at first: what does each tool actually do? Vite did everything — bundling, serving, HMR, fingerprinting. With Propshaft + esbuild, the responsibilities split cleanly:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   BUILDERS   │     │   PROPSHAFT   │     │   BROWSER    │
│              │     │              │     │              │
│  esbuild ────┼────▶│  Fingerprint │────▶│  Cached      │
│  tailwind ───┼────▶│  Manifest    │     │  Assets      │
│              │     │  Serve       │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
  "compile stuff"     "name & deliver"     "use stuff"
```

**esbuild** bundles JavaScript. It takes `app/javascript/application.js`, resolves imports, and outputs a single file to `app/assets/builds/application.js`.

**tailwindcss-rails** generates CSS. It scans your templates for Tailwind classes and outputs `app/assets/builds/application.css`. No Node needed — it ships a standalone binary.

**Propshaft** serves everything. It sees files in `app/assets/`, fingerprints them (`application-a1b2c3.js`), and serves them with far-future cache headers. In development, it skips fingerprinting and serves files directly.

### In Development

Three processes run via `bin/dev`:

```
web: rails server              ← serves HTML, delegates assets to Propshaft
js:  yarn build --watch        ← esbuild watches JS, rebuilds on change
css: rails tailwindcss:watch   ← Tailwind watches templates, rebuilds CSS
```

You edit a file, esbuild rebuilds in < 50ms, Turbo Drive reloads the page. No HMR, but with Turbo the reload is so fast you don't notice.

### On Deploy

`rails assets:precompile` chains everything:

1. `yarn build` — esbuild bundles + minifies JS
2. `rails tailwindcss:build` — Tailwind generates production CSS
3. Propshaft fingerprints all assets, writes a manifest to `public/assets/.manifest.json`

The fingerprinted files get served with immutable cache headers. When content changes, the hash changes, browsers fetch the new version.

---

## But First: Removing npm Dependencies

Before swapping the asset pipeline, I had to deal with two npm packages that would block a future importmaps migration:

### Font Awesome → Heroicons

Font Awesome v7 ships as an npm package with 74 icon usages across 27 view files. That's a lot of `<i class="fa-solid fa-user">` tags.

I replaced it with the `heroicon` gem, which renders SVG icons server-side. No CSS bundle, no font files, no npm package. The mapping was straightforward — most Font Awesome icons have a direct Heroicon equivalent.

The only tricky part was brand icons (Facebook, LinkedIn, X/Twitter). Heroicons doesn't have brand icons, so I used inline SVGs from [Simple Icons](https://simpleicons.org/).

### hotwire_combobox → maquina_components

The `hotwire_combobox` gem needed both a Ruby gem AND an npm package (`@josefarias/hotwire_combobox`). It's a good library, but it was one of only two things keeping npm in the picture for my forms.

I replaced it with the combobox from `maquina_components`, which is a pure Ruby/ERB component library styled with Tailwind. It ships a combobox with search filtering, keyboard navigation, and ARIA support — all without npm.

The one gap: maquina's combobox does client-side filtering only. My appointments form fetches patient information on selection via Turbo Frame. I added a small Stimulus controller (~20 lines) to handle just the async fetch. The combobox UI itself is entirely maquina.

---

## The Migration

With Font Awesome and hotwire_combobox gone, the actual pipeline swap was mechanical:

1. Replace `gem "vite_rails"` with `gem "propshaft"` and `gem "jsbundling-rails"`
2. Move files from `app/frontend/` to Rails conventions (`app/javascript/`, `app/assets/`)
3. Replace `vite_stylesheet_tag` / `vite_javascript_tag` with `stylesheet_link_tag` / `javascript_include_tag`
4. Delete `vite.config.ts`, `config/vite.json`
5. Update `Procfile.dev`

Then separately, swap Tailwind from npm to the Rails gem:

1. Add `gem "tailwindcss-rails"`, remove `tailwindcss` and `@tailwindcss/postcss` from package.json
2. Delete `tailwind.config.js` and `postcss.config.js`
3. The Tailwind v4 syntax (`@import "tailwindcss"`) works the same in both — no config rewrite needed

---

## What's Left in package.json

After the migration, only four npm packages remain:

- `@hotwired/stimulus` — Stimulus controllers
- `@hotwired/turbo` — Turbo Drive/Frames/Streams
- `@rails/request.js` — Rails CSRF-aware fetch
- `trix` — Rich text editor

Every single one of these is pinnable via importmaps. When I'm ready, swapping `jsbundling-rails` for `importmap-rails` will eliminate Node entirely. But I'm not rushing — esbuild in production first, measure, then decide.

---

## The Road to PWA

One reason I'm simplifying the asset pipeline: I want to turn this into a PWA. Doctors use it on their phones in clinics, sometimes with flaky mobile data. A service worker for offline access and a manifest for "Add to Home Screen" would make a real difference.

PWA doesn't require importmaps — it works with any asset pipeline. But having Propshaft serve the manifest and service worker as plain static assets is cleaner than configuring Vite to handle them.

There's a nice multi-tenant benefit too: each hospital subdomain (`clinic.asistenciaclinica.com`) installs as a separate PWA on the home screen. Browsers isolate by origin, so each hospital gets its own app icon. That's a feature, not a bug.

---

## Comparing the Three Pipelines

After living with all three, here's how they compare for a server-rendered Rails app with Turbo and Stimulus:

|  | Sprockets | Vite | Propshaft + esbuild |
|---|---|---|---|
| Config files | Many | 3 (config, json, ts) | 1 (package.json scripts) |
| Dev server | No | Yes (port 3036) | No |
| HMR | No | Yes | No (Turbo reload) |
| Node required | No | Always | Build step only |
| Fingerprinting | Built-in | Vite manifest | Propshaft manifest |
| Mental model | "Pipeline" | "JS tool serving Rails" | "Builders + server" |

For apps with heavy client-side JS (React, Vue), Vite makes sense. For server-rendered Rails with Stimulus, the Propshaft stack is simpler and more aligned with the framework.

---

## What I'd Tell Past Me

Don't be afraid of these migrations. Each one took a day, not a week. The scariest part — "will my styles break?" — is solved by having tests and checking a few pages manually. The asset pipeline is plumbing; the views don't care how their CSS and JS arrive.

And if you're on Vite and happy with it, that's fine too. This migration was about aligning with where Rails is going and reducing dependencies for a future PWA. If neither of those matters to you, Vite is a great tool.

---

*This is part of a series about modernizing a Rails clinical management system. Previous posts have covered [Sprockets to Vite](/blog/from-sprockets-to-vite-rails-asset-pipeline/) and [HAML to ERB](/blog/from-haml-to-erb-going-back-to-rails-native-templates/).*
