---
layout: post
title: "New Relic para resolver errores de JavaScript"
date: 2021-09-07 08:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [tools]
tags: [TIL, javascript]
---

La semana pasada estuvimos resolviendo errores de JavaScript con la ayuda de New Relic.

> New Relic One: Una plataforma de observabilidad sencilla pero potente.
> Detectar, corregir y prevenir.

**New Relic** monitorea la aplicación web y proporciona reportes sobre el trazado de sesiones, las páginas más visitadas, las páginas con errores, el tiempo de carga, entre otros datos.

Hoy me enfocaré en la sección de errores de JavaScript. New Relic muestra un **listado de errores recurrentes** en las últimas horas o días, configurable mediante un selector de fecha y hora.

Al seleccionar el error que quieres **solucionar**, New Relic proporciona más detalles:

- El mensaje de error

El mensaje de error es muy descriptivo y ayuda a tener una idea clara de cómo solucionar el problema. Por ejemplo:

```javascript
Cannot read property 'checked' of undefined.
```

- La primera fecha en que se detectó el error
- El porcentaje de errores que representa (0.5%)
- Descripción general:

  0. El navegador donde ocurrió el incidente, incluyendo la versión
     - Chrome, Firefox, IE, Edge, Safari

  1. El tipo de dispositivo
     - Escritorio o móvil

  2. El sistema operativo del dispositivo
     - iOS, Android, Windows 10, Windows XP

  3. La ruta de la petición donde se detectó el error

#### He encontrado que los errores de JavaScript ocurren principalmente por tres razones:

0. No **minificar** el JavaScript sin incluir los archivos .map
1. El **orden de carga** de los archivos. Por ejemplo, al usar Bootstrap CSS, debemos cargar jQuery primero y después el JavaScript de Bootstrap; de lo contrario, es probable que no funcione.
2. **Compatibilidad** con navegadores, generalmente el problema es con Internet Explorer.

> Si usas Heroku, puedes instalar New Relic de forma gratuita. Te invito a probarlo.

Más información sobre [New Relic](https://newrelic.com/es/resources/datasheets/new-relic-one).
