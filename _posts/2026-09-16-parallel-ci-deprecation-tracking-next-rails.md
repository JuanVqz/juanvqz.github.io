---
layout: post
title: "Parallel CI Deprecation Tracking in next_rails"
date: 2026-09-16 10:00:00 -0600
last_modified_at: 2026-09-16 10:00:00 -0600
categories: [development]
tags: [rails, ruby, open-source, next_rails, ci, deprecations, fastruby]
---

I recently contributed two features to the [next_rails](https://github.com/fastruby/next_rails) gem: parallel CI support for the deprecation tracker and a `deprecations merge` command to combine the results. This post explains the problem, the solution, and a bug that almost made it into production.

---

## The Problem

The `next_rails` deprecation tracker saves warnings to a single JSON file during your test run. That works fine when tests run on a single machine. But when you split your test suite across parallel CI nodes, every node tries to write to the same file. The last node to finish wins, and all the other nodes' deprecation data is lost.

---

## The Solution: Shard Files

The idea is simple: each CI node writes to its own shard file instead of the canonical one.

When you pass a `node_index` to the tracker, it writes to a file like `deprecation_warning.shitlist.node-0.json` instead of `deprecation_warning.shitlist.json`:

```ruby
RSpec.configure do |config|
  if ENV["DEPRECATION_TRACKER"]
    DeprecationTracker.track_rspec(
      config,
      shitlist_path: "spec/support/deprecation_warning.shitlist.json",
      mode: ENV["DEPRECATION_TRACKER"],
      node_index: ENV["CI_NODE_INDEX"],
      transform_message: -> (message) { message.gsub("#{Rails.root}/", "") }
    )
  end
end
```

Each node gets its own file. No conflicts, no data loss. That was [PR #176](https://github.com/fastruby/next_rails/pull/176).

---

## The Merge Step

Shard files are only useful if you can combine them. After all nodes finish saving, a fan-in step merges everything into the canonical file. That's the `deprecations merge` command, added in [PR #177](https://github.com/fastruby/next_rails/pull/177):

```bash
deprecations merge --delete-shards
```

This globs for all `*.node-*.json` files, deep-merges them, sorts the result, writes the canonical file, and optionally deletes the shards.

The typical CI workflow becomes:

```yaml
# 1. Save phase (each parallel node)
DEPRECATION_TRACKER=save CI_NODE_INDEX=$NODE bundle exec rspec <subset>

# 2. Merge phase (fan-in, runs once)
deprecations merge --delete-shards

# 3. Compare phase (each parallel node)
DEPRECATION_TRACKER=compare CI_NODE_INDEX=$NODE bundle exec rspec <subset>
```

---

## The inject(:merge) Bug

While working on this, I looked at [PR #83](https://github.com/fastruby/next_rails/pull/83) which had previously tried to add multi-file support to the `info` command. The approach used `inject(:merge)` to combine hashes from multiple files. The problem? `Hash#merge` overwrites duplicate keys instead of concatenating their arrays.

Consider three shard files where two of them reference the same test file:

```json
// node-0.json
{ "./spec/controllers/search_controller_spec.rb": ["dep2", "dep2", "dep2"] }

// node-1.json
{ "./spec/controllers/search_controller_spec.rb": ["dep3", "dep3"] }

// node-2.json
{ "./spec/controllers/search_controller_spec.rb": ["dep3", "dep2", "dep2"] }
```

With `inject(:merge)`, only the last file's data survives for that key. Warnings from node-0 and node-1 are silently dropped.

The fix is to concatenate arrays for duplicate keys:

```ruby
merged = {}
shard_files.each do |file|
  JSON.parse(File.read(file)).each do |bucket, messages|
    merged[bucket] = (merged[bucket] || []).concat(Array(messages))
  end
end
```

This is what `ShardMerger` does. Every warning is preserved regardless of how many nodes ran the same test file.

---

## Extracting ShardMerger

The merge logic lives in its own class rather than inside `DeprecationTracker`:

```ruby
class DeprecationTracker
  class ShardMerger
    def initialize(base_path, delete_shards: false)
      @base_path = base_path
      @delete_shards = delete_shards
    end

    def merge
      # glob, deep-merge, sort, write, optionally delete shards
    end
  end
end
```

`DeprecationTracker` is already responsible for tracking deprecations during test runs. Merging files is a separate concern that doesn't need any instance state from the tracker. A separate class keeps things focused and testable.

The CLI also supports `--next` for the next Rails version:

```bash
deprecations merge --next --delete-shards
```

---

## What About Scale?

The current implementation loads all shards into memory. Will it break with thousands of tests?

Probably not. Shards are bounded by CI nodes (typically 10-50), not by test count. Even 10,000 test files with 50 deprecations each is ~500K strings in memory. Ruby handles that without issue.

If someone ever hits memory limits here, the fix would be streaming: read each shard and write directly to output. But that's not a real concern today.

---

## Wrapping Up

These two PRs add a complete workflow for tracking deprecations in parallel CI:

- [PR #176](https://github.com/fastruby/next_rails/pull/176) — Parallel CI support (shard files per node)
- [PR #177](https://github.com/fastruby/next_rails/pull/177) — `deprecations merge` command (combine shards)

If you use `next_rails` for Rails upgrades and run parallel CI, these features should make deprecation tracking work out of the box. Check out the [next_rails README](https://github.com/fastruby/next_rails#parallel-ci-support) for the full setup guide.
