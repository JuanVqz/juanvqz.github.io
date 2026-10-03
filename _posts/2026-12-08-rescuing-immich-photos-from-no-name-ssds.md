---
layout: post
title: "Rescuing 20,000 Immich Photos From Two No-Name SSDs"
date: 2026-12-08 09:00:00 -0600
last_modified_at: 2026-12-08 09:00:00 -0600
categories: [development]
tags: [immich, ssd, data-recovery, smartctl, ext4, homelab, linux, macos]
---

My home server ran [Immich](https://immich.app/) in Docker. The photos lived on two 1 TB SSDs, sold to me as Kingston, one per Immich install, because I was afraid the 240 GB system disk would fill up. Then the server started losing disks. I pulled both SSDs, plugged them into my Mac, and only one showed up.

This post is what I did next: getting the photos off without making things worse, proving every copy was good, and finding out that both SSDs were no-name drives that fall over under sustained writes while SMART says everything is fine.

---

## TL;DR

- Stop writing to the disk. Don't click "Initialize", don't run `fsck` on the only copy.
- Read the filesystem read-only. On macOS, `debugfs -c` from `e2fsprogs` reads a damaged ext4 without mounting it.
- Copy in small chunks and check each one (every file present, exact size) before moving on.
- When deciding whether two sets hold the same files, compare checksums, not sizes. Size matching nearly cost me 69 photos and videos until I hashed everything.
- `SMART PASSED` proves little on a cheap SSD. Read the attributes, then run a write test (`badblocks`, `f3probe`).
- A drive that reports its model as `SSD 1TB` is a no-name drive, whatever the box or the seller said. Check every new drive with `smartctl` and a write test inside the return window.

---

## Step 0: don't make it worse

When an external disk with a Linux filesystem is plugged into a Mac, macOS shows "The disk you attached was not readable by this computer" with **Initialize**, **Ignore** and **Eject**. I clicked Initialize by accident. That only opens Disk Utility; nothing is erased until you press **Erase** there. Close Disk Utility and breathe.

The rules I followed from then on:

1. Nothing writes to the damaged disk.
2. No repair tools (`fsck`, `e2fsck`, "First Aid") on a disk that holds the only copy. A repair writes metadata, and on a damaged filesystem it can make files harder to get back.
3. Every photo has to exist in two verified places before any disk gets erased or tested.

---

## Is it the disk, the cable or the filesystem?

On macOS, `diskutil list` shows what the system sees:

```console
$ diskutil list external physical
/dev/disk5 (external, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *1.0 TB     disk5
   1:           Linux Filesystem                         1.0 TB     disk5s1
```

That tells three different stories apart:

- **The disk doesn't appear at all.** macOS doesn't see the device. Cable, port, power or a dead drive. My second SSD did this on the first try, and showed up later on another attempt.
- **The disk appears but doesn't mount.** The hardware is talking. Here it was ext4, which macOS can't read. Not broken, only foreign.
- **It mounts, but files fail to read.** That is a real problem with the media, and the moment to image the disk with `ddrescue` before anything else.

---

## Reading a damaged ext4 on a Mac

Homebrew's `e2fsprogs` includes `debugfs`, which reads ext4 straight from the device without mounting it. It opens read-only unless you pass `-w`.

```bash
brew install e2fsprogs
sudo /opt/homebrew/opt/e2fsprogs/sbin/debugfs -R "ls -l /" /dev/disk5s1
```

It refused:

```console
/dev/disk5s1: Block bitmap checksum does not match bitmap while reading allocation bitmaps
ls: Filesystem not open
```

`dumpe2fs -h` explained why. The superblock had the `needs_recovery` flag: the disk was unplugged from Linux without a clean unmount, so the journal still held changes that were never applied. The bitmaps (the map of used and free blocks) didn't match their checksums.

The bitmaps say where free space is. My files don't live there. `debugfs -c` (catastrophic mode) skips them and opens the filesystem anyway, still read-only:

```bash
sudo /opt/homebrew/opt/e2fsprogs/sbin/debugfs -c -R "ls -l /Server/immich-app" /dev/disk5s1
```

```console
 35389442   40775 (2)   1000   1000    4096 18-Dec-2025 18:27 .
 35389441   40775 (2)   1000   1000    4096 18-Dec-2025 18:21 ..
 35389443   40700 (2)    999   1000    4096 14-Apr-2026 23:39 postgres
 35389444   40755 (2)   1000   1000    4096 18-Dec-2025 18:28 library
```

Inside `library/` were `encoded-video`, `library`, `upload`, `profile`, `thumbs` and `backups`.

To let scripts read the raw partition without typing a password every time, I made that one device node readable by every local user. It resets when the disk is unplugged and allows no writes:

```bash
sudo chmod o+r /dev/disk5s1
```

Two small traps on the way: Homebrew's `blkid` crashes on macOS with `symbol not found in flat namespace '__et_list'` (a build issue, not your disk), and `debugfs ls -p` prints directory modes as `040755`, not `40755`. My first walker checked `start_with?("40")` and thought every directory was a file.

### Was this a "rescue"?

Yes, but the gentle kind. There are two levels of data recovery:

- **Logical recovery**: the drive reads fine, the filesystem is damaged. You read around the damage with tools like `debugfs`, `testdisk` or a read-only mount. That was my case.
- **Physical recovery**: the drive itself fails to read sectors. Then you image the whole disk with [`ddrescue`](https://www.gnu.org/software/ddrescue/), which retries bad areas and keeps a map, and work only on the image. If the directory structure is gone too, [`photorec`](https://www.cgsecurity.org/wiki/PhotoRec) carves photos out of raw data, at the cost of losing file names and folders.

I watched for read errors the whole time, and there were none. That's why copying the files out was enough.

---

## What to copy from Immich

Immich's library folder has more than the originals:

| Folder | What | Needed? |
|---|---|---|
| `library/<user>/<year>/<date>/` | Originals, after storage template | Yes |
| `upload/` | Originals not yet moved by the storage template | Yes |
| `backups/` | Daily Postgres dumps (`immich-db-backup-*.sql.gz`) | The latest one: albums, people, metadata |
| `thumbs/`, `encoded-video/` | Previews and transcoded video | No, Immich regenerates them |

Skipping `thumbs/` and `encoded-video/` cut 38 GB from the copy. The DB dump file name carries the Immich and Postgres versions (`v2.6.3-pg14.19`). Restore it on that same Immich version, then upgrade.

---

## Copy in chunks, verify each one

I didn't want a three-hour copy that ends in an error and leaves me guessing what made it. So the copy ran one user and one year at a time:

1. Walk the whole tree once with `debugfs ls -p` (batched, one call per directory level) and save every path with its size.
2. For each chunk, `debugfs -c -R "rdump <dir> <dest>"`.
3. Check every file in that chunk: present, exact size.
4. Write a `MAP.md` on the destination with each chunk's status, then move to the next chunk.

```console
18:11:47 [3/23] OK library/admin/2023 (587 files, 11.87 GB)
18:16:46 [4/23] OK library/admin/2025 (1326 files, 7.96 GB)
18:37:26 [14/23] OK library/.../2023 (2725 files, 20.97 GB)
```

23 chunks, 12,160 originals, 81.5 GB, about an hour. At the end, an independent check: every file present at the exact size, plus an md5 of 45 random files (including the 5 largest) read again from the SSD and compared with the copy.

Things that confused the numbers on the way:

- `rdump` prints `Operation not permitted while changing ownership` for every file. It tries to give each file its original owner (uid 1000 on the server), and my scripts ran `debugfs` as a normal user, which can't do that. The data is copied fine. Harmless.
- macOS writes `._*` AppleDouble files next to files that carry extended attributes when it copies them onto non-Mac filesystems. The second SSD had thousands of them from an earlier copy made on a Mac, and they look like photos to a filename filter (`._DJI_0030.MP4`). My first "files only on the second SSD" count said 17,002. Excluding `._*`, it was 7,853. They also appear on the exFAT destination, so exclude them on both sides.
- exFAT on a large stick uses 128 KB clusters, so 25,000 empty Immich directories ate gigabytes of `du` output with no data in them.
- Six "missing" files in `upload/` had mode `000000`. They weren't files: they were directory entries whose changes were still in the journal, never written to their final place on disk.

---

## Two installs, and why size matching lied

The second SSD held an older Immich install with a Google Takeout and other folders. To find what wasn't already rescued, I first compared by name and size, then by size alone for renamed files. That gave 7,853 files only on the second SSD, plus about 2,400 "same size, different name" files I treated as duplicates.

Later I hashed all 18,496 photos and videos on that SSD and compared md5 against both rescued sets:

```console
SSD2 media: 18496; found in rescue 1: 10574; only in rescue 2: 7853; NOT rescued: 69
```

69 files had the same size as a rescued file and different content. Size matching would have lost them. I copied those 69 (1.3 GB) off the SSD right away and checked them with md5 on both destinations. Use checksums.

---

## The journal gave two photos back

Later I plugged the first SSD into a Linux laptop. It auto-mounted, and the kernel log said:

```console
EXT4-fs (sda1): recovery complete
```

Linux had replayed the journal. A new listing showed two files that weren't there before, my last uploads from the day the drive was unplugged. The six broken entries became empty directories.

Reading read-only on another OS shows the state *before* the journal. If the disk is healthy enough, letting Linux replay the journal (ideally on an image, not the original) can bring back the last writes.

---

## Identifying a no-name SSD sold as a brand

I didn't buy these as cheap drives. The listing sold them as Kingston, at the normal Kingston price. Nothing on the outside made me doubt it. The drive itself told a different story the first time I asked it.

The label and the box can be faked. What a seller can't change easily is what the drive reports to the operating system. So the check is software first.

### Ask the drive who it is

macOS can't read SMART through most USB enclosures. Linux can, with `smartctl` and the SAT pass-through:

```bash
sudo apt install smartmontools
sudo smartctl -a -d sat /dev/sda
```

The first lines tell you what you bought:

```console
Device Model:     SSD 1TB
Serial Number:    001929
Firmware Version: VE0R5305
```

A genuine drive identifies itself with its brand and a real model number in `Device Model`, and a long serial that matches the sticker. Red flags, all of which mine had:

- **A generic model name.** `SSD 1TB` is not a product. Neither are strings like `SSD`, `512GB SATA` or the bare capacity.
- **A tiny or sequential serial.** `001929` and `000430`. Real serials are long and match the label and the box.
- **The same unknown firmware on "different" drives.** Both reported `VE0R5305`. Search the firmware string; a real brand publishes its firmware versions.
- **`Device is: Not in smartctl database`.** smartmontools knows the common models of every big brand. Not proof on its own, but it adds up.
- **Attributes named `Unknown_Attribute`.** Big brands' attributes are mostly decoded by smartctl. A wall of unknown IDs points to a generic controller.

Through a USB enclosure, macOS (`diskutil info`, System Information) and Windows (Device Manager) may show a name the enclosure reports, not the drive's own model. Linux with `smartctl -d sat` reads the drive itself, which is why I did these checks there.

### Ask the brand

- Install the brand's own tool: Kingston SSD Manager, Samsung Magician, WD Dashboard, Crucial Storage Executive. If the tool doesn't recognize the drive as one of theirs, it isn't.
- Compare the serial on the sticker with the serial the drive reports. A mismatch, or a sticker with no serial or QR code, means a relabeled drive.
- Look at the product page photos: label layout, fonts, color of the PCB, screws. Counterfeits often get the details wrong. This is the weakest check; the software checks above are stronger.

### Test it while you can still return it

A fake can report a believable model. It can't hide how it behaves under load. Run these within the return window, before trusting it with anything:

1. `smartctl -a -d sat /dev/sdX`: identity, as above.
2. `f3probe --destructive --time-ops /dev/sdX`: real usable capacity, a few minutes. Fake-capacity drives fail here.
3. A long sustained write: `badblocks -wsv` over the whole drive, or `f3write` on a mounted filesystem followed by `f3read`. Watch the speed. A real SATA SSD over USB 3 writes at hundreds of MB/s and drops to a lower steady speed when its cache fills. Mine wrote 8 to 9 MB/s and then disappeared from the bus.
4. `smartctl -a` again, and compare: new reallocated sectors or errors after one full write mean send it back.

And when buying: a branded SSD at a branded price from a marketplace seller is the riskiest combination, because the price gives you no warning. Buy from the store itself or the brand's official store.

### USB enclosure notes

- The USB bridge has its own identity: `lsblk -o NAME,MODEL,SERIAL` and the kernel log. Mine was a Realtek RTL9201 (`0bda:9201`). When the SSD behind it dies, `lsblk` shows the bridge itself (`RTL9201`, serial `012345678999`) as the disk.
- `smartctl -d auto` failing with `Unknown USB bridge` means you need `-d sat`.

---

## Testing health: SMART, then writes

Both drives said `SMART overall-health self-assessment test result: PASSED`. The attributes told different stories:

| Attribute | SSD 1 | SSD 2 |
|---|---|---|
| `Reallocated_Sector_Ct` | 0 | 2,320 |
| `Reported_Uncorrect` | 0 | 290 |
| `Program_Fail_Count_Chip` | 0 | 290 |
| ATA errors logged | 0 | 66 |
| Power-on hours | 256 | 195 |

SSD 2 was clearly failing. SSD 1 looked clean, so it needed a real test. Both of these erase the drive:

**`badblocks`** writes a pattern to every block and reads it back:

```bash
sudo badblocks -wsv -t random -b 4096 -c 4096 /dev/sda
```

It wrote at 8 to 9 MB/s over a 5 Gb/s link. About 1.2 GB in, the kernel logged `uas_eh_abort_handler` on writes, then a flood of `I/O error, dev sda ... op 0x1:(WRITE)`, and the SSD vanished from behind the bridge.

**`f3probe`** (from the [f3](https://github.com/AltraMayor/f3) package) detects fake capacity and broken flash in minutes:

```bash
sudo apt install f3
sudo f3probe --destructive --time-ops /dev/sda
```

I swapped SSD 1 into the other enclosure first, to rule the enclosure out:

```console
Bad news: The device `/dev/sda' is damaged

Device geometry:
         *Usable* size: 0.00 Byte (0 blocks)
        Announced size: 953.87 GB (2000409264 blocks)
```

It fell off the bus again, with `uas_eh_device_reset_handler FAILED err -19`. SMART still showed zero errors. Two enclosures, same result: the drive stops responding under sustained writes. That's also what my server had been doing, which I had blamed on SATA ports.

SSD 1 now carries PDFs to the print shop. Formatted as exFAT, it handles a 50 MB file, and that's all I'll ask of it. SSD 2 dropped off the bus in the middle of `diskutil eraseDisk`, which says enough.

---

## The SATA port that turned itself off

The server board is an ASUS TUF GAMING B460M-PLUS (WI-FI). Its manual has this line under "Connectors with shared bandwidth":

> M.2_1 shares bandwidth with SATA6G_1. When M.2_1 runs SATA mode, SATA6G_1 will be disabled.

My system disk is a SATA M.2 in `M.2_1`. Anything on `SATA6G_1` was invisible. Read the shared-bandwidth page of your motherboard manual before blaming disks, and mount everything by `UUID=` in `/etc/fstab`, because `/dev/sdX` names can change between boots.

---

## What I'm doing instead

This is what I would do now:

- Keep the WD Green M.2 as the system disk: Linux, Docker, the Immich database.
- Put the Immich library on a NAS hard drive (CMR) from a known brand. For photos, space and reliability matter more than speed.
- Add a second one, from another batch, for a nightly backup, so one dead disk costs nothing.
- Buy from the store itself or the brand's official store, not a marketplace seller.
- Give every new disk `smartctl`, then `badblocks`, then `smartctl` again before it gets a single photo.

---

## Checklist for next time

- [ ] Stop. No Initialize, no repair, no writes.
- [ ] Find out which layer is broken: device, filesystem or media.
- [ ] Read-only access (`debugfs -c`, read-only mount, or a `ddrescue` image).
- [ ] Skip what the app regenerates (`thumbs/`, `encoded-video/`), keep the DB dump.
- [ ] Copy in chunks, verify each chunk, keep a map.
- [ ] Compare sets by checksum, never by size.
- [ ] Two verified copies before erasing or testing anything.
- [ ] `smartctl -a -d sat`, then a write test, before trusting any drive.
- [ ] New drive? Check `Device Model` and serial, run `f3probe` and a full write, inside the return window.
- [ ] No-name drive? Use it for PDFs.
