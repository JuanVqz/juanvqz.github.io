---
layout: post
title: "How to install zsh and oh-my-zsh on ubuntu?"
date: 2022-06-03 9:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, tools]
---

Do you want to use a fancy terminal? Install zsh and oh-my-zsh.

## Install zsh

```bash
sudo apt install zsh
```

## Install Oh-My-Zsh

Visit [https://ohmyz.sh](https://ohmyz.sh#install), copy, and execute the following command:

```bash
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## Plugins

- [https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins)
- [https://github.com/zsh-users](https://github.com/zsh-users)
- [https://github.com/zsh-users/zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md#oh-my-zsh)

## Install Plugin Example

I've used zsh-autosuggestions for a long time. Here's how to add this plugin to your `~/.zshrc` file:

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

Then open your `~/.zshrc` file, find the `plugins` section, and add `zsh-autosuggestions`:

```zsh
plugins=(
    # other plugins...
    zsh-autosuggestions
)
```

Start a new terminal session, and you'll have autosuggestions.
