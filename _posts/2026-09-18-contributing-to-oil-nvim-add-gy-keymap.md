---
layout: post
title: "Contributing to oil.nvim: Adding a Copy Path Keymap"
date: 2026-09-18 10:00:00 -0600
last_modified_at: 2026-09-18 10:00:00 -0600
categories: [development]
tags: [neovim, lua, open-source, oil-nvim, contribution]
---

I use [oil.nvim](https://github.com/stevearc/oil.nvim) daily as my file explorer in Neovim. It's vim-vinegar style: you edit the filesystem like a normal buffer. Last week, I wanted to copy a file path but couldn't find a keymap for it. Turns out the action existed, just not the keybinding.

This is the story of adding `gy` as a default keymap for copying file paths.

---

## The Missing Keymap

I was navigating through a project and needed to copy a file path for a command. I pressed `g?` to see the help:

```
g?       Show default keymaps
gs       Change the sort order
gx       Open the entry under the cursor in an external program
g.       Toggle hidden files and directories
g\       Toggle trash
```

Nothing for copying paths. I checked the docs and found `actions.yank_entry` — it yanks the filepath to a register. But no default keymap.

---

## The Contribution

The fix was straightforward: add `gy` to the default keymaps following the existing `g+key` pattern.

```lua
-- lua/oil/config.lua
keymaps = {
  -- ... existing keymaps ...
  ["g."] = { "actions.toggle_hidden", mode = "n" },
  ["g\\"] = { "actions.toggle_trash", mode = "n" },
  ["gy"] = { "actions.yank_entry", mode = "n" },  -- new!
},
```

That's it. The action already existed, it just needed a keybinding.

The `yank_entry` action also supports path modification via `fnamemodify()`:

```lua
-- Yank just the filename
actions.yank_entry.callback({ modify = ":t" })

-- Yank parent directory name
actions.yank_entry.callback({ modify = ":h:t" })
```

---

## The PR

I submitted [PR #746](https://github.com/stevearc/oil.nvim/pull/746) with:

- The config change adding `gy` keymap
- Documentation update in `doc/oil.txt`
- Four tests covering the action's behavior

The tests ensure:
- File paths are yanked correctly
- Directory paths include the trailing slash
- The `modify` parameter works as expected

Writing the tests was the part that took the longest. I had to understand how oil's test adapter works versus the real filesystem adapter. Ended up using `TmpDir` for real filesystem tests since `get_current_dir()` only works with the files adapter.

---

## What I Learned

**Small contributions matter.** This wasn't a complex feature. The action already existed. I just added a keybinding and tests. But now anyone using oil.nvim can press `gy` to copy paths without digging through docs.

**Read existing code patterns.** I looked at how other `g+key` keymaps were defined and followed the same pattern. Consistency with existing conventions makes contributions more likely to be accepted.

**Tests are worth the effort.** I almost skipped writing tests. But going through the process helped me understand oil's testing setup better. And when I refactored the test approach, the tests caught issues I would have missed.

---

## Using It

Once the PR merges (or if you use my fork in the meantime):

```vim
" In oil.nvim, press gy over any file or folder
" Path is copied to the default register
" Paste with p or "+p for system clipboard
```

---

## Wrapping Up

Open source doesn't always require deep architectural changes. Sometimes it's just adding the keybinding that everyone assumes should be there.

If you use oil.nvim and find yourself needing to copy file paths, try `gy`. And if you notice something missing in a tool you use daily, consider contributing. The maintainers appreciate it, and so does everyone else who benefits.

[PR #746](https://github.com/stevearc/oil.nvim/pull/746) — Add `gy` keymap for `yank_entry` action
