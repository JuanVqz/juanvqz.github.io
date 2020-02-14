module.exports = {
  title: "JuanVqz",
  description: "404",
  theme: "@vuepress/blog",
  themeConfig: {
    directories: [
      {
        id: "en",
        dirname: "_en",
        title: "Post",
        path: "/en/",
        itemPermalink: "/en/:year/:month/:day/:slug"
      },
      {
        id: "es",
        dirname: "_es",
        title: "Articulos",
        path: "/es/",
        itemPermalink: "/es/:year/:month/:day/:slug"
      }
    ],
    nav: [
      {
        text: "Blog",
        link: "/en/"
      },
      {
        text: "Articulos",
        link: "/es/"
      },
      {
        text: "Github",
        link: "https://github.com/juanvqz"
      }
    ]
  }
}
