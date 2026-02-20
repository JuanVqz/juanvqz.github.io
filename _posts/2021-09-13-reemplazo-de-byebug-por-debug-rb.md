---
layout: post
title: "Reemplazo de Byebug por Debug 🔥🐛"
date: 2021-09-13 07:30:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [ruby, thisweekinrails]
---

Desde que conozco Ruby on Rails, incluye la gema Byebug 😥. Fue introducida en el Gemfile hace más de 7 años.

El Pull Request [Depend on ruby/debug, replacing Byebug](https://github.com/rails/rails/pull/43187) que nos brindó la información.

La pregunta obligada es: ¿Por qué se remueve la gema de Byebug?

- Byebug y Zeitwerk no son [totalmente compatibles](https://github.com/deivid-rodriguez/byebug/issues/564). Esto no es un error de ninguna de las gemas, es una limitación técnica.

- En Ruby 3.1, la depuración se incluirá con **debug.rb**, y este cambio alinea Rails con Ruby.

#### Dato histórico

El 8 de abril de 2014 se creó el [Pull Request](https://github.com/rails/rails/pull/14646) para introducir Byebug en Ruby on Rails, pero se hizo merge hasta el 11 de abril de 2014.

#### Adiós Byebug

¿Qué es Byebug? En palabras de la misma gema:

Byebug es un depurador rico en funciones y fácil de usar para Ruby. Utiliza la API de TracePoint para el control de ejecución y la API del inspector de depuración para la navegación de la pila de llamadas. No depende de fuentes centrales internas. Es rápido porque está desarrollado como una extensión de C y confiable porque es compatible con un conjunto completo de pruebas.

[Saber más de Byebug](https://github.com/deivid-rodriguez/byebug)

#### Hola Debug

debug.rb proporciona funcionalidad de depuración a Ruby.

Ventajas:

0. **Rápido:** Sin penalización de rendimiento en el modo sin pasos y sin puntos de interrupción
1. **Depuración remota:** Admite la depuración remota de forma nativa
   - Socket de dominio UNIX
   - TCP/IP
   - Integración VSCode/DAP (VSCode rdbg Ruby Debugger)
2. **Extensible:** La aplicación puede introducir soporte de depuración de varias formas
   - Por comando rdbg
   - Al cargar bibliotecas con la opción -r
   - Al llamar al método de Ruby explícitamente

Entre otras cosas:

0. Soporte para hilos (casi terminado) y ractores (TODO)
1. Admite suspender e ingresar a la consola de depuración con Ctrl-C
2. Muestra parámetros en el comando backtrace
3. Admite depuración de grabación y respuesta

[Saber más de Debug](https://github.com/ruby/debug)
