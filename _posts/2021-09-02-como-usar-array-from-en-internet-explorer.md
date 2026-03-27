---
layout: post
title: "Today I Learned That Internet Explorer Doesn't Support Array.from"
date: 2021-09-02 08:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, javascript]
---

Not even Microsoft wants Internet Explorer.

When opening Internet Explorer, a window appears inviting me to switch to the **Edge** browser, which confirms that Microsoft has also left it in the past.

At work we use **document.querySelector** selectors, which return a **NodeList** collection. This collection cannot use the **map** method, which belongs to the **Array** class.

```javascript
document.querySelectorAll(".class")

// NodeList(2) [
//  div.class,
//  div.class
//]
```

To use the **map** method on that collection, we use **Array.from** to convert the NodeList to an array:

```javascript
Array.from(document.querySelectorAll(".class"))

//(2) [
//  div.class,
//  div.class
//]
```

Internet Explorer doesn't support **Array.from**, so you have two options: use the [polyfill](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#polyfill) or use **slice**:

```javascript
Array.prototype.slice(document.querySelectorAll(".class"))
```

Hope this helps. Regards.
