---
layout: post
title: "Installing ReActionView: What the Herb Linter Found in My Views"
date: 2026-10-27 09:00:00 -0600
last_modified_at: 2026-10-27 09:00:00 -0600
categories: [development]
tags: [rails, erb, herb, reactionview, linter, may-store-journey]
---

## The Bet I Made Earlier

A few months ago I moved a whole app [from HAML to ERB](/blog/from-haml-to-erb-going-back-to-rails-native-templates/). The argument was partly about ecosystem alignment, but the forward-looking part was a bet: once [ReActionView](https://reactionview.dev) and [Herb](https://herb-tools.dev) stabilized, ERB would be the on-ramp to HTML-aware templates, real validation, and actual tooling for the view layer.

This week I collected on that bet, in a different app. My order management system for cafes and restaurants had a problem I had written down in its own docs and then ignored:

> `test/system/` is empty, so nothing exercises rendered views end to end. Controller tests use fixtures that often lack the interesting rows (for example, no fixture order has an `extra` line item component, which is why a crash in the bill view went unnoticed).

A view crashed in production-ish usage and no test caught it, because no test rendered that branch. That is the kind of gap a linter and an HTML-aware engine are supposed to close.

---

## Installing It

The install is two commands.

```sh
bundle add reactionview
bin/rails generate reactionview:install
```

That pulls in `herb` and writes `config/initializers/reactionview.rb`. I put the gem in the `:development, :test` group, which turned out to matter more than I expected (more on that below).

Then the linter's own config:

```sh
bundle exec herb lint --init
```

That writes `.herb.yml` and, as a nice touch, drops a `.vscode/extensions.json` recommending the Herb language server.

---

## Two Config Decisions Worth Explaining

### Turn on `intercept_erb`

By default ReActionView only takes over `.html.herb` files. The interesting switch is this one:

```ruby
config.intercept_erb = true
```

With it on, every `.html.erb` template renders through `Herb::Engine`. Invalid HTML raises in the test environment and shows a debug overlay in development. That is exactly the hole I had: my views were never validated by anything, because nothing was looking at the HTML they produced. Now my existing 187 tests double as HTML validation, for free, on every template they happen to render.

All 187 still passed with interception on, which was the result I wanted but not the one I expected on a `0.3.0` gem.

### Guard the initializer

Here is the trap. The gem lives in `:development, :test`, so in production the `ReActionView` constant does not exist, and `config/initializers/reactionview.rb` runs in every environment. An unguarded initializer takes the whole production boot down with a `NameError`.

```ruby
# The reactionview gem is only bundled in :development and :test, so this
# initializer must do nothing when the constant is missing (production).
return unless defined?(ReActionView)

ReActionView.configure do |config|
  config.intercept_erb = true
  config.debug_mode = Rails.env.development?
end
```

Verified the boring way:

```sh
SECRET_KEY_BASE_DUMMY=1 RAILS_ENV=production bin/rails runner 'puts "ok"'
```

### Pin the version

`.herb.yml` gets a `version:` key, and it is not decoration:

```yaml
version: 0.10.3
framework: actionview
template_engine: erubi

files:
  exclude:
    - "public/**/*"
    - "tmp/**/*"
    - "vendor/**/*"
```

Herb ships rules fast. 85 rules are enabled today and 15 more exist but are off. Pinning means a `bundle update` cannot silently turn a green build red with rules I have never read.

---

## The First Run: 16 Offenses

```sh
bundle exec herb lint
```

60 files checked, 9 with offenses, 16 offenses, 767 ms.

Ten of the sixteen were the same rule, `html-no-space-in-tag`, in `public/400.html`, `404.html`, `406-unsupported-browser.html`, `422.html`, and `500.html`. Those are the static error pages Rails generates, with minified inline CSS. I am not hand-editing generated files to satisfy a whitespace rule, so `public/**/*` went into the exclude list. That is a decision, not a workaround: those files are not part of my view layer.

That left six real offenses in `app/views`, and every one of them was a thing I would have written again tomorrow.

---

## What It Actually Caught

### ERB emitting an attribute name

```erb
<input type="radio" name="ingredients[<%= pc.component_id %>]" value="<%= val %>"
       <%= 'checked' if val == 1.0 %> class="hidden peer">
```

Rule: `erb-no-output-in-attribute-name`.

This is the classic "print the whole attribute conditionally" move. It works, and it is invisible to any parser that treats ERB as opaque text, which is why nothing ever complained before. Herb parses the HTML around the ERB, so it can see that the ERB output lands where an attribute *name* goes.

The fix is the Rails helper that has existed the whole time:

```erb
<%= radio_button_tag "ingredients[#{pc.component_id}]", val, val == 1.0, id: nil, class: "hidden peer" %>
```

### ERB in attribute position

```erb
<div id="line_item_<%= item.id %>" data-status="<%= item.status %>"
  <%= 'data-controller="highlight"' if local_assigns[:highlight] %>>
```

Rule: `erb-no-output-in-attribute-position`.

Same species, different symptom. The fix moves the conditional inside the attribute value, where the parser can reason about it:

```erb
data-controller="<%= "highlight" if local_assigns[:highlight] %>"
```

An empty `data-controller=""` when the flag is off is harmless, and Stimulus ignores it.

### `<a href="#">` pretending to be a button

Two places, both the print action:

```erb
<%= link_to t("bill.print"), "#",
      class: "text-center",
      data: { component: "button", variant: "outline", size: "lg", action: "print#print" } %>
```

Rule: `html-anchor-require-href`. The linter's phrasing is blunt and correct: `href="#"` does not navigate anywhere, it scrolls the page to the top and appends `#` to the URL.

This one is a genuine bug in disguise. That element is not a link. It fires a Stimulus action and nothing else. It only ever became an `<a>` because `link_to` was convenient.

```erb
<%= tag.button t("bill.print"), type: "button",
      class: "text-center",
      data: { component: "button", variant: "outline", size: "lg", action: "print#print" } %>
```

Two details mattered here. `type: "button"` is explicit because one of those buttons sits inside the payment form, and a bare `<button>` defaults to `type="submit"`. And the styling survived untouched because my component CSS keys off the data attribute, not the element:

```css
[data-component="button"] { /* ... */ }
```

Element-agnostic component styles are what made this a one-line change instead of a redesign.

### Missing `autocomplete`

Two number inputs, one for extras quantity and one for cash received. Rule: `html-input-require-autocomplete`, a warning rather than an error. Browsers happily autofill a "received amount" field with something from a previous form, which is a real annoyance at a register.

```erb
<input type="number" step="0.01" min="0" name="received" id="received" autocomplete="off" ...>
```

Nine of the 85 enabled rules are accessibility rules, and this is the flavor of thing they catch: not broken, just worse than it needs to be for the person actually using the app.

---

## Wiring It Into CI

A linter nobody runs is a linter that drifts. `herb lint` shells out to `npx @herb-tools/linter`, so the CI job needs Node alongside Ruby:

```yaml
lint_views:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v7
    - uses: ruby/setup-ruby@v1
      with:
        ruby-version: .ruby-version
        bundler-cache: true
    - uses: actions/setup-node@v6
      with:
        node-version: lts/*
    - name: Lint HTML+ERB templates
      run: bundle exec herb lint --github
```

`--github` emits GitHub annotations, so offenses show up inline on the pull request diff instead of buried in a log.

---

## What This Actually Bought Me

Final state: 55 files, 0 offenses, under a second. 187 tests passing with every template rendering through an HTML-aware engine. Rubocop still clean.

The honest accounting:

**Four of the six offenses were invisible to every tool I already ran.** Rubocop reads Ruby. It does not know that a string literal my ERB prints is going to land in an attribute name slot. Brakeman looks for security patterns. My controller tests assert on status codes and text, not on whether the markup is well-formed. There was simply nothing in the pipeline whose job was the HTML.

**One of them was a real bug.** The print buttons were anchors that scrolled the page to the top on every click. Nobody filed that. It is the sort of thing you subconsciously work around for months.

**The `intercept_erb` switch is the part I would keep even without the linter.** Rendering through `Herb::Engine` means the next malformed tag fails a test instead of shipping. That is the gap I had written into my own docs and never closed, and it closed with one line of config.

The cost was one afternoon, one gem in the dev/test group, and one guard clause. That is a cheap trade for a layer of the app that had zero automated scrutiny.

---

## A Note on the Bleeding Edge

`reactionview` is at `0.3.0`. `herb` is at `0.10.3`. The installer literally ends with "Thanks for riding the bleeding edge." I am not going to pretend that is nothing.

What makes it a reasonable bet anyway:

- The gem is not in production. It is `:development, :test` only, with a guarded initializer. The worst case is a broken local server, not a broken store.
- The version is pinned in `.herb.yml`, so upgrades are something I choose.
- The template fixes are all plain Rails. `radio_button_tag`, `tag.button`, `autocomplete="off"`. If I removed ReActionView tomorrow, every fix stays valuable.

That last point is the one I would underline. A good linter does not leave you with code shaped around the linter. It leaves you with code you should have written the first time.

Back in May I wrote that ERB was the on-ramp to everything coming next in the Rails view layer. This is the first stretch of actual road.
