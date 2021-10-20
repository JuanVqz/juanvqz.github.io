---
layout: post
title: "Hoy aprendí que Internet Explorer no soporta Array.from"
date: 2021-09-02 08:30:51 -0500
last_modified_at: 2021-09-02 08:30:51 -0500
categories: [javascript]
---

Ni Microsoft quiere a Internet Explorer, LOL.

Cuando recién abrí Internet Explorer me salto una ventana invitándome a cambiarme al navegador **Edge** lo cual me confirma que ya quedará en el olvido hasta por el mismo Microsoft.

Bueno, en la **chamba** usamos selectores **document.querySelector** por si no sabias eso regresa una coleccion de tipo **NodeList** y esa colección no es capaz de utilizar el método **map** que le pertenece a la "clase" **Array**.

```javascript
document.querySelectorAll(".class")

// NodeList(2) [
//  div.class,
//  div.class
//]
```

Entonces para poder usar el método **map** en esa **colección** usamos **Array.from** para convertir la colección de NodeList a un array común y corriente.

```javascript
Array.from(document.querySelectorAll(".class"))

//(2) [
//  div.class,
//  div.class
//]
```

pero Internet Explorer no lo soporta por lo tanto tienes dos opciones usar el [polifill](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/from#polyfill) o usar [slice](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/slice).

```javascript
Array.prototype.slice(document.querySelectorAll(".class"))
```

Espero que te ayude, saludos!
