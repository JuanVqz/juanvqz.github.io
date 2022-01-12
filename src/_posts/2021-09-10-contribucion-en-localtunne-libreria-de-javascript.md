---
layout: post
title: "Contribución en localtunnel, libreria de javascript"
date: 2021-09-10 12:30:51 -0500
last_modified_at: 2022-01-12 16:30:51 -0500
categories: [javascript]
tags: [contributing, javascript]
author: Juan Vásquez
---

Gracias GitHub!!!

GitHub reportó una vulnerabilidad de seguridad 🙈 en mi repositorio de [juanvqz.github.io](<%= page.data.base_path %>) el cual está relacionado con axios.

![<%= page.data.title %>](https://res.cloudinary.com/juanvqz/image/upload/w_1200,c_limit,q_80/v1/blog/2021-09-10/dependabot_rnncdz.jpg)

> Axios, Promise based HTTP client for the browser and node.js

Lo cual fue curioso porque hasta donde sabía no estaba usando axios en mi blog, por lo tanto me di a la tarea de actualizar las **dependencias** que tan difícil podía ser ejecutar **yarn upgrade** y después ver si todo sigue funcionando.

Después de ejecutar el comando y viendo el git diff, **axios seguía desactualizado**, entonces entre a yarn.lock el cual contiene la versión exacta de tus dependencias que se encuentran en el package.json y ahí me di cuenta que efectivamente Axios no era una dependencia directa de mi blog, era una dependencia de una dependencia llamada [local tunnel](https://github.com/localtunnel/localtunnel) 😂.

> localtunnel exposes your localhost to the world for easy testing and sharing! No need to mess with DNS or deploy just to have others test out your changes.

Así que abrí un [Pull Request](https://github.com/localtunnel/localtunnel/pull/432) en el repositorio de local tunnel y estamos en espera de que sea aceptado o rechazado, que por cierto, ya tiene dos comentarios apoyando que incluyan la solución en el repositorio.

Más adelante haré una actualización en este artículo indicando que paso con el Pull Request o igual y hago otro artículo. ya veremos!!

#### Dato curioso, yarn no tiene un comando para actualizar las dependencias en segundo nivel, al menos no lo encontre, si conoces el comando estaria bueno que lo [compartas.](https://github.com/JuanVqz/juanvqz.github.io/discussions)
