---
layout: page
title: Últimos artículos
---

<h2><%= page.data.title %></h2>

<section class="article_list">
  <% collections.posts.resources.each do |post| %>
    <%= render "post", post: post %>
  <% end %>
</section>
