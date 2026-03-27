---
layout: post
title: "How to Install Neovim from the GitHub Repository"
date: 2021-12-03 08:00:00 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [tools]
tags: [vim, neovim]
---

## Why Install from Source?

**Vim/Neovim** has been my code editor for about 5 years, and in all that time I haven't needed to compile it and install it from its GitHub repository. This is because Vim comes installed in most operating systems I've used, like Xubuntu and macOS.

But this time I want to install GitHub Copilot, which requires Neovim version **0.6.0-x**. This version is **not available** in the operating system packages I currently use (Manjaro). Only the latest stable version, 0.5.x, is available.

I researched on the internet but didn't find any good video or article, so I went to the Neovim documentation, which helped me quickly.

---

## Prerequisites

First, we need to cover the [prerequisites](https://github.com/neovim/neovim/wiki/Building-Neovim#build-prerequisites) on your operating system.

For Manjaro/Arch Linux:

```bash
sudo pacman -S base-devel cmake unzip ninja tree-sitter curl
```

For other systems, check the [Neovim wiki](https://github.com/neovim/neovim/wiki/Building-Neovim#build-prerequisites) for the specific packages you need.

---

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/neovim/neovim
cd neovim
```

### Step 2: Choose Your Version

**For the latest stable version:**
```bash
git checkout stable
```

**For the latest development version (default):**
```bash
# No checkout needed - you're on main branch
```

### Step 3: Build Neovim

```bash
make
```

This will compile Neovim from source. The build process may take a few minutes depending on your system.

### Step 4: Install

```bash
sudo make install
```

This installs Neovim to `/usr/local` by default.

---

## Verification

Let's check the Neovim version we installed:

```bash
nvim --version
```

You should see output like:

```
NVIM v0.6.0-dev+575-g2ef9d2a66
Build type: Debug
LuaJIT 2.1.0-beta3
...
```

---

## Uninstalling (If Needed)

If you want to remove Neovim later:

```bash
sudo rm /usr/local/bin/nvim
sudo rm -rf /usr/local/share/nvim
sudo rm /usr/local/share/man/man1/nvim.1
```

---

## What I Learned

1. **Sometimes you need the bleeding edge** — Package managers lag behind new releases. When a tool you need requires a specific version, compiling from source is often the fastest solution

2. **The documentation is your friend** — I searched the internet but didn't find good resources. Going straight to the Neovim wiki gave me clear, up-to-date instructions

3. **Building from source isn't scary** — With `make`, the process is straightforward. Clone, make, install — that's it

4. **Development versions work fine** — I used the development version (`0.6.0-dev`) without any issues. Don't be afraid to use dev versions if stable doesn't have what you need

5. **Keep track of what you install** — When you install from source, it's good practice to remember how to uninstall it. Unlike package managers, there's no simple `uninstall` command

---

Done. We've installed the latest version of the magnificent editor **Neovim**.

```vimscript
:until next time!
```

[Neovim GitHub](https://github.com/neovim/neovim)
