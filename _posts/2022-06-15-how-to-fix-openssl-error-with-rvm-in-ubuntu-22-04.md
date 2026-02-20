---
layout: post
title: "How to fix RVM openssl error in ubuntu 22.04"
date: 2022-06-15 9:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, ubuntu]
---

Recently, I installed Ubuntu 22.04 to stay on the latest version.

I installed [rvm.io](https://rvm.io/) without issues, then proceeded to install Ruby as usual:

```bash
rvm install 2.6.9
```

To my surprise, I encountered the following error:

![<%= page.data.title %>](https://res.cloudinary.com/juanvqz/image/upload/v1655678572/blog/2022-06-15/download-ruby-error_mhgvj0.png#center)

At first I didn't understand the error. I thought I needed to install some `rvm requirements`, but that didn't work.

To solve it, downgrade the `openssl` version:

```bash
rvm pkg install openssl
```

Then:

```bash
rvm install ruby-2.6.9 --with-openssl-dir=$HOME/.rvm/usr
```

You may encounter errors in other gems as well.

## Resources

- [https://github.com/rvm/rvm/issues/5209](https://github.com/rvm/rvm/issues/5209)
- [https://github.com/rvm/ubuntu_rvm/issues/67](https://github.com/rvm/ubuntu_rvm/issues/67)
