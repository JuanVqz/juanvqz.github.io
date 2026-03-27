---
layout: post
title: "Using New Relic to Solve JavaScript Errors"
date: 2021-09-07 08:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [tools]
tags: [TIL, javascript]
---

Last week we were solving JavaScript errors with the help of New Relic.

> New Relic One: A simple yet powerful observability platform.
> Detect, debug, and prevent.

**New Relic** monitors the web application and provides reports on session tracing, most visited pages, pages with errors, load time, among other data.

Today I'll focus on the JavaScript errors section. New Relic shows a **list of recurrent errors** in the last hours or days, configurable through a date and time selector.

When selecting the error you want to **solve**, New Relic provides more details:

- The error message

The error message is very descriptive and helps to have a clear idea of how to solve the problem. For example:

```javascript
Cannot read property 'checked' of undefined.
```

- The first date the error was detected
- The percentage of errors it represents (0.5%)
- General overview:

  0. The browser where the incident occurred, including the version
     - Chrome, Firefox, IE, Edge, Safari

  1. The device type
     - Desktop or mobile

  2. The device's operating system
     - iOS, Android, Windows 10, Windows XP

  3. The request path where the error was detected

#### I've found that JavaScript errors occur mainly for three reasons:

0. Not **minifying** JavaScript without including the .map files
1. The **loading order** of files. For example, when using Bootstrap CSS, we must load jQuery first and then Bootstrap JavaScript; otherwise, it probably won't work.
2. **Compatibility** with browsers, generally the problem is with Internet Explorer.

> If you use Heroku, you can install New Relic for free. I invite you to try it.

More information about [New Relic](https://newrelic.com/resources/datasheets/new-relic-one).
