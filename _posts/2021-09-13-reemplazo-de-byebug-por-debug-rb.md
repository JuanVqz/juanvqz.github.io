---
layout: post
title: "Replacing Byebug with Debug 🔥🐛"
date: 2021-09-13 07:30:00 -0500
last_modified_at: 2026-03-26 09:00:00 -0500
categories: [development]
tags: [ruby, thisweekinrails]
---

## The Change

Since I've known Ruby on Rails, it has included the Byebug gem 😥. It was introduced in the Gemfile over 7 years ago.

But things are changing. The Pull Request [Depend on ruby/debug, replacing Byebug](https://github.com/rails/rails/pull/43187) announced that Rails is switching to `debug.rb`.

---

## Why the Change?

The obligatory question is: Why is the Byebug gem being removed?

### 1. Zeitwerk Compatibility

Byebug and Zeitwerk are not [fully compatible](https://github.com/deivid-rodriguez/byebug/issues/564). This isn't a bug in either gem — it's a technical limitation that Rails needed to address.

### 2. Ruby 3.1 Alignment

In Ruby 3.1, debugging will be included with **debug.rb** as part of the standard library. This change aligns Rails with Ruby's direction and reduces dependencies.

---

## Historical Context

On April 8, 2014, the [Pull Request](https://github.com/rails/rails/pull/14646) was created to introduce Byebug in Ruby on Rails. It was merged on April 11, 2014.

Over 7 years, Byebug served the Ruby community well. But as Ruby and Rails evolved, the need for a native Ruby debugger became clear.

---

## Goodbye Byebug

What is Byebug? In the gem's own words:

> Byebug is a feature-rich and easy-to-use debugger for Ruby. It uses the TracePoint API for execution control and the Debug Inspector API for call stack navigation. It doesn't depend on internal core sources. It's fast because it's developed as a C extension and reliable because it's compatible with a comprehensive test suite.

[Learn more about Byebug](https://github.com/deivid-rodriguez/byebug)

Byebug served us well, but it had limitations:
- C extension dependency
- Compatibility issues with Zeitwerk
- Not part of Ruby's standard library

---

## Hello Debug

`debug.rb` provides debugging functionality to Ruby and will be included in Ruby 3.1+.

### Advantages of debug.rb

#### 1. Performance

**Fast:** No performance penalty in step-less and breakpoint-free mode. You can leave the debugger in your code without worrying about slowing down production.

#### 2. Remote Debugging

Supports remote debugging natively through multiple protocols:
- UNIX domain socket
- TCP/IP
- VSCode/DAP integration (VSCode rdbg Ruby Debugger)

This is a game-changer for debugging production issues or remote containers.

#### 3. Extensibility

The application can introduce debugging support in several ways:
- By `rdbg` command
- When loading libraries with the `-r` option
- By calling the Ruby method explicitly

### Additional Features

- Support for threads (almost done) and ractors (TODO)
- Supports suspending and entering debug console with Ctrl-C
- Shows parameters in backtrace command
- Supports recording and replay debugging — useful for reproducing intermittent bugs

---

## Migration

The migration from Byebug to `debug.rb` is straightforward:

**Before (Byebug):**
```ruby
gem 'byebug'
```

**After (debug.rb in Ruby 3.1+):**
```ruby
# No gem needed! It's built into Ruby 3.1+
```

For Ruby 3.0 and earlier:
```ruby
gem 'debug', '>= 1.0.0'
```

The debugging commands remain similar, so the learning curve is minimal.

---

## What I Learned

1. **Ruby is maturing** — The inclusion of `debug.rb` in Ruby 3.1 shows the language's commitment to providing a comprehensive standard library

2. **Rails follows Ruby** — When Ruby adds new features or improves existing ones, Rails is quick to adopt them. This alignment keeps the ecosystem cohesive

3. **Remote debugging matters** — The native support for remote debugging in `debug.rb` reflects the reality of modern development: containers, cloud environments, and production debugging

4. **Dependencies are liabilities** — Moving debugging into the standard library reduces the dependency surface area and simplifies maintenance

5. **The community moves forward** — While Byebug served us well, embracing `debug.rb` means we get features and improvements that come with being part of Ruby core

---

[Learn more about Debug](https://github.com/ruby/debug)
