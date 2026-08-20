# frozen_string_literal: true

source 'https://rubygems.org'

gem 'jekyll-theme-chirpy', '~> 7.2', '>= 7.2.4'

# Generates Open Graph images during the build. Needs libvips at runtime
# (macOS: brew install vips), so it is NOT in :development: the Pages deploy
# builds the images itself and there is nothing to commit.
gem 'jekyll-og-image', '~> 2.1'

gem 'html-proofer', '~> 5.0', group: :test

platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem 'tzinfo', '>= 1', '< 3'
  gem 'tzinfo-data'
end

gem 'wdm', '~> 0.2.0', platforms: %i[mingw x64_mingw mswin]
