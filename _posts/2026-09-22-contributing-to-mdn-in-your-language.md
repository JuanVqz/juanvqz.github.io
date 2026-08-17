---
layout: post
title: "Contributing to MDN in Your Language"
date: 2026-09-22 09:00:00 -0600
last_modified_at: 2026-09-22 09:00:00 -0600
categories: [development]
tags: [mdn, localization, open-source, documentation, contribution, community]
---

A developer in Guadalajara opens MDN to look up how `fetch` handles errors. They read English fine, but it is their third language, and after nine hours of work it is the difference between understanding a page and getting through it. They switch to `/es/`, and the page is there, current, complete.

That is the whole product. Everything else in this post is logistics.

I maintain the Spanish locale of [mdn/translated-content](https://github.com/mdn/translated-content). This is what I wish someone had told me before my first PR, written for whatever language you speak.

---

## It Is Smaller Than You Think

MDN has eight active locales: Spanish, French, Japanese, Korean, Brazilian Portuguese, Russian, and both Chinese variants. Every one of them is maintained by a volunteer team, and the teams are small, two people for French, three for Spanish and Brazilian Portuguese, five or six for the larger ones.

That is the entire staff standing between a documentation site used by millions of developers and eight languages' worth of drift.

I bring this up because "contributing to MDN" sounds like joining something enormous where your one page won't matter. The opposite is true. If you translate one page today, you are a measurable fraction of this month's output for your language. There is no queue of people ahead of you.

---

## What a Contribution Actually Looks Like

Not a rewrite of the site. One file.

You find a page in your language that is missing or out of date, compare it to the English source, translate or update it, and open a pull request. A short page is an evening. A long guide is a weekend. Both are complete, mergeable contributions.

The thing that trips people up is scope, in both directions. Some contributors open a PR fixing one typo on a page that is two years out of date: welcome, but the page stays broken. Others try to sync an entire section at once and burn out on page four.

The unit that works is **one page, fully done**. MDN's shared guidelines are explicit about this: do not partially translate a document. A page that is half in your language and half in English is worse than one that is fully English, because the reader can't tell which parts they can trust.

---

## The Ledger That Makes It Sustainable

Every translated page carries this in its front matter:

```yaml
l10n:
  sourceCommit: ca0b474bb2e153ce72718cb304306e540065a888
```

That is the commit of the English file your translation was based on. It looks like bookkeeping. It is actually the single thing that decides whether a locale is maintainable or not.

With it, the next contributor asks a cheap question: what changed in English since that commit? Usually the answer is a typo fix and they can move on. Without it, the only way to know whether a page is current is to read both versions in full, in every language, forever. That is how locales quietly die, not from lack of translators, but from every update costing a full re-read.

So when you finish a page, set that SHA to the latest commit of the English source. You are not doing it for yourself. You are doing it for whoever touches the page in two years.

---

## What English-Only Contributors Get Wrong (Including Me)

A few things I learned by getting them wrong in Spanish, which apply to any locale:

**Translating the page is not the same as translating the links.** If you translate a heading, its anchor id changes with it. Every link pointing at the old English fragment now silently drops readers at the top of the page instead of the section you promised them. Nothing errors. Nothing fails CI. It just quietly doesn't work.

**Don't reason about how the site renders: check.** Heading ids, live-sample names, image paths: fetch the rendered page and look. Any MDN URL with `/index.json` appended returns the rendered body, which is the fastest way to see real heading ids without building anything locally.

**Proper nouns don't get grammar.** `Canvas API` stays `Canvas API` even when your language wants to reorder the words. Same for callout keywords like `[!NOTE]`, which the build localizes for you and which stop rendering as callouts the moment you translate them.

**Your local tooling is not CI's tooling.** When a formatter complains, run it against the untouched English source first. If it complains there too, the problem is your version, not your file.

None of these are in a style guide because they are not style. They are the failure modes you only meet by shipping.

---

## Where the Real Notes Live

This took me embarrassingly long to map out, so here it is in one place:

- **[`docs/README.md`](https://github.com/mdn/translated-content/blob/main/docs/README.md)**, the cross-locale rules. Short. Front matter, no machine translation, no partial translations, how to handle code blocks. Read this first, whatever your language.
- **Your locale's guide**: linked from that same file. Depth varies a lot; Spanish and Simplified Chinese are the longest, and some locales have barely a page. If yours is thin, that itself is a contribution waiting.
- **[`PEERS_GUIDELINES.md`](https://github.com/mdn/translated-content/blob/main/PEERS_GUIDELINES.md)**, the one most people never find. It names every locale's review team, member by member, and states what those maintainers committed to: review every PR within two weeks, triage issues within a month. It is who to ping, and what you can expect from them.
- **The `l10n-<locale>` labels**: `l10n-es`, `l10n-fr`, `l10n-ja`, `l10n-ko`, `l10n-pt-br`, `l10n-ru`, `l10n-zh`. This is your locale's open work.
- **[MDN community discussions](https://github.com/orgs/mdn/discussions)** and the MDN Discord, where most locales have a channel.

---

## Picking Your First Page

Filter issues by your locale's label and look for something scoped to a single document. In Spanish we structure work that way deliberately: a tracking issue gets split into one subtask per page, each carrying the English source path, the line count, the current sync status, and the differences already detected. You reserve one by commenting on it, and you open your PR against that subtask, not the parent.

If your locale doesn't work that way, the same trick works solo. Pick one page you personally use. Compare it to the English source. If it's stale, that's your PR.

Then comment before you start. This is the part I underestimated: I once spent an evening translating two pages that another contributor had already translated, and neither of us knew until both PRs were open. That is nobody's fault except the maintainer's , mine , for not making claims visible. A one-line comment costs nothing and protects someone's evening.

---

## What I Learned

The thing that surprised me most about locale maintenance is how little of it is translation.

It's noticing that a guide has been telling contributors something false for months. It's checking whether an anchor actually resolves instead of assuming. It's writing the reservation convention in the issue body, the review reply, and the welcome message, because saying it once means half the people never see it. It's replying to a first PR in a way that makes someone want to open a second one.

Translation is the easy part. Making it repeatable, so a language doesn't fall behind again the moment one person gets busy, is the actual work, and it's work that doesn't require being a senior engineer. It requires caring that the page is right.

If you speak a language MDN supports, your locale team is two to six people and they are behind. That is not a discouraging fact. It means the thing you do this weekend is visible, and the developer who lands on that page next month has no idea you exist, but their day goes slightly better.

---

## Links

[mdn/translated-content](https://github.com/mdn/translated-content), the repo
[Cross-locale guidelines](https://github.com/mdn/translated-content/blob/main/docs/README.md), start here
[Peer guidelines](https://github.com/mdn/translated-content/blob/main/PEERS_GUIDELINES.md), review teams per locale
[Translated content on MDN](https://developer.mozilla.org/en-US/docs/MDN/Community/Contributing/Translated_content), the official contributor page
