---
layout: post
title: "Replacing Byebug with Debug 🔥🐛"
date: 2021-09-13 07:30:00 -0500
last_modified_at: 2026-02-20 09:00:00 -0500
categories: [development]
tags: [ruby, thisweekinrails]
---

Since I've known Ruby on Rails, it includes the Byebug gem 😥. It was introduced in the Gemfile over 7 years ago.

The Pull Request [Depend on ruby/debug, replacing Byebug](https://github.com/rails/rails/pull/43187) gave us the information.

The obligatory question is: Why is the Byebug gem being removed?

- Byebug and Zeitwerk are not [fully compatible](https://github.com/deivid-rodriguez/byebug/issues/564). This is not a bug in either gem, it's a technical limitation.

- In Ruby 3.1, debugging will be included with **debug.rb**, and this change aligns Rails with Ruby.

#### Historical note

On April 8, 2014, the [Pull Request](https://github.com/rails/rails/pull/14646) was created to introduce Byebug in Ruby on Rails, but it was merged until April 11, 2014.

#### Goodbye Byebug

What is Byebug? In the gem's own words:

Byebug is a feature-rich and easy-to-use debugger for Ruby. It uses the TracePoint API for execution control and the Debug Inspector API for call stack navigation. It doesn't depend on internal core sources. It's fast because it's developed as a C extension and reliable because it's compatible with a comprehensive test suite.

[Learn more about Byebug](https://github.com/deivid-rodriguez/byebug)

#### Hello Debug

debug.rb provides debugging functionality to Ruby.

Advantages:

0. **Fast:** No performance penalty in step-less and breakpoint-free mode
1. **Remote debugging:** Supports remote debugging natively
   - UNIX domain socket
   - TCP/IP
   - VSCode/DAP integration (VSCode rdbg Ruby Debugger)
2. **Extensible:** The application can introduce debugging support in several ways
   - By rdbg command
   - When loading libraries with the -r option
   - By calling the Ruby method explicitly

Among other things:

0. Support for threads (almost done) and ractors (TODO)
1. Supports suspending and entering debug console with Ctrl-C
2. Shows parameters in backtrace command
3. Supports recording and replay debugging

[Learn more about Debug](https://github.com/ruby/debug)
