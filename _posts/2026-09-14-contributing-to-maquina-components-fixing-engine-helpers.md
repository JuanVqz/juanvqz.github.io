---
layout: post
title: "Contributing to maquina-components: Two PRs From Day One"
date: 2026-09-14 10:00:00 -0600
last_modified_at: 2026-09-14 10:00:00 -0600
categories: [development]
tags: [rails, open-source, rails-engines, maquina-components, contribution, generators]
---

While installing [maquina-components](https://github.com/maquina-app/maquina_components) in my project, I hit a `NoMethodError` for `sidebar_open?`. What started as "maybe I'm doing something wrong" turned into a deep dive into how Rails engines handle helpers, a wrong first fix, and eventually two PRs: one fixing a bug and another adding a feature.

---

## The Bug

After running the install generator and adding the sidebar to my layout, I got:

```
undefined method 'sidebar_open?' for an instance of #<Class:...>
```

The generated `MaquinaComponentsHelper` had wrapper methods like `app_sidebar_open?` that delegated to `sidebar_open?`, but `sidebar_open?` lives in `MaquinaComponents::SidebarHelper`. That module was never included.

---

## Why It Happens

Rails engines auto-include helpers from `app/helpers/`, but only top-level ones. If an engine namespaces its helpers in subdirectories like `app/helpers/maquina_components/sidebar_helper.rb`, Rails does not auto-include them into the host app's views.

The engine defines three helper modules:

- `MaquinaComponents::IconsHelper` (provides `icon_for`)
- `MaquinaComponents::SidebarHelper` (provides `sidebar_open?`, `sidebar_state`, `sidebar_closed?`)
- `MaquinaComponents::ToastHelper` (provides `toast_flash_messages`)

These are available inside the engine's own views, but not in the host application's views.

---

## The Wrong Fix First

My first instinct was to add an initializer to the engine that auto-includes all helpers:

```ruby
# lib/maquina_components/engine.rb
initializer "maquina-components.helpers" do
  ActiveSupport.on_load(:action_controller_base) do
    helper MaquinaComponents::IconsHelper
    helper MaquinaComponents::SidebarHelper
    helper MaquinaComponents::ToastHelper
  end
end
```

This works. Every controller in the host app gets the helpers automatically. But after thinking about it more, I realized this was too invasive. Looking at the generated helper template, the maintainer had clearly designed a pattern: wrapper methods (`app_sidebar_open?`) that delegate to engine methods. This gives host apps control over cookie names, caching strategies, and icon rendering without monkey-patching anything.

The initializer approach would bypass that design. If the engine auto-includes everything, the wrapper methods in the generated helper become pointless.

---

## The Right Fix

The generated helper template just needed `include` statements:

```ruby
module MaquinaComponentsHelper
  include MaquinaComponents::IconsHelper
  include MaquinaComponents::SidebarHelper
  include MaquinaComponents::ToastHelper

  def app_sidebar_open?(cookie_name = "sidebar_state")
    sidebar_open?(cookie_name)
  end

  def main_icon_svg_for(name)
    nil  # Override to use your own icon system
  end

  # ...
end
```

The `include` lines make the engine methods available within the helper module, so the wrapper methods can call them. Host apps still override `main_icon_svg_for` to plug in their own icons, and `app_sidebar_open?` to customize the cookie name. The architecture stays intact.

---

## Opening the Issue and PR

I cloned the repo, created a branch, and made three changes:

1. **Template fix**: Added the three `include` statements to `maquina_components_helper.rb.tt`
2. **Test coverage**: Added assertions verifying the includes are present in the generated file
3. **README note**: Added a line about helpers being available after installation

Running the existing test suite:

```bash
ruby -Itest test/generators/install_generator_test.rb
# 14 runs, 82 assertions, 0 failures
```

Since I don't have push access to the upstream repo, I forked it and created the PR from my fork:

```bash
gh repo fork maquina-app/maquina_components --remote-name fork
git push -u fork fix/auto_include_engine_helpers
gh issue create --repo maquina-app/maquina_components \
  --title "Generated helper missing engine module includes"
gh pr create --repo maquina-app/maquina_components \
  --head JuanVqz:fix/auto_include_engine_helpers \
  --title "Include engine helper modules in generated helper"
```

- Issue: [maquina-app/maquina_components#18](https://github.com/maquina-app/maquina_components/issues/18)
- PR: [maquina-app/maquina_components#19](https://github.com/maquina-app/maquina_components/pull/19)

---

## The Workaround

If you're using maquina-components before this fix is merged, add the includes manually to `app/helpers/maquina_components_helper.rb`:

```ruby
module MaquinaComponentsHelper
  include MaquinaComponents::IconsHelper
  include MaquinaComponents::SidebarHelper
  include MaquinaComponents::ToastHelper
end
```

That's it. All engine helpers (`icon_for`, `sidebar_open?`, `toast_flash_messages`) will work in your views.

---

## Second Contribution: Scaffold Templates Generator

After fixing the helper issue, I kept using the gem and found myself writing the same boilerplate every time I created a new resource: wrapping forms in cards, adding breadcrumbs, using `data-component` attributes on inputs. Rails has a mechanism for this: custom scaffold templates in `lib/templates/erb/scaffold/`.

I initially created the templates for my own app (with hardcoded Spanish text), but realized they'd be more useful as part of the gem itself. The key was stripping out my app-specific stuff and following the same English text conventions Rails uses ("New product", "Back to products", "Destroy this product", etc.).

The generator is straightforward:

```bash
rails generate maquina_components:scaffold_templates
```

It copies 6 templates to `lib/templates/erb/scaffold/`. After that, every `rails g scaffold` produces views using cards, tables, breadcrumbs, alerts, and empty states with `data-component` attributes on form elements.

The generator class is minimal:

```ruby
module MaquinaComponents
  module Generators
    class ScaffoldTemplatesGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)

      TEMPLATE_FILES = %w[
        _form.html.erb.tt  edit.html.erb.tt
        index.html.erb.tt  new.html.erb.tt
        partial.html.erb.tt  show.html.erb.tt
      ].freeze

      def copy_templates
        TEMPLATE_FILES.each do |filename|
          copy_file filename, "lib/templates/erb/scaffold/#{filename}"
        end
      end
    end
  end
end
```

I went with a separate generator instead of bundling the templates into the engine's template resolution path. That way users opt-in, and they can customize the templates after copying (change language, add fields, adjust layout) without affecting future gem updates.

Since I was literally a day-one user of the gem, I added a note to the PR: if this contribution feels too early or doesn't align with the project's direction, feel free to close it. Sometimes contributing early is better than waiting, sometimes it's not. The maintainer can decide.

- PR: [maquina-app/maquina_components#20](https://github.com/maquina-app/maquina_components/pull/20)

---

## What I Learned

**Check the design before jumping to a fix.** My first instinct (engine initializer) would have worked but was wrong for the project. The maintainer designed the generated helper as a customization layer. The fix should respect that.

**Rails engine helper auto-inclusion has a gotcha.** Top-level helpers in `app/helpers/` are auto-included. Namespaced helpers in subdirectories are not. This is documented behavior, but easy to miss when building or using engines.

**Strip your app-specific stuff before contributing.** My first version of the scaffold templates had hardcoded Spanish text. That's fine for my app, but a gem contribution needs to follow the same conventions Rails itself uses. Always check the defaults you're replacing.

**Contributing is easier when you can clone and test locally.** Having the gem source at hand made it straightforward to reproduce issues, verify fixes, and run the test suite. Both contributions, from identifying the problems to opening the PRs, happened in the same session.

---

## Links

- [Issue #18: Generated helper missing engine module includes](https://github.com/maquina-app/maquina_components/issues/18)
- [PR #19: Include engine helper modules in generated helper](https://github.com/maquina-app/maquina_components/pull/19)
- [PR #20: Add scaffold_templates generator](https://github.com/maquina-app/maquina_components/pull/20)
- [maquina-components](https://github.com/maquina-app/maquina_components)
