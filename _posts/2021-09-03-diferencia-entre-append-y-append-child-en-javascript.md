---
layout: post
title: "¿Cuál es la diferencia entre append y appendChild en JavaScript?"
date: 2021-09-03 07:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, javascript]
---

La diferencia entre **append** y **appendChild** es que **append** acepta cadenas de texto y nodos (o elementos del DOM), mientras que **appendChild** solo acepta nodos.

```javascript
let div = document.createElement("div")
let p = document.createElement("p")
div.append("Some text", p)

console.log(div.childNodes) // NodeList [ #text "Some text", <p> ]
```

La mayoría de los navegadores modernos soportan **append**, pero no en el caso de navegadores obsoletos como Internet Explorer.

En navegadores sin soporte para **append**, verás el siguiente error:

```javascript
object doesn't support property or method 'append'
```

Si deseas agregar un **Node**, cambia de **append** a **appendChild**. Para más información, revisa la [documentación](https://developer.mozilla.org/en-US/docs/Web/API/Element/append).
