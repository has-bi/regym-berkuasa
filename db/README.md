# Database

Postgres on Neon, replacing the Google Sheets backend.

## First-time setup

```bash
# 1. Create the tables
psql "$DATABASE_URL" -f db/schema.sql

# 2. See what would move, without writing
APPS_SCRIPT_URL=<your /exec url> DATABASE_URL=<neon url> \
  node scripts/migrate-sheets-to-pg.mjs --dry-run

# 3. Move it
APPS_SCRIPT_URL=<your /exec url> DATABASE_URL=<neon url> \
  node scripts/migrate-sheets-to-pg.mjs

# 4. Load the Push / Pull / Legs program and the English exercise catalogue
psql "$DATABASE_URL" -f db/program-ppl.sql
```

Once `program-ppl.sql` has run, do not run the Sheets migration again. The
sheet still names days in Indonesian (`Senin`, …), so a second run would add
those as extra schedule rows beside the English ones.

Run admin SQL over the unpooled URL (host without `-pooler`). Neon's pooler
runs in transaction mode, so a session-level `SET` from a tool such as
`pg_dump` — which empties `search_path` — can stick to a pooled server
connection and make the app's queries fail with "relation does not exist".

The migration is safe to re-run: every insert is `ON CONFLICT DO NOTHING`
against a natural key, so a second run reports zeroes instead of duplicating.
That matters if the first run dies halfway.

Rows whose date is unusable are skipped and counted rather than guessed at.
`--dry-run` tells you how many there are before you commit to anything.

## Local development

`DATABASE_URL` can point at any Postgres. The app picks its driver from the
host: Neon's HTTP driver for `*.neon.tech`, ordinary `pg` for anything else.

```bash
psql "postgresql://postgres@127.0.0.1:5432/latihan" -f db/schema.sql
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/latihan npm run dev
```

## Why the schema looks like this

Two bugs the spreadsheet kept producing are designed out rather than guarded
against:

**`programs.target_reps` is `text`.** Sheets read `10-12` as 12 October and
handed the app `2026-10-12`. A text column cannot do that.

**`workout_logs.client_id` is `unique`.** Idempotency previously needed a
full-sheet scan under a script lock. Now a duplicate insert is refused by the
database, so a retry after a timeout can never write the set twice — the
insert uses `on conflict (client_id) do nothing` and returns the original row.

`weight` defaults to 0 and is meaningful there: bodyweight work carries no
load, and treating 0 as "unset" is what made those sets impossible to log.

## Editing the program

The Sheet was the authoring surface and no longer is. Until the app grows
editing screens, `programs`, `schedule` and `exercises` are changed with SQL —
the Neon console has a query editor. `db/program-ppl.sql` is the current
program in full; editing it and re-running it is the simplest way to make a
larger change, since it resets both tables to exactly what the file says.

`schedule.day_of_week` must be an English weekday name (`Monday` … `Sunday`),
matching `DAY_NAMES` in `src/lib/streak.js`. A day with no matching row is
treated as rest. `workout_logs` and `body_metrics` are
written by the app and need no manual editing.
