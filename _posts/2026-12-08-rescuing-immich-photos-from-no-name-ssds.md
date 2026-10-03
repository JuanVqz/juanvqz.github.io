---
layout: post
title: "Rescuing 20,000 Immich Photos From Two No-Name SSDs"
date: 2026-12-08 09:00:00 -0600
last_modified_at: 2026-12-08 09:00:00 -0600
categories: [development]
tags: [immich, ssd, data-recovery, smartctl, ext4, homelab, linux, macos]
---

My home server ran [Immich](https://immich.app/) in Docker. The photos lived on two 1 TB SSDs, sold to me as Kingston, one per Immich install. Then the server started losing disks. I pulled both SSDs, plugged them into my Mac, and only one showed up.

This is how I got the photos off without making things worse, proved every copy was good, and found out both SSDs were no-name drives that fall over under sustained writes while SMART says everything is fine.

---

## TL;DR

- Stop writing to the disk. Don't click "Initialize", don't run `fsck` on the only copy.
- On macOS, `debugfs -c` from `e2fsprogs` reads a damaged ext4 read-only, without mounting it.
- Copy in small chunks and check each one before moving on.
- To decide whether two sets hold the same files, compare checksums, not sizes. Size matching nearly cost me 69 photos and videos.
- `SMART PASSED` proves little on a cheap SSD. Read the attributes, then run a write test.
- A drive that reports its model as `SSD 1TB` is a no-name drive, whatever the seller said.

---

## Don't make it worse

macOS greets a Linux disk with "The disk you attached was not readable by this computer" and offers **Initialize**. I clicked it by accident. It only opens Disk Utility; nothing is erased until you press **Erase**.

My rules from then on:

1. Nothing writes to the damaged disk.
2. No repair tools (`fsck`, "First Aid") on a disk that holds the only copy. A repair writes metadata and can make files harder to get back.
3. Every photo exists in two verified places before any disk gets erased or tested.

---

## Reading a damaged ext4 on a Mac

`diskutil list` showed the disk with a `Linux Filesystem` partition: the drive was responding, and macOS can't read ext4. Homebrew's `e2fsprogs` includes `debugfs`, which reads ext4 straight from the device and opens read-only unless you pass `-w`:

```bash
brew install e2fsprogs
sudo /opt/homebrew/opt/e2fsprogs/sbin/debugfs -R "ls -l /" /dev/disk5s1
```

It refused:

```console
/dev/disk5s1: Block bitmap checksum does not match bitmap while reading allocation bitmaps
ls: Filesystem not open
```

`dumpe2fs -h` showed the `needs_recovery` flag: the disk had been unplugged from Linux without a clean unmount, so the journal still held unapplied changes and the free-space bitmaps didn't match their checksums. My files don't live in the bitmaps. `debugfs -c` (catastrophic mode) skips them and opens the filesystem anyway, still read-only:

```bash
sudo /opt/homebrew/opt/e2fsprogs/sbin/debugfs -c -R "ls -l /Server/immich-app" /dev/disk5s1
```

Inside was the whole Immich folder.

To let scripts read the partition without a password prompt, I made that device node readable by every local user. It resets on unplug and allows no writes:

```bash
sudo chmod o+r /dev/disk5s1
```

### Was this a "rescue"?

The gentle kind. **Logical recovery** means the drive reads fine and the filesystem is damaged, so you read around the damage with `debugfs`, `testdisk` or a read-only mount. That was my case. **Physical recovery** means the drive fails to read sectors: image it with [`ddrescue`](https://www.gnu.org/software/ddrescue/) and work on the image, and if the folders are gone too, [`photorec`](https://www.cgsecurity.org/wiki/PhotoRec) carves photos out of raw data. I had zero read errors, so copying the files out was enough.

---

## What to copy from Immich

| Folder | What | Needed? |
|---|---|---|
| `library/<user>/<year>/<date>/` | Originals | Yes |
| `upload/` | Originals not yet moved by the storage template | Yes |
| `backups/` | Daily Postgres dumps | The latest one: albums, people, metadata |
| `thumbs/`, `encoded-video/` | Previews and transcodes | No, Immich regenerates them |

Skipping the last row saved 38 GB. The dump name carries the versions (`v2.6.3-pg14.19`); restore it on that same Immich version, then upgrade.

---

## Copy in chunks, verify each one

I didn't want a three-hour copy that ends in an error. So a script walked the tree once with `debugfs ls -p`, then copied one user and one year at a time with `debugfs -c -R "rdump <dir> <dest>"`, checked every file in that chunk (present, exact size), wrote the result to a `MAP.md` and moved on:

```console
18:11:47 [3/23] OK library/admin/2023 (587 files, 11.87 GB)
18:16:46 [4/23] OK library/admin/2025 (1326 files, 7.96 GB)
```

23 chunks, 12,160 originals, 81.5 GB, about an hour, followed by an md5 of 45 random files read again from the SSD.

Two things threw the counts off. macOS `._*` AppleDouble files: the second SSD had thousands from an old Mac copy (`._DJI_0030.MP4` looks like a video to a filename filter), and my first count of files only on the second SSD was 17,002 instead of 7,853. And six "missing" files with mode `000000` weren't files at all: their changes were still in the journal.

---

## Why size matching lied

The second SSD held an older Immich install plus a Google Takeout. I first compared it to the rescue by name and size, then by size alone for renamed files, and treated about 2,400 same-size files as duplicates. Later I hashed all 18,496 photos and videos on it:

```console
SSD2 media: 18496; found in rescue 1: 10574; only in rescue 2: 7853; NOT rescued: 69
```

69 files had the same size as a rescued file and different content. I copied them off right away and checked them with md5 on both destinations. Use checksums.

---

## The journal gave two photos back

Plugged into a Linux laptop, the first SSD auto-mounted and the kernel logged `EXT4-fs (sda1): recovery complete`. Linux had replayed the journal, and two files appeared that weren't there before: my last uploads from the day the drive was unplugged. Reading read-only on another OS shows the state before the journal. Replaying it (ideally on an image) can bring back the last writes.

---

## Identifying a no-name SSD sold as a brand

I paid the normal Kingston price. Nothing on the outside made me doubt it. The label can be faked; what the drive reports to the operating system is harder to fake. macOS and Windows often show the USB enclosure's name, so check on Linux with `smartctl`:

```bash
sudo apt install smartmontools
sudo smartctl -a -d sat /dev/sda
```

```console
Device Model:     SSD 1TB
Serial Number:    001929
Firmware Version: VE0R5305
```

A genuine drive reports its brand and model number, and a long serial that matches the sticker. Mine had every red flag:

- **A generic model name.** `SSD 1TB` is not a product.
- **A tiny serial.** `001929` and `000430`.
- **The same unknown firmware on both "different" drives:** `VE0R5305`.
- **`Device is: Not in smartctl database`** and a list of `Unknown_Attribute` lines. smartmontools knows the big brands.

The brand's own tool (Kingston SSD Manager, Samsung Magician, WD Dashboard) is a second check: if it doesn't recognize the drive, it isn't theirs.

---

## Testing health while you can still return it

Both drives said `SMART overall-health self-assessment test result: PASSED`. The attributes disagreed:

| Attribute | SSD 1 | SSD 2 |
|---|---|---|
| `Reallocated_Sector_Ct` | 0 | 2,320 |
| `Reported_Uncorrect` | 0 | 290 |
| ATA errors logged | 0 | 66 |

SSD 2 was failing. SSD 1 looked clean, so it got the real tests. Both erase the drive.

**`badblocks`** writes every block and reads it back:

```bash
sudo badblocks -wsv -t random -b 4096 -c 4096 /dev/sda
```

It wrote at 8 to 9 MB/s over a 5 Gb/s link. A real SSD does hundreds. About 1.2 GB in, the kernel logged `uas_eh_abort_handler` on writes and the SSD vanished from behind the USB bridge.

**`f3probe`** (from [f3](https://github.com/AltraMayor/f3)) checks real capacity in minutes. I ran it with SSD 1 in the other enclosure, to rule the enclosure out:

```console
Bad news: The device `/dev/sda' is damaged
         *Usable* size: 0.00 Byte (0 blocks)
        Announced size: 953.87 GB (2000409264 blocks)
```

It fell off the bus again. Two enclosures, same result, and SMART never noticed. That's also what my server had been doing.

For any new drive: `smartctl`, then `f3probe`, then a full write while watching the speed, then `smartctl` again, all inside the return window. And a branded SSD at a branded price from a marketplace seller is the riskiest buy, because the price gives no warning.

---

## The SATA port that turned itself off

The server board is an ASUS TUF GAMING B460M-PLUS (WI-FI). Its manual says, under "Connectors with shared bandwidth":

> M.2_1 shares bandwidth with SATA6G_1. When M.2_1 runs SATA mode, SATA6G_1 will be disabled.

My system disk is a SATA M.2 in `M.2_1`, so anything on `SATA6G_1` was invisible. Read that page of your manual before blaming disks, and mount by `UUID=` in `/etc/fstab`.

---

## What I would do now

- Keep the WD Green M.2 as the system disk: Linux, Docker, the Immich database.
- Put the library on a CMR NAS hard drive from a known brand, bought from the store itself.
- Add a second one, from another batch, for a nightly backup.
- Test every new disk before it gets a single photo.

SSD 1 now carries PDFs to the print shop. SSD 2 dropped off the bus in the middle of `diskutil eraseDisk`, which says enough.
