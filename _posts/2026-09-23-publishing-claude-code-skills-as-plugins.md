---
layout: post
title: "Publishing Claude Code Skills as Plugins"
date: 2026-09-23 10:00:00 -0600
last_modified_at: 2026-09-23 10:00:00 -0600
categories: [development]
tags: [claude-code, ai, plugins, rails, open-source, fastruby]
---

At [OmbuLabs](https://www.ombulabs.ai), we've been building Claude Code skills for Rails upgrades based on the [FastRuby.io](https://fastruby.io) methodology. We had three skills working well locally, but distributing them meant telling users to `git clone` and `cp -r` files into `~/.claude/skills/`. Not great.

Claude Code now supports plugins and marketplaces. This post walks through what I learned packaging our `rails-upgrade` skill as a plugin.

---

## Skills vs. Plugins vs. Marketplaces

These three concepts confused me at first, so let me clarify:

- **Skill**: A `SKILL.md` file inside a named directory. The agent reads it and gains new capabilities. This is the content.
- **Plugin**: A package containing one or more skills (and optionally hooks, agents, MCP servers). Defined by `.claude-plugin/plugin.json`. This is the container.
- **Marketplace**: A git repo with a `marketplace.json` at its root that lists available plugins. This is the distribution channel.

A single repo can serve as both a plugin and a marketplace. That's the key insight.

---

## The File Structure

Here's what a working plugin repo looks like:

```
my-skill-repo/
├── marketplace.json              # At repo root (distribution)
├── .claude-plugin/
│   └── plugin.json               # Plugin manifest (packaging)
├── my-skill/                     # Skill directory
│   ├── SKILL.md                  # Required entry point
│   ├── reference/
│   ├── workflows/
│   └── ...
├── LICENSE
└── README.md
```

Two things tripped me up:

1. **`marketplace.json` must be at the repo root**, not inside `.claude-plugin/`. I initially put it in the wrong place.
2. **`plugin.json` stays in `.claude-plugin/`**. Only `plugin.json` goes there.

---

## plugin.json

The plugin manifest tells Claude Code what's inside the package:

```json
{
  "name": "rails-upgrade",
  "description": "Analyzes Rails applications and generates upgrade reports...",
  "version": "3.1.0",
  "skills": "./",
  "author": {
    "name": "OmbuLabs.ai"
  }
}
```

The `skills` field is a path to where Claude Code should look for skill subdirectories. Setting it to `"./"` means "look at the repo root for directories containing `SKILL.md`". In our case, it finds `rails-upgrade/SKILL.md`.

I initially had `"skills": "./rails-upgrade"` which points *into* the skill directory itself. That's wrong. The path should point to the *parent* that contains skill directories.

---

## marketplace.json

This file makes your repo discoverable as a marketplace:

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "fastruby-upgrade-rails",
  "version": "1.0.0",
  "metadata": {
    "description": "Claude Code plugin for Rails upgrades by OmbuLabs.ai"
  },
  "owner": {
    "name": "OmbuLabs.ai"
  },
  "plugins": [
    {
      "name": "rails-upgrade",
      "source": "./",
      "description": "Analyzes Rails applications and generates upgrade reports...",
      "version": "3.1.0"
    }
  ]
}
```

The `source` field tells Claude Code where the plugin lives relative to the marketplace root. `"./"` means the plugin is the repo itself.

---

## Installation Flow

Once published, users install with two commands:

```bash
# Add the marketplace (one-time)
claude plugin marketplace add https://github.com/ombulabs/claude-code_rails-upgrade-skill

# Install the plugin
claude plugin install rails-upgrade
```

For local development, skip the marketplace and load directly:

```bash
claude --plugin-dir /path/to/your/plugin/repo
```

You can validate your plugin structure before publishing:

```bash
claude plugin validate /path/to/your/plugin/repo
```

---

## The One-Marketplace-Per-Skill Problem

We have three skills that work together:

- `rails-upgrade` (the main upgrade workflow)
- `dual-boot` (dual-boot setup with `next_rails`)
- `rails-load-defaults` (incremental `load_defaults` updates)

Each lives in its own repo. That means users would need to add three separate marketplaces:

```bash
claude plugin marketplace add https://github.com/ombulabs/claude-code_rails-upgrade-skill
claude plugin marketplace add https://github.com/ombulabs/claude-code_dual-boot-skill
claude plugin marketplace add https://github.com/ombulabs/claude-code_rails-load-defaults-skill
claude plugin install rails-upgrade
claude plugin install dual-boot
claude plugin install rails-load-defaults
```

That's six commands for what should feel like one tool. The better approach is a unified marketplace repo that lists all three plugins:

```bash
claude plugin marketplace add https://github.com/ombulabs/claude-code-rails-skills
claude plugin install rails-upgrade
claude plugin install dual-boot
claude plugin install rails-load-defaults
```

You can do this with a monorepo (all skills in one repo) or git submodules (separate repos pulled into a marketplace repo). I looked at [maquina](https://github.com/maquina-app/rails-claude-code), which uses the monorepo approach with seven plugins in one marketplace. That's the pattern to follow.

---

## What I Learned

- **Study a working example.** The fastest way to understand the plugin spec was examining an installed marketplace (`~/.claude/plugins/marketplaces/maquina/`), not reading docs.
- **`plugin install` only works with marketplaces.** There's no `claude plugin install <url>`. Users must add your marketplace first.
- **There's no `.pluginignore`.** Everything tracked by git gets included. Use `.gitignore` to keep dev files out.
- **Validate early.** `claude plugin validate` catches structural issues before you push.

---

## Resources

- [Claude Code Plugins documentation](https://docs.anthropic.com/en/docs/claude-code/plugins)
- [Agent Skills specification](https://agentskills.io/specification)
- [Our rails-upgrade skill](https://github.com/ombulabs/claude-code_rails-upgrade-skill)
