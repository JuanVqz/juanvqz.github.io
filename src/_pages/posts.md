---
layout: page
title: Posts
permalink: /posts/
---

<ul>
  {% for post in site.posts %}
    <li class="p-5">
      <a href="{{ post.url }}" class="text-3xl">{{ post.title }}</a>
      <div class="flex flex-row justify-between">
        <p class="text-gray-500">{{ post.date }}</p>
      </div>
      {{ post.excerpt }}
      <p class="text-gray-500">{{ post.categories }}</p>
    </li>
  {% endfor %}
</ul>
