# AGENTS.md - Agent Coding Guidelines

This document provides guidelines for agents working on this Jekyll-based blog repository.

## Project Overview

This is a personal blog built with [Jekyll](https://jekyllrb.com/) using the [Chirpy theme](https://github.com/cotes2020/jekyll-theme-chirpy). The site is deployed to GitHub Pages.

## Installation

### Prerequisites

1. **Ruby 3.3** - Install via [rvm](https://rvm.io/), [rbenv](https://github.com/rbenv/rbenv), or [Ruby official](https://www.ruby-lang.org/)
2. **Bundler** - Install with `gem install bundler`

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/juanvqz/juanvqz.github.io.git
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
1. Ruby 3.3 setup
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
├── _tabs/            # Tab pages (about, links, etc.)
├── _data/            # YAML data files
├── _plugins/         # Jekyll plugins
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
---
```

- Date format: `YYYY-MM-DD HH:MM:SS -0500` (include timezone)
- Use double quotes for title
- Categories and tags use array syntax

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
- Ruby 3.3
- Jekyll 7.x (Chirpy theme 7.2+)
- htmlproofer 5.x (for testing)
- Ruby LSP (in `.ruby-lsp/` for IDE support)

## Notes
- External links are disabled in htmlproofer (only validates internal links)
- The site uses GitHub Pages deployment from `gh-pages` branch
- PWA is enabled with offline caching
- Comments via Giscus (GitHub Discussions)
