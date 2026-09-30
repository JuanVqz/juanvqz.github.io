---
layout: post
title: "Contributing to MDN in Spanish"
date: 2026-09-22 09:00:00 -0600
last_modified_at: 2026-09-30 09:00:00 -0600
categories: [development]
tags: [mdn, localization, open-source, spanish, documentation, contribution, community]
---

A developer in Guadalajara opens MDN to look up how `fetch` handles errors. They read English fine, but after nine hours of work it is the difference between understanding a page and getting through it. They switch to `/es/`, and the page is there, current, complete.

That is the whole point of the Spanish locale. Everything else in this post is logistics.

I lead the Spanish team on MDN. This year, more than half of the Spanish pull requests merged into [mdn/translated-content](https://github.com/mdn/translated-content) came from contributors outside the team, and our job is to help them land. This is what I wish someone had told me before my first Spanish PR.

---

## The Spanish Team Is Three People

[`PEERS_GUIDELINES.md`](https://github.com/mdn/translated-content/blob/main/PEERS_GUIDELINES.md) lists the review team for every locale. For Spanish it is [Graywolf9](https://github.com/Graywolf9), [Mario Morillo](https://github.com/mariomorillo) and me. Three people reviewing everything that lands in `files/es/`, for one of the most spoken languages on the web.

I bring this up because "contributing to MDN" sounds like joining something huge where your one page won't matter. The opposite is true. If you translate one page this weekend, you are a visible share of what Spanish gets this month. There is no queue of people ahead of you.

---

## What We Want From a PR

The [Spanish contributor guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md) ranks it plainly.

**Preferred: one page, fully updated.** Compare the whole Spanish page with the current English source and bring all of it up to date. That is what closes issues and shrinks the gap.

**Also welcome: small fixes.** A missing accent, a typo, one badly translated sentence. It is a good way in, and we review it with the same care. One request: if you find several problems on the same page, send one PR, not a PR a day for a week.

What does not work is the middle: translating the two English sentences someone left in a page that is two years out of date. The sentences get fixed and the page stays stale. Our trackers say it outright: the scope of a subtask is the whole file.

You don't need to install anything for a short page. Open the file under [`files/es/`](https://github.com/mdn/translated-content/tree/main/files/es), click the pencil, and GitHub forks the repo for you. Add `[es]` to the commit message so reviewers can spot Spanish PRs. Every PR gets a preview URL from the bot, so you can see the rendered page without running MDN locally. For longer pages, or to check links and macros as you go, the [local environment guide](https://github.com/mdn/translated-content/blob/main/docs/es/entorno-local.md) walks you through running MDN on your own computer.

---

## How We Write Spanish on MDN

This is the part a generic "how to contribute to MDN" post can't tell you. These are the conventions the Spanish team agreed on, and the ones I correct most often in review.

**Tú, not usted, and the imperative.** "Abre el archivo," not "abra el archivo." MDN's English style guide asks for an active voice and a conversational tone, and in Spanish that becomes tuteo plus the imperative. The imperative already implies *tú*, so "tú haz clic aquí" is redundant. "Haz clic aquí" is enough.

**Agreed terms for the words that repeat.** Headings like *See also* and *Browser compatibility* appear on almost every reference page, so we translate them the same way everywhere:

| English | Spanish |
|---|---|
| Event listener | Detector de eventos |
| Event handler | Manejador de eventos |
| See also | Véase también |
| Browser compatibility | Compatibilidad con navegadores |
| Return value | Valor de retorno |
| Framework | Framework (untranslated) |

The full list is in the guide. When a term is not on it, look at how nearby Spanish pages already say it before inventing a new one.

**API names keep English word order.** Spanish puts the noun first, so "API Canvas" feels natural. It is still wrong: `Canvas API` is a proper noun. The article goes in front of the whole name: *la Canvas API quedó obsoleta*.

**Callout keywords stay in English.** Write `> [!NOTE]`, not `> [!Nota]`. The build renders the first as a styled box with "Nota:" already on it. The second becomes a plain quote.

**Glossary links need a Spanish label.** `{{Glossary("TLD")}}` shows the English term. When the natural Spanish differs, pass it as the second argument: `{{Glossary("TLD", "Dominio de primer nivel")}}`.

**Unresolved doubts get a searchable marker.** If you can't settle something while translating, leave `<!-- TODO(l10n-es): ... -->`. The prefix matters: searching `files/es/` for plain `TODO` also matches the Spanish word *TODOS*.

---

## Links Are Where Spanish Pages Break Quietly

Internal links always use `/es/`, even when the target page is not translated yet. That keeps the reader in Spanish, and the link starts working the day someone translates the target.

Don't expect English to fill in. A `/es/` URL with no Spanish file is a 404, not the English page:

```sh
curl -s -o /dev/null -w '%{http_code}' -L https://developer.mozilla.org/es/docs/Learn_web_development/Core/Scripting/Functions
# 404
```

Our own guide got this wrong for months. I wrote about fixing it in [last week's post](/blog/finishing-a-60-page-mdn-localization-tracker/).

Anchors are worse, because nothing fails. Translating a heading changes its id, so `#browser_compatibility` does not exist on a Spanish page. A link that keeps it drops the reader at the top instead of the section. And the Spanish id is not always what the terms table says: the Spanish Fetch API page renders `#compatibilidad_de_navegadores`, not `con`. Check the real page instead of guessing. Any MDN URL with `/index.json` on the end returns the rendered page, headings and all:

```sh
curl -sL https://developer.mozilla.org/es/docs/Web/API/Fetch_API/index.json | grep -oE '"id":"[^"]+"'
```

If the target page is translated, use its Spanish id. If it isn't, drop the fragment and link to the page.

---

## Leave the Page Easy to Update

Every Spanish page carries this in its front matter:

```yaml
l10n:
  sourceCommit: ca0b474bb2e153ce72718cb304306e540065a888
```

It is the English commit your translation matches. When you finish a page, set it to the latest commit of the English file:

```sh
gh api "repos/mdn/content/commits?path=files/en-us/<path>/index.md&per_page=1" --jq '.[0].sha'
```

With it, the next person asks a cheap question: what changed in English since then? Without it, the only way to know whether a Spanish page is current is to read both versions in full. That is how most of the pages in our current tracker fell years behind.

If you only carried over part of the English changes, keep the old SHA until the rest is done.

---

## Your First Page

Start with [issue #9638](https://github.com/mdn/translated-content/issues/9638), *Has English content [es]*. It lists Spanish pages that fell behind English, split into one subtask per page and sorted from shortest to longest. Each subtask already has the English source path, the Spanish file, the line count, and the differences we found. As of today 42 are open.

1. Read the [Spanish contributor guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md).
2. Pick a subtask nobody has claimed, and **comment on it before you start**.
3. Update the whole file against the English source.
4. Open your PR with `Fixes #<subtask>`, not the parent issue, so the other subtasks stay open.

Step 2 is the one I underestimated. A contributor once spent an evening translating two pages I already had open PRs for, and neither of us knew until both sets of PRs were up. That was my fault as team lead, for not making claims visible. A one-line comment protects your evening.

For anything else, filter by the [`l10n-es`](https://github.com/mdn/translated-content/issues?q=is%3Aissue+is%3Aopen+label%3Al10n-es) label.

---

## Where to Find Us

- **Telegram**: the Spanish group, [t.me/+Dr6qKQCAepw4MjFj](https://t.me/+Dr6qKQCAepw4MjFj)
- **MDN Discord**: the `#spanish` channel, [discord.gg/aZqEtMrbr7](https://discord.gg/aZqEtMrbr7)
- **PR comments**: tag any of the three of us.

Ask in Spanish. That's the point.

---

## What I Learned

The thing that surprised me most about leading the Spanish team is how little of it is translation.

It's noticing that our own guide had been telling people something false. It's checking whether an anchor resolves instead of assuming. It's writing "comment to claim it" in the issue body, the review reply and the welcome message, because saying it once means half the people never see it. It's answering a first PR in a way that makes someone want to open a second one.

If you speak Spanish and write code, the team behind `/es/` is three people and there is more to do than we can reach. The page you update this weekend will be read by someone who never learns your name, and their afternoon goes a little better.

---

## Links

[Spanish contributor guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md), the Spanish rules and everything else you need, start here
[Local environment guide](https://github.com/mdn/translated-content/blob/main/docs/es/entorno-local.md), how to run MDN on your computer to preview your translations
[Issue #9638](https://github.com/mdn/translated-content/issues/9638), one subtask per page, shortest first
[`l10n-es` issues](https://github.com/mdn/translated-content/issues?q=is%3Aissue+is%3Aopen+label%3Al10n-es), everything open for Spanish
[Peer guidelines](https://github.com/mdn/translated-content/blob/main/PEERS_GUIDELINES.md), the review team per locale
