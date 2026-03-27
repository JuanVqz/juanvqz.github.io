---
layout: post
title: "Today I Learned: Internet Explorer Doesn't Support Array.from"
date: 2021-09-02 08:30:51 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [development]
tags: [TIL, javascript]
---

## The Context

Not even Microsoft wants Internet Explorer.

When opening Internet Explorer, a window appears inviting me to switch to the **Edge** browser, which confirms that Microsoft has also left it in the past. Yet, we still have to support it in some projects.

---

## The Problem

At work we use **document.querySelector** selectors, which return a **NodeList** collection. This collection cannot use the **map** method, which belongs to the **Array** class.

```javascript
document.querySelectorAll(".class")

// NodeList(2) [
//  div.class,
//  div.class
//]
```

---

## The Solution: Using Array.from

To use the **map** method on that collection, we use **Array.from** to convert the NodeList to an array:

```javascript
Array.from(document.querySelectorAll(".class"))

//(2) [
//  div.class,
//  div.class
//]
```

---

## The Problem with Internet Explorer

Internet Explorer doesn't support **Array.from**, so you have two options:

### Option 1: Use a Polyfill
Use the [polyfill from MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#polyfill).

### Option 2: Use Array.prototype.slice

```javascript
Array.prototype.slice.call(document.querySelectorAll(".class"))
```

**Before:**
```javascript
Array.from(document.querySelectorAll(".class"))
```

**After (IE-compatible):**
```javascript
Array.prototype.slice.call(document.querySelectorAll(".class"))
```

---

## What I Learned

1. **Browser compatibility is still a thing** — Even in 2021, supporting legacy browsers like Internet Explorer can trip you up
2. **Know your alternatives** — When a modern API isn't supported, there's often a workaround using older methods
3. **Test in IE** — If you need to support Internet Explorer, you can't rely on testing only in modern browsers
4. **MDN is your friend** — The documentation includes polyfills for most modern APIs

---

Hope this helps. Regards.
