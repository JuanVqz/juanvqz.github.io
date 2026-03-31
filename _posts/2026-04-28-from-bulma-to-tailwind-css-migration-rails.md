---
layout: post
title: "From Bulma to Tailwind: Migrating a Rails App's CSS Framework"
date: 2026-04-28 09:00:00 -0600
last_modified_at: 2026-04-28 09:00:00 -0600
categories: [development]
tags: [rails, css, tailwind, bulma, frontend, doctors-journey]
---

## The Starting Point

I've been running a clinical assistance system for a few years — doctors manage patient consultations, hospitalizations, and referrals across multiple hospital subdomains. The frontend was built with **Bulma**, a CSS framework that ships pre-styled components out of the box.

Bulma served the app well for a long time. Navbars, tables, buttons, modals — all there, all consistent. You write `class="button is-link"` and you get a blue button. No thinking required.

Then the app grew, the requirements got more specific, and Bulma started getting in the way.

---

## What Bulma Looked Like

Here's the patient list page in the Bulma era:

![Bulma version of the patient list](/assets/img/posts/css-migration/bulma-patients.png)
_Bulma's default styling — functional, but rigid_

The HAML template was clean and readable:

```haml
%nav.level
  .level-left
    .level-item
      = render "shared/search", search_path: patients_path
  .level-right
    .level-item
      = link_to [:new, :patient], class: "button is-link" do
        %span.icon
          %i.fa.fa-plus
        %span Registrar Paciente

.table-container
  %table.table.is-hoverable.is-fullwidth
    %thead.is-uppercase
      %tr
        %th Nombre
        %th Registrado
        %th Actualizado
        %th.has-text-right Acciones
```

Classes like `is-link`, `is-hoverable`, `is-fullwidth`, `level-left` — semantic and descriptive. You read the template and understand the structure immediately.

---

## Why I Moved Away From Bulma

### Customization ceiling

Bulma gives you components, but when you need to go beyond them, you fight the framework. Need a slightly different card layout? Override Bulma's defaults. Want responsive behavior that doesn't match Bulma's breakpoints? Write custom CSS on top. Over time, I was writing more overrides than framework code.

### No dark mode

This was the dealbreaker. The clinical app needed dark mode — doctors working late shifts, hospital environments with low lighting. Bulma has no built-in dark mode support. You'd need to maintain an entire parallel stylesheet or adopt a community fork.

### Dead-ish development

Bulma's development slowed significantly. The framework was stuck between v0.9 and v1.0 for years. Meanwhile, the CSS ecosystem moved on — container queries, `@layer`, native nesting. Bulma wasn't keeping up.

### Sprockets dependency

The app was using `bulma-rails` which pulled Bulma through the Sprockets asset pipeline. When I migrated to Vite (via `vite_rails`), keeping Sprockets around just for Bulma felt wrong. It was time for a clean break.

---

## The Migration: One Big PR

I won't pretend this was incremental. It was a single PR — **183 files changed, 3,426 insertions, 11,354 deletions**. That net deletion tells you something: Bulma had a lot of structural markup that Tailwind didn't need.

The migration involved:

1. **Remove Bulma and Sprockets config** — delete `bulma-rails`, remove the Sprockets initializer
2. **Install Tailwind via npm** — configured with Vite and PostCSS
3. **Update SimpleForm initializer** — from Bulma wrappers to Tailwind-styled wrappers
4. **Rewrite every view** — replace Bulma classes with Tailwind utilities

That last step was the bulk of the work. Every `is-link` became a set of Tailwind classes. Every `columns` layout became Flexbox or Grid utilities.

---

## The Same Page, After

Here's the same patient list in Tailwind:

![Tailwind version of the patient list](/assets/img/posts/css-migration/tailwind-patients.png)
_Tailwind version — dark mode ready, cleaner layout_

And the template:

```haml
= render 'shared/section' do
  .flex.flex-col.md:flex-row.md:justify-between
    = render 'shared/actions', model: :patient, search_path: patients_path

= render 'shared/section' do
  = render 'shared/table' do
    %thead.border-b.border-gray-300.dark:border-gray-700.text-gray-400
      %tr
        %th.py-2= t('.name')
        %th.py-2= t('.created_at')
        %th.py-2.text-center= t('.actions')
    %tbody
      - @patients.each do |patient|
        %tr.hover:bg-gray-200.dark:hover:bg-gray-700
          %td.py-2.whitespace-nowrap= patient
          %td.py-2.whitespace-nowrap= time_ago_in_words(patient.created_at)
```

Yes, the classes are longer. `.hover:bg-gray-200.dark:hover:bg-gray-700` is not as pretty as `.is-hoverable`. But every style decision is explicit and visible. No guessing what `is-hoverable` actually does behind the scenes.

---

## What Changed Beyond Classes

### SimpleForm wrappers

This was surprisingly time-consuming. Bulma has specific form markup expectations — `field`, `control`, `label` wrappers with specific nesting. Tailwind needs completely different wrapper definitions.

I ended up defining custom wrappers in `simple_form_tailwindcss.rb`:

```ruby
config.wrappers :vertical_form, tag: :div, class: "mb-4" do |b|
  b.use :html5
  b.use :placeholder
  b.use :label, class: "block mb-2 text-sm font-medium text-gray-900 dark:text-white"
  b.use :input,
        class: "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
               focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5
               dark:bg-gray-700 dark:border-gray-600 dark:text-white"
  b.use :hint, wrap_with: { tag: :small, class: "text-sm text-gray-400" }
end
```

One gotcha: **select inputs need their own wrapper**. Without it, `<select>` elements inherit text-input styling and render at the wrong height. I added a dedicated `:vertical_select` wrapper mapped in `wrapper_mappings`:

```ruby
config.wrapper_mappings = {
  boolean: :vertical_boolean,
  select: :vertical_select,
  # ...
}
```

### Shared partials multiplied

With Bulma, components came free — a `table` class gave you a styled table. With Tailwind, I extracted shared partials (`shared/section`, `shared/table`, `shared/actions`) to avoid repeating the same utility classes across every view. This was actually a net positive — the partials are now more composable than Bulma's rigid components.

### Dark mode came free

Once the Tailwind classes were in place, dark mode was just a matter of adding `dark:` variants. No separate stylesheet, no theme switcher library. A simple `localStorage` toggle and a few `dark:bg-gray-800` classes on the layout.

---

## Tailwind v3 to v4

A few months after the migration, Tailwind v4 dropped. The upgrade was surprisingly smooth — mostly changing the CSS import from a config-file approach to the new `@import "tailwindcss"` directive. A few utility renames, but nothing structural.

The hardest part was a brief period where I **downgraded back** after the initial v4 bump broke some PostCSS interactions. Once `@tailwindcss/postcss` stabilized, the upgrade stuck.

---

## Comparison

| | Bulma | Tailwind |
|---|---|---|
| **Approach** | Pre-built components | Utility classes |
| **Dark mode** | Not built-in | `dark:` prefix, trivial |
| **Customization** | Override defaults | Compose from utilities |
| **Bundle size** | Full framework loaded | Only used classes (purged) |
| **Learning curve** | Low (read docs, use classes) | Medium (learn utility patterns) |
| **Template readability** | Cleaner class names | Longer, more explicit |
| **Form integration** | SimpleForm has Bulma wrappers | Need custom wrappers |
| **Maintenance** | Slow development | Very active |

---

## What's Next: Component Libraries

The one thing I miss from Bulma is having pre-built components. Tailwind gives you total control, but you end up rebuilding buttons, cards, modals, and dropdowns from scratch — or copying them from Flowbite.

That's why I'm looking at **component libraries** that sit on top of Tailwind — specifically **maquina_components**, which provides Rails-native view components with Tailwind styling. The idea is to get the best of both worlds: Tailwind's flexibility with Bulma-style convenience.

But that's a story for another post.

---

## Was It Worth It?

The migration took a full weekend of focused work. 183 files is no joke. But the result was:

- **11,354 lines deleted** — Bulma's structural markup was heavy
- **Dark mode** — shipped the same week
- **Faster iteration** — no more fighting framework defaults
- **Modern tooling** — Vite + PostCSS + Tailwind v4, no Sprockets

If your app is small and Bulma covers your needs, stay with it. It's a fine framework. But if you're hitting customization walls, need dark mode, or want to modernize your asset pipeline — the migration to Tailwind is painful for a weekend and worth it for years.

The hardest part isn't learning Tailwind. It's accepting that `class="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"` is actually fine.
