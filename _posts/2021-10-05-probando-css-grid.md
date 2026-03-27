---
layout: post
title: "Template Made with CSS GRID"
date: 2021-10-05 11:00:00 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [development]
tags: [TIL, css]
---

## CSS of the Future

I followed a [tutorial](https://www.youtube.com/watch?v=68O6eOGAGqA&t=12s) on YouTube by **Angela Delise** to learn a bit of CSS GRID and it was very simple.

---

## The Layout

CSS Grid makes it incredibly easy to create complex layouts with just a few lines of code. Here's the template I built:

### HTML Structure

```html
<div class="container">
  <nav>Navbar</nav>
  <main>Main</main>
  <div id="sidebar">Sidebar</div>
  <div id="content1">Content 1</div>
  <div id="content2">Content 2</div>
  <div id="content3">Content 3</div>
  <footer>Footer</footer>
</div>
```

### CSS Grid Layout

```css
:root {
  --main-radius: 5px;
  --main-padding: 5px;
}

.container {
  display: grid;
  height: 100vh;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 0.2fr 1.5fr 1.2fr 0.8fr;
  grid-template-areas:
    "nav nav nav nav"
    "sidebar main main main"
    "sidebar content1 content2 content3"
    "sidebar footer footer footer";
  grid-gap: 0.2rem;
  font-weight: 400;
  text-transform: uppercase;
  font-size: 12px;
  text-align: center;
  color: #004d40;
}
```

### Styling Each Section

```css
nav {
  background: #a7ffeb;
  grid-area: nav;
  border-radius: var(--main-radius);
  padding-top: var(--main-padding);
}

main {
  background: #84ffff;
  grid-area: main;
  border-radius: var(--main-radius);
  padding-top: var(--main-padding);
}

#sidebar {
  background: #6fffa2;
  grid-area: sidebar;
  border-radius: var(--main-radius);
  padding-top: var(--main-padding);
}

#content1 {
  background: #6fffd2;
  grid-area: content1;
  border-radius: var(--main-radius);
  padding-top: var(--main-padding);
}

#content2 {
  background: #64ffda;
  grid-area: content2;
  border-radius: var(--main-radius);
  padding-top: var(--main-padding);
}

#content3 {
  background: #5cfff3;
  grid-area: content3;
  border-radius: var(--main-radius);
  padding-top: var(--main-padding);
}

footer {
  background: #96ffbb;
  grid-area: footer;
  border-radius: var(--main-radius);
  padding-top: var(--main-padding);
}
```

---

## How CSS Grid Works

### Grid Template Areas

The magic happens with `grid-template-areas`. You literally draw your layout:

```css
grid-template-areas:
  "nav nav nav nav"
  "sidebar main main main"
  "sidebar content1 content2 content3"
  "sidebar footer footer footer";
```

Each row represents a horizontal line. Each word (repeated) represents how many columns that element spans. This is incredibly intuitive!

### Grid Template Columns and Rows

```css
grid-template-columns: 1fr 1fr 1fr 1fr;
/* Four equal-width columns */

grid-template-rows: 0.2fr 1.5fr 1.2fr 0.8fr;
/* Four rows with proportional heights */
```

The `fr` unit represents a fraction of available space. So `1fr 1fr 1fr 1fr` means "divide the space into 4 equal parts."

---

## Comparison: Grid vs. Flexbox

| Feature | CSS Grid | Flexbox |
|---|---|---|
| **Dimension** | 2D (rows and columns) | 1D (row or column) |
| **Layout Type** | Template-based | Content-based |
| **Use Case** | Overall page layout | Component alignment |
| **Browser Support** | Excellent (all modern) | Excellent (all modern) |
| **Overlap** | Yes, easy | No, requires positioning |

CSS Grid is for the big picture (the whole page layout), while Flexbox is for the details (aligning items within a component).

---

## What I Learned

1. **CSS Grid is surprisingly simple** — The `grid-template-areas` syntax is almost like ASCII art. You can see your layout in the code

2. **2D layouts are now easy** — Before Grid, we needed float hacks, table layouts, or complex Flexbox nesting for 2D layouts. Grid handles this natively

3. **`fr` unit is powerful** — It makes responsive layouts simple without calculating percentages

4. **Grid and Flexbox complement each other** — Use Grid for the overall layout, Flexbox for aligning items within grid cells

5. **Browser support is excellent** — All modern browsers support CSS Grid. You can use it in production today

6. **Learn by doing** — I followed a 20-minute tutorial and was able to build a working layout immediately. The concepts click quickly when you see them in action

---

## Try It Yourself

I invite you to use [codi.link](https://codi.link) to share code online. You can copy-paste the code above and experiment with it.

**Experiment ideas:**
- Change the number of columns
- Rearrange the areas
- Add more content sections
- Try different row and column proportions

---

## Resources

- [CSS Grid Layout - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Grid Garden](https://cssgridgarden.com/) - Learn Grid with a game
- [CSS Tricks - A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/)
