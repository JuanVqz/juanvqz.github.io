---
layout: post
title: "How Do I Use Prismjs in My blog?"
date: 2022-05-30 9:00:00 -0500
last_modified_at: 2022-05-30 9:00:00 -0500
categories: [development]
tags: [daily, bridgetownrb]
author: Juan Vásquez
---

> Prism is a lightweight, extensible syntax highlighter,
> built with modern web standards in mind. It’s used in millions of websites,
> including some of those you visit daily. - [prismjs documentation](https://prismjs.com/)

## How to install it?
There are several ways to install it, if you want to know more about it just
navigate to its web page [https://prismjs.com](https://prismjs.com) and download it.

In my case I used `npm` to install it

```bash
npm install prismjs
```

# How to enable prismjs?

Add the following lines in your js file

```javascript
import Prism from "prismjs"

Prism.highlightAll()
```

# How to enable a theme?

There are some [themes](https://github.com/PrismJS/prism-themes) included by default,
you could add more if decired, though.

```javascript
import "prismjs/themes/prism-solarizedlight.css"
```

# How to enable more languages?

PrismJS supports many [languages](https://github.com/PrismJS/prism/tree/master/components)
but they are disabled by default, in order to use them you must enable them as shown below.

```javascript
import "prismjs/components/prism-bash.js"
import "prismjs/components/prism-docker.js"
import "prismjs/components/prism-dot.js"
import "prismjs/components/prism-yaml.js"
import "prismjs/components/prism-ruby.js"
```

### Syntax examples

```bash
# Bash
gh pr checkout 100
```

```dockerfile
# Dockerfile
FROM ruby:2.7-alphine
```

```ruby
# Ruby
Class Dog
  def self.bark
    puts "Guaw guaw!!!"
  end
end

Dog.bark # Guaw guaw!!!
```

> You can navigate into **node_modules** and see all the available components.

# Conclusion

|Pros|
|----|
|Easy to use|
|Modular|

|Cons|
|----|
|Tricky, when you don't know how to enable more components |

