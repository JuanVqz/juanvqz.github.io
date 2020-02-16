module.exports = {
  title: 'JuanVqz',
  description: 'Mi blog personal',
  theme: '@vuepress/theme-blog',
  themeConfig: {
    hostname: 'https://juanvqz.github.io',
    nav: [
      { text: 'Blog', link: '/' },
      { text: 'Tags', link: '/tag/' },
    ],
    footer: {
      contact: [
        { type: 'github', link: 'https://github.com/juanvqz/' },
        { type: 'twitter', link: 'https://twitter.com/javasgon' },
      ],
      copyright: [
        {
          text: 'Privacy Policy',
          link: 'https://policies.google.com/privacy?hl=en-US'
        },
        { text: 'MIT Licensed | Copyright © 2020', link: '/' },
      ],
    },
    frontmatters: [
      {
        id: 'tag',
        keys: ['tag'],
        path: '/tag/',
        layout: 'Tags',
        scopeLayout: 'Tag'
      }
    ],
  }
}
