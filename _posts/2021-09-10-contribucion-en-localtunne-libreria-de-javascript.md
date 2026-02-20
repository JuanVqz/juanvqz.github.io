---
layout: post
title: "Contribución en localtunnel, libreria de javascript"
date: 2021-09-10 12:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [contributing]
tags: [contributing, javascript]
---

Gracias GitHub!!!

GitHub reportó una vulnerabilidad de seguridad 🙈 en mi repositorio de [juanvqz.github.io](https://github.com/JuanVqz/juanvqz.github.io) el cual está relacionado con axios.

![<%= page.data.title %>](https://res.cloudinary.com/juanvqz/image/upload/w_1200,c_limit,q_80/v1/blog/2021-09-10/dependabot_rnncdz.jpg#center)

> Axios, Promise based HTTP client for the browser and node.js

Lo cual fue curioso porque hasta donde sabía no estaba usando axios en mi blog, por lo tanto me di a la tarea de actualizar las **dependencias** que tan difícil podía ser ejecutar **yarn upgrade** y después ver si todo sigue funcionando.

Después de ejecutar el comando y revisar el git diff, **axios seguía desactualizado**. Revisé yarn.lock, que contiene las versiones exactas de las dependencias del package.json, y me di cuenta de que axios no era una dependencia directa de mi blog, sino una dependencia de una dependencia llamada [localtunnel](https://github.com/localtunnel/localtunnel).

> localtunnel expone tu localhost al mundo para pruebas y compartir. No es necesario configurar DNS o desplegar para que otros prueben tus cambios.

Abrí un [Pull Request](https://github.com/localtunnel/localtunnel/pull/432) en el repositorio de localtunnel y estoy esperando que sea aceptado. Por cierto, ya tiene dos comentarios apoyando la inclusión de la solución.

Más adelante actualizaré este artículo con el estado del Pull Request.

#### Dato curioso: yarn no tiene un comando nativo para actualizar dependencias en segundo nivel, al menos no lo encontré. Si conoces el comando, te agradecería que lo [compartas](https://github.com/JuanVqz/juanvqz.github.io/discussions).
