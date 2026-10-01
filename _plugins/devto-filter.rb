#!/usr/bin/env ruby
#
# `devto_code` Liquid filter, used by assets/devto.xml.
#
# Rouge renders every fenced block as a table with a line-number gutter. dev.to
# turns the feed HTML into Markdown, so the gutter numbers end up inside the
# code. This rewrites each block back to a plain <pre><code> with the
# highlighting spans removed. The language is not kept: dev.to strips every
# class attribute before converting, so it would never arrive.

module DevtoFilter
  ROUGE_BLOCK = %r{
    <div\ class="language-[\w+-]+\ highlighter-rouge">
    <div\ class="highlight"><pre\ class="highlight"><code>
    (?<body>.*?)
    </code></pre></div>\s*</div>
  }mx

  GUTTER = %r{<table class="rouge-table">.*?<td class="rouge-code"><pre>(?<code>.*?)</pre>}m

  def devto_code(html)
    html.to_s.gsub(ROUGE_BLOCK) do
      body = Regexp.last_match[:body]
      body = Regexp.last_match[:code] if body =~ GUTTER

      "<pre><code>#{body.gsub(/<[^>]+>/, '')}</code></pre>"
    end
  end
end

Liquid::Template.register_filter(DevtoFilter)
