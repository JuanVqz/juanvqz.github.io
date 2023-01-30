# [juanvasquez.dev](https://juanvasquez.dev) 🤘

![Vercel Deploy](https://vercelbadge.vercel.app/api/JuanVqz/juanvqz.github.io?style=flat-square)

## Tabla de contenido 📑

- [Descripción](#descripcion)
- [Requisitos](#requisitos)
- [Instalación](#instalacion)
- [Desarrollo](#desarrollo)
- [Commandos](#commandos)
- [Despliegue](#despliegue)
- [Autor](#autor)

## Descripción ✍

Esta es mi **página personal** donde me gusta escribir acerca de tecnologías web como **Ruby** y **Javascript**, obviamente lo que esto conlleva es hablar sobre **Ruby on Rails**, gemas interesantes, **Node.js**, React y mucho más.

La pagina esta hecha con **Bridgetown** el cual utiliza Ruby como **centro** del engranaje y está rodeado de herramientas como **webpack**, **recarga de código** en tiempo real, también tiene un **proxy** para que puedas visualizar la página desde otro dispositivo en la misma red y todo esto ya lo incluye listo para trabajar.

Si te interesa Bridgetown no dudes en tomar código de aquí y si tienes dudas en como funciona o como configurarlo abre un [issue](https://github.com/JuanVqz/juanvqz.github.io/issues/new) en este mismo repositorio para poder ayudarte a solucionar tu duda en medida de lo posible.

> Leer más: [acerca de Bridgetown](https://www.bridgetownrb.com/docs/).

## Requisitos 👩‍🔧

- [Ruby](https://www.ruby-lang.org/en/downloads/)
  - `>= 3.0.0`
- [Bridgetown Gem](https://rubygems.org/gems/bridgetown)
  - `gem install bundler bridgetown -N`
- [Node](https://nodejs.org)
  - `>= 10.13`
- [Yarn](https://yarnpkg.com)

## Instalación con Docker 🔥

```sh
git clone git@github.com:JuanVqz/juanvqz.github.io.git
cd juanvqz.github.io
./bin/setup
./bin/dev
# visita [localhost:4000](https://localhost:4000/)!
```
> Learn more: [Bridgetown Getting Started Documentation](https://www.bridgetownrb.com/docs/).

### Comandos ⌨

```sh
# running locally
bin/bridgetown start

# build & deploy to production
bin/bridgetown deploy

# load the site up within a Ruby console (IRB)
bin/bridgetown console
```

> Learn more: [Bridgetown CLI Documentation](https://www.bridgetownrb.com/docs/command-line-usage)

## Despliegue 🚀

> El despliegue en GitHub Actions es solo para ejemplo, por el momento estoy usando vercel como despliegue principal.

Utilizo [GitHub Actions](https://github.com/andrewmcodes/bridgetown-gh-pages-action) para ejecutar el comando (yarn deploy) de despliegue.

Utilizo la rama **gh-pages** para el despliegue de los archivos estaticos.

[@juanvqz\_](https://twitter.com/juanvqz_)


## Categorias

Trataré de llevar el control de la cantiadad de articulos por caterogia en el blog

```rb
{
  contributing: [
    alacritty_themes: 2,
    localtunnel: 1,
  ],
  development: [
    bridgetown_svg: 1,
    css: 1,
    javascript: 2,
    thisweekinrails: 1,
    rails: 1
  ],
  english: [
    words: 1,
  ],
  tools: [
    alacritty_themes: 1,
    new_relic: 1,
    vim: 2,
  ],
  personal: [
    daily: 1,
  ],
}
```
