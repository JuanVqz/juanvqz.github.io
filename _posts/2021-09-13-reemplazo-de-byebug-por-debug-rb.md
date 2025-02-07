---
layout: post
title: "Reemplazo de Byebug por Debug 🔥🐛"
date: 2021-09-13 07:30:00 -0500
last_modified_at: 2021-09-13 07:30:00 -0500
categories: [development]
tags: [ruby, thisweekinrails]
---

> Desde que conozco Ruby on Rails incluye la gema de Bye Bug 😥 claro, tiene más de 7 años que fue introducido al Gemfile de Ruby on Rails.

El Pull Request [Depend on ruby/debug, replacing Byebug](https://github.com/rails/rails/pull/43187) que nos brindó la información.

Creo que la pregunta obligada es ¿Por qué se remueve la gema de byebug?

- Byebug y Zeitwerk no son [totalmente compatibles](https://github.com/deivid-rodriguez/byebug/issues/564). Eso sí, eso no es un error de ninguna de las gemas, es una limitación técnica.

- En Ruby 3.1 está previsto que la depuración se envíe con **debug.rb** y este cambio alinea Rails con Ruby.

#### Dato histórico

El _08 de Abril del 2014_ se creó el [Pull Request](https://github.com/rails/rails/pull/14646) para introducir Bye Bug en Ruby on Rails pero fue hasta el 11 de Abril del 2014 que se hizo merge.

#### Adios Bye Bug

¿Qué es Bye Bug? En palabras de la misma gema.

Byebug es un **depurador** rico en funciones y fácil de usar para Ruby. Utiliza la API de TracePoint para el control de ejecución y la API del inspector de depuración para la navegación de la pila de llamadas. Por lo tanto, Byebug no depende de fuentes centrales internas. Byebug también es rápido porque está desarrollado como una extensión de C y confiable porque es compatible con un conjunto de pruebas completo.

[Saber más de Byebug](https://github.com/deivid-rodriguez/byebug)

#### Hola Debug

debug.rb proporciona funcionalidad de depuración a Ruby

Ventajas

0. **Rápido:** Sin penalización de rendimiento en el modo sin pasos y sin puntos de interrupción.
1. **Depuración remota:** Admite la depuración remota de forma nativa.
   Socket de dominio UNIX
   TCP / IP
   Integración VSCode / DAP (VSCode rdbg Ruby Debugger - Visual Studio Marketplace)
2. **Extensible:** La aplicación puede introducir soporte de depuración de varias formas:
   Por comando rdbg
   Al cargar bibliotecas con la opción de línea de comando -r
   Al llamar al método de Ruby explícitamente

Entre otras cosas

0. Hilos de soporte (casi terminado) y ractores (TODO).
1. Admite suspender e ingresar a la consola de depuración con Ctrl-C en la mayor parte del tiempo.
2. Mostrar parámetros en el comando backtrace.
3. Admite depuración de grabación y respuesta.

[Saber más de Debug](https://github.com/ruby/debug)
