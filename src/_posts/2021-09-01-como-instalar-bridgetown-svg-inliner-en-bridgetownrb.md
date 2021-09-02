---
layout: post
title: "¿Cómo instalar bridgetown-svg-inliner en Bridgetown?"
date: 2021-09-01 08:30:51 -0500
categories: bridgetownrb
---

Esto se arma de dos patadas!

La verdad la tarea es muy sencilla si has usado ruby on rails seguramente ya sabes como instalar gemas en un archivo Gemfile, es exactamente igual, te enumero los pasos.

> NOTA:
> Mucho cuidado!
> Existe otra gema llamada [bridgetown-inline-svg](https://github.com/andrewmcodes/bridgetown-inline-svg#readme) pero ya esta en **Modo de Mantenimiento** así que no es recomendable usarla.

La gema que estamos usando es la siguiente [bridgetown-svg-inliner](https://github.com/ayushn21/bridgetown-svg-inliner), tiene compatibilidad con la ultima versión de Bridgetown y la licencia es **MIT**.

1. Agrega la gema a tu Gemfile

```ruby
group :bridgetown_plugins do
  gem "bridgetown-svg-inliner"
end
```

2. Ejecuta **bundle install** en la terminal.

```bash
  # el la carpeta principal, en mi caso es juanvqz.github.io
  bundle install
```

3. Listo! ya puedes usar archivos svg desde una etiqueta svg, mira!

```liquid
# formato liquid
{#% svg "images/github.svg" %}
{% svg "images/github.svg" %}
```

```ruby
# formato erb
<%= svg "images/youtube.svg" %>
```

> NOTA: Si copia el código anterior, remover el símbolo de gato.

4. No es necesario usar la ruta completa desde la raiz del projecto, basta con la ruta relativa que apunta a la carpeta de imagenes que proporciona Bridgetown por default en:

```bash
proyecto/src/images
```

Para información más detallada revisa el [README](https://github.com/ayushn21/bridgetown-svg-inliner#installation) de la gema, por favor.

Sin mas por el momento me despudo de Usted, Don Joaquin!
