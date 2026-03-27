---
layout: post
title: "Using New Relic to Solve JavaScript Errors"
date: 2021-09-07 08:30:51 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [tools]
tags: [TIL, javascript]
---

## The Context

Last week we were solving JavaScript errors with the help of New Relic.

> New Relic One: A simple yet powerful observability platform.
> Detect, debug, and prevent.

**New Relic** monitors the web application and provides reports on session tracing, most visited pages, pages with errors, load time, among other data.

Today I'll focus on the JavaScript errors section and how it helped us debug issues in production.

---

## The JavaScript Errors Dashboard

New Relic shows a **list of recurrent errors** in the last hours or days, configurable through a date and time selector.

When selecting the error you want to **solve**, New Relic provides comprehensive details:

### 1. The Error Message

The error message is very descriptive and helps to have a clear idea of how to solve the problem. For example:

```javascript
Cannot read property 'checked' of undefined.
```

This tells us exactly what's wrong — we're trying to access a property on something that doesn't exist.

### 2. When It Started

- The first date the error was detected
- The percentage of errors it represents (e.g., 0.5%)

This helps prioritize which errors to fix first.

### 3. Environment Context

General overview of where the error occurred:

| Information | Details |
|---|---|
| **Browser** | Chrome, Firefox, IE, Edge, Safari (with version) |
| **Device Type** | Desktop or mobile |
| **Operating System** | iOS, Android, Windows 10, Windows XP |
| **Request Path** | The URL where the error was detected |

This context is crucial for reproduction. If an error only happens on iOS 14 with Safari, you know exactly what to test.

---

## Common Causes of JavaScript Errors

Based on our experience, JavaScript errors occur mainly for three reasons:

### 1. Minification Without Source Maps

When you minify JavaScript without including `.map` files, the error stack traces become useless:

```javascript
// Without source maps
Error at main.min.js:1:12345

// With source maps
Error at components/UserForm.js:42:10
```

**Solution:** Always generate and deploy source maps for production builds.

### 2. Incorrect File Loading Order

The order in which you load JavaScript files matters. For example, when using Bootstrap:

```html
<!-- ❌ Wrong order -->
<script src="bootstrap.js"></script>
<script src="jquery.js"></script>

<!-- ✅ Correct order -->
<script src="jquery.js"></script>
<script src="bootstrap.js"></script>
```

Bootstrap depends on jQuery, so jQuery must load first. If the order is wrong, Bootstrap won't work and you'll see errors.

**Solution:** Understand your dependencies and load them in the correct order. Use bundlers like Webpack or Vite to handle this automatically.

### 3. Browser Compatibility

Internet Explorer is the usual culprit. Modern JavaScript features like `Array.from`, `Object.assign`, or arrow functions don't work in older browsers.

```javascript
// Modern JavaScript (breaks in IE)
const result = Array.from(nodes).map(n => n.textContent);

// IE-compatible version
const result = Array.prototype.slice.call(nodes).map(function(n) {
  return n.textContent;
});
```

**Solution:** Use Babel to transpile modern JavaScript to ES5, or use polyfills for missing features.

---

## What I Learned

1. **Observability is essential** — You can't fix what you can't see. New Relic gave us visibility into production errors we didn't know existed

2. **Context matters** — Knowing that an error only happens on IE 11 or iOS 14 changes how you debug it. Browser, device, and OS information is crucial

3. **Prioritize by impact** — Not all errors are equal. An error affecting 0.1% of users is different from one affecting 10%. Focus on the high-impact issues first

4. **Source maps are non-negotiable** — Debugging minified JavaScript without source maps is painful. Always include them

5. **Test in the browsers your users use** — If your analytics show users on IE 11, test in IE 11. Don't assume everyone uses Chrome

6. **Free tier is valuable** — New Relic has a free tier for Heroku apps. You don't need a big budget to get started with observability

---

## Getting Started

> If you use Heroku, you can install New Relic for free. I invite you to try it.

More information about [New Relic](https://newrelic.com/resources/datasheets/new-relic-one).
