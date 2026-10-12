---
layout: post
title: "RomM on a Home Server: the Whole Library, Our Own Box Art, and a 15-Hour Scan"
date: 2027-02-16 09:00:00 -0600
last_modified_at: 2027-02-16 09:00:00 -0600
categories: [personal]
tags: [romm, grout, homelab, docker, self-hosted, retro-gaming, emulation, handheld,
  screenscraper, retroachievements, launchbox, es-de]
---

My [first look at RomM](/blog/first-look-at-romm/) ran on a laptop, against a curated
folder of 313 games. It earned a permanent place, and the laptop showed why it could
not be that place: a laptop sleeps, and RomM only helps while it is awake.

So RomM moved to the home server. On the way, the plan changed. I stopped wanting the
consoles to hold everything. The idea now is to empty the handhelds, keep only what I
am playing, and pull a new game from RomM when I want to try one. If I do not like it,
I delete it. That only works if RomM has the whole library, not 313 games.

---

## TL;DR

- One folder for everything handheld on the server: ROMs, box art, BIOS, and RomM's own
  data next to them.
- RomM 5.3.1, not the 5.4.0 released that same day: Grout supports only the RomM
  version that matches its own.
- Rename your system folders to ES-DE names (`megadrive`, `pcengine`) and RomM knows
  them. Then do not "help" it with old platform slugs: a binding wins over its built-in
  table.
- An ES-DE `gamelist.xml` lets RomM use box art you already have instead of
  downloading it again.
- Turn off manuals: they were half the disk RomM used.
- The first full scan of 15,655 games takes about 15 hours, and ScreenScraper's daily
  quota runs out partway through.

---

## One folder, the library first

Everything handheld lives under one folder on the server's data disk:

```
/mnt/data/handhelds/
  roms/    44 GB, one folder per system
  art/     box art, named after each ROM
  bios/    firmware for the systems that need it
  romm/    RomM's database, scraped covers and saves
```

The rest of the server keeps one folder per app (`/mnt/data/immich/`). This one breaks
the pattern on purpose. The ROMs and the art are the library, and RomM is one app that
reads it. If I ever replace RomM, `romm/` goes and the library stays where it is.

The copy from the laptop went with `rsync`, and I checked it with an md5 of every file
on both sides: 23,920 files, no differences. The laptop is still the master copy.

## Folder names RomM already knows

In the first post my system folders used OnionOS codes: `FC`, `SFC`, `MD`, `PCE`. RomM
did not know them, so `config.yml` mapped each one to a RomM platform.

Before the move I renamed the library folders to the names the ES-DE frontend uses:
`nes`, `snes`, `megadrive`, `pcengine`. RomM ships its own table that turns those into
its platforms, so most of the mapping became unnecessary. The consoles keep their codes;
a small `systems.yml` in my repo maps one to the other for the scripts that copy games
to the cards.

![RomM setup wizard listing gameandwatch, megadrive and pcengine as Unidentified](/assets/img/posts/romm-on-a-home-server/setup-wizard-unidentified-platforms.png)

Then the setup wizard listed seven folders as unidentified, Mega Drive and PC Engine
among them. Two separate things were going on.

First, a real bug, and it was mine. I had carried the mappings over from the laptop
test, and three of them used slugs RomM 5.3.1 no longer has: `genesis-slash-megadrive`
is now `genesis`, `turbografx-16-slash-pc-engine` is now `tg16`. A mapping in
`config.yml` wins over RomM's built-in table, so those folders would have been scanned
as unknown platforms. I checked by asking RomM itself, inside the container, which
platform each folder resolves to.

Second, the wizard. It compares the folder name with the platform slug and skips the
alias table, so `gameandwatch` looks unidentified there even with the mapping fixed. The
scan uses the table. The wizard locks detected folders in anyway, so there is nothing
to click; the scan said
`Folder g-and-w[gameandwatch] identified as Game & Watch`.

The fixed mappings, which only say what RomM would work out by itself:

```yaml
system:
  platforms:
    megadrive: genesis
    mastersystem: sms
    pcengine: tg16
    ngp: neo-geo-pocket
    neogeo: neogeoaes
    sega32x: sega32
    gameandwatch: g-and-w
```

## The version that matches Grout

RomM 5.4.0 came out as stable the day I set this up. I installed 5.3.1.

Grout, the app on the handhelds, says in its README that the RomM version it needs is
the first three numbers of its own version. The newest Grout was v5.3.1.3, so RomM
5.3.1 it is. Both get upgraded together, once a 5.4 Grout exists. RomM itself keeps suggesting
the upgrade.

![RomM scan page with a New version available 5.4.0 notice](/assets/img/posts/romm-on-a-home-server/new-version-available-toast.png)

MariaDB is pinned to
11.8, a long-term support release, instead of `latest`.

## Only reachable where it needs to be

Docker publishes ports by writing its own firewall rules, ahead of `ufw`, so a plain
`8080:8080` is open to the whole network whatever the firewall says. RomM is bound to
two addresses instead: the server's own loopback, and its LAN address for the handhelds.

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
start. So the router gets a reservation for the server before Grout is paired. Grout
has no way to change the server it is paired with, short of reinstalling it.

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

![RomM live scan progress with an ES badge on games matched from gamelist.xml](/assets/img/posts/romm-on-a-home-server/scan-live-progress-gamelist-badge.png)

One side effect: linking 2,474 files at once crashed RomM's folder watcher with
`OSError: [Errno 7] Argument list too long`. RomM restarted it within seconds, but a
batch that big may not trigger a rescan, so after a large copy I start a scan by hand.

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

That is half of an estimated 28 GB for the whole library. The manuals already downloaded
were deleted, and their entries cleared in the database so the web interface shows no
broken links.

## The 15-hour scan

The full scan covers 15,655 games across 20 systems, with hashing on so
RetroAchievements can match each ROM. It ran at about 16 games a minute, which put it at
roughly 15 hours.

The limit is ScreenScraper. A free account allows one request at a time, so four scan
workers wait for each other, and 20,000 requests a day. RomM logs the quota as it goes:

```
ScreenScraper: SCAN_WORKERS is 4 but this account allows 1 simultaneous requests, so the extra workers will queue
ScreenScraper quota: 2590/20000 daily requests used (17410 left), 0/2000 unrecognized-ROM requests used (2000 left)
```

That was about 3.7 requests per game, so the quota runs out somewhere past game 5,000.
After that, RomM stops calling ScreenScraper for the rest of the scan and carries on
with the other sources. The games that missed it get filled in by later scans, a few
thousand a day.

LaunchBox helps here. Its game database is free, and RomM downloads a copy of it with a
task (Administration, then Tasks, then "Scheduled LaunchBox metadata update"). It took a minute, costs
no quota, and with `ENABLE_SCHEDULED_UPDATE_LAUNCHBOX_METADATA=true` RomM refreshes it
every night.

## The restart that cost me a wizard

I restarted RomM twice while setting this up, once to load the fixed mappings and once
for the manuals. The first restart caught me halfway through the setup wizard, and my
admin account was never saved. The second stopped both the scan and
the LaunchBox download in the middle.

RomM reads `config.yml` when it starts, so a config change means a restart. What I do
now: change the config before starting a long scan, or wait until it finishes. A Quick
scan afterwards skips every game already done, so a lost scan costs minutes, not hours.

## Where it stands

RomM runs on the server all the time, with every game, our own covers first and the
scrapers filling the rest. Grout is not paired yet; that waits for the router
reservation. Saves are not synced yet either, and that part goes slowly, because one of
those saves is a 48-hour game of Pokémon.

*This is part of a series about retro handhelds; the rest are under the
[handheld tag](/tags/handheld/).*
