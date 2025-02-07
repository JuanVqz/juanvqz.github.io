---
layout: post
title: "New Relic para resolver errores de JavaScript"
date: 2021-09-07 08:30:51 -0500
last_modified_at: 2021-09-07 08:30:51 -0500
categories: [tools]
tags: [TIL, javascript]
---

La semana pasada estuvimos limpiando errores de javascript con la ayuda de New Relic.

> New Relic One: Una plataforma de observabilidad sencilla pero potente.
> Detectar, corregir y prevenir.

**New Relic** se encarga de **monitorear** la aplicación web y nos da reportes o estadísticas del trazado de sesiones,
cuales son las páginas más visitadas, las páginas con reportes de errores, el tiempo de carga de las páginas, etc.

**Hoy** hablaré del apartado de errores de Javascript,
prácticamente New Relic te regresa un **listado de errores** que han sido **recurrentes** en las últimas horas o los últimos días,
puedes configurarlo a través de un selector de fecha y hora.

Una vez **seleccionado** el error que quieres **solucionar** te dará más detalles de dicho error:

- El mensaje de error

Hasta ahora el mensaje de error es muy descriptivo y eso ayuda a tener una clara idea de como solucionar el error,
pongamos de ejemplo el siguiente caso.

```javascript
Cannot read property 'checked' of undefined.
```

- La fecha de la primera vez que se vio el error en el sistema (Hace 2 días).

- El porcentaje de errores que representa (0.5%).

- Descripcion general.

  0. El nombre del navegador donde ocurrió el incidente, incluso la version del navegador.

     _Chrome, Firefox, IE, Edge, Safari_

  1. El tipo de dispositivo.

     _Escritorio o Móvil_

  2. El sistema operativo del dispositivo.

     _iOS, Android, Windows 10, Windows XP_

  3. La **ruta de la petición** donde se detectó el error.

#### Para concluir me gustaría comentar que he encontrado que los errores de javascript ocurren por 3 principales razones.

0. No **minificar** el Javascript y contar con un archivo .map
1. El **orden de carga** de los archivos, por ejemplo cuando usamos el Framework CSS Bootstrap, tenemos que cargar jquery (hasta ahora) y después el Javascript de Bootstrap de lo contrario es muy probable que el Javascript Bootstrap no funcione.
2. **Compatibilidad** con navegadores, por lo regular siempre es IE el malo del cuento.

> Creo que si usas Heroku puedes instalar New Relic de forma gratuita, no estaría mal echarle un ojo, verdad? te invito a que lo hagas.

Mas informancion acerca de [New Relic](https://newrelic.com/es/resources/datasheets/new-relic-one)
