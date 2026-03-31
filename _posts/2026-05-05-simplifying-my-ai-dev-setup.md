---
layout: post
title: "Simplifying My AI Dev Setup: What Worked and What I Cut"
date: 2026-05-05 09:00:00 -0600
last_modified_at: 2026-05-04 09:00:00 -0600
categories: [development]
tags: [ai, claude-code, developer-tools, dotfiles]
---

A few weeks ago I looked at my dotfiles AI configuration and realized I'd over-engineered it. What started as a clean centralization effort had grown into a web of submodules, global MCP servers, and multi-platform symlinks that I barely used.

I'm a Rails developer. My primary AI coding tool is Claude Code, with OpenCode as a secondary option. I'd built a system in my dotfiles to manage AI agent configuration across both tools — and theoretically across Cursor, Codex, and Claude Desktop too. Here's what happened when I got honest about what I actually needed.

## What I built

The idea was sound: one `AGENTS.md` file in my dotfiles as the single source of truth for global AI instructions. A bash script called `agents` to sync everything via symlinks — like a lightweight stow for AI config. Skills shared across tools via git submodules. A global MCP server for Rails projects.

The `agents` script handled sync and unsync:

```bash
# Static symlinks: target -> link_path
LINKS=(
  "$AI_DIR/AGENTS.md"  "$HOME/.claude/CLAUDE.md"
)
```

Running `agents sync` would initialize submodules, create symlinks, and link skills into `~/.claude/skills/` and `~/.config/opencode/skills/`. Running `agents unsync` would tear it all down cleanly. It even had `disable` and `enable` commands for individual skills.

On top of that, I had:
- **superpowers** — a submodule with 14 skills (code review, architecture planning, debugging, etc.)
- **railway-skills** — deployment skills for Railway
- **rails-mcp-server** — a global MCP server wrapper so every project could talk to Rails
- Symlink targets for Cursor, Codex, and Claude Desktop

## What worked

**AGENTS.md centralization** is the best thing I did. One file defines how AI agents behave across all my projects — never commit to main, use worktrees, use `gh` for GitHub operations, don't add co-author lines. When I update it, every tool picks it up immediately through the symlink.

```markdown
# AGENTS.md

## Global Agent Instructions

- Never commit or push directly to `main`. Always use a git worktree.
- Prefer worktrees over simple branches: `git worktree add .worktrees/<name> -b feature/<name>`
- For GitHub-related requests, use GitHub CLI (`gh`) by default.
- Never add yourself as co-author in git commits or pull requests.
```

**The sync script** is simple and reliable. It creates symlinks, skips existing non-symlink files, and only removes links it created. No magic.

**Per-project AGENTS.md files** complement the global one perfectly. Each project gets its own instructions — database conventions, testing preferences, deployment notes — without polluting the global config.

**The worktree workflow** has been the biggest productivity gain. Main stays clean. Every feature gets a worktree with a branch. When the PR merges, I remove the worktree. I never think about which branch I'm on in my main working directory because it's always `main`.

## What didn't work

**Superpowers was the biggest waste.** Fourteen skills — code review, architecture analysis, debugging workflows, dependency auditing, and more. The problem? Claude Code already does most of this natively. I was maintaining a git submodule to teach the tool things it already knew how to do. Every `agents sync` pulled down a repo of instructions that mostly duplicated built-in behavior. When I actually looked at my usage, I couldn't point to a single time a superpowers skill changed the outcome of a conversation.

**The global MCP server** caused more friction than it solved. I had `rails-mcp-server` configured globally so every project could use it. But when I opened a non-Rails project, the server would fail to connect or throw errors — noise in every session that had nothing to do with Rails. MCP servers are project-level concerns pretending to be global ones.

**Multi-platform support** was pure speculation. I had symlink targets for Cursor, Codex, and Claude Desktop in the script. In practice, I use Claude Code for 95% of my work and OpenCode for the rest. I was maintaining complexity for tools I'd tried once and moved on from.

**Railway skills globally** made no sense. Only one app — my doctors app — deploys to Railway. Every other project got Railway deployment skills linked into its config for no reason. That same app, by the way, just went through a [HAML to ERB migration](/blog/from-haml-to-erb-going-back-to-rails-native-templates/) — another case of cutting away a dependency that wasn't pulling its weight.

## What I did

The cleanup took about 30 minutes:

1. **Removed the superpowers submodule.** `git submodule deinit ai/skills/superpowers`, delete the directory, done. Fourteen skills, gone. Nothing broke.

2. **Moved railway-skills to the doctors app.** Instead of a global submodule, I added the skills directly to the project that actually uses them. Project-level skills, where they belong.

3. **Switched from global MCP to per-project MCP.** Instead of a wrapper script in dotfiles, I now add MCP servers per project:

    ```bash
    claude mcp add --scope project rails-mcp-server rails-mcp-server
    ```

    This writes to the project's `.mcp.json`. The server only loads when I'm in that project. No noise elsewhere.

4. **Simplified the agents script.** Removed symlink targets for Cursor, Codex, and Claude Desktop. The script now only manages Claude Code and OpenCode — the tools I actually use.

5. **Removed the rails-mcp-server wrapper** from dotfiles entirely. Each Rails project that needs it configures it locally.

## The result

My dotfiles AI directory went from a sprawling setup with two submodules, a global MCP wrapper, and five platform targets to this: one `AGENTS.md`, one sync script, and nothing else that doesn't earn its place.

The `agents sync` command still works the same way. It just does less — which is the point.

## The lesson

Start lean. The foundation is `AGENTS.md` for global instructions and a worktree-based workflow for safe development. That's it. That's the setup that actually matters every day.

Skills and MCP servers belong at the project level, where they're used. A Rails MCP server should live in the Rails project. Deployment skills should live in the app that deploys to that platform. Global config is for behavior that applies everywhere — "use worktrees," "don't commit to main," "use `gh` for GitHub."

Don't add complexity because you might need it. I spent time configuring Cursor and Codex support that I never used. I maintained 14 skills that duplicated built-in features. I ran a global MCP server that broke in half my projects.

Build the simplest thing that works. When a specific project needs more, add it there. Your dotfiles should be the floor, not the ceiling.
