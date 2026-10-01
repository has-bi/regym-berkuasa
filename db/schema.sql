-- Latihan — schema
--
-- Ported from the Google Sheets backend. Two long-running bugs are designed
-- out here rather than guarded against:
--
--   target_reps is TEXT. In Sheets, "10-12" was silently coerced to the date
--   12 October and read back as "2026-10-12". A text column cannot do that.
--
--   client_id is UNIQUE. Idempotency used to need a full-sheet scan under a
--   script lock; now a duplicate insert is rejected by the database itself,
--   so a retry after a timeout can never write a second row.

create extension if not exists "pgcrypto";

-- Master exercise list, plus the tutorial shown in the app.
create table if not exists exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  muscle_group text not null default '',
  equipment    text not null default '',
  video_url    text not null default '',
  cues         text not null default '',
  created_at   timestamptz not null default now()
);

-- What each session is made of.
create table if not exists programs (
  id            uuid primary key default gen_random_uuid(),
  session       text not null,
  exercise_name text not null,
  target_sets   integer not null default 0,
  -- Text on purpose: holds "8-12", "AMRAP", "30 detik per sisi".
  target_reps   text    not null default '',
  rest_seconds  integer not null default 0,
  target_weight numeric(6,2) not null default 0,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (session, exercise_name)
);

create index if not exists programs_session_order_idx
  on programs (session, sort_order);

-- The weekly split. A rest day is an explicit row with session = 'REST', so
-- the streak can tell planned rest from a skipped day.
create table if not exists schedule (
  id          uuid primary key default gen_random_uuid(),
  day_of_week text not null unique,
  session     text not null default 'REST',
  notes       text not null default ''
);

-- One row per logged set.
create table if not exists workout_logs (
  id            uuid primary key default gen_random_uuid(),
  -- Sent by the app and reused across retries; the constraint is what makes
  -- a repeated write a no-op instead of a duplicate.
  client_id     text unique,
  date          date not null,
  session       text not null,
  exercise_name text not null,
  set_number    integer not null default 1,
  -- 0 is a real value: bodyweight work carries no load.
  weight        numeric(6,2) not null default 0,
  reps          integer not null default 0,
  rpe           integer,
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists workout_logs_date_idx     on workout_logs (date desc);
create index if not exists workout_logs_exercise_idx on workout_logs (exercise_name, date desc);
create index if not exists workout_logs_session_idx  on workout_logs (date, session);

create table if not exists body_metrics (
  id         uuid primary key default gen_random_uuid(),
  client_id  text unique,
  date       date not null,
  weight     numeric(5,2) not null default 0,
  waist      numeric(5,2) not null default 0,
  height     numeric(5,2) not null default 173,
  bmi        numeric(4,1) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists body_metrics_date_idx on body_metrics (date desc);

-- Daily walking (NEAT). Deliberately separate from workout_logs.
--
-- Walking is a background habit, not a session. Logging it as a session would
-- make every day a training day, which erases rest days and makes the streak
-- break the first time a walk is missed. Keeping it here means the streak
-- never sees it.
--
-- One row per day: `date` is the natural key, and a second entry for the same
-- day replaces the count rather than adding to it, because a step counter
-- already reports a running total.
create table if not exists daily_activity (
  date         date primary key,
  steps        integer not null default 0,
  walk_minutes integer not null default 0,
  notes        text not null default '',
  updated_at   timestamptz not null default now()
);

create index if not exists daily_activity_date_idx on daily_activity (date desc);
