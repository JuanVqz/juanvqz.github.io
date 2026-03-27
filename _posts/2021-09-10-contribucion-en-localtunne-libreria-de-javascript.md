---
layout: post
title: "Contribution to localtunnel, a JavaScript Library"
date: 2021-09-10 12:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [contributing]
tags: [contributing, javascript]
---

Thank you GitHub!!!

GitHub reported a security vulnerability 🙈 in my [juanvqz.github.io](https://github.com/JuanVqz/juanvqz.github.io) repository which is related to axios.

![<%= page.data.title %>](https://res.cloudinary.com/juanvqz/image/upload/w_1200,c_limit,q_80/v1/blog/2021-09-10/dependabot_rnncdz.jpg#center)

> Axios, Promise based HTTP client for the browser and node.js

Which was curious because as far as I knew I wasn't using axios in my blog, so I set out to update the **dependencies** — how hard could it be to run **yarn upgrade** and then see if everything still works.

After running the command and reviewing the git diff, **axios was still outdated**. I checked yarn.lock, which contains the exact versions of the package.json dependencies, and realized that axios wasn't a direct dependency of my blog, but a dependency of a dependency called [localtunnel](https://github.com/localtunnel/localtunnel).

> localtunnel exposes your localhost to the world for testing and sharing. No need to configure DNS or deploy for others to test your changes.

I opened a [Pull Request](https://github.com/localtunnel/localtunnel/pull/432) in the localtunnel repository and I'm waiting for it to be accepted. By the way, it already has two comments supporting the inclusion of the solution.

I'll update this article later with the Pull Request status.

#### Fun fact: yarn doesn't have a native command to update second-level dependencies, at least I didn't find it. If you know the command, I'd appreciate it if you [share it](https://github.com/JuanVqz/juanvqz.github.io/discussions).
