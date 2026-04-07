---
layout: post
title: "Upgrading Rails From 5.2 to 8.1: Seven Years of Incremental Progress"
date: 2026-04-07 09:00:00 -0600
last_modified_at: 2026-04-07 09:00:00 -0600
categories: [development]
tags: [rails, ruby, upgrade, next_rails, fastruby, doctors-journey]
---

## The Timeline

I started the Doctors app — the clinical assistance system I've been writing about recently — in October 2018 on **Rails 5.2.1** with **Ruby 2.5.1**. Today it runs **Rails 8.1** on **Ruby 3.4.8**. That's every major Rails version — 5.2, 6.0, 6.1, 7.0, 7.1, 7.2, 8.0, 8.1 — across seven years.

Here's the full upgrade history, pulled straight from git:

| Date | Rails | Ruby | EOL status at upgrade time |
|------|-------|------|----------------------------|
| Oct 2018 | 5.2.1 | 2.5.1 | Both current |
| Dec 2018 | 5.2.2 | 2.5.3 | Both current |
| May 2021 | 6.0 | 2.7.2 | Rails 5.2 EOL Jun 2020 — **11 months late**. Ruby 2.5 EOL Mar 2021 — **2 months late** |
| Jul 2021 | 6.1.4 | 2.7.3 | Rails 6.0 still supported. Ruby 2.7 current |
| Mar 2022 | 6.1.4.6 | 2.7.4 | Rails 6.1 current. Ruby 2.7 EOL Mar 2023 (still supported) |
| May 2022 | 7.0 | 3.x | Rails 6.1 still supported. Used next_rails for the jump |
| Mar 2024 | 7.1 | 3.3.0 | Rails 7.0 EOL Apr 2024 — **just in time**. Ruby 3.0 EOL Mar 2024 (skipped 3.0-3.2) |
| Jan 2025 | 7.2 | 3.4.1 | Rails 7.1 still supported. Ruby 3.3 current |
| Feb 2025 | 8.0 | 3.4.1 | Same month as 7.2 — caught up |
| Jan 2026 | 8.1 | 3.4.2 | Both current — Dependabot PR |

A few things jump out. There's a **2.5-year gap** between the initial release and the first upgrade (5.2 → 6.0). Then another **almost 2-year gap** between 7.0 and 7.1. Life gets in the way of side projects. The lesson: the longer you wait, the harder it gets.

---

## The Early Upgrades: 5.2 → 6.0 → 6.1

### 5.2 to 6.0 — The Scary One

This was the first major upgrade and it sat undone for over two years. The app was small — patients, appointments, hospitalizations — but I hadn't upgraded a Rails app before and didn't know where to start.

Rails 6.0 brought:
- **Action Mailbox** and **Action Text** (didn't need them yet)
- **Multiple database support** (not relevant for a single-tenant setup at the time)
- **Zeitwerk autoloader** replacing the classic autoloader

The Zeitwerk migration was the main friction. Rails 6 could run in `classic` mode initially, but the writing was on the wall — you had to adopt Zeitwerk eventually. For a small app, this mostly meant making sure file names matched class names.

Ruby went from 2.5 → 2.7, which was painless.

### 6.0 to 6.1 — The Easy One

Two months later. Rails 6.1 was a smooth minor upgrade. The main additions were `delegated_type`, `destroy_async` for associations, and stricter `where.not` behavior. For this app, it was essentially a Gemfile change and running `rails app:update`.

---

## The Rails 7 Upgrade: Where next_rails Changed Everything

### Context: Working at FastRuby.io

I work at **[FastRuby.io](https://www.fastruby.io/)** (OmbuLabs), a consultancy that specializes in [Rails upgrades](https://www.fastruby.io/). We upgrade Rails apps professionally — from legacy Rails 2.x apps all the way to the latest version.

One of the tools we built and use daily is **[next_rails](https://github.com/fastruby/next_rails)** — a gem I help maintain — that lets you run your test suite against two Rails versions simultaneously using a dual-boot setup.

### How next_rails works

Instead of upgrading all at once and hoping tests pass, `next_rails` creates a parallel `Gemfile.next` that pins the target Rails version:

```ruby
# Gemfile
if next?
  gem "rails", "~> 7.0" # Gemfile.lock
else
  gem "rails", "~> 6.1" # Gemfile.next.lock
end
```

You run your tests against both versions:

```bash
# Current version
bundle exec rspec

# Next version
BUNDLE_GEMFILE=Gemfile.next bundle exec rspec
```

I also configured a **separate CI job** — `next-rails-app.yml` — that ran the test suite against the next Rails version on every push. This way you could see deprecation warnings and failures in CI before committing to the upgrade.

### The 6.1 → 7.0 migration

With `next_rails`, the upgrade went like this:

1. **Add next_rails** and configure `Gemfile.next` to target Rails 7.0
2. **Fix deprecation warnings** one by one — each fix works on both versions
3. **Run CI against both versions** — green on 6.1 and 7.0
4. **Merge** — switch the main Gemfile to 7.0
5. **Clean up** — remove `next_rails`, `Gemfile.next`, `Gemfile.next.lock`, and the dual CI job

The cleanup commit tells the story: **414 lines deleted** just from removing `Gemfile.next.lock`.

### What broke in Rails 7.0

Rails 7.0 was a significant release:

- **Hotwire by default** — Turbo and Stimulus replaced UJS and Turbolinks
- **Import Maps** introduced (though I went with Vite instead)
- **Encrypted credentials** replaced `secrets.yml`
- **ActiveStorage** got a lot of improvements

The biggest change was the Hotwire migration — replacing `turbolinks` with `turbo-rails` and adopting Stimulus for JavaScript. This wasn't just a gem swap; it changed how forms submitted (`Turbo` intercepts form submissions by default) and how page navigation worked.

I also ran `rails app:update` which regenerates config files. This is always the tedious part — manually diffing the generated configs against your customizations to decide what to keep.

---

## The Middle Stretch: 7.0 → 7.1 → 7.2

### 7.0 to 7.1 — The Long Wait

Almost **two years** between 7.0 and 7.1. This wasn't technical difficulty — I just didn't prioritize it. The app worked fine on 7.0.

When I finally upgraded in March 2024, Rails 7.1 brought:
- **Dockerfile generation** (helpful for containerized deployments)
- **Async queries** in Active Record
- **Strict `locals` for partials**
- **Normalization** for Active Record attributes

### 7.1 to 7.2 — January 2025

Rails 7.2 was light on breaking changes. The main additions were:
- **Dev containers** support
- **Default Progressive Web App** files
- **Browser version guard**

This was a `rails app:update`, fix deprecations, run tests, done.

---

## The Rails 8 Jump

### 7.2 to 8.0 — Same Month

I upgraded to 7.2 and 8.0 in the **same month** (January-February 2025). Once the 7.2 deprecation warnings were clean, 8.0 was just a version bump away.

Rails 8.0 was an opinionated release:
- **Kamal 2** for deployment (I use Railway, so irrelevant)
- **Solid Cable, Solid Cache, Solid Queue** — SQLite-backed adapters replacing Redis
- **Propshaft** as default over Sprockets (I was on Vite)
- **Authentication generator** (I use Devise)

The deprecation warning I had to fix:

```
DEPRECATION WARNING: `to_time` will always preserve the full timezone
rather than offset of the receiver in Rails 8.1.
To opt in to the new behavior, set
`config.active_support.to_time_preserves_timezone = :zone`.
```

The other gotcha was **Devise**. Rails 8 introduced a built-in authentication generator that conflicts with how Devise handles test sign-in. The `sign_in` helper in integration tests broke — [a known issue](https://github.com/heartcombo/devise/issues/5705). The fix was switching from `sign_in` to `login_as` in the test suite:

```ruby
# Before
sign_in user

# After
login_as user
```

Small change, but the kind of thing that blocks your entire test suite until you find the GitHub issue explaining it.

### 8.0 to 8.1 — Dependabot Did It

The 8.1 upgrade came through as an automated Dependabot PR in January 2026. Rails 8.1 was smooth — no manual intervention needed. That's the reward of staying current: when the next version drops, it's boring.

### What's next — tracking Rails main

Now that the app is current, I'm planning to add `next_rails` back — not for a specific upgrade, but to run CI against Rails `main` permanently. This way I catch deprecations and breaking changes as they land, not when a new version is released. The goal is to always be one `Gemfile` change away from the next Rails version, instead of scrambling after a release.

---

## Ruby Upgrades in Parallel

The Ruby upgrades happened alongside Rails but on their own schedule:

| Ruby | When | Notable |
|------|------|---------|
| 2.5.1 → 2.5.3 | Dec 2018 | Patch |
| 2.5.3 → 2.7.2 | May 2021 | Skipped 2.6 entirely |
| 2.7.x → 3.3.0 | Mar 2024 | Skipped 3.0, 3.1, 3.2 |
| 3.3.0 → 3.4.1 | Jan 2025 | |
| 3.4.1 → 3.4.8 | Current | Patches |

I skipped **four minor Ruby versions** (2.6, 3.0, 3.1, 3.2) by letting gaps accumulate. This worked because Ruby is remarkably backwards-compatible, but it's not a strategy I'd recommend for larger apps.

The 2.7 → 3.x jump was the only one that required attention. Ruby 3.0 changed keyword argument handling (`**kwargs`), which affected some gem compatibility. By the time I upgraded to 3.3 directly, most gems had long since been patched.

### Next target: Ruby 4

**Ruby 4.0.0** was released on December 25, 2025 — the traditional Ruby Christmas release. The key changes:

- **Frozen string literals by default** — `String` objects are now frozen unless explicitly mutated. This has been the direction since Ruby 2.3 introduced the `# frozen_string_literal: true` magic comment, and this app already uses it in every file. If yours doesn't, start adding it now — it's no longer optional.
- **Removal of long-deprecated features** — methods and behaviors deprecated across the 3.x series were finally removed.
- **Type checking improvements** — RBS and type signatures got tighter integration.

I'm currently on Ruby 3.4.8 and the upgrade to 4.0 is next on the list. Since the app already uses `frozen_string_literal: true` everywhere and runs clean on 3.4 with no deprecation warnings, I expect it to be smooth. The pattern is the same as always — stay current, fix deprecations early, and the major version bump becomes just another upgrade.

---

## What I Learned

### Upgrade often, upgrade small

The hardest upgrades were the ones with the biggest gaps. 5.2 → 6.0 after 2.5 years was intimidating. 8.0 → 8.1 via Dependabot was a non-event. The sweet spot is upgrading within a month or two of each new Rails release, while the upgrade guides are fresh and the community is actively reporting issues.

### `rails app:update` is your friend (and enemy)

Every upgrade, run it. It regenerates configuration files for the new version. Then carefully diff each file — don't blindly accept the new defaults, and don't blindly keep your old config. The tedious part is deciding which changes matter.

### Deprecation warnings are the upgrade roadmap

Rails tells you exactly what's going to break in the next version. Fix deprecation warnings as they appear, not when you're upgrading. If your test suite runs clean with no deprecations, the next upgrade is almost always smooth.

### Dual-boot testing (next_rails) is powerful for big jumps

For the 6.1 → 7.0 upgrade, running CI against both versions simultaneously was invaluable. Each fix could be verified against both versions before merging. It's overkill for minor bumps, but for major versions with breaking changes, it removes the fear.

### Side projects fall behind

The biggest risk for side projects isn't technical — it's motivation. The 2.5-year gap between 5.2 and 6.0 wasn't because the upgrade was hard. It was because the app worked fine and I had no reason to touch it. Set a reminder, or enable Dependabot to at least create the PRs.

### The test suite is everything

Every upgrade I've done comes down to: make the change, run the tests, fix what breaks. Without a test suite, you're upgrading blind. The investment in tests pays for itself on every single Rails upgrade.

---

## The Full Commit Trail

For anyone curious, here are the actual git commits for each upgrade:

```
d1cd162  Oct 2018  Initial commit (Rails 5.2.1)
abeaf21  Dec 2018  Update ruby to 2.5.3 and rails to 5.2.2
9948b7a  May 2021  Updating to rails 6 (#22)
14cf117  Jul 2021  DOC-49 update ruby and rails (#50)
833fb67  Mar 2022  upgrade rails version (#155)
c716dee  May 2022  [DOC-185] Add next_rails config (#193)
f386621  May 2022  [DOC-199] Merging rails 7 (#201)
76b618e  Oct 2022  Remove next_rails (#238)
06a9beb  Mar 2024  rails 7 1 config (#535)
6962e2a  Jan 2025  Run rails app:update command (#784)
14f00f6  Feb 2025  Bump to Rails 8 (#807)
c9797a6  Jan 2026  chore(deps): bump rails from 8.0.3 to 8.1.1
```

Seven years, eight major versions, one app that still runs. The best time to upgrade is always now.
