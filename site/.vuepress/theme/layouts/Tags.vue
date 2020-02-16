<template>
  <ul id="default-layout">
    <li v-for="tag in $tag.list">
      <h1>{{ tag.name }}</h1>
      <div v-for="page in tag.pages" v-if="tag.pages.length">
        <router-link class="page-link" :to="page.path">{{ page.title }}</router-link>
        <span>{{ page.frontmatter.date }}</span>
      </div>
    </li>
  </ul>
</template>

