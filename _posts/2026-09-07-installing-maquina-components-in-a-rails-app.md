---
layout: post
title: "Installing maquina-components in a Rails App"
date: 2026-09-07 10:00:00 -0600
last_modified_at: 2026-09-07 10:00:00 -0600
categories: [development]
tags: [rails, tailwind-css, maquina-components, hotwire, ui]
---

I recently migrated [MayStore](https://github.com/JuanVqz/may_store), a multitenant order management app, from 520 lines of custom CSS to [maquina-components](https://github.com/maquina-app/maquina_components). This post covers what it takes, what worked well, and a few gotchas.

---

## What is maquina-components?

It's a Rails engine that provides a component library built on Tailwind CSS v4. Think shadcn/ui but for ERB. Components are rendered as partials with `data-component` and `data-variant` attributes for styling. No ViewComponent, no Phlex, just Rails partials.

The library includes: sidebar, header, breadcrumbs, cards, tables, buttons, inputs, toasts, alerts, modals, and more.

---

## Prerequisites

Before installing maquina-components, you need:

1. **Rails 8.0+** with Propshaft (not Sprockets)
2. **importmap-rails** for JavaScript delivery
3. **tailwindcss-rails** gem installed and configured
4. **Tailwind CSS v4** (the gem's latest version uses v4)

If you're using esbuild, Vite, or jsbundling-rails for JS, maquina-components won't work out of the box. The engine registers its JavaScript controllers through importmap, and the Stimulus controllers expect to be loaded via `@hotwired/stimulus-loading`.

Install the prerequisites:

```bash
bundle add tailwindcss-rails
rails tailwindcss:install
```

This creates `app/assets/tailwind/application.css` with the `@import "tailwindcss"` directive.

---

## Installing maquina-components

```bash
bundle add maquina-components
rails generate maquina_components:install
```

The generator does three things:

1. Adds the engine CSS import to your Tailwind file
2. Appends theme variables (CSS custom properties with oklch colors, light/dark mode)
3. Creates `app/helpers/maquina_components_helper.rb` with engine helper includes

After running the generator, restart your Rails server so the engine's view paths and importmap entries are picked up.

---

## The Layout: Collapsible Sidebar

The sidebar component is what sold me. It has an `inset` variant that wraps the main content in a padded container, and it collapses to icons-only on desktop or slides off-canvas on mobile. State is persisted via cookies.

Here's what the layout looks like:

```erb
<body class="overflow-hidden bg-background font-sans antialiased">
  <%= render "components/sidebar/provider",
             default_open: app_sidebar_open? do %>

    <%= render "components/sidebar/sidebar", variant: :inset do %>
      <%= render "components/sidebar/header" do %>
        <span class="font-semibold text-lg truncate">
          <%= Current.store.name %>
        </span>
      <% end %>

      <%= render "components/sidebar/content" do %>
        <%= render "components/sidebar/group" do %>
          <%= render "components/sidebar/menu" do %>
            <%= render "components/sidebar/menu_item" do %>
              <%= render "components/sidebar/menu_button",
                    href: tables_path,
                    text: "Mesas",
                    icon: :grid %>
            <% end %>
          <% end %>
        <% end %>
      <% end %>
    <% end %>

    <%= render "components/sidebar/inset" do %>
      <%= render "components/header" do %>
        <%= render "components/sidebar/trigger" %>
        <%= render "components/separator", orientation: :vertical %>
        <!-- breadcrumbs, logout, etc. -->
      <% end %>

      <div class="flex-1 overflow-y-auto p-4">
        <%= yield %>
      </div>
    <% end %>
  <% end %>
</body>
```

The `app_sidebar_open?` helper reads a cookie to restore the sidebar state across page loads. The sidebar trigger button and keyboard shortcut (`Cmd+B`) toggle it.

---

## Using Components in Views

Components use `data-component` and `data-variant` attributes. No CSS classes to memorize:

```erb
<%# Button variants %>
<button data-component="button" data-variant="primary">Save</button>
<button data-component="button" data-variant="destructive">Delete</button>
<button data-component="button" data-variant="outline" data-size="sm">Edit</button>

<%# Form inputs %>
<%= form.text_field :name, data: { component: "input" } %>
<%= form.text_area :notes, data: { component: "textarea" } %>

<%# Cards %>
<%= render "components/card" do %>
  <%= render "components/card/header" do %>
    <%= render "components/card/title", text: "Order Details" %>
  <% end %>
  <%= render "components/card/content" do %>
    <!-- content here -->
  <% end %>
<% end %>
```

The partial-based approach means you get autocomplete in your editor and can inspect the component source directly in the engine's `app/views/components/` directory.

---

## Customizing the Theme

The generator adds CSS custom properties to your Tailwind file. You can change them to match your brand. I changed the primary color from the default red to blue:

```css
:root {
  --primary: oklch(0.488 0.243 264);
  --primary-foreground: oklch(0.984 0.003 264);
}

.dark {
  --primary: oklch(0.623 0.214 264);
  --primary-foreground: oklch(0.144 0.03 264);
}
```

One thing to watch: the default `--destructive` color is a light pink tint (designed for alert backgrounds). If you're using it for delete buttons, you'll want a more saturated red:

```css
:root {
  --destructive: oklch(0.577 0.245 27);
  --destructive-foreground: oklch(0.984 0.003 27);
}
```

---

## Pro Tip: Scaffold Templates

After using maquina-components for a bit, I found myself wanting every `rails generate scaffold` to produce views that already use the component system. I [contributed a generator](https://github.com/maquina-app/maquina_components/pull/20) for this. If it gets merged, you'll be able to run:

```bash
rails generate maquina_components:scaffold_templates
```

This copies 6 ERB templates (`_form`, `index`, `show`, `new`, `edit`, `partial`) to `lib/templates/erb/scaffold/`. After that, any `rails g scaffold Product name:string price:integer` produces views with cards, tables, breadcrumbs, and proper component markup out of the box.

Here's what the generated index looks like: a card with a row header (title + "New" button), a table with column headers from your model attributes, and an empty state component when there are no records.

The generated forms use `data: { component: "input" }` on every field, error messages render inside an alert component, and show/edit views include breadcrumbs via `content_for :breadcrumbs`.

In the meantime, you can grab the templates directly from the [PR branch](https://github.com/JuanVqz/maquina_components/tree/feature/scaffold_templates/lib/generators/maquina_components/scaffold_templates/templates) and copy them to `lib/templates/erb/scaffold/` manually.

---

## Was It Easy?

Mostly yes. The migration from custom CSS to components was straightforward because the component API is consistent: `data-component`, `data-variant`, `data-size` everywhere. The sidebar required the most thought (cookie state, mobile behavior, inset layout), but the documentation covers it.

A few things I ran into:

- **Restart required after install.** The engine's view paths and importmap entries aren't picked up until you restart the server. If you get a missing partial error for `components/_header`, that's why.
- **Engine helpers need explicit includes.** The generated helper file needs `include MaquinaComponents::SidebarHelper` (and friends) to work. As of v0.4.4, the generator template was missing these includes. I [opened a PR](https://github.com/maquina-app/maquina_components/pull/19) to fix it.
- **Stimulus controllers need updating.** If you have Stimulus controllers that toggle CSS classes for styling, you'll need to switch them to toggle `data-variant` attributes instead.

Overall, going from 520 lines of hand-written CSS to a component library that handles dark mode, responsive behavior, and accessibility was a clear win.

---

## Links

- [maquina-components](https://github.com/maquina-app/maquina_components)
- [Scaffold templates generator PR](https://github.com/maquina-app/maquina_components/pull/20)
- [tailwindcss-rails](https://github.com/rails/tailwindcss-rails)
- [MayStore PR #29](https://github.com/JuanVqz/may_store/pull/29)
