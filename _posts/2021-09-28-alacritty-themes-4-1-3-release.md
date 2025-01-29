---
layout: post
title: "¡Urge actualizar Alacritty Themes a la versión 4.1.3!"
date: 2021-09-28 12:30:51 -0500
last_modified_at: 2021-09-28 12:30:51 -0500
categories: [contributing]
tags: [alacritty, alacritty-themes, javascript]
author: Juan Vásquez
---

¿Sabes que hace el comando `pwd` en linux? Digamos que estamos en la carpeta **Descargas** de nuestra computadora.
¿Que regresaría el comando `pwd`? Es correcto, regresa la ruta al directorio actual.

```bash
Descargas $ pwd
/home/itox/Descargas
```

El día de hoy en alacritty-themes matamos un bicho enorme que se nos pasó en la versión anterior 4.1.2.

```javascript
Descargas $
function rootDirectory() {
  return process.PWD
}

// /home/itox/Descargas/themes
```

Resulta que al hacer prubas y llamar el metodo **rootDirectory** el cual usaba **process.PWD** de **Node.js** parecía que retornaba la ruta a la carpeta del proyecto, por ejemplo.

```bash
alacritty-themes
  package.json
  src/
    index.js
    helpers/
      index.js
```

Eso significaba que si ejecutamos el método (rootDirectory) en el archivo **index.js** de la carpeta **helpers** regresaba la ruta hasta la carpeta padre que es **alacritty-themes** pero **no** hasta el archivo index.js.

#### Pues NO!!!

Como bien sabemos el comando PWD regresa la carpeta actual donde te encuentras situado,
por ese motivo cuando los usuarios del paquete comenzaron a cambiar sus temas,
**oh sorpresa!** error la carpeta **themes** _(donde se alojan los colores)_
no existía porque buscaba la carpeta themes en el directorio actual.

Lo resolvimos colocando un archivo **settings.js** en el directorio principal del repositorio.

```javascript
// settings.js
module.exports = {
  PROJECT_DIR: __dirname,
}
```

**\_\_directory** regresa el directorio actual sin importar donde se ejecute el comando

```javascript
Descargas $

const { PROJECT_DIR } = require("settings")

function rootDirectory() {
  return PROJECT_DIR
}

// /home/itox/code/alacritty-themes/themes
```

y con eso solucionamos el PEQUEÑO problema.
