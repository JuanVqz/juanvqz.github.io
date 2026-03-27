---
layout: post
title: "Contribution to localtunnel, a JavaScript Library"
date: 2021-09-10 12:30:51 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [contributing]
tags: [contributing, javascript]
---

## The Discovery

Thank you GitHub!!!

GitHub reported a security vulnerability 🙈 in my [juanvqz.github.io](https://github.com/JuanVqz/juanvqz.github.io) repository which is related to axios.

![<%= page.data.title %>](https://res.cloudinary.com/juanvqz/image/upload/w_1200,c_limit,q_80/v1/blog/2021-09-10/dependabot_rnncdz.jpg#center)

> Axios, Promise based HTTP client for the browser and node.js

---

## The Investigation

Which was curious because as far as I knew I wasn't using axios in my blog. So I set out to update the **dependencies** — how hard could it be to run **yarn upgrade** and then see if everything still works?

```bash
yarn upgrade
```

After running the command and reviewing the git diff, **axios was still outdated**. 

I checked `yarn.lock`, which contains the exact versions of the `package.json` dependencies, and realized something important: **axios wasn't a direct dependency of my blog.**

It was a dependency of a dependency.

---

## The Dependency Tree

Tracing through the dependency tree, I found:

```
juanvqz.github.io (my blog)
  └─ localtunnel (dev dependency)
      └─ axios (security vulnerability)
```

> **localtunnel** exposes your localhost to the world for testing and sharing. No need to configure DNS or deploy for others to test your changes.

So my blog didn't use axios directly — it was brought in by localtunnel.

---

## The Solution

Running `yarn upgrade` only updates direct dependencies. To update second-level (transitive) dependencies, you need a different approach.

### Option 1: Force Update

```bash
yarn upgrade localtunnel --latest
```

This forces localtunnel to update to its latest version, which should include the updated axios.

### Option 2: Fix at the Source

The real fix is in the localtunnel repository itself. I opened a [Pull Request](https://github.com/localtunnel/localtunnel/pull/432) to update axios in the localtunnel `package.json`.

The PR already has two comments supporting the inclusion of the solution.

---

## What I Learned

1. **Dependency trees are deeper than you think** — Security vulnerabilities can hide in third- or fourth-level dependencies. You need tools like Dependabot to surface them

2. **Transitive dependencies matter** — Even if you don't use a library directly, you're affected by its vulnerabilities if your dependencies use it

3. **`yarn upgrade` has limits** — It updates direct dependencies, not transitive ones. To update deep dependencies, you need different strategies

4. **Fix at the source when possible** — While you can work around transitive dependency issues locally, the best fix is to update the package that introduces the vulnerable dependency

5. **Contributing to your dependencies** — When you find a vulnerability or bug in a dependency you use, contribute a fix. It helps the whole ecosystem

6. **Security is everyone's responsibility** — GitHub's Dependabot found this automatically, but we still need to act on it. Security tools are useless without human follow-through

---

## Update on the Pull Request

I'll update this article later with the Pull Request status. As of now, it's pending review and has community support.

---

## Fun Fact

Yarn doesn't have a native command to update second-level dependencies (at least I couldn't find one). If you know the command, I'd appreciate it if you [share it](https://github.com/JuanVqz/juanvqz.github.io/discussions).

---

## Tools for Managing Transitive Dependencies

If you're dealing with similar issues, here are some tools that can help:

- **npm-check-updates** — Checks for package updates
- **npm audit** — Scans for vulnerabilities
- **Snyk** — Security scanning for dependencies
- **Dependabot** — Automated dependency updates (what found this issue)

---

Remember: Your dependencies are part of your security perimeter. Treat them with the same care as your own code.
