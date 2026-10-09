---
layout: post
title: "Open a Server-Only Web App on Your Laptop With an SSH Tunnel"
date: 2026-12-29 09:00:00 -0600
last_modified_at: 2026-12-29 09:00:00 -0600
categories: [development]
tags: [ssh, networking, homelab, immich, docker, linux, macos]
---

My home server runs [Immich](https://immich.app/) in Docker. On purpose, it only listens on the server itself: `127.0.0.1:2283`. Nothing else on my network can reach it, not even my Mac sitting next to it.

That is great for security and a problem the moment you need the web UI. I had to click "Restore from backup" in a browser, and the server has no screen or browser. The browser on my Mac could not reach the app.

One SSH command fixed it. I typed `http://localhost:2283` on my Mac and got the Immich instance running on the server. This post is what that command does, because it is also the simplest way I know to understand what a reverse proxy is.

## The setup

- The server is reachable with `ssh homelab` (an alias in `~/.ssh/config`).
- Immich's Docker compose publishes the port only on the loopback interface:

```yaml
ports:
  - '127.0.0.1:2283:2283'
```

On the server, `ss` confirms it:

```console
$ ss -tlnp | grep 2283
LISTEN 0      4096                     127.0.0.1:2283       0.0.0.0:*
```

From the Mac, going straight to the server's LAN address fails, as intended:

```console
$ curl 192.168.0.25:2283/api/server/ping
curl: (7) Failed to connect to 192.168.0.25 port 2283 after 375 ms: Couldn't connect to server
```

## The command

```bash
ssh -N -L 2283:localhost:2283 homelab
```

Leave it running and open `http://localhost:2283` on the laptop.

Read `-L 2283:localhost:2283` as **listen here : send there**:

- The first `2283` is a port **on my laptop**. SSH opens it and waits.
- `localhost:2283` is the destination **as seen from the server**. `localhost` there means the server itself, not my laptop.
- `homelab` is the server SSH connects to.
- `-N` means "do not open a shell". I only want the tunnel.

## What happens when the browser loads the page

```text
Browser on the Mac
  -> localhost:2283 on the Mac (the ssh process is listening)
  -> inside the encrypted SSH connection to the server
  -> the server's sshd connects to localhost:2283 (Immich)
  <- the response comes back the same way
```

The browser thinks it is talking to a local app. Immich thinks the request came from the server itself. Nothing new is exposed on the network: the only traffic crossing the LAN is a normal SSH connection.

You can see who is listening on the laptop:

```console
$ lsof -nP -iTCP:2283 -sTCP:LISTEN
COMMAND   PID USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
ssh     45216 juan    5u  IPv6  ...          0t0  TCP [::1]:2283 (LISTEN)
ssh     45216 juan    6u  IPv4  ...          0t0  TCP 127.0.0.1:2283 (LISTEN)
```

It is `ssh`, not Immich. If the tunnel closes, `localhost:2283` stops loading on the laptop, but Immich keeps running on the server.

## The two ports do not have to match

The laptop side is any free port you like:

```console
$ ssh -f -N -L 8099:localhost:2283 homelab
$ curl localhost:8099/api/server/version
{"major":3,"minor":3,"patch":0,"prerelease":null}
```

`-f` sends SSH to the background after it connects. Close it later with `pkill -f "ssh -f -N -L 8099"` or by finding its PID with `lsof`.

Picking another port is also how you get around this error, which shows up when the local port is already taken (in my case by a tunnel I had left open):

```text
bind [127.0.0.1]:2283: Address already in use
channel_setup_fwd_listener_tcpip: cannot listen to port: 2283
Could not request local forwarding.
```

Add `-o ExitOnForwardFailure=yes` and SSH quits on that error instead of staying connected with no tunnel, which is easy to miss.

## Keep it in `~/.ssh/config`

If you open the same tunnel often, give it its own host entry:

```text
Host homelab-immich
  HostName 192.168.0.25
  User admin
  IdentityFile ~/.ssh/homelab_ed25519
  LocalForward 2283 localhost:2283
```

Now `ssh -N homelab-immich` opens it. Keep it out of the plain `homelab` entry: `LocalForward` applies to every connection to that host, so a second shell, an `rsync` or a script would each try to bind 2283 again and hit the error above. You can test the option without editing the file:

```bash
ssh -f -N -o "LocalForward=8098 localhost:2283" homelab
```

## Do not share the tunnel by accident

By default the laptop end listens only on the laptop's own loopback (`127.0.0.1` and `[::1]` in the `lsof` output above). Other devices on your Wi-Fi cannot use it.

If you write `-L 0.0.0.0:2283:localhost:2283`, SSH listens on every IPv4 interface of your laptop, and anyone on the same network can reach the app through you. Sometimes that is what you want. Usually it is not.

## How this connects to a reverse proxy

A reverse proxy does the same thing in spirit: it listens somewhere public-facing and forwards requests to an app that is not exposed directly. The SSH tunnel is that idea at its smallest:

| | SSH local forward | Reverse proxy (Caddy, Traefik, Nginx) |
|---|---|---|
| Who uses it | Only you, from the machine running `ssh` | Everyone who can reach the proxy |
| How long | While the command runs | Always on, as a service |
| Picks the app by | Port | Hostname or path (`photos.example.com`) |
| Encryption | SSH | TLS certificates the proxy manages |

Once "listen here, forward there" clicks with SSH, a proxy config reads the same way: a listener, and a destination behind it.

For day-to-day access I now use [Tailscale](https://tailscale.com/). Every device gets a private network address, and [`tailscale serve`](https://tailscale.com/docs/features/tailscale-serve) puts Immich behind HTTPS at an address like `https://homelab.<tailnet>.ts.net`, so the phones reach it too. It is the same idea as the tunnel: a listener in front of an app that only listens on `127.0.0.1`. The SSH tunnel is still what I reach for when I need a one-off look at something on a server.
