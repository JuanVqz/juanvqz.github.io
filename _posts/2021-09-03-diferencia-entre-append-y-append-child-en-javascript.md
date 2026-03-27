---
layout: post
title: "What's the Difference Between append and appendChild in JavaScript?"
date: 2021-09-03 07:30:51 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [development]
tags: [TIL, javascript]
---

## The Core Difference

The main difference between **append** and **appendChild** is simple:

- **`append`** accepts text strings AND nodes (DOM elements)
- **`appendChild`** only accepts nodes (DOM elements)

---

## Example: Using append

With `append`, you can add both text and elements in one call:

```javascript
let div = document.createElement("div")
let p = document.createElement("p")
div.append("Some text", p)

console.log(div.childNodes)
// NodeList [ #text "Some text", <p> ]
```

---

## Example: Using appendChild

With `appendChild`, you can only add nodes. If you want to add text, you need to create a text node first:

```javascript
let div = document.createElement("div")
let p = document.createElement("p")

// This works
div.appendChild(p)

// This doesn't work - will throw an error
div.appendChild("Some text") // Error: Wrong type of argument

// To add text, create a text node
let textNode = document.createTextNode("Some text")
div.appendChild(textNode)
```

---

## Browser Compatibility

Most modern browsers support **append**, but not obsolete browsers like Internet Explorer.

In browsers without support for **append**, you'll see this error:

```javascript
object doesn't support property or method 'append'
```

### Comparison

| Feature | `append()` | `appendChild()` |
|---|---|---|
| **Accepts strings** | ✅ Yes | ❌ No |
| **Accepts nodes** | ✅ Yes | ✅ Yes |
| **Multiple arguments** | ✅ Yes | ❌ No |
| **Returns value** | `undefined` | The appended node |
| **IE support** | ❌ No | ✅ Yes |
| **Modern browsers** | ✅ Yes | ✅ Yes |

---

## Before and After

**Before (IE-compatible):**
```javascript
let div = document.createElement("div")

// Add an element
div.appendChild(document.createElement("p"))

// Add text (needs text node)
div.appendChild(document.createTextNode("Some text"))
```

**After (modern browsers):**
```javascript
let div = document.createElement("div")

// Add both in one call
div.append("Some text", document.createElement("p"))
```

---

## What I Learned

1. **`append` is more flexible** — Being able to pass strings directly is convenient and reduces boilerplate code
2. **Know your target browsers** — If you need to support Internet Explorer, stick with `appendChild`
3. **Both methods are useful** — `appendChild` returns the node you appended, which can be useful for chaining or reference. `append` returns `undefined` but lets you add multiple items at once
4. **Check MDN for compatibility** — The browser compatibility tables on MDN are invaluable when deciding which API to use

For more information, check the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Element/append).
