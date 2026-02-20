---
layout: post
title: "Hoy aprendí que Internet Explorer no soporta Array.from"
date: 2021-09-02 08:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [TIL, javascript]
---

Ni Microsoft quiere a Internet Explorer.

Al abrir Internet Explorer, aparece una ventana invitándome a cambiar al navegador **Edge**, lo que confirma que Microsoft también lo ha dejado en el olvido.

En el trabajo usamos selectores **document.querySelector**, que regresan una colección de tipo **NodeList**. Esta colección no puede utilizar el método **map**, que pertenece a la clase **Array**.

```javascript
document.querySelectorAll(".class")

// NodeList(2) [
//  div.class,
//  div.class
//]
```

Para usar el método **map** en esa colección, usamos **Array.from** para convertir la NodeList a un array:

```javascript
Array.from(document.querySelectorAll(".class"))

//(2) [
//  div.class,
//  div.class
//]
```

Internet Explorer no soporta **Array.from**, por lo que tienes dos opciones: usar el [polyfill](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/from#polyfill) o usar **slice**:

```javascript
Array.prototype.slice(document.querySelectorAll(".class"))
```

Espero que esto te ayude. Saludos.
