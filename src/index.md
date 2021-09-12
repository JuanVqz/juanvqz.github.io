---
layout: page
title: Últimos artículos
---

<div class="flex flex-col md:flex-row justify-center">
  <div class="space-y-8">
    <h1 class="text-2xl"><%= page.data.title %></h1>
    <% site.collections.posts.docs.reverse.each do |post|%>
      <%= render "post", post: post %>
    <% end %>
  </div>
</div>
