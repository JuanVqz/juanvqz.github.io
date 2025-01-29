---
layout: post
title: "How to fix RVM openssl error in ubuntu 22.04"
date: 2022-06-15 9:00:00 -0500
last_modified_at: 2022-06-15 9:00:00 -0500
categories: [development]
tags: [daily, ubuntu]
author: Juan Vásquez
---

Recently, I installed Ubuntu 22.04 because I wanted to be on the latest version.

I installed [rvm.io](https://rvm.io/) without issues,
then I just wanted to download the ruby binary as usual.

```bash
rvm install 2.6.9
```

and oh, surprise! ran in the following error

![<%= page.data.title %>](https://res.cloudinary.com/juanvqz/image/upload/v1655678572/blog/2022-06-15/download-ruby-error_mhgvj0.png#center)

at the beginning I didn't understand the error,
I thought needed to install some `rvm requirements`, but didn't work.

to solve it, need to downgrade the `openssl` version

```bash
rvm pkg install openssl
```

then

```bash
rvm install ruby-2.6.9 --with-openssl-dir=$HOME/.rvm/usr
```

problably you will have errors in another gems, though

# Resouces

- [https://github.com/rvm/rvm/issues/5209](https://github.com/rvm/rvm/issues/5209)
- [https://github.com/rvm/ubuntu_rvm/issues/67](https://github.com/rvm/ubuntu_rvm/issues/67)
