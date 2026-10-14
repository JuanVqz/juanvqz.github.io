---
layout: post
title: "RomM on a Home Server: the Whole Library, Our Own Box Art, and a 16-Hour Scan"
date: 2027-02-16 09:00:00 -0600
last_modified_at: 2027-02-16 09:00:00 -0600
categories: [personal]
tags: [romm, grout, homelab, docker, self-hosting, retro-gaming, emulation, handheld,
  screenscraper, retroachievements, launchbox, es-de]
---

My [first look at RomM](/blog/first-look-at-romm/) was an experiment from the start:
RomM on a laptop, against a curated folder of 313 games, to see whether it was worth
running on the home server. It was.

So RomM moved to the server. On the way, the plan changed. I stopped wanting the
consoles to hold everything. The idea now is to empty the handhelds, keep only what I
am playing, and pull a new game from RomM when I want to try one. If I do not like it,
I delete it. That only works if RomM has the whole library, not 313 games.

---

## TL;DR

- One folder for everything handheld on the server: ROMs, box art, BIOS, and RomM's own
  data next to them.
- RomM 5.3.1, not the 5.4.0 released that same day: Grout supports only the RomM
  version that matches its own.
- Name your system folders the ES-DE way (`megadrive`, `pcengine`) and RomM's scan maps
  them itself. Old mappings are worse than none: a mapping wins over RomM's built-in
  table. Grout is the exception: it wants a binding for the folders whose name differs
  from RomM's slug.
- An ES-DE `gamelist.xml` lets RomM use box art you already have instead of
  downloading it again.
- Copy art with readable permissions (`rsync --chmod=D755,F644`), or RomM serves 403
  for the large covers.
- Turn off manuals: they were half the disk RomM used.
- The first full scan of 15,655 games takes about 16 hours, and ScreenScraper's daily
  quota runs out partway through.

---

## One folder, the library first

Everything handheld lives under one folder on the server's data disk:

```text
/mnt/data/handhelds/
  roms/    44 GB, one folder per system
  art/     box art, named after each ROM
  bios/    firmware for the systems that need it
  romm/    RomM's database, scraped covers and saves
```

This is the rule for the whole data disk: one folder per group of related services,
named for what they share, not for one app. The ROMs and the art are the library, and RomM is one app that
reads it, so its data sits inside the library folder as `romm/`. If I ever replace
RomM, `romm/` goes and the library stays where it is.

## Folder names RomM already knows

In the first post my system folders used OnionOS codes: `FC`, `SFC`, `MD`, `PCE`. RomM
did not know them, so `config.yml` mapped each one to a RomM platform.

Before the move I renamed the library folders to the names the ES-DE frontend uses:
`nes`, `snes`, `megadrive`, `pcengine`. RomM ships its own table that turns those into
its platforms, so most of the mapping became unnecessary. The cards kept their codes,
and a small `systems.yml` in my repo maps one to the other for the scripts that copy
games to them.

![RomM setup wizard listing gameandwatch, megadrive and pcengine as Unidentified](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791825411/blog/romm-on-a-home-server/images/setup-wizard-unidentified-platforms.png)

Then the setup wizard listed seven folders as unidentified, Mega Drive and PC Engine
among them. The screenshot above is from a smaller test run with fewer systems, where
three showed up the same way. Two separate things were going on.

First, a real bug, and it was mine. I had carried the mappings over from the laptop
test, and three of them used slugs RomM 5.3.1 does not have: `genesis-slash-megadrive`
is now `genesis`, `turbografx-16-slash-pc-engine` is now `tg16`, and `ps` is now `psx`. A mapping in
`config.yml` wins over RomM's built-in table, so those folders would have been scanned
as unknown platforms. I checked by asking RomM itself, inside the container, which
platform each folder resolves to.

Second, the wizard. It compares the folder name with the platform slug and skips the
alias table, so `gameandwatch` looks unidentified there with or without a mapping. The
scan uses the table. The wizard locks detected folders in anyway, so there is nothing
to click; the scan said
`Folder g-and-w[gameandwatch] identified as Game & Watch`.

So I deleted the mappings. With no `system.platforms` block at all, I asked again
inside the container, and every folder resolved to the same platform. For the scan,
following the convention means there is nothing to map.

Grout, the RomM app on the handhelds, brought the block back two days later. RomM
sends it to its clients as the platform binding, and Grout keys its own tables by RomM
slugs (`genesis`, `sms`, `tg16`). Without a binding, Grout missed the folders whose
name differs from the slug: no folder suggestion and no save folder for them. So
there are seven bindings again, and each one names the
platform the scan already picks, which leaves the scan as it was:

```yaml
system:
  platforms:
    gameandwatch: g-and-w
    mastersystem: sms
    megadrive: genesis
    neogeo: neogeoaes
    ngp: neo-geo-pocket
    pcengine: tg16
    sega32x: sega32
```

These are RomM 5.3.1 slugs, so they are the first thing to check when I upgrade RomM.
Grout's box art for muOS does not use the binding yet, so covers for those systems land
in a folder muOS never reads. I opened
[a pull request for that](https://github.com/rommapp/grout/pull/300); until then I copy
that art by hand.

## The version that matches Grout

RomM 5.4.0 came out as stable the day I set this up. I installed 5.3.1.

Grout's README says that the RomM version it needs is the first three numbers of
its own version. The newest Grout was v5.3.1.3, so RomM
5.3.1 it is. Both get upgraded together, once a 5.4 Grout exists. RomM itself keeps
suggesting the upgrade.

![RomM scan page with a New version available 5.4.0 notice](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791825413/blog/romm-on-a-home-server/images/new-version-available-toast.png)

MariaDB is pinned too, to 11.8, a long-term support release, instead of `latest`.

## Only reachable where it needs to be

Docker publishes ports by writing its own firewall rules, ahead of `ufw`, so a plain
`8080:8080` is open to the whole network whatever the firewall says. RomM is bound to
two addresses instead: the server's own loopback, which Tailscale serves when I am away
from home, and its LAN address for the handhelds.

```yaml
services:
  romm:
    image: rommapp/romm:5.3.1
    ports:
      - 127.0.0.1:8080:8080
      - <server-ip>:8080:8080
    volumes:
      - /mnt/data/handhelds/roms:/romm/library/roms:ro
      - /mnt/data/handhelds/romm/resources:/romm/resources
      - /mnt/data/handhelds/romm/assets:/romm/assets
      - /mnt/data/handhelds/romm/redis:/redis-data
      - ./config:/romm/config
```

The ROMs are still read-only, for the same reason as before: art is matched by
filename, and RomM must never tidy a filename.

The LAN binding has a catch: if the server's address changes, the container will not
start. So the server needs a DHCP reservation in the router. Grout cares too: it has
no setting to change the server it is paired with. Even reinstalling keeps the old
pairing; I had to delete Grout's folder on the card and pair again.

## Our art first

The first post ended with a script that copies RomM's covers *into* my library. With
the whole library on the server, the other direction matters more. I already have
art for 2,474 of those games, pulled from the cards over the years, and it is known to
display on the consoles. RomM would download a cover for every one of them anyway.

RomM reads an ES-DE `gamelist.xml` in each system folder. A small Ruby script on the
laptop writes one per system, with an entry for every ROM that has a cover:

```xml
<gameList>
  <game>
    <path>./Ace Combat Advance (USA, Europe).gba</path>
    <thumbnail>./covers/Ace Combat Advance (USA, Europe).png</thumbnail>
  </game>
</gameList>
```

The `covers/` folder is made of hardlinks to the art folder, so it takes no extra disk,
and RomM skips both `gamelist.xml` and `covers/` when it looks for games. Then
`config.yml` puts the gamelist first for covers:

```yaml
scan:
  priority:
    cover: [gamelist, ss, libretro, launchbox, sgdb, ra, hasheous]
```

ScreenScraper and libretro come next because they have real box art. SteamGridDB comes
later because its covers are fan-made. The gamelist also has to be ticked as a source
when you start the scan, or RomM ignores the file. During the scan, games matched from
it get an ES badge next to the other sources.

RomM's automatic scans never tick it. The nightly rescan and the rescans on file
changes leave the gamelist out, so a ROM added later gets a scraper's cover. After
adding games that have art, I run the script again and start a scan by hand with the
gamelist ticked.

![RomM live scan progress with an ES badge on games matched from gamelist.xml](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791825415/blog/romm-on-a-home-server/images/scan-live-progress-gamelist-badge.png)

One side effect: linking 2,474 files at once crashed RomM's folder watcher with
`OSError: [Errno 7] Argument list too long`. RomM restarted it within seconds, but a
batch that big may not trigger a rescan, so after a large copy I start a scan by hand.

The last surprise was a 403. My art came off exFAT SD cards, where every file reads as
mode 700, and `rsync -a` kept that mode on the server. RomM copies each cover into its
own folder with the same mode, and the web server inside the container runs as the
`romm` user, which could not read them. The large covers answered 403, and Grout could
not download art. The fix is to set the mode while copying:

```sh
rsync -a --chmod=D755,F644 library-art/ server:/mnt/data/handhelds/art/
```

For files already on the server, a `chmod 644` on the files and `755` on the folders,
in both the art folder and RomM's `resources/`, fixed the covers RomM had copied.

## Manuals were half the disk

After the first 123 games, RomM's media folder held 221 MB. Manuals, as PDFs, were
113 MB of it. Covers were 50 MB, and a second copy of each cover from ScreenScraper
another 46 MB.

I looked at converting the images to WebP first, since RomM has a task for it. It does
not save disk: it writes a `.webp` next to each cover and keeps the PNG. And the
consoles need PNG anyway.

Manuals only show in the web interface, so they went:

```yaml
scan:
  media:
    - box2d
    - screenshot
```

At 221 MB for 123 games, the whole library would take about 28 GB of media, and
dropping manuals saves about half of it. The manuals already downloaded
were deleted, and their entries cleared in the database so the web interface shows no
broken links.

## The 16-hour scan

The full scan covers 15,655 games across 20 systems, with hashing on so
RetroAchievements can match each ROM. It ran at about 16 games a minute, which put it at
roughly 16 hours.

The limit is ScreenScraper. A free account allows one request at a time, so four scan
workers wait for each other, and 20,000 requests a day. RomM logs the quota as it goes:

```text
ScreenScraper: SCAN_WORKERS is 4 but this account allows 1 simultaneous requests, so the extra workers will queue
ScreenScraper quota: 2590/20000 daily requests used (17410 left), 0/2000 unrecognized-ROM requests used (2000 left)
```

That was about 3.7 requests per game, so the quota runs out somewhere past game 5,000.
After that, RomM stops calling ScreenScraper for the rest of the scan and carries on
with the other sources. Later automatic scans do not fill the gap: the nightly rescan
is a Quick scan, and a Quick scan only checks the files of games it already knows. The
fix is a scan by hand, "Unmatched games" with ScreenScraper ticked, a day at a time
until the quota stops running out.

Four hours in, at game 3,842, the scan stopped by itself:

```text
Scan 2c455200-5fb7-4abb-9136-4ee9f8b0b2a2 is over: it exceeded the 14400s SCAN_TIMEOUT
```

RomM gives a scan four hours by default. A library this size at ScreenScraper's pace
needs more, so `SCAN_TIMEOUT=86400` (a day) went into the compose file, and a Quick scan
picked up where the first one stopped.

LaunchBox helps here. Its game database is free, and RomM downloads a copy of it with a
task (Administration, then Tasks, then "Scheduled LaunchBox metadata update"). It took a minute, costs
no quota, and with `ENABLE_SCHEDULED_UPDATE_LAUNCHBOX_METADATA=true` RomM refreshes it
every night.

## The restart that cost me a wizard

During the first setup I restarted RomM twice, once to load the config without the
mappings and once for the manuals. The first restart caught me halfway through the setup wizard, and my
admin account was never saved. The second stopped both the scan and
the LaunchBox download in the middle.

RomM reads `config.yml` when it starts, so a config change means a restart. What I do
now: change the config before starting a long scan, or wait until it finishes. A Quick
scan afterwards skips every game already done, so a lost scan costs minutes, not hours.

## Where it stands

RomM runs on the server all the time, with every game, our own covers first and the
scrapers filling the rest. Grout is paired on the Anbernic and the Miyoo, and both see the whole library.
One setting to know: Download Art is off by default in Grout, so my first downloads
came without covers until I turned it on. Saves are not synced yet, and that part goes
slowly, because one of those saves is a 48-hour game of Pokémon.

*This is part of a series about retro handhelds; the rest are under the
[handheld tag](/tags/handheld/).*
