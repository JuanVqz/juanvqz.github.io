---
layout: post
title: "I Turned My Immich Upgrade Checklist Into a Claude Code Skill"
date: 2027-01-19 09:00:00 -0600
last_modified_at: 2027-01-19 09:00:00 -0600
categories: [development]
tags: [immich, homelab, docker, self-hosting, claude-code]
---

Immich ships often. In the week I [restored my library into v3](/blog/restoring-an-immich-v2-backup-into-v3/), v3.3.0 came out the same day I finished, and v3.3.1 the next day. The web UI shows a banner for each one, and the official compose file uses a moving `release` tag, which makes upgrading as easy as `docker compose pull`.

That is also how you end up on a version with a breaking change you did not read about. Immich does not support downgrades, not even within a minor version, so I upgrade on purpose and the same way every time.

---

## TL;DR

- Pin `IMMICH_VERSION` and upgrade on purpose, after reading every release in between.
- `pg_dump` first; there are no downgrades.
- Diff the new compose files and check health, migrations and the port after.
- The whole checklist is now a public Claude Code skill.

---

## Pin the version

The official `example.env` has `IMMICH_VERSION=v3`. Mine says:

```bash
IMMICH_VERSION=v3.3.1
```

Nothing changes unless I change that line.

## Read what changed

```bash
gh release list -R immich-app/immich -L 5
gh release view v3.3.1 -R immich-app/immich
```

Read every release between the one you run and the target, not only the newest. Immich also tags breaking changes in its [discussions](https://github.com/immich-app/immich/discussions?discussions_q=label%3Achangelog%3Abreaking-change). Both of my upgrades had none: v3.3.0 added people sharing and birthday memories, v3.3.1 fixed bugs around it.

## Back up the database first

Immich keeps daily dumps in `UPLOAD_LOCATION/backups/`, but I take one right before upgrading so the newest data is in it:

```bash
docker exec immich_postgres pg_dump -U postgres -d immich --clean --if-exists \
  | gzip > /mnt/data/import/pre-v3.3.1.sql.gz
gzip -t /mnt/data/import/pre-v3.3.1.sql.gz
```

If the dump fails or is much smaller than the previous one, stop there. If an upgrade goes wrong, this dump goes back in on the **same** version it came from. Never point an older image at a migrated database.

## Keep your edits on top of the new compose file

I run the official `docker-compose.yml` with three changes: Quick Sync for transcoding, thumbnails on the SSD, and the port bound to `127.0.0.1`. Each upgrade, I download the new release's files and check what upstream changed:

```bash
for f in docker-compose.yml example.env hwaccel.transcoding.yml; do
  curl -sL -o new/$f https://github.com/immich-app/immich/releases/download/v3.3.1/$f
done
diff -r old/ new/
```

From v3.2.4 to v3.3.0, the only change was the Valkey image digest. From v3.3.0 to v3.3.1, the files were identical. Then a second diff confirms my file is still upstream plus my three edits and nothing else:

```bash
diff <(sed '/# homelab:/d' docker-compose.yml) new/docker-compose.yml
```

Every edit I make carries a `# homelab:` comment, so this diff stays short and readable.

## Upgrade and verify

```bash
sed -i "s/^IMMICH_VERSION=.*/IMMICH_VERSION=v3.3.1/" .env
docker compose pull -q && docker compose up -d
```

Then:

```bash
docker compose ps                                   # all 4 healthy
curl -s localhost:2283/api/server/version           # {"major":3,"minor":3,"patch":1,...}
docker logs immich_server --since 10m | grep -iE "migrat|error"
ss -tlnp | grep 2283                                # still 127.0.0.1:2283
docker image rm ghcr.io/immich-app/immich-server:v3.3.0 ghcr.io/immich-app/immich-machine-learning:v3.3.0
```

The migrations log should end with `Finished running migrations`. The port check matters because a careless merge of the new compose file would put back `2283:2283`, which Docker publishes on every interface, past the firewall.

The phone apps should match the server's major version, so update them too.

## Turning it into a skill

I do these upgrades with [Claude Code](https://claude.com/claude-code). After the second one I wrote the steps down as a skill for my own server, then rewrote it without anything specific to my setup and published it: [`immich-upgrade` in JuanVqz/skills](https://github.com/JuanVqz/skills/tree/main/immich/skills/upgrade). It is unofficial and not affiliated with Immich.

It follows the order of this post: back up first, plan the path through Immich's required versions, keep your compose edits, and verify that the library survived, not only that the containers are healthy. The [SKILL.md](https://github.com/JuanVqz/skills/blob/main/immich/skills/upgrade/SKILL.md) has the current steps.

It stops for your OK on anything risky: a major version hop, a database image change, a manual step from the release notes. If you only want to know what an upgrade would involve, ask for a plan: it reads your install and the release notes, reports, and changes nothing.

To try it in Claude Code:

```text
/plugin install immich-tools --marketplace JuanVqz/skills
```

Or with the [skills CLI](https://skills.sh/juanvqz/skills), which also works with other coding agents:

```bash
npx skills add JuanVqz/skills --skill immich-upgrade
```

Then ask your agent to upgrade Immich.

Before publishing it I tested it with the skill-creator workflow: the same prompts run by agents with and without the skill, against sample installs. On a routine 3.2.4 to 3.3.1 upgrade both did fine. The difference showed on an old v1.120.0 install: without the skill, Claude planned the right hops but edited the files for v3.3.1 without asking and planned two database dumps for three hops. With the skill, it stopped with the plan and a list of questions, and planned a dump before every hop.

Contributions are welcome: if your setup breaks an assumption in the skill, open an issue or a pull request.
