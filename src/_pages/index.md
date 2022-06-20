---
layout: page
title: Articles
paginate:
  collection: posts
---

<h2><%= page.data.title %></h2>

<section class="article_list">
  <% paginator.resources.each do |post| %>
    <%= render "post", post: post %>
  <% end %>
</section>

<%= render "pagination", paginator: paginator %>
