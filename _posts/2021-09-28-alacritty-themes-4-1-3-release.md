---
layout: post
title: "Update Alacritty Themes to Version 4.1.3 Now!"
date: 2021-09-28 12:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [contributing]
tags: [alacritty, alacritty-themes, javascript]
---

Do you know what the **PWD** command does in Linux?

Let's say we're in the **Downloads** folder on our computer.

What would the pwd command return? Correct, the current directory path.

```bash
Downloads $ pwd
/home/itox/Downloads
```

Today in alacritty-themes we fixed an important bug that we missed in the previous version 4.1.2.

```javascript
Downloads $
function rootDirectory() {
  return process.PWD
}

// /home/itox/Downloads/themes
```

When testing and calling the **rootDirectory** method, which used **process.PWD** from **Node.js**, it seemed to return the path to the project folder, for example:

```bash
alacritty-themes
  package.json
  src/
    index.js
    helpers/
      index.js
```

This meant that when running the method in the **index.js** file of the **helpers** folder, it returned the path up to the parent folder **alacritty-themes**, but not up to the index.js file.

#### But no!

As we know, the PWD command returns the current folder where you are. For this reason, when package users started changing their themes, **surprise!** Error: the **themes** folder (where colors are hosted) didn't exist because it was looking for it in the current directory.

We solved it by placing a **settings.js** file in the main directory of the repository:

```javascript
// settings.js
module.exports = {
  PROJECT_DIR: __dirname,
}
```

**\_\_dirname** returns the current directory regardless of where the command is executed:

```javascript
Downloads $

const { PROJECT_DIR } = require("settings")

function rootDirectory() {
  return PROJECT_DIR
}

// /home/itox/code/alacritty-themes/themes
```

With this we solved the problem.

With this we solved the problem.
