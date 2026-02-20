---
layout: post
title: "¿Cómo instalar bridgetown-svg-inliner en Bridgetown?"
date: 2021-09-01 08:30:51 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [ruby, bridgetownrb, javascript]
---

Es más sencillo de lo que parece.

La tarea es sencilla si has usado Ruby on Rails, ya que el proceso es idéntico a instalar gemas en un Gemfile. Te detallo los pasos:

> NOTA:
> Existe otra gema llamada [bridgetown-inline-svg](https://github.com/andrewmcodes/bridgetown-inline-svg#readme)
> pero está en **modo de mantenimiento**, por lo que no se recomienda su uso.

La gema recomendada es [bridgetown-svg-inliner](https://github.com/ayushn21/bridgetown-svg-inliner),
que tiene compatibilidad con la última versión de Bridgetown y licencia **MIT**.

* Agrega la gema a tu Gemfile

```ruby
group :bridgetown_plugins do
  gem "bridgetown-svg-inliner"
end
```

* Ejecuta **bundle install** en la terminal.

```bash
  # En la carpeta principal del proyecto
  bundle install
```

* Listo. Ya puedes usar archivos SVG desde una etiqueta SVG:

```liquid
<!-- formato liquid -->
{% raw %}{% svg "images/github.svg" %}{% endraw %}
```

```ruby
# formato erb
<%= svg "images/youtube.svg" %>
```

> NOTA: Si copias el código anterior, elimina los comentarios.

* No es necesario usar la ruta completa desde la raíz del proyecto,
basta con la ruta relativa a la carpeta de imágenes que Bridgetown proporciona por defecto en:

```bash
proyecto/src/images
```

Para más información, revisa el [README](https://github.com/ayushn21/bridgetown-svg-inliner#installation) de la gema.
