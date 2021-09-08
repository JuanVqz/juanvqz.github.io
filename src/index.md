---
layout: page
title: Últimos artículos
---

<div class="flex flex-col md:flex-row justify-center">
  <div class="space-y-8">
    <h1 class="text-2xl">{{ page.title }}</h1>
    {% for post in site.posts %}
      {% render "post", post: post %}
    {% endfor %}
  </div>
</div>

<!-- If you have a lot of posts, you may want to consider adding [pagination](https://www.bridgetownrb.com/docs/content/pagination)! -->
