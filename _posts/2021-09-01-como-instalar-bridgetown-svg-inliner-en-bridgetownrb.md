---
layout: post
title: "How to Install bridgetown-svg-inliner in Bridgetown"
date: 2021-09-01 08:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [ruby, bridgetownrb, javascript]
---

It's simpler than it seems.

The task is simple if you've used Ruby on Rails, as the process is identical to installing gems in a Gemfile. Here are the steps:

> NOTE:
> There's another gem called [bridgetown-inline-svg](https://github.com/andrewmcodes/bridgetown-inline-svg#readme)
> but it's in **maintenance mode**, so its use is not recommended.

The recommended gem is [bridgetown-svg-inliner](https://github.com/ayushn21/bridgetown-svg-inliner),
which has compatibility with the latest version of Bridgetown and **MIT** license.

* Add the gem to your Gemfile

```ruby
group :bridgetown_plugins do
  gem "bridgetown-svg-inliner"
end
```

* Run **bundle install** in the terminal.

```bash
  # In the main folder of the project
  bundle install
```

* Done. You can now use SVG files from an SVG tag:

```liquid
<!-- liquid format -->
{% raw %}{% svg "images/github.svg" %}{% endraw %}
```

```ruby
# erb format
<%= svg "images/youtube.svg" %>
```

> NOTE: If you copy the code above, remove the comments.

* You don't need to use the full path from the root of the project,
  just the relative path to the images folder that Bridgetown provides by default in:

```bash
project/src/images
```

For more information, check the gem's [README](https://github.com/ayushn21/bridgetown-svg-inliner#installation).
