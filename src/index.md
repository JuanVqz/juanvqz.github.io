---
layout: page
title: Últimos artículos
---

<div class="space-y-8 mt-4">
  {% for post in site.posts %}
    <div class="border-b-2 pb-6 border-divide-gray-100 hover:border-gray-600">
      <a href="{{ post.url }}">
        <h1 class="text-xl md:text-2xl uppercase font-bold">{{ post.title }}</h1>
        <div class="flex flex-wrap justify-between py-3">
          <small class="font-light">{{ post.date | date_to_string: "ordinal", "US" }}</small>
          <small class="font-light">{{ post.content | reading_time: 1 }} minutos</small>
        </div>
        <div class="text-justify">{{ post.excerpt | markdownify }}</div>
      </a>
    </div>
  {% endfor %}
</div>

<!-- If you have a lot of posts, you may want to consider adding [pagination](https://www.bridgetownrb.com/docs/content/pagination)! -->
