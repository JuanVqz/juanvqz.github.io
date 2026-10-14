---
layout: post
title: "Backing Up Immich to Backblaze B2 With Backrest"
date: 2027-03-23 09:00:00 -0600
last_modified_at: 2027-03-23 09:00:00 -0600
categories: [development]
tags: [immich, backups, backblaze, homelab, restic, self-hosting]
---

After the [rescue](/blog/rescuing-immich-photos-from-no-name-ssds/), Immich ended up on a single 2 TB disk in my home server. Every photo my wife and I take lands there first, and for a while it was the only copy. The [setup post](/blog/a-private-immich-setup-for-a-home-server/) closed with "the photos need a backup of their own". This is that backup: Backrest on the server, a private bucket on Backblaze B2, about a dollar a month.

---

## TL;DR

- B2 Cloud Storage, one private bucket, lifecycle "keep only the last version", Object Lock off.
- An application key limited to that bucket, saved on the server as a file.
- Backrest (a web UI for restic) with the Immich folder mounted read-only.
- Back up `library/`, `upload/`, `profile/` and `backups/`. Skip what Immich can rebuild.
- Set restic's hourly retention to 0 when you back up once a day.

---

## Why B2

I compared two places to keep about 136 GB (prices from October 2026):

| Service | Price | Note |
|---|---|---|
| Backblaze B2 | USD 6.95 per TB per month | Downloads free up to 3x what you store |
| Cloudflare R2 | USD 15 per TB per month | Downloads always free |

B2 won on price at this size. The [pricing page](https://www.backblaze.com/cloud-storage/pricing) also lists the first 10 GB as free, so 136 GB comes to under a dollar a month. I looked for a promo code before signing up: there is no official one, and the codes on coupon sites are old and mostly for Computer Backup.

That is the other thing to get right on signup: Backblaze sells two products. **Computer Backup** is their own app for a Mac or Windows PC. **B2 Cloud Storage** is the S3-compatible storage that backup tools write to. A Linux server needs B2.

The region is chosen once per account and cannot change. Price is the same in every region, and a nightly backup does not care about latency, so any region near you works. I already had a forgotten account from years ago, with an empty bucket in it. I deleted the bucket and kept the account; the region came with it (`us-west-004`).

## The bucket

![B2 bucket details: private, lifecycle set, Object Lock disabled, encryption enabled](/assets/img/posts/backing-up-immich-to-backblaze-b2-with-backrest/b2-bucket-details.png)

- **Private.** Nothing in it is ever shared by link.
- **Lifecycle: "Keep only the last version of the file".** B2 keeps old versions of every file by default. restic manages its own history, so old versions are dead weight. In the API this shows as `daysFromHidingToDeleting: 1`.
- **Object Lock: off.** It blocks deleting files until a date you set. That protects a backup from someone who steals the server's key, but restic's `prune` has to delete old data to keep the repository small, and with a lock it cannot. I will revisit it after the backup has run for a while.

## A key for this bucket only

The master application key can do anything in the account. The backup gets its own key, limited to one bucket with read and write access:

![B2 application key limited to one bucket, with its list of capabilities](/assets/img/posts/backing-up-immich-to-backblaze-b2-with-backrest/b2-application-key-capabilities.png)

Creating it does not touch the master key. Keys are independent; only generating a new master key cancels the old master.

B2 shows the secret once. I pasted it straight into a file on the server, never into a chat or a terminal history:

```bash
nano /srv/homelab/services/backrest/b2-immich.env
chmod 600 /srv/homelab/services/backrest/b2-immich.env
```

```text
B2_IMMICH_KEY_ID=...
B2_IMMICH_APP_KEY=...
```

The names carry the bucket on purpose. A second bucket later gets its own file and its own variable names, so one key can never leak into the other repository.

Before going further, I checked the key works and sees only its bucket, without printing the secret:

```bash
set -a; . /srv/homelab/services/backrest/b2-immich.env; set +a
curl -s -u "$B2_IMMICH_KEY_ID:$B2_IMMICH_APP_KEY" \
  https://api.backblazeb2.com/b2api/v3/b2_authorize_account \
  | python3 -c 'import json,sys; s=json.load(sys.stdin)["apiInfo"]["storageApi"]; print(s["bucketName"], s["s3ApiUrl"])'
```

```text
<bucket> https://s3.us-west-004.backblazeb2.com
```

## What goes in the backup

Immich's upload folder on the HDD holds these, and not all of them are worth paying for:

| Folder | Size | Back up? |
|---|---|---|
| `library/` | 135 GB | Yes. The originals |
| `upload/` | 287 MB | Yes. Uploads still being processed |
| `profile/` | 56 KB | Yes. Profile pictures |
| `backups/` | 729 MB | Yes. Immich's nightly database dump |
| `encoded-video/` | 20 GB | No. Immich transcodes again |

Thumbnails are not in that folder at all: they live on the SSD since the [setup post](/blog/a-private-immich-setup-for-a-home-server/), and Immich can regenerate them, so they stay out too.

The database dump matters more than its size suggests. Albums, faces, people, favorites and users live in the database, not in the files. Without it, a restore is a pile of photos.

The live Postgres folder (588 MB, on the SSD) stays out. A copy of a database taken while it runs can be inconsistent; the dump Immich writes every night at 02:00 is the database backup.

## Backrest

[restic](https://restic.net/) does the backup: it encrypts everything before upload, stores each piece of data once, and speaks the S3 API B2 offers. [Backrest](https://github.com/garethgeorge/backrest) puts a web UI and a scheduler around it: plans, retention rules, a list of snapshots, and restores with a few clicks. It matches the rest of the server, where every service is a web page behind Tailscale.

The compose file is the README example with a few edits:

```yaml
services:
  backrest:
    image: garethgeorge/backrest:v1.14.1
    container_name: backrest
    # restic records this as the snapshot host
    hostname: homelab
    restart: unless-stopped
    env_file:
      - b2-immich.env
    environment:
      - BACKREST_DATA=/data
      - BACKREST_CONFIG=/config/config.json
      - XDG_CACHE_HOME=/cache
      - TMPDIR=/tmp
      - TZ=America/Mexico_City
    volumes:
      - ./data:/data
      - ./config:/config
      - ./cache:/cache
      - ./tmp:/tmp
      # read-only: a backup can never change a photo
      - /mnt/data/immich:/sources/immich:ro
      # restores go here, never over the live library
      - /mnt/data/restore:/restore
    ports:
      - 127.0.0.1:9898:9898
```

- **Pinned version**, like everything else on the server.
- **Read-only source.** I checked it from inside the container: `touch /sources/immich/x` fails with `Read-only file system`.
- **Localhost only.** Docker's published ports skip `ufw`, so the UI binds to `127.0.0.1` and Tailscale serves it to my devices: `tailscale serve --bg --https=9898 http://127.0.0.1:9898`.

The image bundles restic itself (0.19.1 here), so there is nothing else to install.

### Two surprises on the first screen

The first screen asks for an instance ID and a login. After saving it, the browser tab hung. The server was fine: it answered in milliseconds. A reload brought the UI back, and the saved config showed authentication **disabled**, so anyone on my tailnet could have opened it. I turned it back on in Settings and checked from the command line that a request without a login is refused:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Content-Type: application/json" -d '{}' \
  https://homelab.<tailnet>.ts.net:9898/v1.Backrest/GetConfig
```

```text
401
```

Then the login itself hung in Safari, in a private window too. It matches [backrest#1402](https://github.com/garethgeorge/backrest/issues/1402), still open in October 2026: in Safari on macOS 27, the tab that submits the login never finishes, although the login works and a new tab in the same window opens the dashboard. Opera logged in on the first try, so I use Opera for Backrest.

## The repository

A restic repository is the encrypted store in the bucket. In Backrest it takes a name, a URI, a password and the credentials:

- **URI:** `s3:https://s3.us-west-004.backblazeb2.com/<bucket>/immich`
- **Password:** a new random one from the password manager. This is the encryption key for every byte in the bucket, not the Backrest login. Lose it and nobody can read the backup, Backblaze included.
- **Env vars:** `AWS_ACCESS_KEY_ID=${B2_IMMICH_KEY_ID}` and `AWS_SECRET_ACCESS_KEY=${B2_IMMICH_APP_KEY}`. Backrest expands `${VAR}` from its own environment ([`env.go`](https://github.com/garethgeorge/backrest/blob/v1.14.1/internal/orchestrator/repo/env.go)), so the secret stays in the file.

Prune and check stay on the defaults: once a month, and prune only when more than 10% of the repository is unused. Photos are mostly added and rarely deleted, so there is little to clean.

After saving, two small files appeared in the bucket, `immich/config` and one file in `immich/keys/`. restic had created the repository over the S3 API, which proved the key, the endpoint and the variable names in one go.

## The plan, and a retention trap

The plan ties the four folders to the repository, runs at 03:00 (an hour after Immich's database dump), and decides how many snapshots to keep:

![Backrest Add Plan form with the four Immich folders](/assets/img/posts/backing-up-immich-to-backblaze-b2-with-backrest/backrest-add-plan-form.png)

The retention defaults were hourly 24, daily 7, weekly 4, monthly 3. The hourly one looks harmless for a daily backup, but restic reads `--keep-hourly 24` as "the last 24 hours **that have a snapshot**", one snapshot each. With one backup a day, that keeps 24 daily snapshots: 24 days, not 24 hours. I set:

| Hourly | Daily | Weekly | Monthly | Yearly |
|---|---|---|---|---|
| 0 | 7 | 4 | 12 | 2 |

Snapshots share their data, so a longer history costs almost nothing. The only extra storage is photos deleted from Immich, kept until their last snapshot expires, which is the point.

## The first upload

I started the first run by hand instead of waiting for 03:00:

![Backrest plan view with the first backup running, 3 of 21,748 files](/assets/img/posts/backing-up-immich-to-backblaze-b2-with-backrest/backrest-first-backup-progress.png)

135.74 GiB in 21,748 files. restic reads the database dumps first, then the library. I measured the upload on the server's network interface over a minute: 9.8 Mbit/s, which is all my home connection sends. At that rate the first run takes about 31 hours. Photos and videos are already compressed, so restic's compression does not change much.

![Backrest dashboard showing the backup in progress](/assets/img/posts/backing-up-immich-to-backblaze-b2-with-backrest/backrest-dashboard-backing-up.png)

While it runs, the backup uses the whole upload, so anything else sending data out of the house shares what is left. Phone backups to Immich over the home Wi-Fi do not use the internet upload at all. If that is a problem, restic's `--limit-upload` caps it, and an interrupted run loses nothing: restic saves its index as it goes, and the next run skips what is already in the bucket.

After the first run, each night uploads only the new photos.

## What the bucket looks like

Nothing in B2 is readable as a photo. The browser shows restic's layout, all of it encrypted:

```text
<bucket>/
  immich/
    config
    keys/
    snapshots/
    index/
    data/00..ff/
```

To browse or restore, open a snapshot in Backrest. It shows the original paths, `/sources/immich/library/<user>/<year>/<date>/<file>`, and restores to `/restore`.

## Restore test

<!-- TODO after the first run finishes: restore a few photos and one database dump to /restore, compare sha1sum against the originals, record the numbers here. -->

## What I would do the same way again

- A key per bucket, in a file named after the bucket.
- The source mounted read-only, and a separate folder to restore into.
- Hourly retention at 0 for a daily backup.
- Check the login works without trusting the setup screen: a `curl` without credentials must get `401`.
