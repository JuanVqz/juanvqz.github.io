---
layout: post
title: "How Do I Use Prismjs in My blog?"
date: 2022-05-30 9:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, bridgetownrb]
---

> Prism is a lightweight, extensible syntax highlighter,
> built with modern web standards in mind. It’s used in millions of websites,
> including some of those you visit daily. - [prismjs documentation](https://prismjs.com/)

## How to Install It?

There are several ways to install PrismJS. For more information, visit [https://prismjs.com](https://prismjs.com).

I installed it using `npm`:

```bash
npm install prismjs
```

## How to Enable PrismJS?

Add the following lines to your JavaScript file:

```javascript
import Prism from "prismjs"

Prism.highlightAll()
```

## How to Enable a Theme?

There are some [themes](https://github.com/PrismJS/prism-themes) included by default, and you can add more if desired:

```javascript
import "prismjs/themes/prism-solarizedlight.css"
```

## How to Enable More Languages?

PrismJS supports many [languages](https://github.com/PrismJS/prism/tree/master/components), but they are disabled by default. To use them, enable them as shown below:

```javascript
import "prismjs/components/prism-bash.js"
import "prismjs/components/prism-docker.js"
import "prismjs/components/prism-dot.js"
import "prismjs/components/prism-yaml.js"
import "prismjs/components/prism-ruby.js"
```

### Syntax Examples

```bash
# Bash
gh pr checkout 100
```

```dockerfile
# Dockerfile
FROM ruby:2.7-alpine
```

```ruby
# Ruby
class Dog
  def self.bark
    puts "Guaw guaw!"
  end
end

Dog.bark
```

> You can navigate into **node_modules** to see all available components.

## Conclusion

**Pros**

- Easy to use
- Modular

**Cons**

- Tricky when you don't know how to enable more components
