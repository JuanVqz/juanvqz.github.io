---
layout: post
title: "Update Alacritty Themes to Version 4.1.3 Now!"
date: 2021-09-28 12:30:51 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [contributing]
tags: [alacritty, alacritty-themes, javascript]
---

## The Bug

Do you know what the **PWD** command does in Linux?

Let's say we're in the **Downloads** folder on our computer.

```bash
Downloads $ pwd
/home/itox/Downloads
```

`pwd` returns the current directory path — simple, right?

Today in alacritty-themes we fixed an important bug that we missed in the previous version 4.1.2.

---

## The Problem

The bug was in this code:

```javascript
function rootDirectory() {
  return process.PWD
}
```

When testing and calling the **rootDirectory** method, which used **process.PWD** from **Node.js**, it seemed to return the path to the project folder:

```bash
alacritty-themes
  package.json
  src/
    index.js
    helpers/
      index.js
```

This meant that when running the method in the **index.js** file of the **helpers** folder, it returned the path up to the parent folder **alacritty-themes**, but not to the actual project directory.

---

## Why This Failed

As we know, the `PWD` command returns the **current folder where you are**, not the folder where the script is located.

So when users of the package started changing their themes, **surprise!** Error: the **themes** folder (where colors are hosted) didn't exist because it was looking for it in the user's current directory, not in the package's directory.

```bash
# User runs this from their home directory
~ $ alacritty-themes monokai

# process.PWD is /home/user
# But themes are at /home/user/.nvm/versions/node/v16.0.0/lib/node_modules/alacritty-themes/themes
# Error: themes folder not found!
```

---

## The Solution

We solved it by placing a **settings.js** file in the main directory of the repository:

```javascript
// settings.js
module.exports = {
  PROJECT_DIR: __dirname,
}
```

**`__dirname`** returns the directory where the current script is located, regardless of where the command is executed:

```javascript
// No matter where the user runs this from:
const { PROJECT_DIR } = require("settings")

function rootDirectory() {
  return PROJECT_DIR
}

// Always returns: /home/user/.nvm/versions/node/v16.0.0/lib/node_modules/alacritty-themes
```

### Before and After

**Before (broken):**
```javascript
function rootDirectory() {
  return process.PWD  // Returns user's current directory
}

// When run from ~: returns /home/user
// Themes folder not found!
```

**After (fixed):**
```javascript
const { PROJECT_DIR } = require("settings")

function rootDirectory() {
  return PROJECT_DIR  // Returns package directory
}

// Always returns /path/to/alacritty-themes
// Themes folder found!
```

---

## What I Learned

1. **`process.PWD` vs `__dirname`** — This is a crucial distinction in Node.js:
   - `process.PWD`: The current working directory where the command was executed
   - `__dirname`: The directory where the current script file is located

2. **Always test in different directories** — We tested from the project directory, so `process.PWD` happened to work. We should have tested from a completely different directory

3. **Package-specific paths** — When building a package or library, never rely on the user's working directory. Always use paths relative to where your code is installed

4. **`__dirname` is your friend** — For package development, `__dirname` (and `__filename`) are reliable ways to get paths relative to your code

5. **Bugs happen even after releases** — We released 4.1.2 thinking everything was fixed, but users found this bug quickly. Fast follow-up releases (like 4.1.3) show you care about quality

---

With this, we solved the problem. Update to version 4.1.3 now!

[Alacritty-Themes on GitHub](https://github.com/rajasegar/alacritty-themes)
