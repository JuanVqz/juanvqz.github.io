---
layout: post
title: "Releasing a Gem with release-please and Trusted Publishing"
date: 2026-12-22 09:00:00 -0600
last_modified_at: 2026-12-22 09:00:00 -0600
categories: [development]
tags: [ruby, rubygems, release-please, github-actions]
---

When I turned my dev.to fixes into [jekyll-devto](/blog/cross-posting-a-jekyll-blog-to-dev-to-complete/), I did not want the usual release routine: bump the version by hand, write the changelog, tag, `gem build`, `gem push`, type an MFA code. Five versions later I have not typed any of it. I merge a pull request, and CI does the rest.

Two pieces make that work: [release-please](https://github.com/googleapis/release-please) writes the release, and RubyGems [trusted publishing](https://guides.rubygems.org/trusted-publishing/) pushes it without an API key. This is the setup, and the traps I found on the way.

---

## How a release goes

1. Every pull request is squash-merged with a [Conventional Commit](https://www.conventionalcommits.org/) title: `fix(feed): keep adjacent code blocks separate on dev.to`.
2. On each push to `main`, release-please reads those commits and keeps a `chore(main): release 0.4.1` pull request open, with the version bumped and the `CHANGELOG.md` entries written.
3. Merging that pull request tags `v0.4.1`, creates the GitHub release, and pushes the gem to RubyGems.

That merge is the publish. A version number on RubyGems can never be reused, even after a yank, so it is the one step I keep for myself.

---

## release-please

Two files in the repository root. The config:

```json
{
  "release-type": "ruby",
  "include-component-in-tag": false,
  "bump-minor-pre-major": true,
  "initial-version": "0.1.0",
  "packages": {
    ".": {
      "package-name": "jekyll-devto",
      "version-file": "lib/jekyll/devto/version.rb",
      "changelog-sections": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "docs", "section": "Documentation" },
        { "type": "test", "section": "Tests", "hidden": true },
        { "type": "ci", "section": "Continuous Integration", "hidden": true },
        { "type": "chore", "section": "Maintenance", "hidden": true }
      ]
    }
  }
}
```

And the manifest, which release-please updates on every release:

```json
{
  ".": "0.4.0"
}
```

`release-type: ruby` tells it to bump the `VERSION` constant in `version-file`. `include-component-in-tag: false` makes the tags plain `v0.4.0` instead of `jekyll-devto-v0.4.0`. `bump-minor-pre-major` keeps a breaking change on `0.x` from jumping to `1.0.0`. The hidden sections keep tests, CI and chores out of the changelog, so it only lists what a user of the gem would notice.

---

## Trusted publishing

Trusted publishing replaces the RubyGems API key. On rubygems.org you register which GitHub repository and workflow may push the gem. When that workflow runs, it trades the job's OIDC token for a RubyGems key that expires shortly after, so there is no secret stored anywhere.

The workflow has two jobs. The second runs only when the first created a release:

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  release-please:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
    steps:
      - uses: googleapis/release-please-action@v5
        id: release
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

  publish:
    needs: release-please
    if: needs.release-please.outputs.release_created == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5
        with:
          persist-credentials: false
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "4.0"
          bundler-cache: true
      - run: bundle exec rake test
      - uses: rubygems/configure-rubygems-credentials@v2.1.0
      - run: gem build jekyll-devto.gemspec
      - run: gem push jekyll-devto-*.gem
```

`id-token: write` is the permission that lets the job ask for the OIDC token, and it is only on the job that pushes. The tests run once more before the push, on the commit being released.

The gemspec sets `rubygems_mfa_required`, and I expected that to block a push from CI. It does not. In rubygems.org's source, `Pusher#verify_mfa_requirement` passes when the API key does not belong to a user, and `ApiKey#mfa_authorized?` returns true for keys that came from an OIDC token. MFA still protects every push made with my own account.

---

## The traps

### The first release would have been 1.0.0

With a `0.0.0` manifest and no release yet, release-please ignores the manifest and falls back to `1.0.0` (`initialReleaseVersion()` in `src/strategies/base.ts`). The fix is `"initial-version": "0.1.0"`, which it reads only until the first tag exists. A code review caught this before the first merge. Since a version on RubyGems can never be reused, a `1.0.0` would have stayed there for good.

### A pending publisher lasts 12 hours

A gem that does not exist yet cannot have a trusted publisher, so rubygems.org has a pending one: it holds the name for whoever pushes it from the workflow you registered. It expires 12 hours after you create it (`expires_at: 12.hours.from_now`), and the pusher ignores an expired one. If the first release pull request waits longer than that, create the pending publisher again right before merging. After the first push it becomes the gem's permanent publisher.

### A changelog seeded by hand

I added a `CHANGELOG.md` with only a `# Changelog` line, and the first release pull request ended with a stray `## Changelog` under the entry. A file without a version header gets appended below release-please's own header, with its H1 turned into an H2 (`src/updaters/changelog.ts`). Delete the file and let release-please create it.

### The release pull request does not always refresh

release-please rewrites its pull request only when the release notes change. A hidden commit, a `chore` or a `ci`, leaves it as it was, stale files included, and its log says the pull request "remained the same". The date in the changelog entry is also the day the pull request was built, not the day it is merged. To rebuild it, close it with its branch deleted, remove its `autorelease: pending` label, and rerun the latest `Release` run. Closing it publishes nothing.

### Merging adds a co-author

The release pull request is opened by `github-actions[bot]`, and a squash merge from the web adds a `Co-authored-by: github-actions[bot]` line to the commit. I merge it from the terminal with my own subject and body instead:

```sh
gh pr merge 21 --squash --delete-branch \
  --subject "chore(main): release 0.4.1 (#21)" \
  --body "Release 0.4.1."
```

### Settings the workflow needs

release-please cannot open its pull request until **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests** is on. And some of the CI runs on its pull requests waited for my approval, marked `action_required`, before running the tests.

---

## Was it worth it

For a gem I release a few times a week while it is new, yes. The commit messages I already wrote became the changelog, and I stopped keeping a version number in my head. There is no RubyGems key to rotate or leak, and the only manual step left is the one that should be manual: deciding a version is ready.

The full setup is in the [jekyll-devto repository](https://github.com/JuanVqz/jekyll-devto), including the `AGENTS.md` notes on each of these traps.
