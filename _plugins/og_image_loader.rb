begin
  require 'jekyll_og_image'
rescue LoadError
end

Jekyll::Hooks.register :posts, :pre_render do |post|
  next if post.data['image']

  generated_path = File.join(post.site.source, 'assets', 'images', 'og', 'posts', "#{post.data['slug']}.png")
  next unless File.exist?(generated_path)

  post.data['image'] = {
    'path' => "/assets/images/og/posts/#{post.data['slug']}.png",
    'alt' => post.data['title']
  }
end
