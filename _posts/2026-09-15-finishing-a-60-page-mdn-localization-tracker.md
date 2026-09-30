---
layout: post
title: "MDN's Writing Guidelines, Now Current in Spanish"
date: 2026-09-15 09:00:00 -0600
last_modified_at: 2026-09-30 09:00:00 -0600
categories: [development]
tags: [mdn, localization, open-source, spanish, contribution, documentation]
---

In August the Spanish locale of MDN closed [issue #35373](https://github.com/mdn/translated-content/issues/35373): every page under `/es/docs/MDN/Writing_guidelines`, 60 documents, synchronized with the English source. It took 114 days and 62 merged pull requests, almost all from five volunteers. I lead the Spanish team on MDN, so I split the issue, reviewed the PRs, and translated some of the pages myself.

---

## Why This Section Came First

The request did not start with us. By July 2023 the English Writing Guidelines had been updated to match how MDN now formats content, particularly that it uses Prettier. While formatting the translated pages, [Queen Vinyl Da.i'gyu-Kazotetsu](https://github.com/queengooborg) noticed that a number of the localized guideline pages were out of sync and opened [issue #14373](https://github.com/mdn/translated-content/issues/14373), asking every locale to resynchronize the section. When Graywolf9, from the Spanish team, asked about the scope, they answered that these pages were "a slightly higher priority, as they define the guidelines for writing and formatting MDN content, which cascades down to writing translated pages as well."

Most people who read MDN in Spanish will never open these pages. They are the rules for writing MDN itself: how code examples are formatted, how links and images work, how content gets retired. But every reader feels them, because every Spanish page was written by someone following them.

When the rules are wrong or out of date, the reader is the one who pays:

- A link to a section drops them at the top of the page, because the translator kept an English anchor that doesn't exist in Spanish.
- A warning that should stand out in a box shows up as a plain quote, because the callout keyword got translated.
- A screenshot stays stale after the English one changes, because someone copied the image into the Spanish folder. The Spanish React getting-started page showed `create-react-app` long after the English page had moved to Vite.

The reader never learns that a guideline was behind. They see a Spanish page that is worse than the English one, and they go back to English.

That is the cascade they meant. Spanish sat on that request for almost three years. For all that time, every contributor who read the rules in Spanish first learned a version English contributors had already moved past, and every page they translated inherited it. When we finally opened our own tracker in April 2026, several Spanish guideline pages were still out of date and some did not exist. Simplified Chinese and French finished before us. Spanish was the third locale to close its part of #14373, and Japanese, Korean, Brazilian Portuguese, Russian and Traditional Chinese are still open.

---

## Checkboxes Lie

The issue had 58 subtasks, one per document, all checked. My first instinct was to read that as "done."

It wasn't. A checklist is a snapshot of the day the subtasks were created. Two English pages (`howto/retiring_content` and `retired_content`) landed in `mdn/content` on May 11, three weeks after I split the issue on April 20. They had no subtask and no one was tracking them.

The reliable check compares the English and Spanish directories:

```sh
comm -23 <(cd content/files/en-us/mdn/writing_guidelines && find . -name index.md | sort) \
         <(cd translated-content/files/es/mdn/writing_guidelines && find . -name index.md | sort)
```

Empty output means every English page has a Spanish counterpart. Run it the other way (`comm -13`) to catch Spanish pages whose English source moved or was deleted, which leaves orphan translations at a slug nobody links to.

When that printed nothing in both directions, we were done. The two missing pages became subtasks #37427 and #37428, and their PRs merged on the last day.

---

## `sourceCommit` Is the Ledger

Every Spanish page on MDN carries this in its front matter:

```yaml
---
title: Contenido retirado
slug: MDN/Writing_guidelines/Howto/Retiring_content/Retired_content
l10n:
  sourceCommit: ca0b474bb2e153ce72718cb304306e540065a888
---
```

That SHA is the English commit the Spanish text was translated from. It is the difference between a section you can keep current and one you have to reread in full every time.

Checking it is one API call per page:

```sh
gh api "repos/mdn/content/commits?path=files/en-us/<path>/index.md&per_page=1" --jq '.[0].sha'
```

At the end, ten of our 60 pages were behind. That sounded alarming until I looked at what changed upstream: `fulfil` to `fulfill`, `a HTTP` to `an HTTP`, a CC0 link, a few spelling-bot commits. English spelling chores with nothing to carry over into Spanish.

So the closing PR moved ten SHAs and changed no Spanish text. The value is in what it prevents: the next person checking the Spanish section for staleness gets a clean report instead of ten false alarms to investigate one by one.

---

## Verify the Upstream "Fix" Before You Copy It

One of those upstream commits rewrote a GitHub docs URL in `howto/images_media`. I copied it into the Spanish page, then checked the link out of habit:

```sh
curl -s -o /dev/null -w '%{http_code}' -L "https://docs.github.com/en/pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request"
# 404

curl -s -o /dev/null -w '%{http_code}' -L "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request"
# 200
```

The "fixed" URL was the broken one. The Spanish page already had the working link, and my sync would have replaced it with a dead one to match the English.

English is the source of truth for *content*, not for *facts*. Translating from it does not mean inheriting its broken links.

---

## The Fallback Our Guide Invented

The [Spanish contributor guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md) told people that when a page is not translated, MDN shows the English one instead. It is how I explained `/es/` links to new Spanish contributors for months.

It's false. A `/es/` URL with no Spanish file is a 404:

```sh
curl -s -o /dev/null -w '%{http_code}' -L https://developer.mozilla.org/es/docs/Learn_web_development/Core/Scripting/Functions
# 404
```

The rule it supported, "always use `/es/` in internal links," is still right, for a different reason: it keeps the reader in Spanish, and the link starts working the moment the target is translated.

But the anchor advice built on it was wrong. I had been telling translators to keep the English fragment, like `#browser_compatibility`, on links to untranslated pages, "because MDN will serve English there." There is no page there to serve.

The corrected rule, now in the guide: if the target page exists in Spanish, use its Spanish heading id. If it doesn't, drop the fragment and keep the page link.

A wrong sentence in the Spanish guide does not produce one bug. It produces one bug per Spanish contributor who reads it.

---

## Spanish Rules That Showed Up in Every Review

These came up often enough that they are now written into the Spanish guide:

**API names keep English word order.** `Canvas API`, not "API Canvas." Spanish puts the noun first, so flipping it reads natural, but the name is a proper noun. The article goes in front of the whole thing: *la Canvas API quedó obsoleta*.

**Callout keywords stay in English.** `> [!NOTE]` renders as a styled box. `> [!Nota]` renders as a plain quote. The build puts "Nota" on the box for you. The text inside the box is what you translate.

**Translated headings change their anchors.** `## Browser compatibility` becomes `## Compatibilidad con navegadores`, and its id changes with it. A link that only swaps `/en-US/` for `/es/` and keeps `#browser_compatibility` drops the reader at the top of the page. And you cannot guess the Spanish id either: the guide's convention is *Compatibilidad con navegadores*, but the Spanish Fetch API page renders `#compatibilidad_de_navegadores`. Check the real page:

```sh
curl -sL https://developer.mozilla.org/es/docs/Web/API/Fetch_API/index.json | grep -oE '"id":"[^"]+"'
```

**Images don't get copied into `files/es/`.** When a Spanish page references an image that only exists in English, the build points it at the `/en-US/` file. Translate the `alt` text, leave the binary alone. Only images whose content is Spanish, like a screenshot of a Spanish interface, belong in `files/es/`.

---

## The Part That Isn't Technical

The most expensive mistake of the project had nothing to do with markdown.

I opened PRs for `Retiring_content` and `Retired_content` on July 31. Another contributor opened PRs for the same two pages on August 6, translated from scratch. Neither of us knew.

That is someone's evening spent on work that can't merge, and it's on us as the team, not on them. The subtasks existed. A visible reservation on them did not.

The convention is "comment on the subtask to claim it." It works when people know about it, which means it has to be in the issue body, in review replies, and in the welcome message for first-time contributors, every time.

---

## The Numbers

| | |
|---|---|
| Started | April 20, 2026 |
| Finished | August 12, 2026 |
| Duration | 114 days (16 weeks) |
| Documents | 60 |
| Subtasks | 60 (58 planned + 2 that appeared later) |
| Merged PRs | 62 |
| Pace | ~1 page every 2 days |

Four months for 60 pages is not fast. The number I care about is that no week went by without something merging. That is the hard part of a volunteer locale. Starting is easy. Week 11 is where these things die.

Most of the credit belongs to [Mario Morillo](https://github.com/mariomorillo), who wrote 37 of those 62 PRs and reviewed many of the rest. [EmilianoBecerra](https://github.com/EmilianoBecerra), [Arturo Cabrera](https://github.com/GNUXDAR) and [Ifeanyi Chima](https://github.com/MasterIfeanyi) wrote most of the others with me.

---

## What We Kept for the Next Spanish Tracker

1. **One page per subtask.** Not "sync the section." A newcomer can look at it and know whether they can finish it tonight.
2. **Sort subtasks shortest to longest.** A first page of 116 lines instead of 900 is the difference between someone starting and someone closing the tab.
3. **Put the homework in the subtask.** English source path, Spanish target file, line count, tracked SHA vs latest SHA, and the differences already found. Nobody should have to investigate before they can translate.
4. **Verify by directory, not by checkbox.** That is what caught the two missing pages.
5. **Bump `sourceCommit` when you close.** Otherwise the next sync starts from zero, which is how this section needed a 60-page tracker in the first place.

That process now runs [issue #9638](https://github.com/mdn/translated-content/issues/9638), *Has English content [es]*. It was opened in 2022 to list Spanish pages that still had untranslated English in them. For a reader, those are the pages where you switch to Spanish and still hit paragraphs in English. The English was only the symptom: most of those pages had fallen years behind the English source, so the Spanish parts can describe an API as it was, not as it is. As of today, 63 of its 105 subtasks are done and 42 are open, sorted shortest first, each with its sync status already worked out.

If you read Spanish and want a first open source contribution with a well-scoped task waiting for you, that's the issue. Comment on a subtask to claim it, and open your PR with `Fixes #<subtask>`, not the parent, so the rest stay open. Start with the [Spanish contributor guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md), and next week's post, [Contributing to MDN in Spanish](/blog/contributing-to-mdn-in-your-language/), walks through the rest.

---

## Links

[Issue #35373](https://github.com/mdn/translated-content/issues/35373), the Writing Guidelines tracker
[Issue #9638](https://github.com/mdn/translated-content/issues/9638), the next one, 42 subtasks open
[Spanish contributor guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md), the Spanish rules and everything else you need, start here
[Local environment guide](https://github.com/mdn/translated-content/blob/main/docs/es/entorno-local.md), how to run MDN on your computer to preview your translations
