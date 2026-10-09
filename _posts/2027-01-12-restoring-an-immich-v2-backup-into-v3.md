---
layout: post
title: "Restoring an Immich v2 Backup Into v3: Two Gotchas the Docs Don't Cover"
date: 2027-01-12 09:00:00 -0600
last_modified_at: 2027-01-12 09:00:00 -0600
categories: [development]
tags: [immich, homelab, docker, postgres, self-hosting, backup]
---

After [rescuing 20,000 photos from two no-name SSDs](/blog/rescuing-immich-photos-from-no-name-ssds/), I had the original files and one database dump from April: `immich-db-backup-20260414T020000-v2.6.3-pg14.19.sql.gz`. By the time the server was ready again, Immich was on v3.

The restore itself worked on the first try. Getting thumbnails and videos back did not, and the reasons are not in the docs.

---

## TL;DR

- A v2.6.3 dump restores straight into v3 when both use the same Postgres image.
- After a restore, "Missing" jobs do nothing. Use "All".
- Run Extract Metadata > All before thumbnails and transcoding, or every video fails.

---

## Can a v2 dump go straight into v3?

The safe-sounding plan is to install the old version, restore, then upgrade. Before doing that, I compared the official compose files of both releases:

```bash
for v in v2.6.3 v3.2.4; do
  curl -sL https://github.com/immich-app/immich/releases/download/$v/docker-compose.yml | grep -E "image:|:/data"
done
```

Both used the same Postgres image, down to the digest (`ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0@sha256:bcf63357...`), and both mount the library at `/data`. The [v3 migration post](https://immich.app/blog/v3-migration) lists one breaking change that could matter for a restore, dropping pgvecto.rs, so I checked which vector extension the dump used:

```console
$ zgrep -m8 -oiE "CREATE EXTENSION[^;]*(vchord|vector)[^;]*" immich-db-backup-*.sql.gz
CREATE EXTENSION IF NOT EXISTS vchord WITH SCHEMA public
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public
$ zgrep -oE "/data/(library|upload)" immich-db-backup-*.sql.gz | sort | uniq -c
  10961 /data/library
      9 /data/upload
```

VectorChord, not pgvecto.rs, and paths under `/data`. Same database, same layout: no need for the detour through v2.

## Restore From Backup

Put the original files where `UPLOAD_LOCATION` points (`library/` and `upload/`), put the dump in `UPLOAD_LOCATION/backups/`, start the stack, and open the web UI. A fresh install shows this:

![Immich welcome screen with Getting Started and Restore From Backup](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572880/blog/restoring-an-immich-v2-backup-into-v3/images/welcome-restore-from-backup.png)

Do not click **Getting Started**: it creates a new admin and the restore option goes away. **Restore From Backup** checks that every storage folder is readable, then lists the dumps it finds. Mine warned that `profile/` was missing files (I never rescued profile pictures; they show blank) and that `thumbs/` and `encoded-video/` were empty, which is expected because Immich can regenerate both.

It ran the database migrations for the newer version on its own, and I logged in with my old account. Both users were back, and so were the 296 people with their names.

## Gotcha 1: every thumbnail is broken, and "Missing" does not fix it

![Immich timeline right after the restore, every tile says Error loading image](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572882/blog/restoring-an-immich-v2-backup-into-v3/images/photos-timeline-thumbnails-missing.png)

The obvious fix is Administration > Job Queues > **Generate Thumbnails > Missing**. It finished instantly and generated nothing.

The reason is in the server code. The "Missing" query only picks assets that have **no thumbnail row** in the `asset_file` table:

```ts
// server/src/repositories/asset-job.repository.ts (v3.3.0), streamForThumbnailJob
not(exists(file(AssetFileType.Thumbnail))),
not(exists(file(AssetFileType.Preview))),
```

A restored database has those rows for all 10,934 thumbnails. They point at files that were never restored, so as far as the query is concerned, nothing is missing. People are the same: "Missing" only regenerates a face thumbnail when `thumbnailPath` is empty.

**Generate Thumbnails > All** is the one that works after a restore. It got through about 5,400 thumbnails in its first 20 minutes on an i7-10700.

## Gotcha 2: videos fail with "Missing video metadata"

While thumbnails ran, the log filled with this, once per video:

```text
Unable to run job handler (AssetGenerateThumbnails): Error: Missing video metadata for asset b0f31c16-82fc-4b78-b2b5-88f0aee4077c
```

And **Transcode Videos > All** finished in seconds with nothing transcoded:

![Transcode Videos queue with 0 active and 0 waiting](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572883/blog/restoring-an-immich-v2-backup-into-v3/images/transcode-videos-nothing-queued.png)

v3 reads each video's codec and container from a table called `asset_video`. The v2.6.3 dump does not have that data: 2,178 videos, 0 rows. The transcode job loads the video with an inner join on that table, finds nothing, and ends as failed. Thumbnails fail the same way.

The fix is to rebuild the metadata first: **Extract Metadata > All**.

![Extract Metadata queue with about 11,000 jobs](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572884/blog/restoring-an-immich-v2-backup-into-v3/images/extract-metadata-jobs-over-time.png)

When it finished, 2,177 of 2,178 videos had their row. Then, in this order:

1. **Generate Thumbnails > All**, again, so the videos get theirs.
2. **Transcode Videos > All**, which now queued every video:

![Transcode Videos queue with 2,172 waiting](https://res.cloudinary.com/juan-vasquez/image/upload/f_auto,q_auto,w_1200,c_limit/v1791572885/blog/restoring-an-immich-v2-backup-into-v3/images/transcode-videos-queue-running.png)

Immich only transcodes videos a browser cannot play as they are, so 1,210 of 2,177 ended up with an encoded copy, about the same number the old install had.

## What I would do next time

1. Compare the old and new release `docker-compose.yml` before deciding whether to restore into the new version.
2. Restore From Backup before creating any user.
3. Extract Metadata > All.
4. Generate Thumbnails > All.
5. Transcode Videos > All.
6. Spot-check the logs for `ENOENT` and `Missing video metadata` before calling it done.
