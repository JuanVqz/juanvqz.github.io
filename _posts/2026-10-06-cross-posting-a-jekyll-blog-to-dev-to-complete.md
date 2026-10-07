---
layout: post
title: "Cross-Posting a Jekyll Blog to dev.to, Complete"
date: 2026-10-06 09:00:00 -0600
last_modified_at: 2026-10-06 09:00:00 -0600
categories: [development]
tags: [jekyll, dev-to, ruby, rubygems, github-actions, release-please, rss]
---

My blog has been connected to dev.to's "Publishing to DEV Community from RSS" for a long time. Every post I wrote showed up on dev.to as a draft, which sounds like the whole job done for me. It was not. Every draft was cut short, so before publishing anything on dev.to I opened the draft and pasted the rest of the post by hand. An integration that makes you sync by hand is not an integration.

This is how I tracked it down, the things dev.to does that are not written anywhere, and the gem that came out of it: [jekyll-devto](https://github.com/JuanVqz/jekyll-devto).

---

## Why the posts arrived cut short

This blog runs on [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy). Its `feed.xml` is an Atom feed, and each entry looks like this:

```xml
<content type="text/html" src="https://www.juanvasquez.dev/blog/some-post/" />
<summary>The first 90 words of the post […]</summary>
```

The `<content>` element is empty. It only points at the post with `src`. dev.to runs [Forem](https://github.com/forem/forem), and the importer picks the body in `Feeds::AssembleArticleMarkdown`:

```ruby
def get_content
  @item.content || @item.summary
end
```

Feedjira, the parser Forem uses, returns `nil` for an empty `<content>`, so dev.to took the summary. Ninety words and a `[…]`. Nothing on my side was broken: it is how the theme's feed is built.

---

## A second feed, not a fuller one

The obvious fix is to put the whole post in `feed.xml`. I did not, for two reasons. The README of my GitHub profile reads that feed and only needs titles. And the theme's template ends with `replace: '&', '&amp;'` over the whole document, which would corrupt the escaped entities inside code blocks the moment the feed carried full HTML.

So I added `/devto.xml`, an RSS 2.0 feed with the full rendered post in `<content:encoded>`, which is what Forem reads first. The summary feed stays a summary, the way Chirpy ships it.

The first build looked right, and I checked it the only way that counts: I ran the feed through the same chain dev.to uses. Feedjira to parse it, Forem's own `Feeds::CleanHtml` to clean it, and ReverseMarkdown to turn it into the Markdown dev.to stores. That replay found the next problem.

---

## Line numbers inside the code

Chirpy's default config turns on Rouge line numbers (`line_numbers: true`), so every fenced block renders as a table with a gutter. After dev.to's conversion, the numbers were part of the code:

```
1
2
bundle add tailwindcss-rails
rails tailwindcss:install
```

The fix rewrites each Rouge block back to a plain `<pre><code>` and drops the highlighting spans. Two review rounds found the cases I had missed:

- **Kramdown block options.** `{: .nolineno }` adds a class to the wrapper and `{: file="app/models/user.rb" }` adds an attribute, so a pattern that expected exactly `class="language-ruby highlighter-rouge"` skipped those blocks.
- **The `{% raw %}{% highlight ruby linenos %}{% endraw %}` tag.** It renders a `<figure>` with `gutter` and `code` cells instead of Kramdown's `rouge-gutter` and `rouge-code`.

That left the code without a language, so dev.to showed it unhighlighted. `Feeds::CleanHtml` removes every `class` attribute before converting, and Forem reads the language from a class, so no feed can carry it through that way. It can carry it another way: CleanHtml only removes classes, so each block now goes out as `<pre data-lang="ruby">`, and the publisher writes that language into the draft's fences right before publishing it.

It matches blocks to fences by their first line of code, not by position. dev.to does not fence a code block inside a list item, so on one of my posts there were three blocks and two fences, and counting by position would have put the wrong language on every fence after the gap. Across this blog, 217 of the 218 blocks that have a language now get it on dev.to. The one left is that block inside a list.

Forem can also fill in a missing language itself: `Article#detect_code_block_languages` asks an AI model when the feature is turned on. One of my posts came out with a <code>```json</code> fence that no version of the feed had carried, so it may be on at dev.to, but I could not confirm it, and the feed does not rely on it.

---

## Absolute links, but not inside code

Root-relative links and images (`/about/`, `/assets/pic.png`) point nowhere once the post lives on dev.to, so the feed makes them absolute. My first version did it with Liquid's `replace` over the whole post, and review caught what that does to a code sample:

```html
<img src="/logo.png">
```

That sample is text, not a tag, but Kramdown leaves its quotes unescaped, so it matched and came out with my domain glued to it. Code reaches the HTML with `<` escaped as `&lt;`, so the fix is to rewrite `src` and `href` only inside real tags. Samples stay exactly as written.

---

## Drafts you still have to publish

With the content fixed, dev.to imported complete posts. As drafts. The importer hardcodes this into the front matter of every article it creates:

```yaml
published: false
```

There is no setting to change it. So I wrote a small publisher: it lists my drafts through the dev.to API, matches each one to a post published in the last seven days, and publishes it. The seven days matter. The feed carries the whole archive, and without a window the first run would have pushed years of old posts at once, a 2023 "Happy New Year" included.

The first version would have published nothing, and the reason is in `Article#evaluate_front_matter`. dev.to evaluates the front matter inside the body on every save, so that `published: false` overrides the `published: true` you send in the request. The publisher has to flip it inside the body, and only inside the front matter, never a matching line further down the post.

There was one more catch. The response to that `PUT` has no `published` field, so you cannot read back whether it worked. The publisher lists the drafts again afterwards, and any post still among them fails the run.

---

## The import that kept raw HTML

The replay said every post converted cleanly, but what dev.to had stored said otherwise: one of my posts was still raw HTML, `<p>` tags and all, with no code fences. My replay had skipped one check in the importer.

dev.to converts a post to Markdown only when it has more HTML block tags than blank lines. Kramdown puts a blank line between every block, so a post sits right on that edge, and the blank lines inside its code blocks decide which side it lands on. Across the blog, 15 of 43 posts had landed on the wrong one.

The fix was to make the feed drop the blank lines between tags and encode the ones inside code, so a post reads exactly the same. Now every post takes the Markdown path.

---

## Covers, and why they are opt-in

The next version used each post's Open Graph image as its dev.to cover. On my blog that image carries the post title, and dev.to prints the title right under the cover, so the first two articles that got one said their own name twice.

So covers are opt-in. Without one, dev.to generates its own share image for the article (`Article#generate_social_image`), so nothing is lost. A post sets `devto_cover` to a path, or to `true` for its image, or to `false` to keep it off, and `devto: { cover: image }` in `_config.yml` turns it on for every post on a site whose images have no title on them.

---

## Things dev.to does that are not documented

All of these come from Forem's source, because none of them is on a settings page:

- **Duplicates match on title or link, per account** (`Feeds::CheckItemPreviouslyImported`). Delete a draft and it comes back on the next fetch while the post is still in the feed. Rename a post after it was imported and you get a second draft.
- **Only the first four tags survive**, stripped to letters and digits. `tailwind-css` becomes `tailwindcss`.
- **"Replace self-referential links"** rewrites links between your posts to the dev.to articles imported from them, drafts included. If the linked post is still a draft, readers get a link that does not work for them.
- **Feeds are only fetched for accounts active in the last three months** (`Feeds::Import`).
- **The one-time "Import from XML" box** takes at most 25 entries and 500 KB (`Feeds::ImportFromXml`). My feed had 43 posts when I checked, so it would have been rejected.

---

## Turning it into a gem

Before writing a gem I looked for one. RubyGems has nothing for Jekyll and dev.to. The tools I found push your raw Markdown through the API, so Jekyll-specific syntax arrives unrendered, and they publish on push rather than on the post's date. The most used one, [devto-cli](https://github.com/sinedied/devto-cli), also writes an article ID back into each post. `jekyll-feed` carries full content but knows nothing about line numbers.

The angle of [jekyll-devto](https://github.com/JuanVqz/jekyll-devto) is the opposite: it works from the HTML Jekyll already rendered, so anything your theme supports comes through, and it never edits your posts.

```ruby
# Gemfile
gem 'jekyll-devto'
```

```yaml
# _config.yml
url: "https://example.com"
plugins:
  - jekyll-devto
```

That gives you `/devto.xml`. For the drafts:

```sh
export DEVTO_API_KEY=... # https://dev.to/settings/extensions

bundle exec jekyll-devto publish            # dry run
bundle exec jekyll-devto publish --publish
```

The repository ships an example GitHub Actions workflow that runs it after each deploy and on a schedule, because dev.to fetches the feed on its own: its import job runs every hour but reads a feed again only when the last read is more than four hours old.

Two optional front matter keys cover the rest of what dev.to does differently. `devto_tags` picks the four tags dev.to keeps, and `devto_series` puts the post in a dev.to series, created the first time it is used. The series name has to be identical on every post, because dev.to matches a series by its exact name.

I checked it two ways before calling it done. On this blog, with my in-repo version removed, the gem produced the same `devto.xml` for all 43 posts it carried at the time; the only difference was the build timestamp. And on a fresh `jekyll new` site with the default theme, the feed is valid and its code blocks and links survive the replay of dev.to's import.

---

## Releasing it without typing an MFA code

The gem is released with [release-please](https://github.com/googleapis/release-please) and RubyGems [trusted publishing](https://guides.rubygems.org/trusted-publishing/). Merging a release pull request tags the version, creates the GitHub release, and pushes the gem from CI with a short-lived key, so there is no API key in the repository. The gemspec requires MFA, and rubygems.org lets those keys through anyway: in its source, `Pusher#verify_mfa_requirement` passes when the key does not belong to a user.

Two traps on the way to `0.1.0`:

- **The first release would have been 1.0.0.** With no previous release, release-please ignores a `0.0.0` manifest and falls back to `1.0.0` unless `initial-version` is set. A version number on RubyGems can never be reused, even after a yank, so that one would have stuck. A code review caught it before the merge.
- **A pending trusted publisher lasts 12 hours.** For a gem that does not exist yet, rubygems.org holds the name for whoever pushes it from that workflow, and the hold expires. After the first push it becomes permanent.

Every version since went out the same way: merge the release pull request, and CI does the rest.

---

## What I would tell myself before starting

- Run the real pipeline. Most bugs in this post showed up only when the feed went through Feedjira, `CleanHtml` and ReverseMarkdown, never by looking at the XML.
- Then check what the service stored. A replay is only as faithful as the steps you copied into it, and mine had left out the one that kept 15 posts as raw HTML.
- Front matter is YAML, so test every type. `devto_cover: true` crashed the whole Jekyll build, because `true` reached code that expected a string. A test that builds a site for every key with every YAML type, `true`, numbers, lists and hashes, found 14 more crashes like it.
- Read the source of the service you integrate with. Forem's code answered every question its settings page did not.
- Let someone review it. Half the fixes here came from review, and one suggested fix was wrong: it checked a `published` field the API response does not have. Checking it against the code before applying it saved a publisher that would have failed every post.

The gem is on [RubyGems](https://rubygems.org/gems/jekyll-devto) and the code is on [GitHub](https://github.com/JuanVqz/jekyll-devto). If your Jekyll blog has been sending dev.to half a post, it should not anymore.
