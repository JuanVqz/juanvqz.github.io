---
layout: post
title: "From HAML to ERB: Going Back to Rails-Native Templates"
date: 2026-05-05 09:00:00 -0600
last_modified_at: 2026-05-05 09:00:00 -0600
categories: [development]
tags: [rails, haml, erb, templates, reactionview, doctors-journey]
---

## Why HAML in the First Place

When I started building the clinical assistance app, HAML felt like a breath of fresh air. No closing tags. No angle brackets everywhere. Just clean, indentation-based markup:

```haml
%nav.navbar
  .navbar-brand
    = link_to root_path, class: "navbar-item" do
      %img{ src: logo_path }
  .navbar-menu
    .navbar-end
      = render "shared/user_menu"
```

It was elegant. You could look at a template and immediately see the structure without the visual noise of HTML. For a solo developer building out features fast, HAML kept the view layer concise and readable.

I never questioned it — until the rest of the ecosystem started moving in a different direction.

---

## The Cracks Started Showing

### Tooling isolation

HAML exists in its own world. Every Rails upgrade, every new tool integration, every AI assistant — they all speak ERB natively. HAML support is always an afterthought, a plugin, a "community contribution" that may or may not keep up.

GitHub Copilot? Better with ERB. Claude? Writes ERB fluently, HAML less so. New Rails generators? ERB by default. Every time I scaffolded something, I had to convert the output or maintain custom generator templates.

### Onboarding friction

Any Rails developer can read ERB on day one — it's just HTML with Ruby sprinkled in. HAML has its own syntax, its own rules about whitespace, its own gotchas with multiline attributes. It's one more thing to learn before you can contribute.

### The whitespace trap

HAML's indentation sensitivity sounds clean in theory, but in practice it creates brittle templates. A misplaced indent breaks rendering silently. Copy-pasting snippets from documentation or Stack Overflow requires manual reformatting. Merge conflicts in deeply nested templates become puzzles.

I once spent twenty minutes debugging a template that looked correct — the issue was a tab mixed in with spaces three levels deep.

---

## What Finally Pushed Me Over

I came across [ReactionView](https://reactionview.dev) — a new ERB-aware template engine built on the [Herb](https://github.com/marcoroth/herb) parser. It adds HTML validation, better error messages, and debugging overlays to ERB templates. The roadmap includes reactive server-rendered components that work with Hotwire.

There was one problem: ReactionView only supports ERB. No HAML. No Slim. Just `.html.erb` and its own `.html.herb` format.

That was the catalyst, but not the only reason. The real realization was simpler: **ERB is Rails-native.** It's what the framework speaks. Every piece of Rails tooling, every tutorial, every upgrade guide assumes ERB. By using HAML, I was swimming against the current — and for what? Saving a few angle brackets?

The future I wanted — Herb's HTML-aware parsing, ReactionView's debugging tools, maybe reactive templates down the line — all required ERB as the foundation. Staying on HAML meant staying on the sideline.

---

## The Migration

### 68 templates, one PR

The app had 68 HAML templates — layouts, partials, forms, turbo stream responses. I converted them all in a single PR. No incremental migration, no running both engines side by side.

Why one PR? Because the app has solid test coverage. Every controller action, every turbo stream response, every critical user flow has tests backing it. If the templates render correctly and the tests pass, the migration worked.

### The conversion process

There's no magic `haml-to-erb` tool that produces perfect output. The approach I used:

1. Automated conversion to get the structure right
2. Manual review of every template to clean up the output
3. Pattern matching against existing conventions — Tailwind classes, I18n keys, helper usage

Here's what a typical conversion looked like. The HAML:

```haml
.flex.flex-row.justify-between.items-center.mb-4
  %h1.text-2xl.font-bold
    = t(".title")
  = link_to new_patient_path, class: "#{primary_button}" do
    %i.fa-solid.fa-plus.mr-1
    = t("tooltips.defaults.new")
```

Became this ERB:

```erb
<div class="flex flex-row justify-between items-center mb-4">
  <h1 class="text-2xl font-bold">
    <%= t(".title") %>
  </h1>
  <%= link_to new_patient_path, class: "#{primary_button}" do %>
    <i class="fa-solid fa-plus mr-1"></i>
    <%= t("tooltips.defaults.new") %>
  <% end %>
</div>
```

More verbose? Yes. But also immediately recognizable to anyone who's written HTML. No syntax to decode, no indentation rules to remember. Just HTML with Ruby in it.

And in practice, the verbosity gap is smaller than it looks. The app leans heavily on Rails-native partials — most templates are composed of `render` calls, helpers, and `link_to` blocks rather than raw HTML. When a template is mostly Ruby method calls wrapped in `<%= %>` tags, HAML's conciseness advantage nearly disappears.

### Cleaning up after HAML

The migration wasn't just a file format change. It was also an opportunity to catch things that had been hiding in plain sight:

- **Removed `haml-rails`** from the Gemfile entirely — one less dependency to maintain
- **Updated Tailwind config** — removed the `*.haml` glob from the content paths since no HAML files exist anymore
- **Updated scaffold generators** — replaced the custom HAML form template with an ERB equivalent
- **Fixed stale Bulma classes** — a hospitalization partial was still using `button is-success` and hardcoded Spanish strings from the pre-Tailwind, pre-I18n era

That last one is the hidden benefit of touching every template: you see everything.

---

## What I Lost, What I Gained

### What I lost

**Conciseness.** HAML templates are shorter. There's no way around it — when you don't write closing tags, your files are more compact. The 68 ERB templates take up more lines than their HAML predecessors.

**Visual elegance.** HAML's indentation-as-structure is genuinely pleasant to read when the template is simple. A nav bar in HAML reads like pseudocode.

### What I gained

**Ecosystem alignment.** Every Rails tool works with ERB out of the box. No adapter gems, no custom generator templates, no hoping that the next Rails version doesn't break HAML compatibility.

**Better AI collaboration.** This matters more than I expected. When Claude or any LLM generates view code, it writes ERB. When I paste template code into a conversation, ERB needs no explanation. The feedback loop is faster.

**A path to ReactionView.** This is the forward-looking bet. Once Herb and ReactionView stabilize, upgrading from `.html.erb` to `.html.herb` should be straightforward — the syntax is the same, just with an HTML-aware parser underneath. From HAML, that path didn't exist.

**One less thing.** One less DSL to maintain expertise in. One less gem to update. One less entry in the "things a new contributor needs to learn" list.

---

## Looking Forward

The plan is to let ERB settle for a while. The templates are clean, the tests pass, and the team (me) is comfortable with the format.

When ReactionView reaches a stable release, the migration from ERB to Herb should be minimal — rename files, add the gem, and start benefiting from HTML validation and better error messages. That's the whole point: ERB is the on-ramp to everything coming next in the Rails view layer.

Sometimes going "back" to the native option is actually moving forward. HAML was great for its time. ERB is where Rails is going.
