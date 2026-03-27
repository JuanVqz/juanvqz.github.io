---
layout: post
title: "How to Install Neovim from the GitHub Repository"
date: 2021-12-03 08:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [tools]
tags: [vim, neovim]
---

**Vim/Neovim** has been my code editor for about 5 years, and in all that time I haven't had the need to compile it and install it from its GitHub repository. This may be because Vim comes installed in most operating systems I've used, like Xubuntu and macOS.

But this time I want to install GitHub Copilot, which requires Neovim version **0.6.0-x**, which is **not available** in the operating system packages I currently use (Manjaro). Only the latest stable version, 0.5.x, is available.

I researched a bit on the internet but didn't find any good video or article, so I went to the Neovim documentation, which helped me quickly.

1. First we need to cover the [prerequisites](https://github.com/neovim/neovim/wiki/Building-Neovim#build-prerequisites) on your operating system:

```bash
sudo pacman -S base-devel cmake unzip ninja tree-sitter curl
```

2. Clone the repository on your computer:

```bash
git clone https://github.com/neovim/neovim
```

3. Enter the cloned folder and run the **make** command:

   - Optional: if you want the stable version, run **git checkout stable**.

```bash
cd neovim && make
```

4. Install Neovim on your computer (it installs in **/usr/local** by default):

```bash
sudo make install
```

Let's check the Neovim version we installed:

```bash
nvim --version
# NVIM v0.6.0-dev+575-g2ef9d2a66
# Build type: Debug
# LuaJIT 2.1.0-beta3
# ...
```

Done. We've installed the latest version of the magnificent editor **Neovim**.

```vimscript
:until next time!
```

[Neovim GitHub](https://github.com/neovim/neovim)
