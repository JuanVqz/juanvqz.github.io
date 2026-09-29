---
layout: post
title: "A Game About Juan, Installed by Juan"
date: 2026-10-01 09:00:00 -0600
last_modified_at: 2026-10-01 09:00:00 -0600
categories: [personal]
tags: [portmaster, muos, handheld, anbernic, linux, box86, guacamelee, rg40xx-v,
  retro-gaming, emulation, gog, arm, arm64, indie-games, metroidvania, sd-card,
  game-porting, drm-free]
---

I wanted Guacamelee! because it is about luchadores. Then I found out the luchador is
called Juan Aguacate, which is my name, and wanting it turned into needing it.

It is a metroidvania built on lucha libre. You play an agave farmer who dies in the
first few minutes, puts on a mask in the land of the dead, and comes back as a
luchador to rescue El Presidente's daughter from a charro skeleton named Carlos
Calaca.

DrinkBox Studios did their homework. The two worlds you swap between are the living
and the dead, and they are drawn the way Día de Muertos looks: marigolds, papel
picado, sugar skulls, alebrije colours turned up past what any other game would dare.
The bosses are folklore. The enemies are folklore. Even the map is a small Mexican
town with a church, a plaza and a statue in the middle of it.

![Guacamelee running on the handheld, Juan in front of the Pueblucho church](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1790297855/blog/guacamelee/images/church.png#center)

I have played plenty of games that borrow a skull and call it Mexican. This one feels
like someone who has been to the cemetery on the second of November.

It runs on the handheld, it looks like that, and it took a detour to get there. If you
have an Anbernic or something like it, the detour is the useful part.

## Requirements

My handheld is an Anbernic RG40XX V running muOS. It plays old console games happily,
but PC games need [PortMaster](https://portmaster.games/), which packages them up for
these little ARM machines. So the list is short:

- An Anbernic or similar handheld running muOS
- PortMaster installed on it
- A copy of Guacamelee! Gold Edition that you own

PortMaster ships with some muOS images and not others. If it is not under
Applications, download `muos.portmaster.zip` from the PortMaster releases, drop it in
the `/ARCHIVE` folder on your SD card, and install it from **Applications → Archive
Manager**.

### Say hello first

Before spending money, install something free and play it for a minute. PortMaster's
list has plenty that need nothing but the install: I used Apotris, a Tetris game that
is about 7 MB.

This is worth the five minutes because it tests the whole chain at once, and because
of something nobody tells you up front: a PortMaster entry might not contain a game at all.
Some ports include everything. Others are only the engine, waiting for game files you
own and supply yourself. In the menu the two look identical, and installing the second
kind without the files gets you a black screen and a bounce back to the menu, with no
error to explain why. Guacamelee is the second kind.

## Check before you pay

PortMaster publishes its whole catalogue as a data file, so "will this work" is
something you look up rather than ask on a forum. Two things to confirm:

1. Your handheld is on the port's supported list.
2. It needs no extra runtime. A port that drags in a 250 MB runtime is a different proposition on a 1 GB device.

To check both, open the catalogue in your browser:
<https://raw.githubusercontent.com/PortsMaster/PortMaster-Info/main/ports.json>. Search
the page for the game you want. In its entry, `avail` lists the supported devices (the
Anbernic RG40XX V is `rg40xx-v`), and you want `runtime` to be an empty `[]`. If the
search finds nothing, try a shorter piece of the title before giving up.

Guacamelee's entry, trimmed to the parts that matter:

```json
{
  "arch": ["armhf"],
  "avail": ["rg40xx-h:ALL", "rg40xx-v:ALL", "rg35xx-plus:ALL"],
  "inst": "Add your Humble Bundle Linux Guacamelee\\_DRMFREE.sh, or GOGs gog\\_guacamelee\\_gold\\_edition\\_2.0.0.3.sh to the guacamelee folder and run the game.",
  "runtime": [],
  "title": "Guacamelee"
}
```

Guacamelee passed both. The part I did not expect was that its age mattered most.
These ports run x86 games on ARM hardware through a translation layer called
[Box86](https://box86.org/), and Box86 only handles **32-bit** programs.
Modern Linux games are 64-bit. Guacamelee shipped in 2014, when 32-bit was still normal,
and that is the only reason any of this works.

The catalogue answers that too. Guacamelee's entry lists its architecture as `armhf`,
the 32-bit build, and names the exact file it wants: GOG's
`gog_guacamelee_gold_edition_2.0.0.3.sh`. A port built for 32-bit, asking for a 2014
installer by name, turned "probably" into "buy it".

After buying, I checked anyway. I opened the installer on my laptop and looked for a
folder called `lib32`. It was there.

GOG sells the game for three operating systems. Take the Linux one, a single
self-extracting `.sh` file, not the Galaxy installer and not the Mac version. Its name
has to match the one in the catalogue entry character for character. If it differs,
setup fails with "Game installation file is missing", and you rename the file to match.

It helped that it is cheap. I bought it on GOG at 75% off, well under the price of a coffee.
A game that old goes on deep discount often, so if it is not on sale when you look, wait a week.

## Five minutes

First launch unpacks everything. PortMaster says it takes about five minutes, and it is true.

![The PortMaster patch screen extracting the game files](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1790297857/blog/guacamelee/images/patching.png#center)

Watching `lib32` scroll past on the handheld, after checking for it on my laptop,
was the most satisfying part of the afternoon.

## It runs

![The luchador statue in the town plaza](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1790297859/blog/guacamelee/images/statue.png#center)

Full speed, no stutter, an hour in.

![Options showing 640x480 at 60Hz and language set to Spanish](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1790297861/blog/guacamelee/images/options.png#center)

I opened the options to raise the resolution and found 640×480. My first thought was
that this seemed low for how good it looked. My second thought, after checking, was
that the screen *is* 640×480. There was nothing to raise. The game was already drawing
one pixel for every pixel the display has, which is the best it can do.

The screen is 4:3 and the game was made for widescreen, so you get a cropped view
rather than a squashed one. In practice you stop noticing.

The language menu has several languages, Spanish and French among them.
Playing a game built on Mexican folklore, in Spanish, on a handheld I can put in a jacket pocket, is better than I expected from
something I nearly talked myself out of buying.

## If you try this

- **Check whether the port includes the game before you buy anything.** A small
  download and a black screen means it is waiting for files you do not have.
- **Check whether it needs a runtime.** On a 1 GB device, a port that drags in a
  250 MB runtime is a different proposition to one that does not.
- **Take the Linux build**, not the Galaxy installer, not the Mac one.
- **Match the filename exactly.** Most brittle step, easiest fix.
- **Look up the port in PortMaster's catalogue before paying.** Your device on the
  list, no runtime, and a 32-bit build answer the only question that matters.

One last thing: GOG bundles Super Turbo Championship Edition with Gold Edition, and it
looks like two games for one price. On the handheld it is one. Super Turbo is a
separate 2014 release with no PortMaster port, so it sits in your library, playable on
a desktop, invisible to the handheld.

Quitting the game takes a few minutes, which is the one rough edge. The save held,
which is the part that matters.

A game about a man called Juan who keeps getting knocked down and coming back. Took a
few false starts and one fussy filename to get there. Fitting enough.
