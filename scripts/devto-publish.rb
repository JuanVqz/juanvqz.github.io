#!/usr/bin/env ruby
# frozen_string_literal: true

# Publishes the dev.to draft of every post that is live on the site.
#
#   DEVTO_API_KEY=... ruby scripts/devto-publish.rb            # dry run, prints the plan
#   DEVTO_API_KEY=... ruby scripts/devto-publish.rb --publish  # publishes
#   ruby scripts/devto-publish.rb --days 14                    # widen the window
#
# dev.to imports posts from /devto.xml as drafts. This finds the drafts whose
# title matches a post dated in the last DAYS days (7 by default) and not in
# the future, and publishes them. Older drafts are left alone on purpose:
# re-importing the archive would otherwise publish years of old posts at once.
#
# The imported body carries `published: false` in its own front matter, and
# dev.to lets that override the `published` field of the request, so the
# script flips it inside the body as well.
#
# The API key comes from https://dev.to/settings/extensions.

require "date"
require "json"
require "net/http"
require "optparse"
require "time"
require "yaml"

API = URI("https://dev.to/api/")
ROOT = File.expand_path("..", __dir__)

options = { days: 7, publish: false }
OptionParser.new do |o|
  o.on("--publish", "Publish the drafts (default: dry run)") { options[:publish] = true }
  o.on("--days N", Integer, "Only posts dated in the last N days") { |n| options[:days] = n }
end.parse!

api_key = ENV.fetch("DEVTO_API_KEY", "")
abort "DEVTO_API_KEY is not set." if api_key.empty?

def request(method, path, api_key, body = nil)
  uri = API + path
  req = Net::HTTP.const_get(method).new(uri)
  req["api-key"] = api_key
  req["Accept"] = "application/vnd.forem.api-v1+json"
  req["Content-Type"] = "application/json"
  req["User-Agent"] = "juanvasquez.dev devto-publish"
  req.body = JSON.generate(body) if body

  res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(req) }
  raise "#{method.upcase} #{uri.path} failed: #{res.code} #{res.body}" unless res.is_a?(Net::HTTPSuccess)

  JSON.parse(res.body)
end

def due_posts(days)
  now = Time.now
  Dir[File.join(ROOT, "_posts", "*.md")].filter_map do |path|
    data = YAML.safe_load(File.read(path)[/\A---\n(.*?)\n---/m, 1].to_s, permitted_classes: [Date, Time])
    date = data["date"].is_a?(Time) ? data["date"] : Time.parse(data["date"].to_s)
    next if date > now || date < now - (days * 86_400)

    { title: data["title"].to_s.strip, date: date, file: File.basename(path) }
  end
end

def drafts(api_key)
  (1..).each_with_object([]) do |page, all|
    batch = request("Get", "articles/me/unpublished?per_page=1000&page=#{page}", api_key)
    all.concat(batch)
    break all if batch.size < 1000
  end
end

def published_body(markdown)
  # Only inside the front matter: up to the first closing ---, so a
  # "published: false" line in the post body is left alone.
  markdown.sub(/\A---\r?\n.*?^---[ \t]*\r?$/m) do |front_matter|
    front_matter.sub(/^published:[ \t]*false[ \t]*(?=\r?$)/, "published: true")
  end
end

posts = due_posts(options[:days])
puts "Posts live in the last #{options[:days]} days: #{posts.size}"
exit if posts.empty?

by_title = drafts(api_key).to_h { |d| [d["title"].to_s.strip, d] }
puts "Drafts on dev.to: #{by_title.size}"
failures = []
published = {}

posts.each do |post|
  draft = by_title[post[:title]]
  unless draft
    puts "  skip    #{post[:file]}: no dev.to draft titled #{post[:title].inspect}"
    near = by_title.keys.find { |t| t.downcase.include?(post[:title].downcase[0, 20]) }
    puts "          closest draft title: #{near.inspect}" if near
    next
  end

  unless options[:publish]
    puts "  would publish #{post[:file]} -> dev.to draft #{draft['id']}"
    next
  end

  # One rejected post must not stop the rest, or every retry would stop at it.
  begin
    article = { published: true, body_markdown: published_body(draft["body_markdown"].to_s) }
    result = request("Put", "articles/#{draft['id']}", api_key, { article: article })
    published[draft["id"]] = post[:file]
    puts "  sent    #{post[:file]} -> #{result['url']}"
  rescue StandardError => e
    failures << post[:file]
    warn "  FAILED  #{post[:file]}: #{e.message}"
  end
end

# The PUT response does not say whether the article is published, so ask
# dev.to again: anything still in the drafts list did not go out.
unless published.empty?
  still_drafts = drafts(api_key).map { |d| d["id"] } & published.keys
  still_drafts.each { |id| failures << published[id] }
  warn "  STILL A DRAFT: #{still_drafts.map { |id| published[id] }.join(", ")}" if still_drafts.any?
end

abort "#{failures.size} post(s) failed to publish: #{failures.join(", ")}" if failures.any?
