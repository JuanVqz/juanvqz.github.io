---
layout: post
title: "Dockerizing Bridwgetownrb v1"
date: 2022-05-15 9:00:00 -0500
last_modified_at: 2022-05-15 09:00:00 -0500
categories: [development]
tags: [docker, bridgetownrb]
author: Juan Vásquez
---

I'm working in a new pc, as a result I wanted to dockerize my bridgetownrb blog
because not want to have my pc dirty XD

As usual I started searching how to dockerize [bridgetownrb](https://www.bridgetownrb.com/)
I found this easy to follow [post](https://blog.konnor.site/bridgetownrb/dockerizing-bridgetown/)
(Konnor thank you for that) but wait a minute it is not up to date, we are actually
in bridgetownrb version 1 (in a few days will be a beta release of Bridgwtown 1.1).

<blockquote class="twitter-tweet">
<p lang="en" dir="ltr">
Crossing our fingers we&#39;ll have a beta release of Bridgetown 1.1 ready to roll next week,
just in time for Bridgetown Bash during RailsConf! 🤞</p>&mdash; Bridgetown (@bridgetownrb)
<a href="https://twitter.com/bridgetownrb/status/1525126134626545664?ref_src=twsrc%5Etfw">May 13, 2022</a>
</blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

## Dockerizing it!

In root directory create the following files

> I'm only covering esbuild config since I'm using it

## Dockerfile

```docker
FROM ruby:3.0-alpine3.14 as builder

RUN apk add --no-cache --virtual nodejs-dev yarn build-base libnotify-dev

FROM builder as bridgetownrb

ARG USER_ID=${USER_ID:-1000}
ARG GROUP_ID=${GROUP_ID:-1000}
ARG DOCKER_USER=${DOCKER_USER:-user}
ARG APP_DIR=${APP_DIR:-/home/user/blog}

RUN addgroup -g $GROUP_ID -S $GROUP_ID
RUN adduser --disabled-password -G $GROUP_ID --uid $USER_ID -S $DOCKER_USER

RUN mkdir -p $APP_DIR
RUN chown -R $USER_ID:$GROUP_ID $APP_DIR

WORKDIR $APP_DIR

COPY --chown=$USER_ID:$GROUP_ID Gemfile* $APP_DIR/
RUN gem install bundler:"$(tail -n 1 Gemfile.lock)"
RUN bundle install

COPY --chown=$USER_ID:$GROUP_ID package.json $APP_DIR
COPY --chown=$USER_ID:$GROUP_ID yarn.lock $APP_DIR
RUN yarn install
```

## docker-compose.yml

```yaml
version: "3"
services:
  web:
    build:
      context: .
      args:
        USER_ID: ${USER_ID:-1000}
        GROUP_ID: ${GROUP_ID:-1000}
        DOCKER_USER: ${DOCKER_USER:-user}
        APP_DIR: ${APP_DIR:-/home/user/blog}
    command: sh -c "bundle exec bridgetown dev"
    ports:
      - 4000:4000
      - 4001:4001
      - 4002:4002
    volumes:
      - .:${APP_DIR:-/home/user/blog}
      - node_modules:${APP_DIR:-/home/user/blog}/node_modules
volumes:
  node_modules:
```

## .dockerignore

```dot
# Bridgetown
output
.bridgetown-cache
.bridgetown-metadata
.bridgetown-webpack
# Dependency folders
node_modules
bower_components
vendor
# Caches
.sass-cache
.npm
.node_repl_history
# Ignore bundler config.
/.bundle
# Ignore Byebug command history file.
.byebug_history
# dotenv environment variables file
.env
# Mac files
.DS_Store
# Yarn
yarn-error.log
yarn-debug.log*
.pnp/
.pnp.js
# Yarn Integrity file
.yarn-integrity
.git
```

then just run the following steps

```bash
docker-compose up -d
```

and visit [`http://localhost:4000`](http://localhost:4000)

## Extra

Under `bin` directory, create the following files
and add the `execution` permission.

```bash
touch bin/setup
touch bin/dev

chmod +x bin/setup
chmod +x bin/dev
```

## `bin/setup`

```ruby
#!/usr/bin/env ruby
require "pathname"
require "fileutils"
include FileUtils

# move to the root application.
APP_ROOT = Pathname.new File.expand_path("../../", __FILE__)

def system!(*args)
  system(*args) || abort("\n== Command #{args} failed ==")
end

chdir APP_ROOT do
  puts "== Build container =="
  system! "docker-compose build"

  puts "== Image created =="
  system! "docker images | grep juanvqz"
end
```

then run `./bin/setup` first time or when want to build the image (not used to often).

## `bin/dev`

```ruby
#!/usr/bin/env ruby
require "pathname"
require "fileutils"
include FileUtils

# move to the root application.
APP_ROOT = Pathname.new File.expand_path("../../", __FILE__)

def system!(*args)
  system(*args) || abort("\n== Command #{args} failed ==")
end

chdir APP_ROOT do
  puts "== Running container =="
  system! "docker-compose up -d"

  puts "== Visit at http://localhost:4000 =="
  system! "docker-compose logs -f web"
end
```

then run `./bin/dev` (this is used all the time).
