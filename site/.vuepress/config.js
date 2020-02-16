module.exports = {
  title: 'JuanVqz',
  description: 'JuanVqz description',
  themeConfig: {
    nav: [
      { text: 'Blog', link:'/blog/' }
    ]
  },
  plugins: [
    [ '@vuepress/blog', {
      directories: [
        {
          id: 'posts',
          dirname: '_posts',
          path: '/',
          itemPermalink: '/blog/:year/:month/:day/:slug',
          pagination: {
            lengthPerPage: 2
          }
        },
      ],
      frontmatters: [
        {
          id: 'tag',
          keys: ['tag'],
          path: '/tags/',
          layout: 'Tags',
          scopeLayout: 'Tags'
        },
      ],
      sitemap: {
        hostname: 'https://juanvqz.github.io'
      },
      feed: {
        canonical_base: 'https://juanvqz.github.io',
      },
    }]
  ]
}
