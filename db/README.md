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
```

The migration is safe to re-run: every insert is `ON CONFLICT DO NOTHING`
against a natural key, so a second run reports zeroes instead of duplicating.
That matters if the first run dies halfway.

Rows whose date is unusable are skipped and counted rather than guessed at.
`--dry-run` tells you how many there are before you commit to anything.

## Loading the program

`db/seed-program.sql` holds the current training block: three full-body days,
two to three cardio slots with one of them HIIT, and a rest day.

```bash
psql "$DATABASE_URL" -f db/seed-program.sql
```

It replaces `programs` wholesale and upserts `schedule`, so it is safe to
re-run when the block changes. `workout_logs` is never touched — sessions are
referenced by name, so history under the old Upper/Lower names stays readable
even though those sessions no longer appear in the Program tab.

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
the Neon console has a query editor. `workout_logs` and `body_metrics` are
written by the app and need no manual editing.
