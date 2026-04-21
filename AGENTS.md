# AGENTS.md - Agent Coding Guidelines

This document provides guidelines for agents working on this Jekyll-based blog repository.

## Project Overview

This is a personal blog built with [Jekyll](https://jekyllrb.com/) using the [Chirpy theme](https://github.com/cotes2020/jekyll-theme-chirpy). The site is deployed to GitHub Pages.

## Installation

### Prerequisites

1. **Ruby 3.4** - Install via [rvm](https://rvm.io/), [rbenv](https://github.com/rbenv/rbenv), [asdf](https://asdf-vm.com/), or [Ruby official](https://www.ruby-lang.org/)
2. **Bundler** - Install with `gem install bundler`

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/JuanVqz/juanvqz.github.io.git
cd juanvqz.github.io

# 2. Install Ruby dependencies
bundle install

# 3. Start development server
bundle exec jekyll s -l

# 4. Open browser at http://127.0.0.1:4000
```

For production mode or custom host:
```bash
bash tools/run.sh -p        # production mode
bash tools/run.sh -H 0.0.0.0  # accessible from network
```

## Build Commands

### Local Development
```bash
# Install dependencies
bundle install

# Start development server with live reload
bundle exec jekyll s -l

# Or use the helper script (supports -H for host, -p for production mode)
bash tools/run.sh
```

### Production Build
```bash
JEKYLL_ENV=production bundle exec jekyll build
bash tools/test.sh
```

### Testing

This project uses [htmlproofer](https://github.com/gjtorikian/html-proofer) to validate HTML links and structure:

```bash
# Full test (builds and validates)
bash tools/test.sh

# Run htmlproofer directly on _site directory
bundle exec htmlproofer _site --disable-external --ignore-urls "/^http:\/\/127.0.0.1/,/^http:\/\/0.0.0.0/,/^http:\/\/localhost/"
```

There is no concept of "single test" in this project since htmlproofer tests the entire built site.

### CI/CD

The GitHub Actions workflow (`.github/workflows/pages-deploy.yml`) runs:
1. Ruby 3.4 setup
2. `jekyll build` with production environment
3. htmlproofer validation

## Code Style Guidelines

### General Conventions
- **Charset**: UTF-8
- **Line endings**: Unix (LF)
- **Trailing whitespace**: Trimmed
- **Final newline**: Required

### EditorConfig
The project uses `.editorconfig` with these settings:
- **Indent style**: Space
- **Indent size**: 2
- **JavaScript/CSS/SCSS**: Single quotes
- **YAML**: Double quotes
- **Markdown**: No trailing whitespace trimming (to preserve formatting)

### File Organization
```
_root/
├── _posts/           # Blog posts (YYYY-MM-DD-title.md)
├── _tabs/            # Tab pages (about, crochet, etc.)
├── _data/            # YAML data files
├── _plugins/         # Jekyll plugins
├── assets/img/crochet/ # Crochet project images
├── tools/            # Helper scripts (run.sh, test.sh)
├── .github/          # GitHub workflows
├── Gemfile           # Ruby dependencies
└── _config.yml       # Jekyll configuration
```

### Blog Post Frontmatter
Required fields for posts in `_posts/`:

```yaml
---
layout: post
title: "Post Title"
date: YYYY-MM-DD HH:MM:SS ZONE
last_modified_at: YYYY-MM-DD HH:MM:SS ZONE
categories: [category1, category2]
tags: [tag1, tag2]
image:
  path: /assets/img/posts/<slug>/og.png
  alt: Short description
---
```

- Date format: `YYYY-MM-DD HH:MM:SS -0500` (include timezone)
- Use double quotes for title
- Categories and tags use array syntax

### Social Preview Images (Open Graph)

Open Graph images are **auto-generated** by `jekyll-og-image` via a GitHub Actions workflow. No manual step — write a post, push, the workflow regenerates and commits the PNGs back to the branch, Vercel redeploys with them as static assets.

Setup:

1. `jekyll-og-image` is in the `Gemfile` `:development` group and is **not** listed under `_config.yml` `plugins:`. `_plugins/og_image_loader.rb` requires the gem when it is available (rescuing `LoadError` so Vercel, where the gem is not installed, does not crash) and registers a `pre_render` hook that sets `page.image` from `assets/img/og/posts/<slug>.png` whenever a matching PNG exists. This makes Chirpy emit the correct `og:image` and `twitter:image` meta tags even when the plugin itself is not loaded.
   - Vercel does not auto-exclude the `:development` group. The environment variable `BUNDLE_WITHOUT=development:test` must be set in Vercel → Project → Settings → Environment Variables (Production + Preview). Without it, Vercel installs the plugin, which then tries to call libvips at build time and crashes (AL2023 has no libvips package).
2. `.github/workflows/og-images.yml` runs on pushes that touch `_posts/`, `_config.yml`, the avatar, the Gemfile, or the workflow itself. It installs `libvips`, runs `tools/og-images.sh` (which builds the site and copies the generated PNGs into `assets/img/og/posts/`), and commits any new/changed images back to the branch with `[skip og]` in the message to prevent loops.
3. The local `_layouts/home.html` override hides the image from the post list. The local `_layouts/post.html` override hides the banner at the top of post pages. The image is used only for social sharing.

To regenerate locally:

```bash
bash tools/og-images.sh
```

**Custom image for a specific post:**

Override via frontmatter:

```yaml
image:
  path: /assets/img/posts/<slug>/og.png
  alt: Short description
```

Image spec (for custom overrides or the site-wide default):

- **Recommended size**: 1200×630 px (aspect ratio 1.91:1)
- **Minimum size**: 600×315 px
- **Max file size**: 5 MB (X/Twitter), 8 MB (Facebook/LinkedIn)
- **Format**: PNG or JPG (avoid WebP — some scrapers do not support it)

Crop an existing image to spec:

```bash
sips -z 630 1200 --cropToHeightWidth 630 1200 input.png --out og.png
```

Verify locally with a browser extension (e.g., "Social Share Preview") on the rendered post page.

**Local dependency:** `libvips` must be installed for the plugin to run. On macOS: `brew install vips`.

### Markdown Guidelines
- Use ATX-style headers (`#`, `##`, `###`)
- Code blocks with language hints: ` ```sh `, ` ```ruby `, etc.
- Keep lines reasonably short for readability
- Don't trim trailing whitespace in markdown files (preserves intentional formatting)

### Shell Scripts
- Use `#!/usr/bin/env bash`
- Include shebang and brief comment
- Use `set -eu` for error handling
- Follow the patterns in `tools/test.sh` and `tools/run.sh`

### YAML Configuration
- Use double quotes for strings
- 2-space indentation
- Comments start with `#`

### VSCode Settings
The project includes VSCode settings (`.vscode/settings.json`):
- Prettier for formatting
- Shopify Liquid for HTML templates
- Markdown All-in-One for markdown
- shfmt for shell scripts

## Common Tasks

### Creating a New Post
1. Create file: `_posts/YYYY-MM-DD-post-title.md`
2. Add frontmatter with required fields
3. Write content in Markdown
4. Test locally with `bundle exec jekyll s -l`

### Adding a New Page/Tab
1. Create file in `_tabs/` directory
2. Add frontmatter with `layout: page` and `permalink:`
3. Set `order:` for navigation ordering

### Running Full Validation
```bash
bash tools/test.sh
# This runs:
# 1. JEKYLL_ENV=production bundle exec jekyll b
# 2. bundle exec htmlproofer _site --disable-external ...
```

## Dependencies
- Ruby 3.4
- Jekyll 7.x (Chirpy theme 7.5+)
- htmlproofer 5.x (for testing)
- Ruby LSP (in `.ruby-lsp/` for IDE support)

## Notes
- External links are disabled in htmlproofer (only validates internal links)
- The site uses GitHub Pages deployment from `gh-pages` branch
- PWA is enabled with offline caching
- Comments via Giscus (GitHub Discussions)
