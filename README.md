# [juanvasquez.dev](https://juanvasquez.dev) 🤘

## Tabla de contenido 📑

- [Descripción](#descripcion)
- [Requisitos](#requisitos)
- [Instalación](#instalacion)
- [Desarrollo](#desarrollo)
- [Commandos](#commandos)
- [Despliegue](#despliegue)
- [Autor](#autor)

## Descripción

Esta es mi **página personal** donde me gusta escribir acerca de tecnologías web como **Ruby** y **Javascript**, obviamente lo que esto conlleva es hablar sobre **Ruby on Rails**, gemas interesantes, **Node.js**, React y mucho más.

La pagina esta hecha con **Bridgetown** el cual utiliza Ruby como **centro** del engranaje y está rodeado de herramientas como **webpack**, **recarga de código** en tiempo real, también tiene un **proxy** para que puedas visualizar la página desde otro dispositivo en la misma red y todo esto ya lo incluye listo para trabajar.

Si te interesa Bridgetown no dudes en tomar código de aquí y si tienes dudas en como funciona o como configurarlo abre un [issue](https://github.com/JuanVqz/juanvqz.github.io/issues/new) en este mismo repositorio para poder ayudarte a solucionar tu duda en medida de lo posible.

> Leer más: [acerca de Bridgetown](https://www.bridgetownrb.com/docs/).

## Requisitos

- [Ruby](https://www.ruby-lang.org/en/downloads/)
  - `>= 2.7`
- [Bridgetown Gem](https://rubygems.org/gems/bridgetown)
  - `gem install bundler bridgetown -N`
- [Node](https://nodejs.org)
  - `>= 10.13`
- [Yarn](https://yarnpkg.com)

## Instalación

```sh
git clone git@github.com:JuanVqz/juanvqz.github.io.git

cd juanvqz.github.io

bundle install && yarn install
```

## Desarrollo

Para iniciar el servidor ejecuta **yarn start** y navega hacia [localhost:4000](https://localhost:4000/)!

### Commandos

```sh
# running locally
yarn start

# build & deploy to production
yarn deploy

# load the site up within a Ruby console (IRB)
bundle exec bridgetown console
```

## Despliegue

Utilizo [GitHub Actions](https://github.com/andrewmcodes/bridgetown-gh-pages-action) para ejecutar el comando (yarn deploy) de despliegue.

Utilizo la rama **gh-pages** para el despliegue de los archivos estaticos.

## Autor

🇲🇽 [@juanvqz\_](https://twitter.com/juanvqz_)

