---
layout: post
title: "What's the Difference Between append and appendChild in JavaScript?"
date: 2021-09-03 07:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, javascript]
---

The difference between **append** and **appendChild** is that **append** accepts text strings and nodes (or DOM elements), while **appendChild** only accepts nodes.

```javascript
let div = document.createElement("div")
let p = document.createElement("p")
div.append("Some text", p)

console.log(div.childNodes) // NodeList [ #text "Some text", <p> ]
```

Most modern browsers support **append**, but not in the case of obsolete browsers like Internet Explorer.

In browsers without support for **append**, you'll see the following error:

```javascript
object doesn't support property or method 'append'
```

If you want to add a **Node**, change from **append** to **appendChild**. For more information, check the [documentation](https://developer.mozilla.org/en-US/docs/Web/API/Element/append).
