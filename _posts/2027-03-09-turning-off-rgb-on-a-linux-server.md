---
layout: post
title: "Turning Off RGB on a Headless Linux Server with OpenRGB"
date: 2027-03-09 09:00:00 -0600
last_modified_at: 2027-03-09 09:00:00 -0600
categories: [development]
tags: [homelab, linux, openrgb, systemd, ram, hardware]
---

My home server is an old gaming PC. It sits in a corner, nobody looks at a screen on it, and its three RAM sticks glow in rainbow colors all night. These are the same Corsair Vengeance RGB Pro sticks from the [bad RAM stick hunt](/blog/finding-a-bad-ram-stick-with-memtest86/), minus the one that failed.

The sticks have no switch, and the BIOS has no option for them. Their LED controller sits on the SMBus, so the only way to turn them off is from software. This is how I did it with OpenRGB from an SSH session, and how I keep them off after a reboot.

---

## TL;DR

- Use the OpenRGB AppImage on Ubuntu 24.04 based distros; the `.deb` does not install.
- Run it as root and set every device to black: `--noautoconnect -c 000000`, with no mode.
- A systemd oneshot runs the same command at boot.

---

## The setup

- Board: ASUS TUF GAMING B460M-PLUS (WI-FI).
- OS: Linux Mint 22.2, which is built on Ubuntu 24.04 (noble).
- RAM: three Corsair Vengeance RGB Pro DDR4 sticks.

The SMBus driver, `i2c_i801`, was already loaded. The `/dev/i2c-*` devices are root only (`crw------- root root`), so OpenRGB has to run with `sudo` to reach the RAM.

I ran everything below from my phone over SSH. Nothing here needs a desktop.

## The .deb does not install on Mint 22

[OpenRGB](https://codeberg.org/OpenRGB/OpenRGB/releases) 1.0 came out in September 2026, and its releases now live on Codeberg. The Debian bookworm `.deb` refuses to install on Mint 22. Its dependencies use Debian package names:

- `libmbedtls14`, `libmbedcrypto7`, `libmbedx509-1` and `libqt6widgets6`. Ubuntu 24.04 renamed these with a `t64` suffix during its 64-bit `time_t` transition, so it has `libmbedtls14t64` and `libqt6widgets6t64` instead.
- `libhidapi-hotplug-hidraw0` and `libhidapi-hotplug-libusb0` (>= 0.15.0). Ubuntu does not ship these at all. It has `libhidapi-hidraw0` 0.14.

The trixie `.deb` is for Debian 13, so that one is out too. The AppImage has no such problem. It needs FUSE 2, and `libfuse2t64` was already installed:

```sh
sudo install -D -m 755 OpenRGB_1.0_x86_64_81bbe18.AppImage /opt/openrgb/OpenRGB.AppImage
```

## Listing the devices

```sh
sudo /opt/openrgb/OpenRGB.AppImage --noautoconnect -l
```

`--noautoconnect` tells it not to try to connect to a local OpenRGB server first. The command takes 15 to 20 seconds and looks hung the whole time. It is scanning the buses. Then it lists four devices, each with a block of details I trimmed here:

```text
0: Corsair Vengeance RGB Pro DDR4
1: Corsair Vengeance RGB Pro DDR4
2: Corsair Vengeance RGB Pro DDR4
3: ASUS TUF GAMING B460M-PLUS (WI-FI)
```

It also warns that the OpenRGB udev rules are not installed. The rules let a normal user reach the devices. Running as root, the warning does not matter.

## Black, without a mode

My first try set a static mode and the color black:

```sh
sudo /opt/openrgb/OpenRGB.AppImage --noautoconnect -m static -c 000000
```

It printed this three times, once per stick:

```text
Error: Mode 'static' not available for device 'Corsair Vengeance RGB Pro DDR4'
```

And yet everything went dark. Without a mode the stick does not support, OpenRGB applies the color directly. So the command I kept has no mode at all:

```sh
sudo /opt/openrgb/OpenRGB.AppImage --noautoconnect -c 000000
```

## What the board controls, and what it does not

Device 3 is the board. Before turning it off for good, I wanted to know which lights it owns, so I made it red:

```sh
sudo /opt/openrgb/OpenRGB.AppImage --noautoconnect -d 3 -m static -c FF0000
```

Only the LED strip on the board turned red. The case fans did not change, so their LEDs are not on a board RGB header. My guess is they take power from the PSU directly, which means the only way to turn them off is to unplug or replace them.

I also wanted to be sure that turning off the strip would not hide a warning. It does not. The board's fault lights are the ASUS Q-LEDs, separate from the strip and not controlled by OpenRGB. The [ASUS spec page](https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b460m-plus-wi-fi/techspec/) lists them as CPU (red), DRAM (yellow), VGA (white) and Boot Device (yellow green). The strip is decoration.

## Keeping them off after a reboot

I have not confirmed that the sticks forget their setting after a power cut, but I would rather not find out at 2 a.m. A systemd oneshot runs the same command at every boot. The 15-second sleep is a guess: if the SMBus driver loads later than that, OpenRGB finds no sticks and still exits cleanly, so the first real reboot is the actual test.

```ini
[Unit]
Description=Turn off RAM and motherboard LEDs with OpenRGB
After=systemd-modules-load.service systemd-udevd.service

[Service]
Type=oneshot
# give udev time to load i2c_i801 so the RAM sticks are found
ExecStartPre=/bin/sleep 15
# no --mode: Corsair Vengeance RGB Pro has no "static", plain colors use direct mode
ExecStart=/opt/openrgb/OpenRGB.AppImage --noautoconnect -c 000000

[Install]
WantedBy=multi-user.target
```

The 15 second sleep is a cheap guard: if the service started before the SMBus driver was ready, OpenRGB could miss the RAM sticks. The unit file lives in the server's git checkout, so I link it instead of copying it:

```sh
sudo systemctl link /srv/homelab/services/openrgb/leds-off.service
sudo systemctl enable --now leds-off.service
```

`systemctl status leds-off.service` showed the sleep, then the main command with `status=0/SUCCESS`, then "Deactivated successfully". The whole run took about 34 seconds, 1.3 seconds of it CPU time.

I have not rebooted the server since, so the boot path is still untested. The service ran fine with `--now`, which runs the same steps, but a real boot is the test that counts.

## Takeaways

- RGB RAM with no BIOS option is still controllable: it sits on the SMBus, and root can reach it.
- On Ubuntu 24.04 and its derivatives, take the OpenRGB AppImage, not the `.deb`.
- If OpenRGB says a mode is not available, drop `-m`. The plain color still applies.
- Before turning off a board's lights, check which ones are the fault indicators.
