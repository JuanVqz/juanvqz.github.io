---
layout: post
title: "From wicked_pdf to Prawn: A Rails PDF Generation Journey"
date: 2026-06-02 09:00:00 -0600
last_modified_at: 2026-04-27 09:00:00 -0600
categories: [development]
tags: [rails, pdf, prawn, wicked_pdf, grover, puppeteer, doctors-journey]
---

## The Setup

I run a clinical assistance system where doctors manage patient consultations, hospitalizations, and referrals. Every one of those records needs a printable PDF — prescriptions, discharge summaries, referral letters.

PDF generation sounds simple until you're three libraries deep and your CI pipeline needs a headless browser.

This is the story of migrating through **three different PDF solutions** in a Rails app, what broke along the way, and why I ended up with the one I least expected to love.

---

## Phase 1: wicked_pdf — The Classic

**wicked_pdf** was the original choice. It wraps **wkhtmltopdf**, a command-line tool that converts HTML to PDF using a WebKit rendering engine.

The appeal is obvious: write your PDFs as regular Rails views (ERB/HAML), style them with CSS, and wkhtmltopdf renders them. If you can build a web page, you can build a PDF.

```ruby
gem "wicked_pdf"
```

It worked fine for years. Then the cracks appeared.

### The problems

**wkhtmltopdf is dead.** The project has been unmaintained since 2023. It's based on an old WebKit fork that doesn't support modern CSS (Flexbox? Forget it. Grid? No chance). You end up writing CSS like it's 2012 — floats, tables for layout, and vendor-specific hacks.

**Deployment is painful.** You need the wkhtmltopdf binary on your server. On Heroku, that meant a buildpack. On newer stacks like Heroku-24 or Railway, the old binary simply didn't work. I spent commits just trying to get `wkhtmltopdf-heroku` to cooperate with the platform.

**Debugging is awful.** When a PDF renders blank or misaligned, you're staring at HTML that looks fine in a browser but breaks in wkhtmltopdf's ancient engine. There's no inspector, no console, no useful error messages.

After bumping the gem through versions 2.1.0 to 2.8.2 and fighting every deployment, I decided to move on.

---

## Phase 2: Grover + Puppeteer — The Modern Approach

The natural successor was **Grover**, which uses **Puppeteer** (headless Chrome/Chromium) to render HTML to PDF. Modern CSS support, JavaScript execution, and Chrome DevTools for debugging.

```ruby
gem "grover"
```

```json
{
  "dependencies": {
    "puppeteer-core": "^24.0.0"
  }
}
```

This felt like the right move. My existing HTML templates worked with minimal changes. Flexbox and Tailwind CSS rendered perfectly. The PDFs looked exactly like the web pages.

### The problems

**Puppeteer is heavy.** You're running a full Chromium browser in the background to generate a PDF. Memory usage spikes on every render. For a clinical app where a doctor might print 10 prescriptions in a row, that adds up fast.

**Deployment complexity doubled.** Now I needed both Node.js and a Chromium binary on the server. On Heroku, that meant configuring `puppeteer-core` to use the system Chrome instead of downloading its own bundled Chromium (a 280MB+ download that times out on deployment).

```javascript
// .puppeteerrc.cjs — telling Puppeteer to use system Chrome
module.exports = {
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
}
```

**CI became fragile.** GitHub Actions needed a Chromium setup step. Tests that generated PDFs were slow and occasionally flaky — a headless browser is a lot of moving parts for "turn this into a document."

**Version churn.** In the span of two months, I went through Grover 1.2.6 to 1.2.9 and Puppeteer-core 24.36.0 to 24.39.1. Each bump had subtle behavior changes.

I realized I was maintaining a headless browser infrastructure just to lay text on a page.

---

## Phase 3: Prawn — Going Native

Then I looked at **Prawn**.

Prawn is a pure Ruby PDF generation library. No HTML, no CSS, no browser. You build the PDF programmatically — placing text, setting fonts, drawing lines. It felt like going backwards at first.

```ruby
gem "prawn"
gem "prawn-table"  # I ended up not needing this
```

```ruby
Prawn::Document.new(page_size: "A4", margin: [40, 40, 40, 40]) do |pdf|
  pdf.font "Helvetica"
  pdf.font_size 13
  pdf.text "Patient: Juan Perez", align: :right
  pdf.move_down 8
  pdf.text "Prescription:", style: :bold
  pdf.text prescription_content, inline_format: true
end
```

No browser. No Node.js. No binary dependencies. Just Ruby.

### The migration

I migrated in two phases:

**First**, hospitalizations and patient referrals — the simpler PDFs with mostly label-value pairs.

**Then**, appointments (prescriptions) — which have rich text content from a Trix editor that needed HTML-to-Prawn conversion.

The key was building a small **HtmlFormatter** class that converts Trix HTML into Prawn's inline format:

```ruby
class Pdfs::HtmlFormatter
  def to_prawn
    # <b>text</b>     → <b>text</b>       (pass-through)
    # <h1>text</h1>   → <b><u>text</u></b>
    # <a href="">      → <link href="">text</link>
    # <code>text</code> → <font name="Courier">text</font>
    # Strip everything else to plain text
  end
end
```

The entire Grover removal commit was satisfying — deleting `config/initializers/grover.rb`, removing Puppeteer from `package.json`, dropping the CI Chromium setup step.

---

## The Architecture That Emerged

What started as a simple "render this as PDF" became a configurable system. Each hospital can customize their PDFs through an admin UI:

| Setting | Options |
|---------|---------|
| Page format | A4, A3, A5, Letter, Legal |
| Font | Helvetica, Times Roman, Courier |
| Font size | 1-24pt |
| Margins | Top, bottom, left, right (0-100pt) |
| Per-field label | Custom text or I18n default |
| Per-field alignment | Left, center, right |
| Per-field style | Normal, bold, italic, bold italic |
| Per-field color | Black, red |
| Per-field spacing | Configurable move-down |
| Per-field ordering | Drag to reorder via position |
| Per-field visibility | Enable/disable individual fields |

This level of configurability would have been miserable with HTML templates — you'd be generating dynamic CSS for every combination. With Prawn, each setting maps directly to a method parameter:

```ruby
pdf.text text, align: :right, style: :bold
pdf.fill_color "FF0000"
pdf.text "Allergies: Penicillin", style: :bold
pdf.fill_color "000000"
```

The generators inherit from a `BaseGenerator` that handles all the configuration lookup, and each PDF type just defines what fields it renders:

```ruby
class Pdfs::AppointmentGenerator < Pdfs::BaseGenerator
  def pdf_type
    :appointment
  end

  private

  def render_patient(pdf)
    render_field(pdf, :appointment, :patient, record.patient.to_s)
  end

  def render_prescription(pdf)
    return if record.prescription.blank?
    render_html_field(pdf, :appointment, :prescription, record.prescription)
  end

  # ... more fields
end
```

The base class renders them in the order defined by the `position` column in the database — so hospitals can reorder their PDF fields from the admin UI without touching code.

---

## Comparison Table

| | wicked_pdf | Grover | Prawn |
|---|---|---|---|
| **Approach** | HTML → PDF via wkhtmltopdf | HTML → PDF via Chromium | Ruby DSL → PDF |
| **CSS support** | Old WebKit (no Flexbox/Grid) | Full modern CSS | N/A (programmatic) |
| **Dependencies** | wkhtmltopdf binary | Node.js + Chromium | None (pure Ruby) |
| **Memory** | Moderate | High (full browser) | Low |
| **CI complexity** | Buildpack needed | Chromium setup step | Nothing extra |
| **Deployment** | Binary must exist on server | Node + Chrome on server | `bundle install` and done |
| **Rich text** | Native HTML rendering | Native HTML rendering | Needs HTML→Prawn converter |
| **Configurability** | Hard (dynamic CSS) | Hard (dynamic CSS) | Natural (method params) |
| **Debugging** | Painful | Chrome DevTools | Ruby debugger |
| **Maintenance** | Dead project | Active but heavy | Active, stable |

---

## Gotchas I Ran Into

**Prawn and Unicode.** Prawn's built-in fonts (Helvetica, Times Roman, Courier) have limited Unicode support. Spanish characters like accented vowels work, but if you need full UTF-8 (CJK, emoji), you'll need to register custom TTF fonts. Prawn warns you about this on every render — loudly.

**The matrix gem.** Prawn depends on the `matrix` gem for transformation matrices in its graphics engine. Ruby 3.1+ removed `matrix` from the standard library, so you need it as an explicit dependency. This tripped me up during the initial install.

**prawn-table was unused.** I installed it thinking I'd need it for tabular data. After building all three PDF types, I never used `Prawn::Table` once. Simple `render_field` calls with alignment handled everything. It's a dependency you can probably skip.

**HTML content needs conversion.** If you store rich text (Trix, ActionText), you can't just pass HTML to Prawn. You need a formatter that converts HTML tags to Prawn's inline format (`<b>`, `<i>`, `<u>`, `<link>`, `<font>`). This was about 60 lines of code but it's the one piece you won't find in a tutorial.

**fill_color is stateful.** When you set `pdf.fill_color "FF0000"` for red text, it stays red for everything after. You need to save and restore the previous color. I wrapped this in a `with_color` helper to avoid forgetting:

```ruby
def with_color(pdf, pdf_type, field_name)
  hex = COLOR_MAP[color_for(pdf_type, field_name)] || "000000"
  previous_color = pdf.fill_color
  pdf.fill_color hex
  yield
  pdf.fill_color previous_color
end
```

---

## Was It Worth It?

Absolutely.

The Grover removal deleted more code than Prawn added. CI runs faster without Chromium. Deployments are simpler — no binary dependencies, no buildpacks, no Node.js requirement for PDF generation. Memory usage dropped noticeably.

The trade-off is that you lose the "write HTML, get PDF" convenience. You're building documents programmatically instead of visually. But for structured documents like medical records — where the layout is label-value pairs, headers, and text blocks — Prawn's approach maps more naturally to the data than HTML ever did.

If your PDFs are basically web pages with complex layouts, Grover (or its alternatives) might still be the right call. But if your PDFs are **documents** — structured, data-driven, configurable — Prawn is simpler, faster, and easier to maintain than anything that needs a browser to run.

Sometimes the tool that feels like a step backwards is actually a step in the right direction.
