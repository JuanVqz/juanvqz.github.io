---
layout: page
title: Últimos artículos
---

<h1 class="articles_title"><%= page.data.title %></h1>
<div class="article_list">
  <% collections.posts.resources.each do |post| %>
    <%= render "post", post: post %>
  <% end %>
</div>
