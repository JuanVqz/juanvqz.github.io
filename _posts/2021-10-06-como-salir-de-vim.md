---
layout: post
title: "How to Exit Vim"
date: 2021-10-06 08:00:00 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [tools]
tags: [vim, neovim]
---

![<%= page.data.title %>](https://res.cloudinary.com/juanvqz/image/upload/w_1200,c_limit,q_80/v1/blog/2021-10-06/how_to_exit_on_vim_hf9p2d.jpg#center)

## The Problem

You've just opened Vim, maybe by accident or because someone told you it's a great editor. Now you're stuck. You've tried everything — clicking, pressing random keys, nothing works. How do you get out?

This is one of the most common questions in the programming community, and for good reason. Vim's modal editing model is powerful, but it's not intuitive when you're first starting out.

---

## The Solution

Assuming you're already inside the Vim editor **without any pending modifications** to save:

1. Press the **ESC** key to make sure you're in normal mode (you don't need to understand what normal mode is for this action)
2. Press colon (`:`) followed by the letter **q** to get:

```bash
:q
```

3. Press the **ENTER** key, and you'll be out of Vim!

```bash
# The complete sequence
ESC + : + q + ENTER
```

---

## What If You Have Unsaved Changes?

If you've made changes and try to quit with `:q`, Vim will show an error:

```
E37: No write since last change (add ! to override)
```

In this case, you have two options:

### Option 1: Save and Quit
```bash
:wq
# or
:x
```

### Option 2: Quit Without Saving
```bash
:q!
```

The `!` forces Vim to quit even if you have unsaved changes.

---

## Common Commands Reference

| Command | What It Does |
|---|---|
| `:q` | Quit (no unsaved changes) |
| `:q!` | Force quit (discard unsaved changes) |
| `:w` | Write (save) file |
| `:wq` | Write and quit |
| `:x` | Write and quit (same as `:wq`) |
| `ZZ` | Write and quit (shortcut) |
| `ZQ` | Quit without saving (shortcut) |

---

## What I Learned

1. **Vim's modal model makes sense once you understand it** — The reason Vim is "hard" to quit is that it expects you to be in a specific mode. ESC always takes you to normal mode, which is the safe starting point for any command.

2. **The basics are simple** — You can be productive in Vim with just a handful of commands. `:q`, `:w`, `:wq`, and movement keys cover 80% of use cases.

3. **Don't be afraid** — The worst thing that can happen is you lose your unsaved changes. Learn to save frequently, and you'll be fine.

4. **Keep learning** — Once you can exit, you can start exploring. Vim's efficiency comes from staying in the editor and using keyboard commands instead of reaching for the mouse.

---

## Resources

- [How to Exit Vim - Video on YouTube](https://www.youtube.com/watch?v=TgfHZrGyntY&list=PL4yLj0azo9NUPv560ffx8OXnWRB7KClPh&index=4&t=108s)
- [Vim Cheat Sheet](https://vim.rtorr.com/)
- [Open Vim](https://openvim.com/) - Interactive Vim tutorial

---

#### Be careful next time!
