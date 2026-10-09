---
layout: post
title: "A Private Immich Setup for a Home Server"
date: 2027-02-02 09:00:00 -0600
last_modified_at: 2027-02-02 09:00:00 -0600
categories: [development]
tags: [immich, homelab, tailscale, docker, self-hosting, security]
---

Immich holds my wife's and my photos, going back to 2015. Two people use it, from two phones, at home and away. Nobody else should ever reach it.

This is the setup I ended up with after [restoring](/blog/restoring-an-immich-v2-backup-into-v3/) and [refilling](/blog/bulk-uploading-photos-to-immich-with-the-cli/) it: the official Docker Compose file with three small edits, Tailscale in front, and a few settings that matter more than the defaults suggest.

---

## TL;DR

- Bind Immich to `127.0.0.1` and reach it with `tailscale serve`.
- Database and thumbnails on the SSD, originals on the HDD, Quick Sync for video.
- A multilingual search model if you search in more than one language.

---

## The hardware

An i7-10700 with 24 GB of RAM, a 240 GB SATA SSD for the system, Docker and Postgres, and a 2 TB HDD for the photos. The machine runs Linux Mint and nothing else is exposed from it except SSH on the LAN.

## Three edits to the official compose file

I start from the release's `docker-compose.yml` and change three things. Each one carries a `# homelab:` comment, so [upgrades](/blog/immich-upgrade-checklist-claude-code-skill/) can diff against upstream.

```yaml
services:
  immich-server:
    extends:
      file: hwaccel.transcoding.yml
      service: quicksync
    volumes:
      - ${UPLOAD_LOCATION}:/data
      # homelab: thumbnails on the SSD, originals on the HDD (docs: guides/custom-locations)
      - ${THUMB_LOCATION}:/data/thumbs
      - /etc/localtime:/etc/localtime:ro
    ports:
      # homelab: localhost only; reached through `tailscale serve`, never the LAN or internet
      - '127.0.0.1:2283:2283'
```

### 1. Localhost only

The official file publishes `'2283:2283'`. Docker [inserts its own firewall rules](https://docs.docker.com/engine/network/packet-filtering-firewalls/) for published ports, ahead of `ufw`, so that line opens Immich to the whole network no matter what `ufw` says. With `127.0.0.1:2283:2283`, only the server itself can connect:

```console
$ ss -tlnp | grep 2283
LISTEN 0      4096       127.0.0.1:2283       0.0.0.0:*
```

Postgres and Valkey publish no ports at all in the official file. Keep it that way.

### 2. Thumbnails on the SSD

The [custom locations guide](https://docs.immich.app/guides/custom-locations) lets you split folders out of `UPLOAD_LOCATION`. Originals stay on the 2 TB disk; thumbnails and previews go to the SSD, so scrolling the timeline does not wait on a 5,900 rpm drive.

```bash
UPLOAD_LOCATION=/mnt/data/immich
THUMB_LOCATION=/srv/homelab/services/immich/thumbs
DB_DATA_LOCATION=/srv/homelab/services/immich/postgres
```

The database stays on the SSD too. Immich's `example.env` warns that network shares are not supported for it.

The HDD is mounted with `nofail`, so a missing disk does not stop the server from booting. That would be risky with an app that writes wherever its folder points, but Immich writes a `.immich` marker in each of its folders and refuses to start if one is missing.

### 3. Quick Sync

The i7-10700's integrated GPU can encode video. The compose change maps `/dev/dri` into the container; the rest is one setting in Administration > Video Transcoding:

![Immich hardware acceleration settings with Quick Sync selected](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572888/blog/a-private-immich-setup-for-a-home-server/images/hardware-acceleration-quick-sync.png)

Immich only transcodes videos a browser cannot play as they are. For my library that was 1,210 of 2,177.

## Tailscale in front

Two users, two phones, no public sharing: a VPN fits better than a reverse proxy on the open internet. [Immich's remote access guide](https://docs.immich.app/guides/remote-access) lists a VPN or Tailscale first, and warns against forwarding port 2283 to the internet. I ruled out two other options:

- **Cloudflare Tunnel** caps request bodies at 100 MB on the free plan, which breaks video uploads.
- **Tailscale Funnel** publishes the service to the whole internet. The opposite of what I want.

[`tailscale serve`](https://tailscale.com/kb/1312/serve) is the private version:

```bash
sudo tailscale serve --bg --https=443 http://localhost:2283
```

```text
Available within your tailnet:

https://homelab.<tailnet>.ts.net/
|-- proxy http://localhost:2283
```

Before that, two switches in the Tailscale admin console: MagicDNS and HTTPS certificates. The certificate comes from Let's Encrypt and Tailscale renews it. Machine names end up in public Certificate Transparency logs, so name the node something boring.

I also disabled key expiry for the server node. Tailscale suggests it for [trusted servers](https://tailscale.com/docs/features/access-control/key-expiry): otherwise the server drops off the tailnet every 180 days until someone logs in on it. Phones and laptops keep the default.

On the phones, the server URL in the Immich app is the same `https://homelab.<tailnet>.ts.net`, and Tailscale's VPN On Demand (iOS) can keep the connection up so background backups also run away from home.

![Immich iPhone app backup screen with backup enabled](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572889/blog/a-private-immich-setup-for-a-home-server/images/phone-app-backup-enabled.png)

## Search in Spanish

The default Smart Search model, `ViT-B-32__openai`, only understands English. We search in Spanish. Immich's [search docs](https://docs.immich.app/features/searching) have a table per language; for Spanish, `ViT-B-16-SigLIP2__webli` scored 83.6% recall with about 3 GB of RAM, and SigLIP2 models understand queries in any language, so English still works.

Change it in Administration > Settings > Machine Learning > Smart Search, then run **Smart Search > All**:

![Smart Search queue with 17,194 jobs waiting](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572890/blog/a-private-immich-setup-for-a-home-server/images/smart-search-queue-multilingual.png)

It ran overnight on the CPU and finished with 17,196 photos and videos indexed and no failures.

Searching "perro" (dog) now brings back our dogs, in photos and videos, and even a dog mural:

![Immich search results for perro, a grid of dog photos and videos](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572895/blog/a-private-immich-setup-for-a-home-server/images/smart-search-perro.png)

## Smaller settings

- **Pin the version.** `IMMICH_VERSION=v3.3.1`, not `v3` or `release`.
- **Database password:** letters and digits only, as `example.env` asks. `openssl rand -hex 24` gives one.
- **Storage template** on, so originals are filed as `library/<user>/<year>/<date>/<file>` instead of random IDs.
- **Daily database dumps** are on by default at 02:00 in `UPLOAD_LOCATION/backups/`. They are only metadata: the photos need a backup of their own.
