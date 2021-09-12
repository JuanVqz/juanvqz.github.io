---
layout: post
title: "Hice mi primera contribución en el código de alacritty-themes"
date: 2021-08-27 21:54:51 -0500
updated_at: 2021-08-27 21:54:51 -0500
categories: [contribución, alacritty]
---

En tiempos de COVID el tiempo pasa muy rapido!!!

Hoy me doy cuenta que el tiempo pasa muy rápido pues ya tengo más de un año utilizando la terminal **alacritty**, la cual la he encontrado muy efectiva pues me gusta la forma en que se configura con un simple archivo yaml.

Sin embargo, a pesar de ser usuario de alacritty siempre buscaba los colores repositorio por repositorio después los copiaba y pegaba aveces los comentaba por si quería regresar al color anterior 🤯 pensándolo bien un poco desastroso el asunto.

No hace mucho me di a la tarea de buscar una mejor solución para administrar mis colores en alacritty y encontré el **alacritty-themes** ❤️, el cual te facilita el acceso a más de 100 colores distintos, teniendo la capacidad de cambiarlos **en tiempo real** desde la terminal, es decir no tienes que ir al archivo de **~/.config/alacritty.yml** a cambiar el color 👏.

Después de un tiempo usándolo me dio curiosidad en que lenguaje está escrito yo apostaba que era un script de bash pero ¡oh sorpresa¡ está escrito en **javascript** bueno para ser precisos en **node.js**.

Entonces comencé a ver el código y observé que tenía posibles lugares para contribuir, sin más, hice la copia del repositorio y realice un cambio sencillo.

Existía un archivo llamado **test.js** en la carpeta de **tests** y hasta donde conozco, la convención para pruebas debería ser:

| Archivo a ser probado    | Archivo de prueba              |
| ------------------------ | ------------------------------ |
| src/index.js             | test/index.test.js             |
| src/helpers/locations.js | test/helpers/locations.test.js |
| src/components/Home.js   | test/components/Home.test.js   |

Por lo tanto mi contribución fue cambiar el nombre del archivo de **test.js** a **index.test.js**

Aquí está el [link al Pull Request en GitHub.](https://github.com/rajasegar/alacritty-themes/pull/27)

Quiero concluir diciendo que no es necesario hacer un cambio enorme en el codigo para contribuir.

Saludos, con animo y ganas de seguir contribuyendo, [Juan Vásquez!](https://github.com/juanvqz)
