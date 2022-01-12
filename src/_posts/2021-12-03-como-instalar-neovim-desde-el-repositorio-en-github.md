---
layout: post
title: "¿Cómo instalar Neovim desde el repositorio en GitHub?"
date: 2021-12-03 08:00:00 -0500
last_modified_at: 2021-12-03 08:00:00 -0500
categories: [vim]
tags: [vim, tooling]
author: Juan Vásquez
---

**Vim/Neovim** ha sido mi editor de codigo desde hace aproximadamente 5 años,
y en todo ese tiempo no me había visto en la necesidad de compilarlo e
instalarlo desde su repositorio en GitHub,
eso puede ser debido a que Vim viene instalado en la mayoría de los sistemas operativos
que he utilizado como Xubuntu y MacOs.

Pero en esta ocasión **quiero instalar GitHub Copilot** y es necesario instalar
la versión **0.6.0-x** de Neovim, la cual **no esta disponible** en los paquetes
del sistema operativo que actualmente uso (Manjaro),
solo está disponible la última versión estable la 0.5.x.

Entonces me di a la tarea de investigar un poco por internet pero no encontre
algun buen video, ni algun buen articulo, asi que me dirigí a la documentación
de Neovim, la cual me sacó del apuro rápidamente.

1 Primero necesitamos cubrir los [pre requisitos](https://github.com/neovim/neovim/wiki/Building-Neovim#build-prerequisites)
en tu sistema operativo.

```bash
sudo pacman -S base-devel cmake unzip ninja tree-sitter curl
```

2 Clonar el repositorio en tu computadora.

```bash
git clone https://github.com/neovim/neovim
```

3 Entrar en la carpeta clonada y ejecutar el comando _make_.

- opcional, si quieres la versión estable, ejecuta _git checkout stable_.

```bash
cd neovim && make
```

4 Instalar Neovim en tu computadora, se instala en _/usr/local_ por default.

```bash
sudo make install
```

comprobemos la versión de neovim que instalamos con el siguiente comando.

```bash
nvim --version
# NVIM v0.6.0-dev+575-g2ef9d2a66
# Build type: Debug
# LuaJIT 2.1.0-beta3
# ...
```

listo!!!! Hemos instalado la última versión del magnifico editor **Neovim**.

```vimscript
:hasta la proxima!
```

[Neovim GitHub](https://github.com/neovim/neovim)
