#!/usr/bin/env ruby
# frozen_string_literal: true

# Checks posts against the house style before they are merged, rather than after.
#
#   ruby scripts/lint-prose.rb                    # every post
#   ruby scripts/lint-prose.rb _posts/2026-*.md   # specific files
#
# Exits 1 when an ERROR rule matches, 0 when only WARNINGS do. Warnings are
# judgement calls; errors are things the style guide rules out outright.
#
# Code is exempt: fenced blocks, indented blocks and YAML front matter are
# skipped, because an em dash inside a shell comment is part of the sample.

ERRORS = {
  "em dash" =>
    [/—/, "Use a colon, a comma, or a full stop. Standing rule: no em dashes."],
  "I want to be honest" =>
    [/\bI wa(nt|nted) to be honest\b/i, "Reads as generated. Just say the thing."],
  "it's worth noting" =>
    [/\bit'?s worth noting\b/i, "Filler. If it is worth noting, note it."],
  "the key insight/takeaway" =>
    [/\bthe key (insight|takeaway)\b/i, "State the insight instead of announcing it."],
  "here's the thing" =>
    [/\bhere'?s the thing\b/i, "Reads as generated."],
  "in conclusion" =>
    [/\bin conclusion\b/i, "Essay scaffolding. Delete it."],
  "let's dive in" =>
    [/\blet'?s (dive|jump) in\b/i, "Reads as generated."],
  "delve" =>
    [/\bdelv(e|es|ing|ed)\b/i, "Nobody says this."],
  "corporate filler" =>
    [/\b(leverag(e|es|ing|ed)|seamless(ly)?|game.changer|robust)\b/i,
     "Say what it actually does."]
}.freeze

WARNINGS = {
  "hedging" =>
    [/\b(kind of|sort of|I think maybe|somewhat)\b/i, "Weakens the claim. Cut or commit."],
  "filler adverb" =>
    [/\b(just|really|actually|very)\s/i, "Usually removable without loss."],
  "that said" =>
    [/\bthat said,/i, "Often a transition standing in for an argument."],
  "ultimately" =>
    [/\bultimately,/i, "Usually removable."]
}.freeze

def prose_lines(path)
  in_fence = false
  in_front = false
  File.readlines(path, chomp: true).each_with_index do |line, i|
    stripped = line.strip
    if i.zero? && stripped == "---"
      in_front = true
      next
    end
    if in_front
      in_front = false if stripped == "---"
      next
    end
    if stripped.start_with?("```", "~~~")
      in_fence = !in_fence
      next
    end
    next if in_fence
    next if line.start_with?("    ", "\t")   # indented code
    yield line, i + 1
  end
end

files = ARGV.empty? ? Dir["_posts/**/*.md"] : ARGV
files = files.select { |f| File.file?(f) && f.end_with?(".md") }
abort "no markdown files to check" if files.empty?

errors = 0
warnings = 0

files.sort.each do |path|
  prose_lines(path) do |line, no|
    ERRORS.each do |name, (pattern, why)|
      next unless (m = line.match(pattern))

      errors += 1
      puts "#{path}:#{no}  ERROR  #{name}: #{m[0].strip.inspect}"
      puts "        #{why}"
    end
    WARNINGS.each do |name, (pattern, why)|
      next unless (m = line.match(pattern))

      warnings += 1
      puts "#{path}:#{no}  warn   #{name}: #{m[0].strip.inspect}"
      puts "        #{why}"
    end
  end
end

puts
puts "#{files.size} file(s) checked: #{errors} error(s), #{warnings} warning(s)"
if errors.positive?
  puts "Errors block the build. Warnings are judgement calls and do not."
  exit 1
end
exit 0
