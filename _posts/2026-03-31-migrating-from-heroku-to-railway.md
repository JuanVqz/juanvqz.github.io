---
layout: post
title: "Migrating a Rails App from Heroku to Railway"
date: 2026-03-31 09:00:00 -0600
last_modified_at: 2026-04-14 09:00:00 -0600
categories: [devops]
tags: [rails, heroku, railway, deployment, postgresql, doctors-journey]
---

Tonight I migrated my Doctors App from Heroku to Railway.

It's a multi-tenant Rails app where each hospital gets its own subdomain — `one.doctors.com`, `two.doctors.com`, and so on.

Five hospitals, around 25,000 appointments, 9,700+ patients. Not huge, but not trivial either.

Here's how it went, including the part where I accidentally broke the database.

## The setup

I already had a Railway project running with a test domain (`*.juanvasquez.dev`) from earlier experiments. The web service was deployed from GitHub and the Postgres 17 instance was co-located in `us-east4`. Cloudflare R2 handles file storage — that stays the same regardless of where the app runs.

The plan was simple: put Heroku in maintenance mode, dump the database, restore it to Railway, flip the DNS, and go home.

## The database restore

First, I captured a fresh Heroku backup and downloaded it:

```bash
heroku pg:backups:capture --app doctors
heroku pg:backups:download --app doctors --output /tmp/heroku_backup.dump
```

Then I wiped the Railway database and restored:

```bash
# Wipe
psql -h <railway-host> -p <port> -U postgres -d railway \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore
pg_restore --verbose --no-owner --no-acl \
  -h <railway-host> -p <port> -U postgres -d railway /tmp/heroku_backup.dump
```

The restore threw two errors — both about the `unaccent` extension. Heroku installs extensions in a `heroku_ext` schema that doesn't exist on Railway. The fix is to just create it manually afterward:

```bash
psql -h <railway-host> -p <port> -U postgres -d railway \
  -c "CREATE EXTENSION IF NOT EXISTS unaccent;"
```

Everything else restored cleanly. I verified every table:

| Table | Heroku | Railway |
|---|---|---|
| users | 9,752 | 9,752 |
| appointments | 25,481 | 25,481 |
| addresses | 9,835 | 9,835 |
| patient_referrals | 1,211 | 1,211 |
| hospitals | 5 | 5 |

All 12 tables matched exactly. If you take one thing from this post: **always verify row counts after a restore**.

## The moment I broke the database

With the data restored, I wanted to trigger a deploy on the web service. I ran:

```bash
railway up --detach
```

Without `--service web`.

That command deployed my Rails application code onto the Postgres service. It replaced the PostgreSQL 17 container with Puma. The database was now a Rails web server that couldn't handle Postgres connections.

The logs told the story immediately:

```
HTTP parse error, malformed request: #<Puma::HttpParserError:
Invalid HTTP format, parsing fails. Are you trying to open
an SSL connection to a non-SSL Puma?>
```

The web service was trying to connect to Postgres, but Postgres was now running Puma, responding to TCP connections with HTTP errors.

The fix was to roll back the Postgres service to its last good deployment — the one using the `ghcr.io/railwayapp-templates/postgres-ssl:17` image. Railway's CLI doesn't have a rollback command, so I used the dashboard to roll back the deployment.

After about 45 seconds, Postgres was back. Data intact. Lesson learned: **always pass `--service web` when deploying**.

## Flipping the domain

Removing the test domain was another adventure. Railway's CLI can add domains but can't delete them. I used the dashboard to remove it.

Then I added the production wildcard domain:

```bash
railway domain "*.doctors.com" --service web --port 8080
```

Railway returned the DNS records I needed. In Squarespace (my domain registrar), I added:

| Type | Host | Value |
|---|---|---|
| CNAME | `*` | `znjcefnu.up.railway.app` |
| CNAME | `_acme-challenge` | `znjcefnu.authorize.railwaydns.net` |

There was also a `_railway-verify` record for domain ownership. I initially tried adding it as a CNAME, but Squarespace rejected the value — it's actually a **TXT record**, not a CNAME. Small thing, but it tripped me up.

DNS propagated fast. Within a couple of minutes, Railway confirmed the domain was verified and SSL was provisioned.

## One more thing: RACK_ENV

The first request to `demo.doctors.com` returned a 500. I checked the logs and saw... a Rails development error page. `RACK_ENV` was set to `development`. A quick variable update and redeploy fixed it:

```bash
railway variable set RACK_ENV=production --service web
```

Then all five hospital subdomains came back with 200s.

## Trial plan limitations

Railway's trial plan only allows **one custom domain per service**. The wildcard `*.doctors.com` uses that single slot, which works great for multi-tenancy — every subdomain routes correctly. But I can't also add the root domain `doctors.com`. For now, I'll handle that with a redirect at the registrar level.

## Pricing

| | Heroku | Railway |
|---|---|---|
| Web service | $7/mo (Basic dyno) | Usage-based (~$5/mo) |
| Postgres | $5/mo (Mini) | Included (500MB) |
| Custom domains | Included | 1 per service (trial) |
| SSL | Automatic | Automatic |
| Chrome buildpack | Required for old PDF setup | Not needed (using Prawn now) |

For my scale, Railway is slightly cheaper. The real win is simplicity — no buildpack configuration, no add-on marketplace to navigate, and Postgres is just there.

## What I also did

While I was at it, I replaced Sentry with [Honeybadger](https://app.honeybadger.io/users/sign_up?referred_by=8eTFBiZ7EUHt8iCF) *(referral link)* for error tracking. Sentry's initializer still referenced Heroku env vars, so it was a good time to clean house. Honeybadger has a free plan, built-in uptime monitoring, and the Rails setup is just a YAML file:

```yaml
# config/honeybadger.yml
api_key: <%= ENV.fetch("HONEYBADGER_API_KEY", "") %>
env: <%= Rails.env %>
exceptions:
  enabled: <%= Rails.env.production? %>
```

I also updated the CI pipeline — upgraded Postgres from 10.13 to 17 (matching production) and Node.js from 20 to 22 (matching `package.json`). Removed the Puppeteer and Chrome setup steps that were left over from when the app used Grover for PDF generation.

## Things I'd tell myself before starting

1. **Verify row counts after every restore.** Don't trust "no errors" — count the rows.
2. **Always specify `--service` when running Railway CLI commands.** Especially `railway up`.
3. **Railway's CLI can't do everything.** Domain deletion and deployment rollbacks need to be done through the dashboard.
4. **`railway run` executes locally**, not on Railway's infrastructure. Use `railway shell` for remote access.
5. **Heroku's `heroku_ext` schema for extensions doesn't exist on Railway.** Expect restore errors for extensions, and re-create them manually.
6. **Check your RACK_ENV.** It seems obvious, but it's easy to forget when you're focused on the database.
7. **The `_railway-verify` DNS record is a TXT record**, even though it looks like it could be a CNAME. Your registrar will reject it if you pick the wrong type.

## Fair warning

Since migrating, I've seen reports from other developers that give me pause. One team experienced [persistent 150–200ms request queuing](https://www.reddit.com/r/rails/comments/1s51mfc/railway_vs_render_heroku_digital_ocean_fly_etc/) on Railway that they couldn't resolve even with Pro plan support — response times that were 40ms on Heroku, Render, and DigitalOcean. Another long-time customer [reported a caching misconfiguration](https://x.com/euboid/status/2038729202602500376) that leaked user data between accounts, on top of weeks of near-daily incidents.

I measured my own response times after reading these reports, and for my scale they're good enough. But if you're running something larger or handling sensitive data, do thorough stress testing before committing, and have a rollback plan. Railway is young, and that cuts both ways: fast iteration, but also growing pains.

## Was it worth it?

The whole migration took about an hour. Most of that was waiting for DNS propagation and debugging the Postgres incident. The actual work — dump, restore, set variables, flip DNS — was maybe 20 minutes.

Railway feels like what Heroku should have become. The dashboard is clean, deploys are fast, and the Postgres integration just works. I miss `heroku run` (Railway's local execution model is confusing at first), but `railway shell` covers most cases.

For a small multi-tenant Rails app like mine, it's a good fit. But I'm keeping my Heroku knowledge fresh — just in case.
