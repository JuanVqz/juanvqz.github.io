#!/usr/bin/env ruby
#
# `devto_html` Liquid filter, used by assets/devto.xml.
#
# Rouge renders every fenced block as a table with a line-number gutter. dev.to
# turns the feed HTML into Markdown, so the gutter numbers end up inside the
# code. This rewrites each block back to a plain <pre><code> with the
# highlighting spans removed. The language is not kept: dev.to strips every
# class attribute before converting, so it would never arrive.
#
# It also makes root-relative src and href absolute, but only inside real tags.
# Code samples reach the HTML escaped (&lt;img src="/x"&gt;), so they are left
# exactly as written.

module DevtoFilter
  # Chirpy options such as {: .nolineno } or {: file="..." } add classes and
  # attributes to the wrapper, so match the class anywhere in the tag.
  ROUGE_BLOCK = %r{
    <div\b[^>]*\bclass="[^"]*\bhighlighter-rouge\b[^"]*"[^>]*>\s*
    <div\ class="highlight">\s*<pre\ class="highlight"><code>
    (?<body>.*?)
    </code></pre>\s*</div>\s*</div>
  }mx

  GUTTER = %r{<table class="rouge-table">.*?<td class="rouge-code"><pre>(?<code>.*?)</pre>}m

  TAG = /<[a-zA-Z][^>]*>/
  ROOT_RELATIVE = %r{\b(src|href)="/(?!/)}

  def devto_html(html, base_url)
    html.to_s
      .gsub(ROUGE_BLOCK) { plain_code(Regexp.last_match[:body]) }
      .gsub(TAG) { |tag| tag.gsub(ROOT_RELATIVE, %(\\1="#{base_url}/)) }
  end

  private

  def plain_code(body)
    body = Regexp.last_match[:code] if body =~ GUTTER

    "<pre><code>#{body.gsub(/<[^>]+>/, '')}</code></pre>"
  end
end

Liquid::Template.register_filter(DevtoFilter)
