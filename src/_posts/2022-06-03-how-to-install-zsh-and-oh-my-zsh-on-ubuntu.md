---
layout: post
title: "How to install zsh and oh-my-zsh on ubuntu?"
date: 2022-06-03 9:00:00 -0500
last_modified_at: 2022-06-03 9:00:00 -0500
categories: [development]
tags: [daily, tools]
author: Juan Vásquez
---

Do you want to use a fancy terminal?, then install zsh and ohmyzsh.

# Install zsh

```bash
sudo apt install zsh
```

# Install Oh-My-Zsh

Then go to [https://ohmyz.sh](https://ohmyz.sh#install) page copy and execute
the following command.


```bash
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

# Plugins


  * [https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins)

  * [https://github.com/zsh-users](https://github.com/zsh-users)

  * [https://github.com/zsh-users/zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions/blob/master/INSTALL.md#oh-my-zsh)


# Install Plugin Example

I have used zsh-autosuggestions for a long time, so, I'll show you how to add
this plugin in your `~/.zshrc` file

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

then open your `~/.zshrc` file, find the `plugins` section and add `zsh-autosuggestions`

```zsh
plugins=(
    # other plugins...
    zsh-autosuggestions
)
```

start a new terminal session and bom! will have autosuggestions.

