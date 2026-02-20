---
layout: post
title: "¿Cómo instalar Neovim desde el repositorio en GitHub?"
date: 2021-12-03 08:00:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [tools]
tags: [vim, neovim]
---

**Vim/Neovim** ha sido mi editor de código desde hace aproximadamente 5 años, y en todo ese tiempo no había tenido necesidad de compilarlo e instalarlo desde su repositorio en GitHub. Esto puede ser porque Vim viene instalado en la mayoría de los sistemas operativos que he utilizado, como Xubuntu y macOS.

Pero en esta ocasión quiero instalar GitHub Copilot, que requiere la versión **0.6.0-x** de Neovim, la cual **no está disponible** en los paquetes del sistema operativo que actualmente uso (Manjaro). Solo está disponible la última versión estable, la 0.5.x.

Investigué un poco por internet pero no encontré ningún buen video ni artículo, así que me dirigí a la documentación de Neovim, que me ayudó rápidamente.

1. Primero necesitamos cubrir los [prerrequisitos](https://github.com/neovim/neovim/wiki/Building-Neovim#build-prerequisites) en tu sistema operativo:

```bash
sudo pacman -S base-devel cmake unzip ninja tree-sitter curl
```

2. Clonar el repositorio en tu computadora:

```bash
git clone https://github.com/neovim/neovim
```

3. Entrar en la carpeta clonada y ejecutar el comando **make**:

   - Opcional: si quieres la versión estable, ejecuta **git checkout stable**.

```bash
cd neovim && make
```

4. Instalar Neovim en tu computadora (se instala en **/usr/local** por defecto):

```bash
sudo make install
```

Comprobemos la versión de Neovim que instalamos:

```bash
nvim --version
# NVIM v0.6.0-dev+575-g2ef9d2a66
# Build type: Debug
# LuaJIT 2.1.0-beta3
# ...
```

Listo. Hemos instalado la última versión del magnífico editor **Neovim**.

```vimscript
:hasta la próxima!
```

[Neovim GitHub](https://github.com/neovim/neovim)
