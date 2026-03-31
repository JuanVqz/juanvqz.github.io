# www.juanvasquez.dev

This is my personal blog built with Jekyll and the [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme.

## About

Welcome to my personal space where I share my experiences, thoughts on software development, technology, and life.

## Site

- **URL**: https://juanvasquez.dev
- **Theme**: [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)
- **Comments**: Powered by [Giscus](https://giscus.app) (uses GitHub Discussions)
- **Analytics**: Cloudflare Web Analytics

> **Warning**
> Do NOT disable GitHub Discussions on this repository. The comment system (Giscus) depends on it to store and display comments on blog posts. Disabling Discussions will break all comments site-wide. The [giscus GitHub App](https://github.com/apps/giscus) must also remain installed with access to this repo.

## Build and Run

This site uses Jekyll. To build and run locally:

```bash
# Install dependencies
bundle install

# Run the site locally
bundle exec jekyll serve

# Preview future-dated posts (scheduled posts hidden by default)
bundle exec jekyll serve --future
```

The site will be available at `http://localhost:4000`

## Adding Crochet Projects

1. Drop your image(s) into `assets/img/crochet/`
2. Edit `_tabs/crochet.md` and add an entry:

```markdown
## Project Name

![Description](/assets/img/crochet/project-name.jpg)

A short description of the project, yarn used, pattern, etc.
```

## Social

- [X (Twitter)](https://x.com/juanvqz_)
- [GitHub](https://github.com/JuanVqz)
- [LinkedIn](https://linkedin.com/in/JuanVqz)

## License

© Juan Vásquez
