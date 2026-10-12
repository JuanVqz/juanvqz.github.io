---
layout: post
title: "Driving Claude Code on My Mac From My iPhone"
date: 2027-03-16 09:00:00 -0600
last_modified_at: 2027-03-16 09:00:00 -0600
categories: [development]
tags: [claude-code, tailscale, ssh, tmux, iphone, homelab, macos]
---

I rebuilt my home server from a Claude Code session running on my Mac. It went on for days, and many of the steps were waits: a copy running, a scan finishing, a command for me to run. I wanted to answer from the couch, or from somewhere else, without walking back to the desk.

Claude Code has an official feature for this, and it was blocked on my account. What I use instead is plain SSH: Tailscale, the free tier of Termius on the iPhone, and tmux on the Mac. It also turned out to be the easiest way to run the `sudo` commands the session could not run itself.

---

## TL;DR

- Remote Control said `Error: Remote Control is disabled by your organization's policy`. The account belongs to an organization that has it turned off.
- Tailscale gives the iPhone a private path to the Mac. Termius (free) is the SSH app. tmux keeps the session alive when the phone disconnects.
- The SSH key from the phone only works from Tailscale addresses, with `from="100.64.0.0/10,127.0.0.1,::1"` in `authorized_keys`.
- Read the host fingerprint prompt. Mine was for the wrong machine.
- The Mac has to stay awake.

---

## Remote Control was the first try

[Remote Control](https://code.claude.com/docs/en/remote-control) connects the Claude app or claude.ai/code to a Claude Code session running on your machine. It is the official answer to "continue this from my phone". On my Mac it stopped at the first command:

```console
$ claude remote-control --help
Error: Remote Control is disabled by your organization's policy. Contact your organization admin for access.
```

The docs explain why: on Team and Enterprise plans, an Owner has to turn Remote Control on in the admin settings first. The Claude Code on my Mac is signed in to an organization that has it off, and that is not my setting to change.

So I went back to the old way of using a computer from somewhere else: SSH.

## The pieces

- **Tailscale** was already on the Mac, the server and my phone for [Immich](/blog/a-private-immich-setup-for-a-home-server/). Every device gets a private address and a name like `<machine>.<tailnet>.ts.net`, reachable from home or away.
- **Remote Login** on the Mac turns on its SSH server.
- **Termius** on the iPhone is the SSH client.
- **tmux** on the Mac holds the Claude Code session, so the phone can attach to it, drop, and attach again.

## Termius or Blink

The two SSH apps I looked at were Blink Shell and Termius. Blink's strong point is [Mosh](https://blink.sh/), which keeps a connection alive when the phone sleeps or moves from Wi-Fi to cellular. That fits a long Claude Code session well. But Blink is a subscription after a free trial, and I did not want to pay for something I was trying for the first time.

Termius has a free plan, Starter, that [includes SSH](https://termius.com/pricing). Its App Store listing says Starter has Mosh too, but Mosh also needs `mosh-server` on the other end, and I did not want to install anything else on the Mac. So I use plain SSH, and a dropped connection stays dropped: I reconnect and run `tmux attach` again. Since tmux keeps the session running on the Mac, nothing is lost, it only costs a few taps.

## Setting it up

### 1. Turn on Remote Login on the Mac

[Apple's steps](https://support.apple.com/guide/mac-help/allow-a-remote-computer-to-access-your-mac-mchlp1066/mac): **System Settings > General > Sharing**, click the info button next to **Remote Login**, and turn it on. Under the access option, pick **Only these users** and leave only your own user.

To check that it is listening, from the Mac:

```console
$ nc -z -G 3 127.0.0.1 22
Connection to 127.0.0.1 port 22 [tcp/ssh] succeeded!
```

### 2. Make a key in Termius

In Termius I generated a new key, type ED25519. Copy the public key (the line that starts with `ssh-ed25519`) and get it to the Mac. I sent it in a message to the Claude Code session.

### 3. Add the key, only for Tailscale

The key goes in `~/.ssh/authorized_keys` on the Mac, with one option in front of it:

```text
from="100.64.0.0/10,127.0.0.1,::1" ssh-ed25519 AAAA...(the key)... termius-iphone
```

`from=` is an [`authorized_keys` option](https://man.openbsd.org/sshd.8#AUTHORIZED_KEYS_FILE_FORMAT): the key only works when the connection comes from an address in that list, and the list accepts CIDR ranges. `100.64.0.0/10` is the range [Tailscale assigns its addresses from](https://tailscale.com/kb/1015/100.x-addresses). `127.0.0.1` and `::1` allow the Mac itself.

The result: the phone's key works over Tailscale and nowhere else. A device on my home Wi-Fi holding a copy of that key would still be rejected, because its address is a `192.168.x.x` one.

The file needs the usual permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 4. Add the host in Termius

A new host with the Mac's Tailscale name, `<machine>.<tailnet>.ts.net`, my Mac user, and the key from step 2.

## Two things that went wrong

### "unknown node or service"

My first connection failed. Termius said it could not establish the connection, and the error was "unknown node or service".

The Mac was fine: port 22 answered on its Tailscale address. Running `tailscale status` on the Mac showed the reason:

```text
100.x.y.z   <phone>   <account>@   iOS   offline, last seen 3h ago
```

I had turned Tailscale off on the phone earlier and forgot. The `ts.net` name only works with Tailscale connected. I turned it on and the name resolved.

### The fingerprint was for the wrong machine

The next try showed the usual first-connection prompt: the authenticity of the host can't be established, here is its ECDSA fingerprint, continue?

It is tempting to tap Continue. Instead I compared it with the Mac's own host keys. On the Mac:

```bash
for f in /etc/ssh/ssh_host_*_key.pub; do ssh-keygen -lf "$f"; done
```

And what the Mac answers with over Tailscale:

```bash
ssh-keyscan -t ecdsa <machine>.<tailnet>.ts.net | ssh-keygen -lf -
```

Those two matched each other, and neither matched the fingerprint on the phone. I ran the same `ssh-keygen` loop on my home server, and its ECDSA fingerprint was the one Termius showed.

The Termius host was pointing at the server, not the Mac. I had typed the server's name in the address. Nothing bad would have happened if I had accepted, since it was my own server, but this is the exact case the prompt exists for: you think you are connecting to one machine and you are connecting to another. I cancelled, fixed the address, and the fingerprint on the next prompt matched the Mac.

## The tmux part

On the Mac, before leaving the desk:

```bash
tmux new -s homelab
cd ~/code/mine/homelab && claude
```

From Termius on the phone:

```bash
tmux attach -t homelab
```

The phone now shows the same Claude Code session as the Mac, and I can type into it. To leave without closing it, detach with `Ctrl-b` then `d` ([tmux's default prefix and binding](https://man.openbsd.org/tmux.1)). If the connection drops, the session keeps running on the Mac, and `tmux attach -t homelab` picks it up where it was. The Remote Control docs give the same advice for a `claude` running on a remote machine: start it inside tmux or screen, so it survives the SSH connection.

### Why tmux and not tmate or Zellij

I remembered a tmux alternative that "creates an SSH link", and checked both candidates. Neither was installed on the Mac or the server. tmux was already on the Mac from Homebrew.

- **tmate** is a fork of tmux for pairing. It shares your session through a relay server, and anyone with the link gets in. That is the wrong shape for a session that can run commands on my server, and I already have a private network. Its [README](https://github.com/tmate-io/tmate) also says the public tmate servers shut down in July 2025, so today it needs a server of your own.
- **Zellij** is a friendlier multiplexer, with on-screen hints instead of shortcuts to memorize. It also has a [web client](https://zellij.dev/documentation/web-client.html), off by default. Over SSH from Termius it would work like tmux.

tmux was already there and already does the job, so I kept it.

## The server too

Once the Mac worked, I put the same Termius key on the home server, in its `authorized_keys`, with the same `from="100.64.0.0/10,127.0.0.1,::1"` restriction. A second host in Termius points at the server's Tailscale name. This time the right fingerprint on the prompt is the server's, the one I had seen by mistake on the Mac host.

Now the phone reaches both: the Mac for the Claude Code session, and the server directly.

## What I ended up using it for

The surprise was not prompting Claude from the phone. It was `sudo`.

The Claude Code session reaches the server over SSH as my user, but it does not have my `sudo` password, and I want to keep it that way. Every step that needs root comes back to me. With Termius, that loop works from anywhere:

1. Claude prepares the commands, numbered, one per block.
2. I paste them into Termius, on the server host, and type the password there.
3. I tell the session I am done, and it checks the result from the Mac.

That is how I installed Samba, set up its users and shared folder, and later ran OpenRGB to turn off the server's RAM and motherboard LEDs. All of it from the phone, with the Claude Code session on the Mac checking each step.

## The Mac has to stay awake

None of this works if the Mac is asleep: the phone has nothing to connect to. (Remote Control has the same requirement: its docs say your computer has to stay on and the `claude` process has to keep running.)

Apple's [sleep settings](https://support.apple.com/guide/mac-help/set-sleep-and-wake-settings-mchle41a6ccd/mac) have the switch:

- **MacBook:** System Settings > Battery > Options > **Prevent automatic sleeping on power adapter when the display is off**.
- **Desktop Mac:** System Settings > Energy > **Prevent automatic sleeping when the display is off**.

On a laptop, that only holds while it is plugged in.

## What it takes

- Tailscale on the Mac, the server and the phone.
- Remote Login on the Mac.
- Termius, free plan, with one ED25519 key.
- That key in `authorized_keys`, limited to `100.64.0.0/10` plus localhost.
- tmux, and a session started before leaving the desk.
- A Mac that does not sleep.
