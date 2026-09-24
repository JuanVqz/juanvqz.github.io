---
layout: post
title: "A Game About Juan, Installed by Juan"
date: 2026-11-17 09:00:00 -0600
last_modified_at: 2026-11-17 09:00:00 -0600
categories: [tools]
tags: [portmaster, muos, handheld, anbernic, linux, box86]
image:
  path: /assets/img/posts/guacamelee-on-a-handheld/og.png
  alt: Guacamelee running on an Anbernic RG40XX V
---

The protagonist of Guacamelee! is a luchador named Juan Aguacate. My name is Juan.
That is the entire reason this post exists.

The rest of it is about the four downloads, two dead ends and one hardcoded filename
between wanting to play a game on my Anbernic RG40XX V and playing it.

![Guacamelee running on the handheld, Juan in front of the Pueblucho church](/assets/img/posts/guacamelee-on-a-handheld/church.png#center)

## Two kinds of PortMaster port

[PortMaster](https://portmaster.games/) brings PC games to Linux handhelds. I assumed
that meant it brings *games*. It does not always.

Ports come in two kinds, and the catalogue tells you which, if you look at the right
field:

- **Ready to run**: the port contains the game. Install, launch, play.
- **Everything else**: the port is an engine or a wrapper. You supply the game files
  from a copy you own.

I learned this by installing Blood, watching it appear in my ports list, launching it,
and getting a black screen and a bounce back to the menu. No error. The log said what
the menu would not:

```
source/blood/src/screen.cpp(215): BLOOD.PAL not found (RFF files may be wrong version)
```

The port was 1.2 MB. A 1997 shooter is not 1.2 MB. Size is the giveaway: anything
under a few megabytes that claims to be a full game is an engine waiting for assets.

Stardew Valley was already on my card in the same state, installed weeks earlier, its
`gamedata/` folder holding nothing but a `.gitkeep`. I had never noticed because I had
never launched it.

## Checking before you buy

PortMaster publishes its whole catalogue as JSON, which turns "will this work" from a
forum question into a lookup:

```bash
curl -sL https://raw.githubusercontent.com/PortsMaster/PortMaster-Info/main/ports.json
```

Three fields decide it:

| Field | What it tells you |
|---|---|
| `avail` | Which devices the porters list. Mine is `rg40xx-v` |
| `rtr` | `true` = contains the game. `false` = bring your own files |
| `runtime` | Extra downloads needed, like Godot or mono |

For Guacamelee:

```json
"rtr": false,
"runtime": [],
"inst": "Add your Humble Bundle Linux Guacamelee_DRMFREE.sh, or GOGs
         gog_guacamelee_gold_edition_2.0.0.3.sh to the guacamelee folder"
```

So: buy it, Linux build, and the filename is not a suggestion. More on that shortly.

The `runtime` field matters more than it looks on a 1 GB device. A port needing
`mono` pulls a 250 MB runtime; Godot 4 pulls its own compositor. Ready-to-run ports
with an empty `runtime` are the ones that behave.

## The engine underneath

Reading the launcher script explains what you are buying:

```bash
export PORT_32BIT="Y"
BINARYNAME="game-bin"
export LD_LIBRARY_PATH="$GAMEDIR/box86/native":...
```

The handheld is ARM. The game is x86. [Box86](https://box86.org/) translates between
them, and it only handles **32-bit** x86. That single constraint decides whether a
given store's build will work.

Guacamelee! Gold Edition shipped for Linux in 2014, back when 32-bit builds were
normal. That age is why this works at all. A modern Linux release would be 64-bit only
and Box86 could not touch it.

## Four downloads to get one file

GOG's download page has an OS selector. I clicked the buttons in the worst possible
order:

1. **GOG Galaxy installer**, 397 KB. A stub that downloads the launcher that
   downloads the game.
2. **macOS `.dmg`**, 536 MB. Correct size, wrong operating system entirely.
3. **The Linux `.sh`**, 528 MB. The one, hiding behind the penguin tab.

Three wrong buttons before the right one, and only the last is a single self-extracting
installer of the kind the port expects.

Then the filename. The port's extractor does this:

```bash
"$controlfolder/7zzs.$DEVICE_ARCH" x -aoa gog_guacamelee_gold_edition_2.0.0.3.sh
if [ -d "data/noarch/game" ]; then
```

It greps for that exact string. Not a pattern, not a glob. If GOG ever bumps the
version, extraction fails with "Game installation file is missing" and the fix is to
rename your download to match.

Before buying, I checked the installer's contents:

```bash
unzip -Z1 gog_guacamelee_gold_edition_2.0.0.3.sh | grep data/noarch/game
```

```
data/noarch/game/lib32/libSDL2-2.0.so.0
data/noarch/game/lib32/libfmodevent-4.44.27.so
```

`lib32`. The 32-bit build Box86 needs. That was the moment it went from "probably" to
"buy it".

## Five minutes of patching

First launch extracts the installer into place. PortMaster warns it takes about five
minutes, and it takes about five minutes.

![The PortMaster patch screen extracting the game files](/assets/img/posts/guacamelee-on-a-handheld/patching.png#center)

Watching `lib32` scroll past on the device, after checking for it on the laptop, was
the most satisfying part of the afternoon. Then it deletes the 528 MB installer and
boots straight into the game from then on.

## It runs

![The luchador statue in the town plaza](/assets/img/posts/guacamelee-on-a-handheld/statue.png#center)

Full speed. No stutter in the first hour.

The options screen tells you why:

![Options showing 640x480 at 60Hz and language set to Spanish](/assets/img/posts/guacamelee-on-a-handheld/options.png#center)

640×480 at 60 Hz. My first instinct was to look for a higher setting, which was the
wrong instinct: the RG40XX V's panel *is* 640×480. The game is rendering one pixel per
pixel, on a display refreshing at exactly the rate it outputs. There is nothing to
improve. Anything higher would be downscaled back, costing framerate for no visible
gain.

Worth noting for the 4:3 screen: Guacamelee was designed for 16:9, so you are playing
a cropped view rather than a squashed one.

And the language menu offers Spanish, French and more. Playing a game steeped in
Mexican folklore, in Spanish, on a handheld, is a better experience than I expected
from a port I nearly did not buy.

## What I would tell myself

Quitting takes a few minutes, which is the one rough edge. The save held, which is the
part that matters.

If you are doing this yourself:

- **Check `rtr` before you buy anything.** A small download plus a black screen is a
  port waiting for files you do not have.
- **Check `runtime` too.** On 1 GB of RAM, a Godot or mono dependency is a different
  proposition to a native SDL build.
- **Take the Linux build, not Galaxy, not the `.dmg`.** The penguin tab is easy to
  miss and nothing else works.
- **Match the filename exactly.** It is the most brittle part of the whole chain and
  the easiest to fix.
- **Look for `lib32` before paying.** One command, and it answers the only question
  Box86 cares about.

Gold Edition only, by the way. GOG bundles Super Turbo Championship Edition, and it is
a separate 2014 engine with no PortMaster port. It sits in your library, playable on a
desktop, invisible to the handheld.

A game about a man called Juan who keeps getting knocked down and coming back. Took
four downloads, two dead ports and a hardcoded filename. Fitting enough.
