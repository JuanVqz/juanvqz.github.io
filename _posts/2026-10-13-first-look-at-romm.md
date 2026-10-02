---
layout: post
title: "First Look at RomM: An App Store for Games I Already Own"
date: 2026-10-13 06:00:00 -0600
last_modified_at: 2026-10-13 06:00:00 -0600
categories: [personal]
tags: [romm, grout, muos, onionos, handheld, anbernic, miyoo, docker, self-hosted,
  retro-gaming, emulation, retroachievements, screenscraper, homelab]
---

I have two handhelds and a folder of games on my laptop. Getting a game from the
laptop to a handheld meant shutting the console down, taking the SD card out, putting
it in a reader, copying files, ejecting, putting it back. Every single time.

Then I found [RomM](https://romm.app), and it turns that folder into something my
consoles can browse over Wi-Fi.

This post is the first look. I installed RomM on my laptop to try the interface and
see whether it earned a permanent place at home. The real installation, on a small PC
server on my network, gets its own post.

## Two halves

RomM is a self-hosted server, open source under the AGPL. You point it at your games,
it scrapes cover art and metadata, and it gives you a web library to browse. It runs
in Docker.

[Grout](https://grout.romm.app) is the other half: a small app that runs *on the
handheld*. It connects to your RomM server, lists what is available, and downloads
games straight to the console over Wi-Fi. It supports muOS and OnionOS, which happen
to be exactly what my two devices run.

The effect is an app store stocked entirely with games I already own.

## A narrow trial on purpose

I did not try to replace the SD card on day one. The trial covered one console, my
Anbernic RG40XX V, and two jobs: metadata and box art.

Saves and big transfers stayed on the card reader. Everything Grout does crosses the
console's Wi-Fi, and that link drops on long transfers. A card reader moves 1.3 GB in
under a minute. A trial that depends on the weakest link tells you about the link, not
about RomM.

## The compose file

RomM needs a database, so the setup is two containers: RomM and MariaDB. This is my
`docker-compose.yml`, trimmed to the parts that matter. Secrets come from a `.env`
file that stays out of git.

```yaml
services:
  romm:
    image: rommapp/romm:latest
    restart: unless-stopped
    environment:
      - DB_HOST=romm-db
      - DB_NAME=romm
      - DB_USER=romm-user
      - DB_PASSWD=${DB_PASSWD:?set DB_PASSWD in .env}
      - ROMM_AUTH_SECRET_KEY=${ROMM_AUTH_SECRET_KEY:?generate with openssl rand -hex 32}
      - HASHEOUS_API_ENABLED=true
      - SCREENSCRAPER_USER=${SCREENSCRAPER_USER:-}
      - SCREENSCRAPER_PASSWORD=${SCREENSCRAPER_PASSWORD:-}
    volumes:
      - romm_resources:/romm/resources
      - romm_redis_data:/redis-data
      - ../romm-library/roms:/romm/library/roms:ro
      - ../bios:/romm/library/bios:ro
      - ./assets:/romm/assets
      - ./config:/romm/config
    ports:
      - "8080:8080"
    depends_on:
      romm-db:
        condition: service_healthy

  romm-db:
    image: mariadb:latest
    restart: unless-stopped
    environment:
      - MARIADB_ROOT_PASSWORD=${DB_ROOT_PASSWD:?set DB_ROOT_PASSWD in .env}
      - MARIADB_DATABASE=romm
      - MARIADB_USER=romm-user
      - MARIADB_PASSWORD=${DB_PASSWD:?set DB_PASSWD in .env}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  romm_resources:
  romm_redis_data:
  mysql_data:
```

The `:?` in `${DB_PASSWD:?...}` makes Compose refuse to start when the variable is
missing, instead of starting a database with an empty password.

For metadata, Hasheous needs no account and is enough to start. ScreenScraper needs a
free account, and it has the better coverage for Sega, where my Mega Drive art had
gaps.

Then `docker compose up -d`, open `http://localhost:8080`, create the admin account,
scan.

Three lines in that file were decisions, not defaults.

**The games are mounted read-only.** That is the `:ro` on the library line. My two
consoles share filenames on purpose: box art is matched to a game by filename and
nothing else, so a game called the same thing on both devices means one image works
on either. A scraper that decides to tidy your filenames would quietly undo that, and
you would only notice when the art went blank. Read-only means RomM can look and never
touch.

**The library is a curated folder, not the whole archive.** My first scan found 15,654
games and started downloading cover art for all of them. I have about 300 on the
consoles. That is hours of API calls for art nobody will ever see.

So `../romm-library/roms` is a second folder holding only the games that are on a
device, built with hardlinks, which means it takes no extra disk. Same files, second
set of names. RomM sees 313 games across nine systems instead of 15,654, and the scan
finishes in minutes.

**RomM's own data lives in named volumes.** The database, the scraped art and the
cache are Docker volumes, not folders I manage. That comes back when the laptop stops
being the host.

## The folder name problem

My library names its system folders with short codes: `FC` for Famicom, `SFC` for
Super Famicom, `PCE` for PC Engine. Those come from OnionOS, which requires exactly
those names on the Miyoo. muOS has no fixed folder names, you pick one and assign a
core to it, so I used the same codes on the Anbernic and both consoles share one
layout.

RomM has never heard of those codes. On the first scan it saw folders it could not
identify and scraped nothing for them.

`config/config.yml` fixes that by mapping each folder to a RomM platform:

```yaml
system:
  platforms:
    # console folder -> RomM platform
    FC: nes
    GB: gb
    GBC: gbc
    GBA: gba
    SFC: snes
    MD: genesis-slash-megadrive
    PCE: turbografx-16-slash-pc-engine

exclude:
  platforms:
    - ARCADE
    - Ports

filesystem:
  skip_hash_calculation: false
```

My real file maps twenty systems. The exclusions matter too. Arcade sets depend on the
exact romset version and would mostly fail to match, and ports are programs built for
one device, not games in RomM's sense.

I left hashing on. RetroAchievements matches a ROM to its achievement set by hash, and
I play with achievements on. The cost is a slower first scan. Later scans only hash
what changed.

If your folders already use RomM's own names, like `nes` and `snes`, none of this
comes up. Mine follow what OnionOS wanted.

## The mistake: `down -v`

Midway through setup, the stack got torn down to rescan from scratch, with
`docker compose down -v`. The `-v` deletes the named volumes, and the admin account
lives in the database, which lives in a volume. The account I had created was
gone.

```sh
docker compose stop     # keeps the database, scraped art and cache
docker compose start
docker compose down -v  # deletes them: the admin account and the scan go too
```

To pause RomM, use `stop`. `down -v` is for when you mean it.

## Connecting the console

Grout installs the same way other muOS apps do: drop a file in a folder on the SD card
and install it from the Archive Manager.

Connecting is a pairing code rather than a login. You generate a client token in RomM,
Grout shows a code, you type it into the web UI, and they are linked. The server
address is your computer's address on the network, not `localhost`, which is obvious
once you say it out loud, and worth saying out loud.

Then Grout showed me my Game Boy library, and reported that it was empty.

## The bit that confused me

The error said none of my mapped platforms had games, and to check my directory
mapping. RomM had 35 Game Boy games indexed. The console could see the platform.

Grout has to know where each RomM platform lives *on the handheld*, which is a second
mapping, separate from the one on the server. Opening Directory Mappings showed Game
Boy with three choices: skip it, use `/GB`, or pick a custom folder. `/GB` is where my
Game Boy games live. One selection and all 35 appeared.

Obvious afterwards. Not obvious while reading an error about mappings I thought I had
already configured.

## What it is not

Grout is not an emulator and not a launcher. It downloads games and syncs saves. You
still play them through your handheld's normal menu.

I worked this out by clicking a game and being offered "redownload", because every
game I was looking at was already on the card. The download half of this only has
something to do when the server has a game the console lacks.

RomM itself does play games, in the browser, through an emulator built into the web
UI. I did not expect that, and it is useful: I can check that a ROM works before
sending it to a console. I tried Pokémon Blue that way, and the save
landed on the laptop, under `assets/users/.../saves/GB/`, not on any console. Saves
made in the browser live on the server, separate from the saves on your devices,
unless sync is set up.

## Art going the other way

A surprise use: RomM is a good scraper for the consoles, not only for itself.

It files art by database id, under `resources/roms/<platform>/<rom>/`. The consoles
match art by ROM filename. So a small Ruby script reads RomM's art and
copies each cover into my library under the game's filename, filling gaps only. Art
that already came off the cards is known to display correctly, so it wins.

The first run found three Game Boy covers RomM had and my library did not. Small, but
those were three blank tiles on the console that are not blank anymore.

## What I want most

Downloads are convenient. The feature I care about is save sync.

I have the same Pokémon game on both handhelds. I play one, then pick up the other,
and they know nothing about each other. I tried solving that once before with a file
sync tool and gave up on it. RomM has a save sync engine with conflict resolution,
which is the hard part of the problem and the reason my last attempt failed.

I have not tested it yet. When I do it will be with a game I do not care about, not
the playthrough I am eighty hours into.

## What the laptop taught me

RomM earned its place. It also showed me why a laptop is the wrong home for it: RomM
only helps while it is running and on the same network, and a laptop that sleeps is
not a server.

Moving it should be small, because of how the compose file is laid out. The whole
configuration is three files: `docker-compose.yml`, `config/config.yml` and `.env`.
The `.env` stays out of git, so it gets copied by hand. The database, scraped art and
cache stay behind in their volumes, and rebuilding them is one rescan, minutes for 313
games, cheaper than migrating them. The `assets` folder is the exception: it is a
plain folder next to the compose file, and it holds the saves made in the browser, so
it moves with the configuration.

Two things change on a real server:

- **An address that does not move.** Grout remembers the server address, and a DHCP
  lease will move eventually. When it stops connecting for no apparent reason, that is
  the first thing to check. A `.local` hostname may be the cleaner fix: it follows the
  machine instead of the lease, as long as the console can resolve it. Testing that is
  part of the next post.
- **Port 8080 is open to the whole network.** Fine on a home LAN. If it ever needs to
  be reachable from outside, it goes behind a reverse proxy with TLS first.

That move is the next post: RomM on a real local server, running all the time.

For now, on a laptop, it does one job well, which is more than the SD card shuffle
managed.
