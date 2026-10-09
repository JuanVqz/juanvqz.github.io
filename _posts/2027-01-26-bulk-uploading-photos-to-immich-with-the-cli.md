---
layout: post
title: "Bulk Uploading Photos to Immich With the CLI, and Proving Every File Landed"
date: 2027-01-26 09:00:00 -0600
last_modified_at: 2027-01-26 09:00:00 -0600
categories: [development]
tags: [immich, homelab, docker, self-hosting, data-integrity]
---

After [restoring my Immich database](/blog/restoring-an-immich-v2-backup-into-v3/), about 9,000 rescued photos and videos were still outside it: files that only one of the two failed SSDs had, files the restored database did not know about, and healthy copies of a few damaged ones. My wife Kenia and I each have an account, so every file had to land in the right one.

This is how I uploaded them with the Immich CLI, proved every single one arrived, and then fixed the batch I sent to the wrong account.

---

## TL;DR

- One API key per user, the CLI in a container pinned to the server version, sections in `tmux`.
- Prove the upload: every source SHA1 must be among that user's assets.
- Check the EXIF camera before trusting a folder name to tell you whose photos they are.

---

## One key per user, kept on the server

Each user creates a key in Account Settings > API Keys. The CLI's `upload` command needs `asset.upload`. I also gave the keys `asset.read`, and `asset.delete` for the cleanup at the end.

![Immich New API Key dialog with the permission list](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572887/blog/bulk-uploading-photos-to-immich-with-the-cli/images/new-api-key-permissions.png)

The keys never went through chat or a terminal history. Each one lives in a file on the server, readable only by my user:

```bash
nano ~/.immich-key-kenia
chmod 600 ~/.immich-key-kenia
curl -s -H "x-api-key: $(tr -d ' \n' < ~/.immich-key-kenia)" localhost:2283/api/users/me
```

The last line must print the right user's name before anything else happens.

## The CLI as a container, same version as the server

No Node.js install on the server. The CLI has an image, and I pin it to the server's version:

```sh
#!/bin/sh
# immich-upload.sh <key-file> <folder> <log-name>
K=$(tr -d " \n" < "$1")
docker run --rm --network host \
  -e IMMICH_INSTANCE_URL=http://localhost:2283/api -e IMMICH_API_KEY="$K" \
  -v "$2":/import:ro ghcr.io/immich-app/immich-cli:3.3.0 upload --recursive /import 2>&1 \
  | tee "/mnt/data/import/logs/$3.log"
echo "EXIT=$?" >> "/mnt/data/import/logs/$3.log"
```

`--network host` because Immich only listens on `127.0.0.1:2283`. The folder is mounted read-only. I never pass `--album`, which names albums after folders (mine were date folders), or `--delete`.

## Dry run

```text
Found 5118 new files and 0 duplicates
Would have uploaded 5118 assets (27.7 GB)
```

That count was misleading. Only 4,738 of those files had different content; the rest were the same photo in two folders. The CLI checks duplicates against the server, not within the batch, so the second copy shows up as a duplicate only once the first one is uploaded.

## Sections, in tmux

The CLI hashes each file and asks the server which checksums it already has before uploading. That makes a stopped run safe to repeat, but a single 49 GB run gives you one number at the end. I split the work into one section per folder and ran them in `tmux` on the server, so a sleeping laptop could not stop them:

```text
kenia-1-set2-library   Successfully uploaded 382 new assets (3.7 GB)
kenia-2-set2-photos    Found 4339 new files and 377 duplicates
                       Successfully uploaded 4339 new assets (20.6 GB)
juan-1-orphans         Successfully uploaded 1244 new assets (4.1 GB)
juan-2-set2-photos     Successfully uploaded 2680 new assets (19.9 GB)
```

Nine sections, every log ending in `EXIT=0`.

## Prove it

"Successfully uploaded" is the CLI's opinion. Immich stores a SHA1 of every original, so the proof is a set comparison: hash the source files, list the user's checksums from the database, and check that nothing is left over.

```sql
select encode(a.checksum, 'hex') from asset a
join "user" u on u.id = a."ownerId"
where a."deletedAt" is null and u.name = 'Kenia';
```

```text
juan:  files=3953 in-immich=3953 missing=0
kenia: files=5118 in-immich=5118 missing=0
```

A section that reported "Found 2681, uploaded 2680" was fine too: the one left over was already in that account.

## The folder that lied

The next day, Kenia's phone started syncing and she saw my photos in her account.

The culprit was a folder from the old SSD called `photos/Kenia`, files named `Kenia - 1 of 7373.jpeg` and up. I had uploaded it to her account because of its name. It was a Google Photos export of a shared library, with photos from both of our phones.

The EXIF data told them apart. Grouping her account by camera:

```text
iPhone 13 Pro Max   6418    (hers)
iPhone 11           1538    (mine)
iPhone XR            543    (mine)
iPhone 6 Plus        445    (mine)
Xiaomi Mi A1         392    (mine)
```

Google had recompressed the export, so checksums did not match my copies. A looser test did: same camera model and same `dateTimeOriginal`, to the second. 2,604 of the misplaced photos already existed in my account by that test. The other 334 from my phones did not.

Immich has no "change owner" button, so the fix was:

1. Upload the 334, plus 637 with no camera data, from the original rescue files to my account.
2. Check all 971 SHA1s in my account.
3. Only then move 2,938 photos to Kenia's trash, where they stay recoverable for 30 days.

The 637 without camera data, mostly screenshots, stayed in both accounts, because some were hers. Anything uploaded from her phone that day was left alone: the change only touched files whose checksum came from the rescue.

Now, before uploading a folder to someone, I group it by EXIF make and model and ask who owned each camera.
