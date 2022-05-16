---
layout: post
title: "¿Cuál es la diferencia entre append y appendChild en JavaScript?"
date: 2021-09-03 07:30:51 -0500
last_modified_at: 2021-09-03 07:30:51 -0500
categories: [development]
tags: [daily, javascript]
author: Juan Vásquez
---

Pa pronto es tarde!

La diferencia entre **append** y **appendChild** es que append **acepta**
cadenas de **texto** y **nodos** (o elementos del DOM) y
**appendChild** solo acepta nodos.

```javascript
let div = document.createElement("div")
let p = document.createElement("p")
div.append("Some text", p)

console.log(div.childNodes) // NodeList [ #text "Some text", <p> ]
```

La mayoría de los navegadores ya soporta append pero **no** en el caso de
navegadores que no estén actualizados, como **Internet Explorer** 🐒.

Este **error** es el que verás en navegadores sin soporte de **append**.

```javascript
object doesn't support property or method 'append'
```

Si lo que deseas es agregar un **Node** solo cambia de **append** a **appendChild**,
para más información puedes revisar la
[documentación.](https://developer.mozilla.org/en-US/docs/Web/API/Element/append)
