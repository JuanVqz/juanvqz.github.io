---
layout: post
title: "Custom Domain Email for $0: What Zoho's Free Plan Actually Gives You"
date: 2026-11-03 09:00:00 -0600
last_modified_at: 2026-11-03 09:00:00 -0600
categories: [development]
tags: [email, dns, cloudflare, zoho, spf, dkim, dmarc]
---

## The Problem

My résumé says `hello@juanvasquez.dev`. My replies came from a Gmail address that says nothing of
the sort.

That is because `hello@` was never a real mailbox. It was a Cloudflare Email Routing rule
forwarding everything at my domain into Gmail. Free, five minutes to set up, works perfectly —
in one direction. Cloudflare Email Routing **receives and forwards. It cannot send.** There is no
SMTP server behind it, so there is nothing for Gmail to hand an outgoing message to.

So every time a recruiter replied, I answered from a personal address that did not match the one on
the document they were reading. Small thing. Also the kind of small thing you would rather not
explain.

The plan was simple: add Zoho Mail's free tier, point Gmail's "Send mail as" at Zoho's SMTP, done.

That plan does not work, and it took me a while to find out why.

---

## What Zoho's free plan quietly stopped including

Zoho Mail still has a Forever Free plan in 2026. Custom domain, five users, 5&nbsp;GB each. It is
real and it is genuinely free.

It is also **webmail-only by design**. From Zoho's own pricing page:

> No se incluye IMAP/POP/Active Sync

And inside the account, each feature says it individually:

| Feature | Free plan |
|---|---|
| Email forwarding | Paid plans only |
| POP | Paid plans only |
| IMAP | "Not available for your account" |
| Send/receive in Zoho webmail and mobile app | ✅ |

Every route into Gmail is closed. No forwarding, so mail cannot be pushed out of Zoho. No POP or
IMAP, so Gmail cannot pull it in. No SMTP for external clients, so Gmail cannot send through it
either.

This is not a misconfiguration you can settle with an afternoon of settings. It is the shape of the
tier.

---

## The setup that actually works, still for $0

Here is the thing I got wrong at the start: **I assumed I had to move my email to Zoho.** I did not.
Receiving was never broken. Cloudflare was already doing it well and for free.

Only *sending* was missing. Once I saw that, the answer got much smaller:

| | |
|---|---|
| **Receiving** | Cloudflare Email Routing catch-all → Gmail (**unchanged**) |
| **Sending** | Zoho webmail and mobile app, as `hello@juanvasquez.dev` |
| **MX records** | **never touched** |
| **Cost** | $0 |

Zoho's free plan can send from its own webmail. It just cannot let another client send for it. If
you are willing to compose in Zoho instead of Gmail, the free tier does the one job you needed.

Not moving MX is the good part. The MX switch is the only step in this kind of migration that can
break incoming mail, and skipping it means there is never a window where anything bounces. My
catch-all keeps working, so every address I have ever invented for a signup still arrives.

---

## The DNS work

Three records. Two are mandatory the moment you send anything you care about.

### 1. SPF: authorize both senders

My existing record only authorized Cloudflare. Mail leaving Zoho's servers would fail SPF outright.

```
v=spf1 include:zoho.com include:_spf.mx.cloudflare.net ~all
```

**Edit the existing record. Do not add a second one.** A domain must publish exactly one SPF record;
two is a permanent error condition, and worse than a wrong one. Cloudflare's include stays because
it is what keeps *forwarded* mail passing checks at Gmail.

### 2. DKIM: sign the mail

In Zoho's Admin Console: Domains → your domain → Email Configuration → DKIM → add a selector
(`zmail` is the default), then publish the generated key as a TXT record at
`zmail._domainkey`.

Skipping DKIM is the most common reason mail from a fresh custom domain lands in spam.

### 3. DMARC: optional, 30 seconds

```
Name:    _dmarc
Content: v=DMARC1; p=none; rua=mailto:hello@juanvasquez.dev
```

`p=none` is monitor-only. It changes nothing about delivery and just tells receivers you are paying
attention.

---

## The gotcha that cost me the most time

I had a **wildcard CNAME** on the domain, sending every undefined subdomain to a Railway app:

```
*.juanvasquez.dev → ux1wdw8n.up.railway.app
```

Harmless for the web app. Actively hostile while debugging DNS, because *every name you check
answers*:

```console
$ dig +short TXT zmail._domainkey.juanvasquez.dev
ux1wdw8n.up.railway.app.

$ dig +short TXT default._domainkey.juanvasquez.dev
ux1wdw8n.up.railway.app.
```

On a normal domain those return nothing, and any checker tells you plainly that DKIM is missing.
With a wildcard, a **misnamed DKIM record does not fail loudly**. It answers with something that
is not a key, and tools report it as an odd value rather than an absence.

Two things follow:

1. **Verify your domain with the TXT method, not CNAME.** A CNAME-based ownership check is
   ambiguous when the name already resolves to something else.
2. **After publishing DKIM, confirm you get a key back**, not the wildcard:

   ```console
   $ dig +short TXT zmail._domainkey.juanvasquez.dev
   "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ..."
   ```

`ux1wdw8n.up.railway.app.` means **missing**. Only `v=DKIM1` means present.

---

## Verify it, do not assume it

The dashboard is not the source of truth. Public DNS is:

```console
$ dig +short TXT juanvasquez.dev
"v=spf1 include:zoho.com include:_spf.mx.cloudflare.net ~all"
"zoho-verification=zb92679339.zmverify.zoho.com"

$ dig +short TXT _dmarc.juanvasquez.dev
"v=DMARC1; p=none; rua=mailto:hello@juanvasquez.dev"

$ dig +short MX juanvasquez.dev
35 route2.mx.cloudflare.net.
49 route1.mx.cloudflare.net.
66 route3.mx.cloudflare.net.
```

Then send a real message to [mail-tester.com](https://www.mail-tester.com) and read the score. Mine
came back **10/10**, SPF and DKIM both passing, not blocklisted. Write a couple of sentences of
normal prose rather than the word "test" — one-word emails score badly for reasons that have
nothing to do with your DNS.

One warning that stays forever in this setup: Zoho's admin console will keep showing **"Yet to point
MX Records"** in amber. That is correct. It means Zoho does not receive your mail, which is exactly
the arrangement. Nothing is wrong.

---

## The compromise

I am not going to pretend this is free of friction, because it is not:

**Your threads split.** You send from Zoho. The reply arrives in Gmail, because Cloudflare forwards
it there. Replying again means going back to Zoho and composing fresh, without the quoted history.

For a first contact, fine. For a five-message negotiation, irritating.

The paid escape hatch is small: Zoho Mail Lite adds IMAP/POP/SMTP for around a dollar a month, which
is enough to wire Gmail's "Send mail as" and put everything back in one inbox. Google Workspace at
$7 makes the whole question disappear.

I am staying on $0 until the split threads actually annoy me. It is easier to justify a
subscription after you have felt the problem than before.

---

## Would I recommend it?

If you want **one professional address on a domain you own, sending and receiving, for nothing** —
yes, and it takes under an hour.

Just go in knowing what the free tier is: Zoho's free plan is a **webmail-only mailbox**, not a mail
service you can plug other clients into. Every guide promising Gmail integration on the free tier
was written before those features moved behind the paywall.

And the general lesson, which cost me the most time here: **check whether the thing you assume is
broken actually is.** I spent an evening planning a migration of my inbound mail. Inbound was fine
the whole time. Only sending was missing, and that turned out to be the small half of the problem.

---

## What is your setup?

This is the best free arrangement I found, but I doubt it is the only one. If you are sending from
a domain you own without paying for it — a different provider, an SMTP relay, a self-hosted setup,
something I have not thought of — I would genuinely like to hear it.

Tell me what you use and what it cost you in friction, on
[GitHub](https://github.com/JuanVqz) or [X](https://x.com/juanvqz_). If something better turns up I
will update this post and credit you.
