---
layout: post
title: "¡Urge actualizar Alacritty Themes a la versión 4.1.3!"
date: 2021-09-28 12:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [contributing]
tags: [alacritty, alacritty-themes, javascript]
---

¿Sabes qué hace el comando **PWD** en Linux?

Digamos que estamos en la carpeta **Descargas** de nuestra computadora.

¿Qué regresaría el comando pwd? Correcto, la ruta del directorio actual.

```bash
Descargas $ pwd
/home/itox/Descargas
```

Hoy en alacritty-themes corregimos un bug importante que se nos pasó en la versión anterior 4.1.2.

```javascript
Descargas $
function rootDirectory() {
  return process.PWD
}

// /home/itox/Descargas/themes
```

Al hacer pruebas y llamar el método **rootDirectory**, que usaba **process.PWD** de **Node.js**, parecía que retornaba la ruta a la carpeta del proyecto, por ejemplo:

```bash
alacritty-themes
  package.json
  src/
    index.js
    helpers/
      index.js
```

Esto significaba que, al ejecutar el método en el archivo **index.js** de la carpeta **helpers**, regresaba la ruta hasta la carpeta padre **alacritty-themes**, pero no hasta el archivo index.js.

#### ¡Pues no!

Como sabemos, el comando PWD regresa la carpeta actual donde te encuentras. Por este motivo, cuando los usuarios del paquete comenzaron a cambiar sus temas, **¡sorpresa!** Error: la carpeta **themes** (donde se alojan los colores) no existía porque la buscaba en el directorio actual.

Lo resolvimos colocando un archivo **settings.js** en el directorio principal del repositorio:

```javascript
// settings.js
module.exports = {
  PROJECT_DIR: __dirname,
}
```

**\_\_dirname** regresa el directorio actual sin importar dónde se ejecute el comando:

```javascript
Descargas $

const { PROJECT_DIR } = require("settings")

function rootDirectory() {
  return PROJECT_DIR
}

// /home/itox/code/alacritty-themes/themes
```

Con esto solucionamos el problema.

Con esto solucionamos el problema.
