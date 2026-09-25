---
layout: post
title: "A Game About Juan, Installed by Juan"
date: 2026-11-17 09:00:00 -0600
last_modified_at: 2026-11-17 09:00:00 -0600
categories: [tools]
tags: [portmaster, muos, handheld, anbernic, linux, box86, guacamelee, rg40xx-v,
  retro-gaming, emulation, gog, arm, arm64, indie-games, metroidvania, sd-card,
  game-porting, drm-free]
image:
  path: /assets/img/posts/guacamelee/og.png
  alt: Guacamelee running on an Anbernic RG40XX V
---

The protagonist of Guacamelee! is a luchador named Juan Aguacate. My name is Juan.
That is the entire reason I wanted it on my handheld.

![Guacamelee running on the handheld, Juan in front of the Pueblucho church](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1790297855/blog/guacamelee/images/church.png#center)

It runs, it looks like that, and it took a detour to get there. If you have an
Anbernic or something like it, the detour is the useful part.

## Ports come in two kinds

My handheld is an Anbernic RG40XX V running muOS. It plays old console games happily,
but PC games need [PortMaster](https://portmaster.games/), which packages them up for
these little ARM machines.

What nobody tells you up front is that a PortMaster entry might not contain a game at
all. Some ports include everything. Others are only the engine, a shell waiting for
game files you own and supply yourself. In the menu the two look identical: same
listing, same icon, same install button. Install the second kind without the files and
you get a black screen and a bounce back to the menu, with no error to explain why.

Size is the giveaway. A port measured in single-digit megabytes is not carrying a full
game with it.

## Reading the label before buying

Guacamelee is the second kind. That was fine, I was happy to pay for it, but I did not
want to spend money and then discover it would not run.

PortMaster publishes its entire catalogue as a data file, which means "will this work"
stops being a forum question and becomes something you can look up. Three things
decide it:

| What to check | Why it matters |
|---|---|
| Is my device listed? | Porters say which handhelds they support |
| Does it include the game? | Or do I need to buy it separately |
| Does it need a runtime? | Extra downloads, some of them large |

Guacamelee needed buying, needed no extra runtime, and listed my exact handheld. Good
so far.

The part that decided it was older than I expected. These ports run x86 games on ARM
hardware through a translation layer called [Box86](https://box86.org/), and Box86
only handles **32-bit** programs. Modern Linux games are 64-bit. This one shipped in
2014, back when 32-bit was still normal, and that is the only reason any of this works.

So before paying, I opened up the installer GOG sells and looked for a folder called
`lib32`. It was there. That is the whole check, and it turned "probably" into "buy it".

## What you are buying

Guacamelee! is a metroidvania built on lucha libre. You play Juan Aguacate, an agave
farmer who dies in the first few minutes, puts on a mask in the land of the dead, and
comes back as a luchador to rescue El Presidente's daughter from a charro skeleton
named Carlos Calaca.

DrinkBox Studios did their homework. The two worlds you swap between are the living
and the dead, and they are drawn the way Día de Muertos really looks: marigolds,
papel picado, sugar skulls, alebrije colours turned up past what any other game would
dare. The bosses are folklore. The enemies are folklore. Even the map is a small
Mexican town with a church, a plaza and a statue in the middle of it.

I have played plenty of games that borrow a skull and call it Mexican. This one feels
like someone who has been to the cemetery on the second of November.

It is also cheap. I bought it on GOG at 75% off, which put it well under the price of
a coffee. A game from 2013 goes on deep discount often, so if it is not on sale when
you look, wait a week.

## Five minutes

First launch unpacks everything. PortMaster says it takes about five minutes, and it
takes about five minutes.

![The PortMaster patch screen extracting the game files](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1790297857/blog/guacamelee/images/patching.png#center)

Watching `lib32` scroll past on the handheld, after checking for it on my laptop an
hour earlier, was the most satisfying part of the afternoon.

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

The language menu has Spanish and French. Playing a game built on Mexican folklore, in
Spanish, on a handheld I can put in a jacket pocket, is better than I expected from
something I nearly talked myself out of buying.

## If you try this

- **Check whether the port includes the game before you buy anything.** A small
  download and a black screen means it is waiting for files you do not have.
- **Check whether it needs a runtime.** On a 1 GB device, a port that drags in a
  250 MB runtime is a different proposition to one that does not.
- **Take the Linux build**, not the Galaxy installer, not the Mac one.
- **Match the filename exactly.** Most brittle step, easiest fix.
- **Look for `lib32` inside the installer before paying.** One check, and it answers
  the only question that matters.

One last thing: GOG bundles Super Turbo Championship Edition with Gold Edition, and it
looks like two games for one price. On the handheld it is one. Super Turbo is a
separate 2014 release with no PortMaster port, so it sits in your library, playable on
a desktop, invisible to the handheld.

Quitting the game takes a few minutes, which is the one rough edge. The save held,
which is the part that matters.

A game about a man called Juan who keeps getting knocked down and coming back. Took a
few false starts and one fussy filename to get there. Fitting enough.
