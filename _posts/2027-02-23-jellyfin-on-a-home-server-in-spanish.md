---
layout: post
title: "Jellyfin on a Home Server, Set Up for Spanish"
date: 2027-02-23 09:00:00 -0600
last_modified_at: 2027-02-23 09:00:00 -0600
categories: [development]
tags: [jellyfin, homelab, docker, self-hosting, tailscale, bazarr, radarr, sonarr]
---

Kenia and I watch almost everything in Spanish. Streaming apps get that right most of the time, so a home media server had to get it right too, without either of us opening a settings menu before every movie.

The server already runs [Immich](/blog/a-private-immich-setup-for-a-home-server/) and a Samba share. Jellyfin joined it with the usual helpers: Radarr and Sonarr to name and file movies and series, Bazarr for subtitles, qBittorrent as the download client. I started from Pelado Nerd's [media-stack](https://github.com/Pelado-Nerdworks/media-stack) repo and changed what did not fit: no indexers, admin pages on the loopback only, Spanish everywhere.

The screenshots come from a copy of the stack on my laptop, playing Blender's open movies (Big Buck Bunny, Tears of Steel, Sintel, Elephants Dream), with the same settings as the server.

---

## TL;DR

- Set the metadata language to Spanish (Latin America, `es-419`) and the country to Mexico, per library. When TMDB has no Spanish text for a film, Jellyfin shows the English one.
- Per user: audio language Spanish, "play the default audio track" off, subtitles Spanish in **Smart** mode. A Spanish dub plays when there is one; an English film shows Spanish subtitles on its own.
- Bazarr asks for Spanish first, then English. Radarr keeps the `.srt` files that come with a movie.
- Intel Quick Sync does the transcoding: pass `/dev/dri` to the container and add the `render` group.
- TVs reach Jellyfin on the LAN; phones away from home go through Tailscale. Behind Docker, Known Proxies is the Docker gateway, not `127.0.0.1`.
- A small script stops the downloads when the data disk drops under 300 GB free and sends a notification to my phone.

---

## Test on the laptop first

The same `docker-compose.yml` runs on the Mac with Docker Desktop and on the server. The server-only pieces (the LAN port, the GPU) live in a second file that the server adds through `COMPOSE_FILE` in its `.env`:

```bash
# server .env
COMPOSE_FILE=docker-compose.yml:compose.server.yml
```

On the Mac I pointed the data and config folders at a scratch directory, started the containers, and checked the things that would be painful to discover on the server: Radarr matched Big Buck Bunny, a manual import made a hardlink instead of a copy (same inode, two links), Jellyfin found the film and played it, and a forced low-bitrate transcode produced valid video segments. Only then did the stack move.

## One folder, one mount

The media sits on the server's data disk:

```
/mnt/data/media/
  torrents/{movies,series}   downloads in progress and seeding
  incoming/{movies,series}   files I copy in by hand
  library/{movies,series}    what Jellyfin shows
```

Radarr and Sonarr see all of `/mnt/data/media` as one mount, `/data`. That detail is what makes hardlinks work: when a download finishes, the file appears in `library/` without being copied, and the disk holds it once. Mount `torrents` and `library` as two separate volumes and every import becomes a copy plus a delete.

Radarr names each folder with the ID Jellyfin reads, so matching never depends on guessing from the title:

```
{Movie Title} ({Release Year}) [tmdbid-{TmdbId}]
{Series Title} ({Series Year}) [tvdbid-{TvdbId}]
```

## Spanish metadata

Each library has its own metadata language. Mine are "Películas" and "Series", both set to Spanish (Latin America) with country Mexico, so titles, plots and genres come in Spanish when TMDB has them:

![Big Buck Bunny details page in Jellyfin with the plot and genres in Spanish](/assets/img/posts/jellyfin-on-a-home-server-in-spanish/movie-details.png)

TMDB does not have a Spanish plot for every film. Of the four open movies, only Big Buck Bunny had one; Sintel and Elephants Dream came in English, and Tears of Steel had none at all. Jellyfin falls back without complaining, so a mixed library is normal, not a broken setting.

![Jellyfin home screen in Spanish with the Películas library and four open movies](/assets/img/posts/jellyfin-on-a-home-server-in-spanish/home.png)

## The right audio and subtitles, without touching anything

This is the part that matters day to day. Three user settings do it:

- **Preferred audio language: Spanish.** When a file carries a Spanish dub, that track plays.
- **"Play default audio track regardless of language": off.** Many files mark the original-language track as the default. With this on, the default wins and the Spanish track is ignored.
- **Subtitles: Spanish, in Smart mode.** Smart loads subtitles in your language only when the audio is in another one. A dubbed movie plays clean; an English one gets Spanish subtitles.

![Jellyfin playback settings with Spanish as the preferred audio language](/assets/img/posts/jellyfin-on-a-home-server-in-spanish/playback-preferences.png)

![Jellyfin subtitle settings with Spanish and Smart mode](/assets/img/posts/jellyfin-on-a-home-server-in-spanish/subtitle-preferences.png)

Tears of Steel is a good test: English audio, and Blender publishes an official Spanish subtitle file. I dropped `Tears of Steel (2012).es.srt` next to the video, pressed play, and the subtitles were on without choosing anything:

![Tears of Steel playing in Jellyfin with Spanish subtitles shown automatically](/assets/img/posts/jellyfin-on-a-home-server-in-spanish/subtitles-playing.png)

These settings are per user, so when Kenia gets her own account it needs the same three.

## Subtitles from Bazarr, and the ones that come with the file

Bazarr watches the Sonarr and Radarr libraries and fetches subtitles that are missing. Its language profile is "Spanish, then English": Spanish is the cutoff, English is the fallback when nothing Spanish exists. It refreshes the Jellyfin library after each download, so a new subtitle shows up without a manual scan.

Two things I learned:

- **Ask for `es`, not Latin American Spanish.** Few subtitle providers list Latin American Spanish separately, so a profile that requires it finds almost nothing.
- **The subtitles bundled with a movie are often the best ones.** Radarr can import "extra files" next to the video. I turned it on for `srt,ass,ssa,sub,idx`. For Tears of Steel, no Bazarr provider had a match, and the `.es.srt` that came with the film is what Jellyfin showed.

The free providers work without an account. OpenSubtitles, the biggest one, needs a free account, which I have not created yet.

## Spanish dubs score higher

Radarr and Sonarr decide between versions of the same title with custom formats. I added two: "Español latino" worth +150 and "Español" worth +100, with English accepted at 0. Given a choice, the Latin American dub wins, then any Spanish, then English.

One default fights this. Radarr's quality profiles come with the language set to "Original", which rejects a Spanish dub of an English film. Set it to "Any" and let the custom formats do the ranking.

Radarr can also show its own titles and plots in Spanish (Latin America), which makes its lists match what Jellyfin shows.

## Quick Sync for transcoding

Most of the time Jellyfin plays the file as it is. When a client cannot (a phone on mobile data, a codec the TV lacks), it transcodes. The server has an Intel UHD 630, the same Quick Sync the Immich setup already uses. The container needs the GPU device and the group that owns it:

```yaml
# compose.server.yml
services:
  jellyfin:
    devices:
      - /dev/dri:/dev/dri
    group_add:
      - "992"   # the host's render group: getent group render
```

Then Dashboard, Playback, Transcoding: hardware acceleration "Intel Quick Sync (QSV)", and hardware decoding for the codecs the chip supports.

![Jellyfin transcoding settings with Intel Quick Sync selected](/assets/img/posts/jellyfin-on-a-home-server-in-spanish/transcoding.png)

A test transcode with `h264_qsv` encoded 206 frames in half a second, so the CPU is not the limit.

## TVs on the LAN, phones through Tailscale

We have two Fire TV Sticks, and they are not on the tailnet. The official Jellyfin app from the Amazon Appstore connects to the server's LAN address on port 8096, and Jellyfin also answers discovery on UDP 7359 so the app can find it. Both are bound to the server's LAN IP only, not to every interface.

Away from home, the phones use Tailscale, the same as Immich: `tailscale serve` gives Jellyfin its own HTTPS port on the tailnet, `https://homelab.<tailnet>.ts.net:8920`. The admin pages of the other apps get the same treatment on their own ports, and none of them listens on anything but `127.0.0.1`.

One setting tripped me up. Jellyfin limits bitrate for remote clients and not for local ones, and behind a proxy it has to know which addresses to trust for the real client IP. I expected requests from `tailscale serve` to arrive from `127.0.0.1`. They do not: Docker hands every connection to the container from its bridge gateway, so Jellyfin saw `172.20.0.1` for everything. That gateway is what goes in **Known Proxies**. With `127.0.0.1` there, remote viewers counted as local.

## A guard for the data disk

qBittorrent has no free-space limit. Radarr and Sonarr have a "minimum free space", but it only blocks imports; downloads keep writing. The same disk holds Immich, the only copy of new phone photos, so a full disk is not an option.

A short Python script (Linux Mint ships Python, so nothing to install) runs every 15 minutes from a systemd timer. Under 300 GB free, it logs in to qBittorrent's Web API, stops every torrent, and sends one notification to my phone through [ntfy](https://ntfy.sh). It sends another when there is room again. It never resumes anything on its own; that stays a decision I make.

The one bug was the login. The script looked for a cookie named `SID`, and qBittorrent 5 calls it `QBT_SID_8081` (the port is part of the name). Reading the first `name=value` pair of `Set-Cookie`, whatever its name, fixed it.

## Gotchas

- **Create every folder before the first `docker compose up`**, as the user the containers run as. Docker creates missing bind-mount folders as root. The linuxserver images fix the ownership of their config folder; the official Jellyfin image does not, and it crash-looped on a root-owned config folder.
- **qBittorrent defaults to manual torrent management**, which ignores the save path of each category. Switch it to automatic, or Radarr and Sonarr downloads all land in the same folder.
- **Renaming a movie folder through the Radarr API left the movie without a file** until a rescan, and Bazarr only lists movies that have one.

## Wrapping up

The setup that took the longest to get right was the one I see the least: three per-user settings, a Bazarr profile, and two custom formats. Now a dubbed movie plays dubbed, an English series shows Spanish subtitles, and nobody opens a menu first.
