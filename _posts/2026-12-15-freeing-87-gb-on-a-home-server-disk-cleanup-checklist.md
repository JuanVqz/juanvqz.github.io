---
layout: post
title: "Freeing 87 GB on My Home Server: A Disk Cleanup Checklist"
date: 2026-12-15 09:00:00 -0600
last_modified_at: 2026-12-15 09:00:00 -0600
categories: [development]
tags: [homelab, linux, macos, docker, disk-space, immich]
---

My home server runs Linux Mint on a 240 GB SSD while I wait for two 4 TB disks. `df` said 127 GB were used, and I was sure there wasn't 127 GB of anything on that machine. By the end of the afternoon it was at 40 GB, and nothing I cared about was lost.

This is the checklist I followed, in the order I'd follow it again, with the command for each step and what it gave back. At the end there are the tools that do part of this for you: [Mole](https://github.com/tw93/mole) on the Mac, and a few Linux equivalents.

The photos in this story are the ones from [Rescuing 20,000 Immich Photos From Two No-Name SSDs](/blog/rescuing-immich-photos-from-no-name-ssds/).

---

## TL;DR

- Measure first: `df -h /` for the total, then `sudo du -xh --max-depth=1 / | sort -rh` to see where it goes.
- Your own files are usually the biggest item. Verify them against your backups with checksums before deleting.
- Docker, Timeshift snapshots, system logs, the apt cache and old kernels are the usual suspects on a Linux box.
- Files deleted from a file manager go to the Trash. They still take space.
- Remove the `/etc/fstab` line of a disk you retired, and check the file before rebooting.

| Step | Freed |
|---|---|
| Photos already backed up elsewhere, browser caches | 66 GB |
| Docker, Timeshift, logs, apps, kernels | 19 GB |
| apt cache and the Trash | 2 GB |
| **Total** | **87 GB (127 GB to 40 GB used)** |

---

## 1. Measure before deleting anything

```bash
df -h /
du -xh --max-depth=1 / 2>/dev/null | sort -rh | head
```

`-x` keeps `du` on one filesystem, so it skips `/proc` and other mounts. Mine said:

```console
/dev/sda2       219G  127G   81G  62% /

107G	/
67G	/home
21G	/timeshift
14G	/usr
3.6G	/var
```

`df` said 127 GB, `du` added up to 107 GB. The 20 GB gap was folders my user can't read, `/var/lib/docker` above all, which `du` silently skips when the errors go to `/dev/null`. Run it with `sudo` to see everything, or ask each tool for its own number (`docker system df`, below).

Then go one level deeper wherever the big number is:

```bash
du -xh --max-depth=2 ~ 2>/dev/null | sort -rh | head
```

```console
66G	/home/me/Pictures/photos
39G	/home/me/Pictures/photos/phone-1
27G	/home/me/Pictures/photos/phone-2
1.2G	/home/me/.cache
```

---

## 2. Your own files: prove they're backed up, then delete

66 of the 127 GB were photos I copied to the server long ago. They were also in my rescued backups, as far as I knew. "As far as I knew" is not enough to delete photos, so I checked by content:

```bash
cd ~/Pictures && find photos -type f -print0 | xargs -0 -P4 -n50 md5sum > /tmp/pictures.md5
```

Four `md5sum` processes in parallel hashed 12,717 files (66 GB) in about six minutes. I compared that list with the md5 lists of my backup sets, then read the matching backup copies again from their disks to make sure they were still intact. The result:

- **10,938 photos and videos** matched a backup copy, and every backup copy checked out: 0 damaged, 0 missing.
- **1,773 files** were `._*` AppleDouble files that macOS leaves behind when it copies to a non-Mac disk. Not photos.
- **6 files** had the same name and the same size as a backup copy, but 32 to 128 bytes in the middle were different. One of the two copies had bad-sector damage.

`ffmpeg` decodes a file and reports errors, which tells you which copy is broken:

```bash
ffmpeg -v error -i IMG_2917.MOV -f null -
```

The server copy threw decode errors in 4 of the 6 and the backup copy in none. For the other 2 both decoded cleanly, so I kept both versions of all 6 in the backup before deleting anything on the server. Same name and same size hid different content, again. Only the checksum caught it.

With that settled, deleting the folder gave back 66 GB.

---

## 3. Caches you'll never miss

On a box I only use over SSH, the browser and thumbnail caches are pure leftovers:

```bash
du -sh ~/.cache/*
rm -rf ~/.cache/mozilla ~/.cache/thumbnails   # with Firefox closed
```

1.2 GB. Everything under `~/.cache` can be rebuilt by the program that wrote it.

---

## 4. Docker

```bash
docker system df
```

```console
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          7         3         8.678GB   4.471GB (51%)
Local Volumes   3         0         876.6MB   876.6MB (100%)
```

The only thing running was an old Immich install whose data folder pointed at a disk I had retired. I stopped it and removed everything:

```bash
cd ~/Server/immich-app && docker compose down --volumes
docker system prune --all --volumes --force
```

**`--volumes` deletes data**, not only images. A database that lives in a named volume goes with it. Run `docker volume ls` first and only prune volumes you're sure about. Without `--all`, `prune` only removes dangling images (untagged leftovers); with it, every image not used by a container goes too.

---

## 5. Timeshift snapshots

[Timeshift](https://github.com/linuxmint/timeshift) ships with Linux Mint and takes system snapshots (here `/home` was excluded). Mine kept four snapshots from April plus one taken that day: 21 GB.

```bash
sudo timeshift --list
sudo timeshift --delete --snapshot '2026-04-11_16-00-01' --scripted
```

Snapshots share unchanged files through hard links, so deleting four of five didn't free four fifths. It took `/timeshift` from 21 GB to 16 GB. I also lowered the daily count from 5 to 2 (`count_daily` in `/etc/timeshift/timeshift.json`, or in the Timeshift app), so it doesn't climb back.

---

## 6. System logs (journald)

`journald` is where systemd keeps the system log: boot messages, service output, errors. It grows until it hits its own limit, which defaults to a share of the disk.

```bash
journalctl --disk-usage
sudo journalctl --vacuum-size=100M
```

To keep it small for good, a drop-in file sets the limit without touching the main config:

```bash
sudo mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=200M\n' | sudo tee /etc/systemd/journald.conf.d/size.conf
sudo systemctl restart systemd-journald
```

1.0 GB down to 66 MB.

---

## 7. Desktop apps on a server

The machine came with a full Mint desktop. Over SSH I'll never open Thunderbird, LibreOffice or a music player:

```bash
sudo apt-get purge -y thunderbird 'libreoffice*' hypnotix celluloid rhythmbox pix \
  drawing transmission-gtk warpinator webapp-manager simple-scan sticky thingy \
  mintwelcome onboard gnome-calendar
```

I kept Firefox, the desktop itself and Timeshift. If you never use the screen, `sudo systemctl set-default multi-user.target` boots to a text console and saves RAM; `sudo systemctl start lightdm` brings the desktop back.

---

## 8. Old kernels

Every kernel update leaves the previous one installed, with its modules and headers. I had five:

```bash
dpkg -l 'linux-image-*' | grep ^ii
uname -r
```

Keep the one you're running (`uname -r`) and the newest. I removed the other three:

```bash
sudo apt-get purge -y 'linux-*6.14.0-29*' 'linux-*6.14.0-37*' 'linux-*6.17.0-14*'
```

Check `uname -r` right before running it. Removing the running kernel is the one way this step can hurt.

Steps 4 to 8 together took the disk from 61 GB to 42 GB used.

---

## 9. The apt cache

apt keeps every package it ever downloaded in `/var/cache/apt/archives`:

```bash
sudo apt-get autoremove --purge -y
sudo apt-get clean
```

I ran them chained with `&&` the first time, and the cache was still 1.9 GB afterwards. Running `apt-get clean` again on its own emptied it. Check with `du -sh /var/cache/apt` instead of assuming.

---

## 10. The Trash

Deleting a folder from the file manager moves it to `~/.local/share/Trash`. It still takes space. Mine also held a `postgres` folder owned by root, left behind by Docker, which only `sudo` could remove:

```bash
du -sh ~/.local/share/Trash
sudo rm -rf ~/.local/share/Trash/*
```

---

## 11. Retired disks in /etc/fstab

Not disk space, but it turned up in the same cleanup: `/etc/fstab` still mounted the SSD I had retired. With `nofail` the server boots anyway, but systemd keeps a mount unit for a disk that will never come back. I removed the line and checked the file before rebooting:

```bash
sudo sed -i '/carbonera/d' /etc/fstab     # carbonera was the old mount point
cat /etc/fstab
sudo findmnt --verify
sudo systemctl daemon-reload
```

`findmnt --verify` checks every line of `fstab`. If it reports an error, fix it before rebooting: a broken `fstab` can stop a machine from booting.

---

## The result

```console
/dev/sda2       219G   40G  168G  19% /
```

What's left is the operating system itself (`/usr` is 12 GB) and one Timeshift snapshot (16 GB). There's nothing more worth removing.

---

## Tools that do part of this for you

### Mac: Mole

[Mole](https://github.com/tw93/mole) is an open-source command-line cleaner for macOS (`brew install mole`). It cleans caches, uninstalls apps with their leftovers, finds old project folders like `node_modules`, and has a disk explorer. Every destructive command has a `--dry-run`; the [README](https://github.com/tw93/mole#readme) lists them all.

On my Mac, `mo clean --dry-run` found 12.78 GB of caches. The better find was in its report of what it won't touch: Docker Desktop was using 92 GB, more than half of it reclaimable. Mole is macOS only; the README mentions an experimental Windows branch and nothing for Linux.

### Linux

None of these does everything Mole does, but together they cover it. All of them are in the Ubuntu 24.04 repositories that Mint 22 uses:

| Tool | What it's for |
|---|---|
| [ncdu](https://dev.yorhel.nl/ncdu) | Interactive `du`: browse folders by size and delete from the list |
| [gdu](https://github.com/dundee/gdu) | Same idea as ncdu, written in Go and faster on SSDs |
| [duf](https://github.com/muesli/duf) | A readable `df`: every disk and mount in one table |
| [BleachBit](https://www.bleachbit.org/) | Cache and log cleaner with a GUI and a CLI: `bleachbit --list-cleaners`, `--preview`, `--clean` |
| [Stacer](https://github.com/oguzhaninan/Stacer) | GUI system optimizer: cleaner, startup apps, services, package uninstaller |

On a headless server I'd install `ncdu` or `gdu` for step 1 and do the rest by hand with the commands above. Docker, Timeshift and old kernels are where the space was, and no general cleaner knows your Docker volumes or your snapshots better than you do.

---

## What I'd do differently

- **Check what is on the disk before assuming it is full of nothing.** Half of it was photos I already had in two other places.
- **Never trust a filename and a size.** That's the second time the same name and size hid different bytes.
- **Look at the numbers after each step.** The apt cache I thought I'd cleared was still there.
- **Check more often.** A `df -h` once a month, or a `duf` alias in the shell, would have caught this long before the disk was over half full.
