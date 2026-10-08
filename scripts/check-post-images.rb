#!/usr/bin/env ruby
# frozen_string_literal: true

# check-post-images.rb - fail when a post's body images live in the repo.
#
# Body images belong on Cloudinary; only social cards are committed. This fails
# on any file under assets/img/posts other than a custom card
# (assets/img/posts/<slug>/og.png), and on any post body that links an image
# under /assets/img/. Front matter is skipped (its image: is the social card),
# and so are fenced code blocks.
#
# Usage:
#   ruby scripts/check-post-images.rb

ROOT = File.expand_path("..", __dir__)
CARD = %r{\Aassets/img/posts/[^/]+/og\.png\z}
LOCAL_IMAGE = %r{/assets/img/\S+?\.(?:png|jpe?g|gif|webp|svg|avif)}i

problems = []

tracked = Dir.chdir(ROOT) { `git ls-files assets/img/posts`.split("\n") }
tracked.reject { |path| path.match?(CARD) }.each do |path|
  problems << "#{path}: image file committed"
end

Dir.glob(File.join(ROOT, "_posts", "*.md")).sort.each do |file|
  lines = File.readlines(file)
  in_front_matter = lines.first&.chomp == "---"
  in_fence = false

  lines.each_with_index do |line, index|
    if in_front_matter
      in_front_matter = false if index.positive? && line.chomp == "---"
      next
    end

    if line.lstrip.start_with?("```", "~~~")
      in_fence = !in_fence
      next
    end
    next if in_fence

    line.scan(LOCAL_IMAGE) do |match|
      problems << "#{file.delete_prefix("#{ROOT}/")}:#{index + 1}: links local image #{match}"
    end
  end
end

if problems.empty?
  puts "No post images in the repo."
  exit 0
end

puts problems
puts <<~MSG

  Post images go on Cloudinary, not in the repo. Upload them and rewrite the post:

    ruby notes/cloudinary_upload.rb _posts/<post>.md

  then git rm the local files.
MSG
exit 1
