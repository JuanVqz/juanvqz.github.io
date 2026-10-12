---
layout: post
title: "A Private File Share on a Home Server With Samba and Tailscale"
date: 2027-02-09 09:00:00 -0600
last_modified_at: 2027-02-09 09:00:00 -0600
categories: [development]
tags: [samba, homelab, tailscale, linux, self-hosting, security]
---

My wife Kenia and I wanted one folder on the home server that both of us can open from the Mac and from our iPhones, at home and away. No cloud account, no app to install, nothing reachable from the internet.

Samba does that with the tools already on the devices: Finder on the Mac, the Files app on the iPhone. Tailscale handles the "away" part, the same way it does for [Immich](/blog/a-private-immich-setup-for-a-home-server/).

Setting up the share took a few minutes. The surprise was the firewall: `ufw` had never been on.

---

## TL;DR

- Install Samba on the host, not in Docker, so `ufw` filters it.
- Samba-only users in one group, a setgid folder, SMB3 only, no guests.
- Ubuntu's stock `smb.conf` overrides some hardening you add at the top. Check with `testparm -s`.
- `systemctl is-active ufw` can say `active` while `ufw status` says `inactive`. Check the second one.

---

## Why on the host and not in Docker

Docker [inserts its own firewall rules](https://docs.docker.com/engine/network/packet-filtering-firewalls/) for published ports, ahead of `ufw`. A Samba container publishing `445:445` would be open to the whole LAN whatever `ufw` says. Samba from the distro's packages is a normal process, and `ufw` filters it like anything else.

```bash
sudo apt update && sudo apt install -y samba
```

## Users and the folder

The share is for two people. Neither of them needs to log in to the server, so their accounts have no shell and no home folder. They exist only to own files and to hold a Samba password:

```bash
sudo groupadd share
sudo useradd --system --no-create-home --shell /usr/sbin/nologin -G share juan
sudo useradd --system --no-create-home --shell /usr/sbin/nologin -G share kenia
sudo smbpasswd -a juan
sudo smbpasswd -a kenia
```

`smbpasswd` keeps its own password database, separate from the Linux one. My server login account is not a Samba user at all.

The folder lives on the 2 TB data disk:

```bash
sudo mkdir -p /mnt/data/share
sudo chown root:share /mnt/data/share
sudo chmod 2770 /mnt/data/share
```

The `2` is the setgid bit: anything created inside gets the `share` group instead of the creator's own group, so a file Kenia saves is one I can edit, and the other way around.

## The share

The share definition lives in my homelab repo and gets deployed to the server with the rest of the configs. `/etc/samba/smb.conf` pulls it in with one line at the end:

```ini
include = /srv/homelab/services/samba/homelab.conf
```

```ini
[share]
   comment = Homelab shared files
   path = /mnt/data/share
   valid users = @share
   read only = no
   browseable = yes
   guest ok = no
   # new files and folders stay in the share group and editable by both users
   force group = share
   create mask = 0660
   directory mask = 2770
   # better behavior with the Mac Finder and the iPhone Files app
   vfs objects = fruit streams_xattr
   fruit:metadata = stream
```

`valid users = @share` means members of the group, not "anyone with a Samba password". If I add a Samba user later for something else, a scanner for example, it does not get into this folder by accident. Adding a person to the share is the `useradd` line plus `smbpasswd`.

[`vfs_fruit`](https://www.samba.org/samba/docs/current/man-html/vfs_fruit.8.html) is Samba's module for Apple clients. With `streams_xattr` it keeps Finder metadata in extended attributes. Resource forks stay in `._` files, the default: the man page marks `fruit:resource = stream` as experimental and warns against it with `streams_xattr`, because most filesystems limit how big an extended attribute can be. I had that line in my first version.

`testparm` checks a config file without touching the running server, and does not need root:

```bash
testparm -s /srv/homelab/services/samba/homelab.conf
```

## Hardening, and the defaults that undo it

Under `[global]` in `/etc/samba/smb.conf` I added:

```ini
[global]
   server min protocol = SMB3
   restrict anonymous = 2
   map to guest = never
   smb ports = 445
   load printers = no
   printing = bsd
   printcap name = /dev/null
   disable spoolss = yes
```

- **SMB3 only.** macOS and the iPhone Files app both speak it.
- **No anonymous access**, and a wrong user name is refused instead of falling back to guest.
- **Port 445 only.** Without `smb ports`, `smbd` also listens on 139, the old NetBIOS port.
- **No printers.** Nothing here prints.

Then `testparm` still said:

```text
map to guest = Bad User
```

The server runs Linux Mint, which ships Ubuntu's Samba package. Its stock `smb.conf` sets `map to guest = bad user` about 80 lines further down, and in Samba the last value wins. It also ships a `[printers]` and a `[print$]` share, and `usershare allow guests = yes`. I deleted the stock `map to guest` line, set `usershare allow guests = no`, and commented out both printer sections with `;`.

Read the merged result rather than the file:

```console
$ testparm -s 2>/dev/null | grep -E '^\[|map to guest|restrict anon|min protocol|smb ports'
[global]
	restrict anonymous = 2
	server min protocol = SMB3
	smb ports = 445
[share]
```

Only two sections are left, and `map to guest` is gone from the output: `testparm -s` hides settings that equal the default, and `Never` is the default. `testparm -sv` prints everything if you want to see it.

`nmbd`, the NetBIOS name service, is not needed either. Clients reach the server by its Tailscale name:

```bash
sudo systemctl restart smbd
sudo systemctl disable --now nmbd
```

Later changes to the share file only need a reload, which keeps open connections:

```bash
sudo smbcontrol all reload-config
```

## The firewall that was never on

The plan was simple: allow 445 from the LAN and from Tailscale. I added the rules and checked from the Mac before any of the hardening above, and port 139 answered from the LAN. `smbd` was listening there, but with 445-only rules, that should not happen.

```console
$ systemctl is-active ufw
active
$ sudo ufw status
Status: inactive
```

The first one only says the systemd unit ran at boot. It is a oneshot unit that stays `active` after it exits, whether or not it loaded any rules. The second one is the firewall. It had been off the whole time, and the rules I had added were saved but never applied.

Until Samba, the only TCP port open to the LAN was SSH, so the gap had not cost anything yet. With a file share listening, it mattered.

A second trap: while `ufw` is inactive, `ufw status` prints only `Status: inactive`, not the rules. To see what is about to be applied:

```console
$ sudo ufw show added
Added user rules (see 'ufw status' for running firewall):
ufw allow 22/tcp
ufw allow from 192.168.0.0/24 to any port 445 proto tcp
ufw allow from 192.168.0.0/24 to any port 22 proto tcp
ufw allow in on tailscale0
ufw allow 41641/udp
```

That list had an old `ufw allow 22/tcp`, SSH from anywhere, IPv6 included. Out it went:

```bash
sudo ufw delete allow 22/tcp
```

Only my own devices can reach `tailscale0`, so I allow everything on it. The full set:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.0.0/24 to any port 445 proto tcp
sudo ufw allow from 192.168.0.0/24 to any port 22 proto tcp
sudo ufw allow in on tailscale0
sudo ufw allow 41641/udp
```

`41641/udp` is the port Tailscale uses for direct connections between devices.

The SSH rule has to be there before `ufw enable`. The session that runs it survives either way, because `ufw` keeps established connections, but without the rule every new SSH connection is refused, including the next one after a reboot. Keep that session open until a new one connects, and if it all goes wrong, `sudo ufw disable` at the server's keyboard undoes it.

```console
$ sudo ufw enable
$ sudo ufw status verbose
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), deny (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
445/tcp                    ALLOW IN    192.168.0.0/24
22/tcp                     ALLOW IN    192.168.0.0/24
Anywhere on tailscale0     ALLOW IN    Anywhere
41641/udp                  ALLOW IN    Anywhere
Anywhere (v6) on tailscale0 ALLOW IN    Anywhere (v6)
41641/udp (v6)             ALLOW IN    Anywhere (v6)
```

## Checking it from the Mac

```bash
nc -vz -G 3 <server-ip> 445                   # LAN: open
nc -vz -G 3 <server-ip> 9999                  # LAN: Operation timed out
nc -vz -G 3 homelab.<tailnet>.ts.net 445      # Tailscale: open
smbutil view -N //guest@<server-ip>           # Authentication error
```

The 9999 line is the one that proves the firewall. Nothing listens there, so without a firewall the server answers right away with `Connection refused`. A timeout means `ufw` dropped the packet.

SSH from a new terminal still worked, Immich still answered over Tailscale, and the Immich containers could still reach the internet with `deny (routed)` in place.

## Connecting

On the Mac, Finder > Go > Connect to Server (`Cmd+K`), then `smb://homelab.<tailnet>.ts.net`, then the Samba user and password:

![Finder connected to the homelab server as juan, showing the share folder](/assets/img/posts/a-private-file-share-on-a-home-server-with-samba/finder-connected-as-juan.png)

On the iPhone, open Files, tap the `...` button on Browse, then Connect to Server, and use the same address. The server then shows up under Shared:

![iPhone Files app Browse screen with Homelab listed under Shared](/assets/img/posts/a-private-file-share-on-a-home-server-with-samba/iphone-files-browse-homelab.png){: width="360" }

![iPhone Files app showing the share folder with one file](/assets/img/posts/a-private-file-share-on-a-home-server-with-samba/iphone-files-share-folder.png){: width="360" }

The address is the Tailscale name, so the same entry works on the home Wi-Fi and on mobile data, as long as Tailscale is connected.
