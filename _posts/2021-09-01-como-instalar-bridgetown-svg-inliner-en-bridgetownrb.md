---
layout: post
title: "How to Install bridgetown-svg-inliner in Bridgetown"
date: 2021-09-01 08:30:51 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [development]
tags: [ruby, bridgetownrb, javascript]
---

## The Task

It's simpler than it seems.

The task is simple if you've used Ruby on Rails, as the process is identical to installing gems in a Gemfile.

---

## Which Gem to Use?

> NOTE:
> There's another gem called [bridgetown-inline-svg](https://github.com/andrewmcodes/bridgetown-inline-svg#readme)
> but it's in **maintenance mode**, so its use is not recommended.

The recommended gem is [bridgetown-svg-inliner](https://github.com/ayushn21/bridgetown-svg-inliner),
which has compatibility with the latest version of Bridgetown and **MIT** license.

---

## Installation Steps

### Step 1: Add the Gem to Your Gemfile

```ruby
group :bridgetown_plugins do
  gem "bridgetown-svg-inliner"
end
```

### Step 2: Install the Gem

```bash
# In the main folder of the project
bundle install
```

### Step 3: Use SVG Files

Done! You can now use SVG files directly in your templates:

**Liquid format:**
```liquid
{% raw %}{% svg "images/github.svg" %}{% endraw %}
```

**ERB format:**
```ruby
<%= svg "images/youtube.svg" %}
```

---

## How It Works

You don't need to use the full path from the root of the project. Just use the relative path to the images folder that Bridgetown provides by default:

```bash
project/src/images
```

So if you have `src/images/github.svg`, you simply reference it as:

```liquid
{% raw %}{% svg "images/github.svg" %}{% endraw %}
```

---

## What I Learned

1. **Ruby conventions are consistent** — If you know Rails, you know Bridgetown. The Gemfile pattern is the same across the Ruby ecosystem

2. **Check maintenance status** — Before using a gem, check if it's actively maintained. `bridgetown-inline-svg` was in maintenance mode, so we chose `bridgetown-svg-inliner` instead

3. **Inline SVGs have benefits** — No extra HTTP requests, easier styling with CSS, and you can manipulate them with JavaScript

4. **Keep paths simple** — Frameworks like Bridgetown provide sensible defaults. Work with them instead of fighting against absolute paths

5. **Liquid vs ERB** — Bridgetown supports both. Choose based on your preference or your team's familiarity

---

## Comparison: Inline vs External SVGs

| Aspect | Inline SVGs | External SVGs |
|---|---|---|
| **HTTP Requests** | None (inline) | One per file |
| **Caching** | Cached with HTML | Cached separately |
| **Styling** | CSS classes work directly | May need `fill: currentColor` |
| **JavaScript Access** | Direct DOM access | Requires `fetch` or `XMLHttpRequest` |
| **File Size** | Increases HTML size | Kept separate |

For icons and small graphics, inline SVGs are often the better choice.

---

For more information, check the gem's [README](https://github.com/ayushn21/bridgetown-svg-inliner#installation).
