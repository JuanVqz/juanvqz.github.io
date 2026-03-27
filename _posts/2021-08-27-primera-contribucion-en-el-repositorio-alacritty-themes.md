---
layout: post
title: "I Made My First Code Contribution to Alacritty-Themes"
date: 2021-08-27 21:54:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [contributing]
tags: [contributing, alacritty-themes, javascript]
---

Time flies during the pandemic.

I realized I've been using the **Alacritty** terminal for over a year now, and I've found it very effective because of its simple YAML configuration.

However, I was always looking for colors in different repositories, copying and pasting them, and sometimes commenting them out in case I wanted to go back to the previous color. In hindsight, this process was disastrous.

I looked for a better solution to manage colors in Alacritty and found **alacritty-themes** ❤️. This package makes it easy to access more than 100 different colors with the ability to change them in real-time from the terminal, without needing to manually edit the `~/.config/alacritty.yml` file.

After using it for a while, I got curious about what language it was written in. I assumed it was a bash script, but to my surprise, it's written in JavaScript, specifically Node.js.

When I reviewed the code, I identified opportunities to contribute, so I forked the repository and made a simple change.

There was a file called **test.js** in the **tests** folder. According to the standard convention for tests, the structure should be:

```js
src/index.js              test/index.test.js
src/helpers/locations.js  test/helpers/locations.test.js
src/components/Home.js    test/components/Home.test.js
```

My contribution was to rename the file **test.js** to **index.test.js**.

Here's the [link to the Pull Request on GitHub.](https://github.com/rajasegar/alacritty-themes/pull/27)

To conclude, it's not necessary to make big changes to contribute to a project.

Best regards, eager to keep contributing, [Juan Vásquez](https://github.com/JuanVqz).
