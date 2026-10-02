# frozen_string_literal: true

# Fails the build when a dev.to series in _config.yml names a post that does
# not exist, or when its glob catches a post it does not name. The series are
# `defaults` scopes whose path is a glob listing post slugs
# ("_posts/*-{slug-a,slug-b}.md"); a slug with a typo matches nothing and the
# post would silently drop out of its series, and because the leading * matches
# any prefix, "*-guacamelee.md" would also pull in "2026-12-01-revisiting-guacamelee.md".

Jekyll::Hooks.register :site, :post_read do |site|
  slug_of = ->(path) { File.basename(path, '.md').sub(/\A\d{4}-\d{2}-\d{2}-/, '') }
  # Jekyll skips future posts unless --future, so check against the files.
  slugs = Dir[File.join(site.source, '_posts', '*.md')].map(&slug_of)

  problems = site.config.fetch('defaults', []).flat_map do |entry|
    series = entry.dig('values', 'devto_series') or next []
    path = entry.dig('scope', 'path').to_s
    listed = path[/\{([^}]*)\}/, 1].to_s.split(',')
    caught = Dir.glob(File.join(site.source, path)).map(&slug_of)

    (listed - slugs).map { |slug| "#{slug} (#{series}) matches no post" } +
      (caught - listed).map { |slug| "#{slug} (#{series}) is caught by the glob but not listed" }
  end

  next if problems.empty?

  raise Jekyll::Errors::FatalException, "dev.to series in _config.yml: #{problems.join(', ')}"
end
