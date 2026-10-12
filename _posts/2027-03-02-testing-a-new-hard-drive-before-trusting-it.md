---
layout: post
title: "Testing a New Hard Drive Before Trusting It With My Photos"
date: 2027-03-02 09:00:00 -0600
last_modified_at: 2027-03-02 09:00:00 -0600
categories: [development]
tags: [homelab, linux, self-hosting, hard-drive, smartctl, badblocks, hardware]
---

My home server lost its photo storage to two no-name SSDs that [fell over under sustained writes](/blog/rescuing-immich-photos-from-no-name-ssds/) while SMART said `PASSED`. So when a new 2 TB Seagate hard drive arrived for the photo library, I did not want to trust a label or a green checkmark. Before any photo went on it, the disk had to show me its history and survive having every sector written and read back.

This is what I checked, what the disk told me, and why I stopped the surface test halfway.

---

## TL;DR

- Read the motherboard manual before picking a SATA port. Some ports turn off when an M.2 is installed.
- `smartctl -a` tells you more than `PASSED`: power-on hours, old self-tests, and the hottest the disk has ever been.
- `badblocks -wsv` erases the whole disk, so run it only on an empty one, inside `tmux`, with the temperature logged.
- One full write and read pass with 0 errors was enough for me to move on.

---

## The server and the port

The server is an ASUS TUF GAMING B460M-PLUS with an i7-10700, running Linux Mint 22.2. The system disk is a WD Green SATA M.2 in the `M.2_1` slot.

That slot matters. The board manual says it in one line:

```text
* M.2_1 shares bandwidth with SATA6G_1. When M.2_1 runs SATA mode,
SATA6G_1 will be disabled.
```

A SATA M.2 in `M.2_1` turns off the first SATA port. A disk plugged in there does not show up at all, and it may be part of why a disk "disappeared" on this server before, next to an SSD that was failing on its own. The new disk went on `SATA6G_2`, and Linux confirmed it on the second port, with the M.2 on the first:

```text
$ ls -l /dev/disk/by-path/ | grep -v part
pci-0000:00:17.0-ata-1 -> ../../sda
pci-0000:00:17.0-ata-2 -> ../../sdb

$ lsblk -o NAME,SIZE,TYPE,TRAN,MODEL
NAME     SIZE TYPE TRAN   MODEL
sda    223.6G disk sata   WDC WDS240G2G0B-00EPW0
sdb      1.8T disk sata   ST2000VM003-1ET164
```

1.8T is the 2 TB on the box, counted in powers of two.

On my server the new disk is `sdb`. In the commands below I write `/dev/sdX`: replace it with your disk's name from `lsblk`, and check the model and size first. Two of these commands erase the disk.

## What SMART said

```bash
sudo smartctl -a /dev/sdX
```

The header (trimmed):

```text
Model Family:     Seagate Video 3.5 HDD
Device Model:     ST2000VM003-1ET164
Firmware Version: SC12
User Capacity:    2 000 398 934 016 bytes [2.00 TB]
Rotation Rate:    5900 rpm
SATA Version is:  SATA 3.1, 6.0 Gb/s (current: 6.0 Gb/s)
SMART overall-health self-assessment test result: PASSED
```

`PASSED` is where most people stop. The attribute table is where the story is (columns trimmed):

```text
ID# ATTRIBUTE_NAME          VALUE WORST THRESH WHEN_FAILED RAW_VALUE
  1 Raw_Read_Error_Rate     118   100   006    -           196902168
  5 Reallocated_Sector_Ct   100   100   010    -           0
  7 Seek_Error_Rate         100   253   030    -           16099
  9 Power_On_Hours          100   100   000    -           13
 12 Power_Cycle_Count       100   100   020    -           10
189 High_Fly_Writes         094   094   000    -           6
190 Airflow_Temperature_Cel 075   037   045    In_the_past 25 (0 142 25 24 0)
192 Power-Off_Retract_Count 100   100   000    -           9
194 Temperature_Celsius     025   063   000    -           25 (0 22 0 0 0)
197 Current_Pending_Sector  100   100   000    -           0
198 Offline_Uncorrectable   100   100   000    -           0
199 UDMA_CRC_Error_Count    200   200   000    -           0
```

The good part:

- **13 power-on hours.** Close to new.
- **0 reallocated, 0 pending, 0 offline uncorrectable sectors.** These are the ones that predict a dying disk.
- **0 CRC errors**, so the cable is fine, and the link runs at the full 6 Gb/s.
- The huge raw numbers on `Raw_Read_Error_Rate` and `Seek_Error_Rate` are normal on Seagate. Several counters are packed into one number.

The part that made me look twice:

- **It once overheated.** Attribute 190 says `In_the_past`. Its normalized value is 100 minus the temperature (075 at 25 °C), so a worst of 037 means it once reached 63 °C. That is below the threshold of 045 (55 °C), which is what the flag records.
- **Someone had tested it before me.** The self-test log already had four short tests:

```text
Num  Test_Description    Status                  Remaining  LifeTime(hours)
# 1  Short offline       Completed without error       00%         7
# 2  Short offline       Completed without error       00%         7
# 3  Short offline       Completed without error       00%         1
# 4  Short offline       Completed without error       00%         0
```

- **6 high-fly writes and 9 power-off retracts**, on a disk with 13 hours.

`smartctl -x` confirmed the temperature peak:

```text
Lifetime    Min/Max Temperature:     22/63 Celsius
```

So it is either a disk that sat on a shelf and went through some factory or seller testing, or a refurbished disk whose counters were reset. The numbers alone cannot tell which.

### FARM: the second hour counter, when there is one

Newer Seagate disks keep a FARM log with their own power-on hours, separate from SMART. A refurbisher who resets SMART usually does not reset FARM, so a big number there would mean a used disk. This model is too old for it:

```text
$ sudo smartctl -l farm /dev/sdX
FARM log (GP Log 0xa6) not supported
```

No second opinion, then. That left the surface test as the real check.

## badblocks, inside tmux

`badblocks -w` writes a pattern to every block and reads it back. It destroys everything on the disk, which was fine: it was empty.

> `badblocks -w` erases the whole disk you point it at, with no confirmation. Replace `sdX` with your new, empty disk, and run `lsblk -o NAME,SIZE,MODEL` right before to make sure. Pointed at the wrong letter, it wipes that disk instead.
{: .prompt-danger }

```bash
sudo badblocks -wsv -b 4096 /dev/sdX
```

```text
Checking for bad blocks in read-write mode
From block 0 to 488378645
Testing with pattern 0xaa:   0.05% done, 0:06 elapsed. (0/0/0 errors)
```

My first run was in a plain SSH session from my Mac. If the Mac slept or the connection dropped, the test would die with it. Ctrl+C, and start it again inside `tmux` on the server:

```bash
ssh homelab
tmux new -s badblocks
sudo badblocks -wsv -b 4096 /dev/sdX
# Ctrl+B, then D to detach. Later: tmux attach -t badblocks
```

`tmux` refused to start:

```text
missing or unsuitable terminal: xterm-ghostty
```

The server did not know my terminal, [Ghostty](https://ghostty.org/). Copying its terminfo entry from the Mac fixed it:

```bash
infocmp -x xterm-ghostty | ssh homelab -- tic -x -
```

Then a new SSH session, and the test was running in a session that would outlive my laptop.

## Watching the temperature

A disk that had already hit 63 °C once was about to spend a day writing nonstop. I wanted the temperature in a log, not a guess.

The `drivetemp` kernel module puts SATA disk temperatures into `sensors`, readable without sudo:

```bash
sudo modprobe drivetemp
echo drivetemp | sudo tee /etc/modules-load.d/drivetemp.conf
```

```text
$ sensors drivetemp-*
drivetemp-scsi-1-0
Adapter: SCSI adapter
temp1:        +30.0 C  (low  =  +1.0 C, high = +61.0 C)
                       (crit low =  +2.0 C, crit = +60.0 C)
```

That is the Seagate, already under badblocks. A second `tmux` window wrote a line every 10 minutes to `~/hdd-temp.log` (`hwmon10` was the Seagate on my server; check `/sys/class/hwmon/hwmon*/device/model` for yours):

```bash
tmux new-window -d -t badblocks -n templog \
  'for i in $(seq 1 240); do
     echo "$(date +%F\ %T) hdd=$(( $(cat /sys/class/hwmon/hwmon10/temp1_input)/1000 ))C bb=$(pgrep -x badblocks >/dev/null && echo running || echo stopped)" >> ~/hdd-temp.log
     sleep 600
   done'
```

```text
2026-10-07 00:24:08 hdd=31C bb=running
2026-10-07 00:34:09 hdd=32C bb=running
...
2026-10-07 09:44:17 hdd=33C bb=running
2026-10-07 09:54:17 hdd=33C bb=running
```

The highest reading in the whole log was 34 °C. Whatever pushed it to 63 °C before, it was not this case under ten hours of writes.

## How long it takes, and why I stopped it

Without `-t`, badblocks runs four patterns (`0xaa`, `0x55`, `0xff`, `0x00`), and each one writes the whole disk and then reads it back. Twelve minutes in, it was at 6.46% of the first write, so each pass took about three hours. Eight passes on a 5900 rpm disk that slows down toward its inner tracks: somewhere between 25 and 35 hours.

That was a lot of waiting for a disk I wanted to use the same week. One pass with a random pattern (`-t random`) should have fit in a night, but I never made the switch, so the four-pattern run kept going. Almost ten hours later:

```text
Testing with pattern 0xaa: done
Reading and comparing: done
Testing with pattern 0x55:  57.33% done, 9:47:09 elapsed. (0/0/0 errors)
```

The three numbers are read errors, write errors and corruption errors. Pattern `0xaa` had written every sector and read every one back with zero errors. That is the coverage that catches bad sectors and a disk that dies early, which were the real risks. The [bad RAM stick](/blog/finding-a-bad-ram-stick-with-memtest86/) I found a day later was still in the server during this run, but bad RAM tends to add false errors, not hide real ones, so a clean result still counts. The remaining patterns would have added about 20 more hours, for problems that only show up with specific data.

So I stopped it:

```text
Testing with pattern 0x55: ^C8.64% done, 9:50:07 elapsed. (0/0/0 errors)
Interrupted at block 286372736
```

The `^C` printed over the first digit: it stopped at 58.64% of the second pattern. To be exact about what this disk passed: one full write and read of the whole surface, plus a bit more than half of a second write, with 0 errors. Not the full four-pattern test.

Compare that with the no-name SSD from the rescue. Its badblocks run wrote at 8 to 9 MB/s, then the drive vanished from the USB bus about 1.2 GB in, and badblocks counted the failures:

```text
19.24% done (0/47808970/0 errors)
```

That one had said `PASSED` too.

## SMART again

The surface test means little if the disk quietly remapped sectors while it ran. So, SMART one more time:

```text
  5 Reallocated_Sector_Ct   0x0033   100   100   010    Pre-fail  Always       -       0
  9 Power_On_Hours          0x0032   100   100   000    Old_age   Always       -       23
187 Reported_Uncorrect      0x0032   100   100   000    Old_age   Always       -       0
190 Airflow_Temperature_Cel 0x0022   068   037   045    Old_age   Always   In_the_past 32 (0 142 34 24 0)
194 Temperature_Celsius     0x0022   032   063   000    Old_age   Always       -       32 (0 22 0 0 0)
197 Current_Pending_Sector  0x0012   100   100   000    Old_age   Always       -       0
198 Offline_Uncorrectable   0x0010   100   100   000    Old_age   Offline      -       0
```

Still 0 reallocated, 0 pending, 0 uncorrectable, now at 23 hours. The `In_the_past` flag is the same old 63 °C event; the worst value is still 037.

## Formatting it

The disk passed, so it got one GPT partition and ext4. This command erases the disk too. Its first line refuses to go on unless `/dev/sdX` is the disk with the serial you expect, because `sdX` names can change between boots. Read the serial off the label or from `lsblk -o NAME,SERIAL,MODEL`, and put it in place of `<your-disk-serial>`:

```bash
[ "$(lsblk -dno SERIAL /dev/sdX)" = "<your-disk-serial>" ] || { echo "WRONG DISK, stop"; false; } && \
sudo parted -s /dev/sdX mklabel gpt mkpart data ext4 1MiB 100% && \
sudo mkfs.ext4 -L data -m 0 /dev/sdX1 && \
sudo mkdir -p /mnt/data && \
echo "UUID=$(sudo blkid -s UUID -o value /dev/sdX1) /mnt/data ext4 defaults,noatime,nofail 0 2" | sudo tee -a /etc/fstab && \
sudo systemctl daemon-reload && sudo mount -a && \
sudo chown "$USER":"$USER" /mnt/data && df -h /mnt/data
```

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1       1.8T   28K  1.8T   1% /mnt/data
```

- `-m 0`: ext4 reserves 5% for root by default, about 100 GB on this disk. On a data-only disk that reserve is wasted.
- `noatime`: reading a file does not cause a write.
- Mount by `UUID=`, never `/dev/sdX`. The letter can change between boots.
- `nofail`: if the disk ever fails to mount, the server still boots. Immich writes marker files into its folders and checks them at startup, so it refuses to run instead of filling the system SSD. Anything else that writes under `/mnt/data` does not check, so a disk that fails to mount has to be noticed and fixed quickly.

That disk now holds the photo library behind my [private Immich setup](/blog/a-private-immich-setup-for-a-home-server/).

## What I would do with the next disk

- Check the motherboard manual for shared M.2 and SATA lanes before plugging anything in.
- `smartctl -a`, and read the attributes, the self-test log and the lifetime temperature, not the `PASSED` line.
- On a Seagate, try `smartctl -l farm` for a second hour count.
- Load `drivetemp` and log the temperature during the test.
- Run `badblocks -wsv` inside `tmux` on the server, never in a session that dies with your laptop.
- One full pattern with `(0/0/0 errors)` and a clean SMART afterwards is my bar. If you have the time, let all four patterns finish.
- Do it inside the return window.
