---
layout: post
title: "Finishing a 60-Page MDN Localization Tracker"
date: 2026-09-15 09:00:00 -0600
last_modified_at: 2026-09-15 09:00:00 -0600
categories: [development]
tags: [mdn, localization, open-source, spanish, contribution, documentation]
---

In August I closed [issue #35373](https://github.com/mdn/translated-content/issues/35373) in `mdn/translated-content`: the whole `/MDN/Writing_guidelines` section, 60 documents, synchronized with the English source. It took 114 days and 62 merged pull requests, spread across a handful of volunteers working in their spare time. I maintain the Spanish locale, so I split the issue, reviewed most of the PRs, and translated some of the pages myself.

This post is about what actually makes that kind of tracker finishable, and about the things I got wrong along the way.

---

## Checkboxes Lie

The issue had 58 subtasks, one per document, all checked. My first instinct was to read that as "done."

It isn't. A checklist is a snapshot of the day the subtasks were generated. It does not grow when new English pages land upstream. Two pages (`howto/retiring_content` and `retired_content`) were created in `mdn/content` on May 11, three weeks after I split the parent issue on April 20. They had no subtask, no checkbox, and no one was tracking them.

The reliable check compares directories, not checkboxes:

```sh
comm -23 <(cd content/files/en-us/mdn/writing_guidelines && find . -name index.md | sort) \
         <(cd translated-content/files/es/mdn/writing_guidelines && find . -name index.md | sort)
```

Empty output means every English page has a Spanish counterpart. Run it the other way around too (`comm -13`) to catch Spanish pages whose English source was moved or deleted, which leaves you with orphan translations at a slug nobody links to.

When that command finally printed nothing in both directions, that was the real "done" signal. The two missing pages became subtasks #37427 and #37428, and their PRs merged on the last day of the project.

---

## `sourceCommit` Is the Ledger

Every translated MDN page carries a front matter field:

```yaml
---
title: Contenido retirado
slug: MDN/Writing_guidelines/Howto/Retiring_content/Retired_content
l10n:
  sourceCommit: ca0b474bb2e153ce72718cb304306e540065a888
---
```

That SHA is the commit of the English file the translation was based on. It is the difference between a section you can maintain and a section you have to re-read in full every time.

The check is one API call per page:

```sh
gh api "repos/mdn/content/commits?path=files/en-us/<path>/index.md&per_page=1" --jq '.[0].sha'
```

Compare it against the tracked value. Ten of our 60 pages were behind. That sounds alarming until you look at what actually changed upstream: `fulfil` → `fulfill`, `a HTTP` → `an HTTP`, a CC0 link update, a few spelling-bot commits. English-only chores with no Spanish counterpart.

So the closing PR moved ten SHAs and changed nothing else. Ten lines. The value isn't in those lines, it's in what they prevent: the next person running a staleness check gets a clean report instead of ten false positives they have to investigate one by one.

---

## Verify the Upstream "Fix" Before You Copy It

One of those ten upstream commits rewrote a GitHub docs URL in `howto/images_media`. I dutifully copied the change into the Spanish page, then ran the link check out of habit:

```sh
curl -s -o /dev/null -w '%{http_code}' -L "https://docs.github.com/en/pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request"
# 404

curl -s -o /dev/null -w '%{http_code}' -L "https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request"
# 200
```

The "fixed" URL is the broken one. The Spanish page already had the working link, and my sync would have replaced a working link with a dead one, in the name of matching the source.

The source of truth is the source of truth for *content*, not for *facts*. Links rot in English too. It cost me one `curl` to find out.

---

## The Fallback That Doesn't Exist

The Spanish contributor guide told people that MDN renders English content as a fallback when a page isn't translated, and the entire anchor-linking section was built on that claim. It's how I explained `/es/` links to newcomers for months.

It's false:

| URL | Spanish file exists | HTTP |
|---|---|---|
| `/es/docs/Learn_web_development/Core/Scripting/Functions` | no | 404 |
| `/es/docs/MDN/Writing_guidelines/Howto/Retiring_content` | no | 404 |
| `/es/docs/Web/API/Fetch_API` | yes | 200 |

There is no whole-page fallback. A `/es/` URL with no translated file is a 404 until someone translates it.

The rule the claim supported ("always use `/es/` in internal links") is still right, just for a different reason: locale consistency, and the link starts working the moment the target gets translated. But the anchor advice that followed from it was actively wrong. I had been telling translators to keep the English fragment (`#browser_compatibility`) on links to untranslated pages "because MDN will serve English there." It won't. There is no page.

The corrected advice: if the target page is translated, use the translated heading id. If it isn't, drop the fragment and keep the page link. A fragment that matches nothing just dumps the reader at the top of the page.

I opened a PR to fix the guide. Worth remembering that a wrong sentence in a contributor guide doesn't produce one bug, it produces one bug per contributor who reads it.

---

## Small Rules That Show Up in Every Review

Four patterns came up often enough during this project that they're now part of my review checklist:

**API names keep English word order.** `Canvas API`, not "API Canvas." Spanish adjective order wants to flip it, and it reads natural, but the name is a proper noun. The article goes in front of the whole thing: *la Canvas API quedó obsoleta*.

**Callout keywords stay in English.** `> [!NOTE]` renders as a styled box; `> [!Nota]` renders as a plain blockquote. The label is localized by the build, not by you.

**Images don't get copied into `files/es/`.** If the Spanish page references an image that only exists in the English folder, the build rewrites the `src` to the `/en-US/` path automatically. Copying the binary in means a file that can't be diffed, gets duplicated in every commit that touches it, and silently drifts when the English one is updated. Only genuinely locale-specific images (a screenshot of a Spanish UI) belong there.

**Local tooling disagrees with CI.** My local `prettier` was 3.8.3, CI runs 3.9.4, and they format markdown blockquotes differently. My pre-commit hook helpfully "fixed" two files, adding lines CI never asked for. The tell: run the same check against the *untouched English source*. If it complains there too, it's your tooling, not the file.

---

## The Part That Isn't Technical

The most expensive mistake of this project had nothing to do with markdown.

Two contributors translated the same two pages. I opened PRs for `Retiring_content` and `Retired_content` on July 31. Another contributor opened PRs for the same two files on August 6, having done the whole translation from scratch. Neither of us knew.

That's someone's evening spent on work that can't merge, and it's on the maintainers, not on them. The subtasks existed. What didn't exist was a visible reservation on them at the moment they started.

The convention is "comment on the subtask to claim it," and it works when people know about it, which means it has to be in the issue body, in the review replies, and in the welcome message for first-time contributors, every single time. Repeating it feels redundant right up until it isn't.

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

Four months for 60 pages is not fast. But the number I care about is that the pace never went to zero: not one of those 16 weeks passed without something merging. That's the hard part of a volunteer localization project. Starting is easy. Week 11 is where these things die.

Most of the credit belongs to [Mario Morillo](https://github.com/mariomorillo), who merged 37 of those PRs and reviewed nearly everything else.

---

## What Made It Repeatable

The thing that outlasts the issue is the shape of the work:

1. **One page per subtask.** Not "sync the section." A newcomer can look at a subtask and know whether they can finish it tonight.
2. **Sort subtasks shortest to longest.** The first one being 116 lines instead of 900 is the difference between someone starting and someone closing the tab.
3. **Put the homework in the subtask.** English source path, target file, line count, tracked SHA vs latest SHA, and the differences already detected. Nobody should have to investigate before they can translate.
4. **Verify by filesystem, not by checkbox.** Covered above, and it's the one that caught the two missing pages.
5. **Bump `sourceCommit` when you close.** Otherwise the next sync starts from zero again, which is exactly how this section ended up needing a 60-page tracker in the first place.

That flow is now running on [issue #9638](https://github.com/mdn/translated-content/issues/9638), which is bigger: 43 open subtasks across the Learn Web Development section, sorted shortest-first, each with its sync status precomputed.

If you read Spanish and want a first open source contribution with a genuinely well-scoped task waiting for you, that's the issue. Comment on a subtask to claim it, and open your PR with `Fixes #<subtask>`, not the parent, so the rest stay open. The [Spanish localization guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md) is the place to start.

---

## Links

[Issue #35373](https://github.com/mdn/translated-content/issues/35373) — the tracker this post is about
[Issue #9638](https://github.com/mdn/translated-content/issues/9638) — the next one, 43 subtasks open
[Spanish localization guide](https://github.com/mdn/translated-content/blob/main/docs/es/README.md) — start here
