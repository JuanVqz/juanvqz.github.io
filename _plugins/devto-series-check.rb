# frozen_string_literal: true

# Fails the build when a dev.to series in _config.yml names a post that does
# not exist. The series are `defaults` scopes whose path is a glob listing post
# slugs ("_posts/*-{slug-a,slug-b}.md"); a slug with a typo matches nothing
# and the post would silently drop out of its series.

Jekyll::Hooks.register :site, :post_read do |site|
  slugs = site.posts.docs.map { |post| File.basename(post.path, '.md').sub(/\A\d{4}-\d{2}-\d{2}-/, '') }
  # Jekyll skips future posts unless --future, so check against the files.
  slugs |= Dir[File.join(site.source, '_posts', '*.md')].map { |f| File.basename(f, '.md').sub(/\A\d{4}-\d{2}-\d{2}-/, '') }

  missing = site.config.fetch('defaults', []).flat_map do |entry|
    series = entry.dig('values', 'devto_series') or next []
    listed = entry.dig('scope', 'path').to_s[/\{([^}]*)\}/, 1].to_s.split(',')
    (listed - slugs).map { |slug| "#{slug} (#{series})" }
  end

  next if missing.empty?

  raise Jekyll::Errors::FatalException, "dev.to series in _config.yml name posts that do not exist: #{missing.join(', ')}"
end
