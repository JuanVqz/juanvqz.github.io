---
layout: post
title: "Linux Mint on a MacBook Pro 2015: Getting Wi-Fi Working Offline"
date: 2026-09-09 10:00:00 -0600
last_modified_at: 2026-09-09 10:00:00 -0600
categories: [development]
tags: [linux, linux-mint, macbook, broadcom, wifi, drivers, openclaw]
---

I wanted to run [OpenClaw](https://github.com/nicories/OpenClaw) on native Linux hardware. The cheapest path? Repurpose my old MacBook Pro 2015 sitting in a drawer. I installed Linux Mint, rebooted, and immediately hit a wall — no Wi-Fi, no Ethernet port, no internet at all.

This is the first post in a short series. Here I cover getting Linux Mint fully online on a MacBook Pro 2015. The next post will cover installing and running OpenClaw on it.

---

## Why a MacBook Pro 2015?

It's the machine I had available. Mine is an i7 with 16 GB of RAM — still decent specs for casual use, but Apple stopped supporting it with macOS updates years ago. Linux Mint gives it a second life — lightweight, familiar, and well-supported. The catch is that Apple uses Broadcom Wi-Fi chips, and the proprietary drivers aren't bundled with Linux Mint.

No Ethernet port on the MacBook means you can't just plug in a cable and download the driver. You need a second machine or a workaround.

---

## Identifying the Wi-Fi Chipset

After installing Linux Mint and booting in, I opened a terminal:

```bash
lspci -nn | grep -i network
```

Output:

```
Broadcom BCM4360 802.11ac Dual Band Wireless Network Adapter
```

The BCM4360 needs the `bcmwl-kernel-source` package — a proprietary Broadcom driver that Linux Mint doesn't ship by default. Fair enough. But I had no internet to install it.

---

## Downloading the Driver on Another Machine

I grabbed my other Linux Mint laptop and downloaded the driver package without installing it:

```bash
sudo apt update
sudo apt install --download-only bcmwl-kernel-source
```

This saves the `.deb` files — including dependencies like `dkms` — to `/var/cache/apt/archives/`. That's the key detail. You don't need to hunt for individual packages; `apt` resolves everything for you.

I plugged in a USB drive and copied the relevant `.deb` files:

```bash
cd /var/cache/apt/archives/
cp bcmwl-kernel-source*.deb dkms*.deb /media/juan/USB/
```

One thing I learned: ignore any `.tar.gz` files in that directory. They're source archives, not installable packages.

---

## Installing the Driver Offline

On the MacBook, I mounted the USB, opened a terminal in that folder, and ran:

```bash
sudo dpkg -i *.deb
sudo apt -f install
```

Then loaded the driver:

```bash
sudo modprobe wl
```

Reboot:

```bash
sudo reboot
```

That was it. After reboot, Wi-Fi networks appeared in the system tray.

---

## When It Doesn't Work

If Wi-Fi doesn't show up after reboot, check two things:

```bash
lsmod | grep wl
```

This confirms the `wl` module is loaded. If it's not listed, run `sudo modprobe wl` again.

```bash
rfkill list
```

If any wireless device shows as "Soft blocked" or "Hard blocked":

```bash
sudo rfkill unblock all
```

On my MacBook, everything came up clean after the first reboot. No rfkill issues.

---

## Things to Watch Out For

**Kernel updates break the driver.** After a kernel update, the `wl` module needs to be rebuilt. Usually `dkms` handles this automatically, but if Wi-Fi disappears after an update:

```bash
sudo apt install --reinstall bcmwl-kernel-source
sudo modprobe wl
```

**Keep the `.deb` files.** I copied them to `~/drivers/` on the MacBook. If I ever need to reinstall Linux Mint, I don't want to repeat the two-machine dance.

---

## What I Learned

The hardest part of this whole process was realizing I needed a second machine. Once I had that, the actual fix took about ten minutes. The Broadcom driver situation on Linux is well-documented, but most guides assume you have internet access. The offline install path with `apt --download-only` is the trick that makes it practical.

The MacBook Pro 2015 runs Linux Mint smoothly. It boots fast, the display looks great, and with Wi-Fi working, it's a fully functional Linux box.

Next up: installing OpenClaw and seeing how this old MacBook handles it.
