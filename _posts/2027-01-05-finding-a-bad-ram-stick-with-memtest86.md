---
layout: post
title: "My Home Server's SSD Went Read-Only. The Culprit Was a RAM Stick"
date: 2027-01-05 09:00:00 -0600
last_modified_at: 2027-01-05 09:00:00 -0600
categories: [development]
tags: [homelab, linux, memtest86, ram, ext4, hardware, troubleshooting]
---

The morning after I restored [Immich](https://immich.app/) on my rebuilt home server, `docker compose logs -f` answered with this:

```text
Error response from daemon: can not get logs from container which is dead or marked for removal
```

The containers were "up" but `unhealthy`, and their health checks were failing in a way I had never seen:

```text
OCI runtime exec failed: open /tmp/runc-process908876061: read-only file system
```

The system disk had gone read-only overnight. This is how I traced it to one bad RAM stick, found which one with memtest86+, and got the server back without losing anything.

## The disk was read-only, and the kernel said why

`/proc/mounts` showed the root filesystem with a flag I had not seen before:

```text
/dev/sda2 / ext4 rw,relatime,errors=remount-ro,emergency_ro 0 0
```

`errors=remount-ro` is the Ubuntu default: when ext4 finds an error, it stops writing to protect the disk. The kernel log had the moment it happened, at one minute past midnight:

```text
EXT4-fs error (device sda2): ext4_lookup:1785: inode #9456551: comm rsync: iget: checksum invalid
Aborting journal on device sda2-8.
EXT4-fs (sda2): Remounting filesystem read-only
```

The `rsync` was the nightly Timeshift snapshot, reading an icon file. A checksum error on a system disk sounds like a dying SSD. But the 45 minutes before it told a different story.

## Random programs crashing at garbage addresses

```text
python3[525875]: segfault at 282f4d1402b0 ip 0000712f4ce2f740 ... error 4 in libpython3.13.so.1.0
python3[531793]: segfault at 64b94e8b78a8 ip 000071b94f2e28c8 ... error 4 in libpython3.13.so.1.0
nm-dispatcher[531642] general protection fault ip:7d7f1a8ade55 ... in libc.so.6
postgres[532076]: segfault at 280000000008 ip 000061a52fbfa5eb ... error 4 in postgres
```

Seventeen crashes: Immich's machine learning container, Postgres, and a NetworkManager helper on the host. Different programs, different CPU cores, nonsense addresses like `280000000008`.

One buggy program crashes the same way every time. Unrelated programs crashing at random points means the data under them is changing. That points at memory. The SSD error could be the same thing: a block that was corrupted in RAM before it was written.

The server has 4 x 8 GB from two Corsair kits bought nine months apart. Mixed kits are a classic source of instability, so RAM went to the top of the list.

## Save what you can before touching anything

With the root filesystem read-only, Docker could not even run `docker exec` (runc needs to write to `/tmp`), so `pg_dump` was out. But nothing had changed on that disk since 00:01, which makes a plain copy of the Postgres folder crash-consistent:

```bash
sudo tar -C /srv/homelab/services/immich -cf /mnt/data/backups/2026-10-08-ssd-readonly/postgres-raw.tar postgres
```

The data disk was a separate HDD and still writable, so the copy went there. Then `sudo poweroff`, not a reboot: on the next boot Linux tries to repair the filesystem, and running a repair on bad RAM can make things worse.

## memtest86+ without an ISO

[memtest86+](https://www.memtest.org/) boots instead of your operating system and writes known patterns to every memory address, then reads them back. It was not installed, and it could not be installed on a read-only disk, so it went on a USB stick prepared on my Mac.

The x86_64 binary in `mt86plus_8.10.binaries.zip` is already a UEFI executable (it starts with `MZ` and has a `PE` header for `0x8664`). On a UEFI board you do not need to write an ISO. A FAT32 stick with one file is enough:

```bash
diskutil eraseDisk FAT32 MEMTEST MBR disk5
mkdir -p /Volumes/MEMTEST/EFI/BOOT
cp mt86p_810_x86_64 /Volumes/MEMTEST/EFI/BOOT/BOOTX64.EFI
```

Check `disk5` with `diskutil list external physical` first: that `eraseDisk` wipes the whole stick.

Two things got in the way on the first boot:

- I missed the F8 boot menu, and Linux stopped at the `(initramfs)` prompt because of the filesystem errors. `poweroff -f` there, and nothing else.
- Booting the stick gave **"Secure Boot violation"**. memtest86+ is not signed. On this ASUS board, Boot > Secure Boot > OS Type "Other OS" turns Secure Boot off, and Linux Mint still boots fine with it.

## 256 errors in 19 seconds

![memtest86+ with all four sticks: Status Failed, Errors 128 after 19 seconds](/assets/img/posts/finding-a-bad-ram-stick-with-memtest86/memtest-4-sticks-errors.jpg)

With all four sticks, memtest86+ failed in 19 seconds and then froze with 256 errors. The interesting part is the table. Compare the expected and found values:

```text
Expected            Found
000000049e547500    0000d8049e547500
000000049e547540    000051049e547540
000000049e547600    0000d7049e547600
```

Every wrong value differs in the same byte, bits 40 to 47, and only there. A 64-bit memory bus is split across the chips on a stick, one byte each, so one bad byte in every error points at one bad chip rather than at timings or the board.

The RAM line said `1333MHz (DDR4-2666) CAS 16-18-18-35` even though the BIOS had Ai Overclock Tuner on Auto, not XMP. Forcing DDR4-2133 did not stick, and the next run failed the same way. Time to pull sticks.

## Testing pairs, then single sticks

The board manual recommends DIMM_A2 and DIMM_B2 for two sticks: the second and fourth slots counting from the CPU. I labeled the sticks 1 to 4 and tested two at a time.

The first pair did not even boot. The board beeped one long and two short on repeat, and one stick's RGB stayed dark. That stick was not fully seated. DDR4 takes more force than you expect: press until both clips close on their own. After that, both lit up and the pair ran clean.

![memtest86+ with sticks 1 and 2: 15.8 GB, 0 errors after almost 8 minutes](/assets/img/posts/finding-a-bad-ram-stick-with-memtest86/memtest-pair-1-2-clean.jpg)

The second pair, both lit and seated, failed in 10 seconds:

![memtest86+ with sticks 3 and 4: Status Failed, 254 errors after 10 seconds](/assets/img/posts/finding-a-bad-ram-stick-with-memtest86/memtest-pair-3-4-errors.jpg)

Stick 3 alone in DIMM_A2 failed right away. Stick 4 alone passed.

## Which kit was it from?

I had bought the RAM in two orders, April 2021 and January 2022, and never kept the boxes. The serial stickers sorted it out: two sticks start with `21`, two with `22`. Stick 3 starts with `21`, so it came with the April 2021 order. Corsair offers a [limited lifetime warranty](https://help.corsair.com/hc/en-us/articles/360033067832-Warranty-Corsair-Limited-Warranty) on its memory for the original buyer, with the receipt and a photo of the serial.

The three good sticks went back in: the complete 2022 kit in DIMM_A2 and DIMM_B2, the surviving 2021 stick in DIMM_A1. Three sticks is not in the manual's diagrams, but the board runs it fine (Intel calls it Flex Mode).

![memtest86+ with three sticks: 23.8 GB, Pass 1, Errors 0, PASS banner after 44 minutes](/assets/img/posts/finding-a-bad-ram-stick-with-memtest86/memtest-3-sticks-pass.jpg)

One full pass over 23.8 GB took 44 minutes, with 0 errors.

## Repairing the disk, after the RAM

Only now was it safe to fix the filesystem. Booting without the stick landed at `(initramfs)` again, and there:

```bash
fsck -f -y /dev/sda2
```

![fsck fixing free blocks and inode counts, ending with FILE SYSTEM WAS MODIFIED](/assets/img/posts/finding-a-bad-ram-stick-with-memtest86/fsck-file-system-was-modified.jpg)

Everything it fixed was bookkeeping: free block and inode counts, nine inode bitmap entries. The total free blocks were off by about 1.2 million (around 4.6 GB), which is roughly what was in flight when the journal aborted. `/lost+found` was empty afterwards, so no files were orphaned.

After the reboot, Postgres replayed its write-ahead log on its own, and a full `pg_dump` read every table without a checksum error. Immich came back as it was.

## What the RAM did and did not do

This server already had a history: two no-name SSDs that failed and started a photo rescue. It is tempting to blame all of it on the RAM. The evidence says otherwise.

- **RAM explains** the random crashes, the filesystem error, and six photos on the server that differed from their rescued copies by 32 to 128 bytes in the middle of the file. That is what bit flips during a copy look like.
- **RAM cannot explain** an SSD dropping off USB on a different computer, or SMART counting 2,320 reallocated sectors. Those counters live inside the SSD.

Two problems overlapped, and each one made the other harder to see.

## Takeaways

- Random crashes in unrelated programs are a memory symptom. Test RAM before you run `fsck` on anything.
- memtest86+ on UEFI is one file on a FAT32 stick. Turn Secure Boot off for the test.
- A dark RGB stick is not seated. Push until the clips close by themselves.
- In memtest86+, compare Expected and Found. Errors in the same byte across addresses point at one chip on one stick.
- Serial number prefixes can tell you which purchase a stick came from.
