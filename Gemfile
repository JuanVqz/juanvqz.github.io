source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

# Hello! This is where you manage which Bridgetown version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Bridgetown with `bundle exec`, like so:
#
#   bundle exec bridgetown serve
#
# This will help ensure the proper Bridgetown version is running.
#
# To install a plugin, simply run bundle add and specify the group
# "bridgetown_plugins". For example:
#
#   bundle add some-new-plugin -g bridgetown_plugins
#
# Happy Bridgetowning!

gem "bridgetown", "1.0.0.alpha1"

group :bridgetown_plugins do
  gem "bridgetown-cloudinary", "1.2.0"
  gem "bridgetown-feed", git: "https://github.com/bridgetownrb/bridgetown-feed.git", ref: "ccbd0f598d61c7f157dcdce656742ea10f6d3732"
  gem "bridgetown-seo-tag", "5.0.0"
  gem "bridgetown-sitemap", "1.1.1"
  gem "bridgetown-svg-inliner", "1.0.2"
end
