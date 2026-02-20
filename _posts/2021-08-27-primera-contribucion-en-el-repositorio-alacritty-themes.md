---
layout: post
title: "Hice mi primera contribución en el código de alacritty-themes"
date: 2021-08-27 21:54:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [contributing]
tags: [contributing, alacritty-themes, javascript]
---

Durante la pandemia, el tiempo pasa muy rápido.

Me di cuenta de que llevo más de un año utilizando la terminal **Alacritty**, que he encontrado muy efectiva por su configuración simple con un archivo YAML.

Sin embargo, siempre buscaba colores en diferentes repositorios, los copiaba y pegaba, y a veces los comentaba por si quería volver al color anterior. En retrospectiva, este proceso era desastroso.

Busqué una mejor solución para administrar los colores en Alacritty y encontré **alacritty-themes** ❤️. Este paquete facilita el acceso a más de 100 colores distintos con la capacidad de cambiarlos en tiempo real desde la terminal, sin necesidad de editar manualmente el archivo `~/.config/alacritty.yml`.

Después de usarlo por un tiempo, me dio curiosidad saber en qué lenguaje estaba escrito. Asumí que era un script de bash, pero para mi sorpresa está escrito en JavaScript, específicamente en Node.js.

Al revisar el código, identifiqué oportunidades para contribuir, así que bifurqué el repositorio e hice un cambio sencillo.

Existía un archivo llamado **test.js** en la carpeta **tests**. Según la convención estándar para pruebas, la estructura debería ser:

```js
src/index.js              test/index.test.js
src/helpers/locations.js  test/helpers/locations.test.js
src/components/Home.js    test/components/Home.test.js
```

Mi contribución consistió en renombrar el archivo **test.js** a **index.test.js**.

Aquí está el [link al Pull Request en GitHub.](https://github.com/rajasegar/alacritty-themes/pull/27)

Para concluir, no es necesario hacer cambios grandes para contribuir a un proyecto.

Saludos, con ganas de seguir contribuyendo, [Juan Vásquez](https://github.com/juanvqz).
