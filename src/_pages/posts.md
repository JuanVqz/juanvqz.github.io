---
layout: page
title: Posts
permalink: /posts/
---

{% for post in site.posts %}

  <div class="flex flex-wrap py-8 md:flex-nowrap">
    <div class="flex flex-col flex-shrink-0 mb-6 md:w-64 md:mb-0">
      <span class="font-semibold text-gray-700">{{ post.categories }}</span>
      <span class="text-sm text-gray-500">{{ post.date }}</span>
    </div>
    <div class="md:flex-grow">
      <h2 class="mb-2 text-2xl font-medium text-gray-900 title-font">{{ post.title }}</h2>
      <p class="leading-relaxed">{{ post.excerpt }}</p>
      <a href="{{ post.url }}" class="inline-flex items-center mt-4 text-green-700">Learn More
        <svg class="w-4 h-4 ml-2" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5l7 7-7 7"></path>
        </svg>
      </a>
    </div>
  </div>
{% endfor %}
