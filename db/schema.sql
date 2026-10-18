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
-- the calendar can tell planned rest from a missed training day.
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
-- make every day a gym day on the calendar and erase the rest days. Keeping it
-- here means the calendar never sees it.
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

-- Personal food library: the things actually eaten, each with one portion.
--
-- Per portion rather than per 100 g, because the same few meals repeat and a
-- portion is how they are thought of ("one plate of nasi goreng"). Logging is
-- then a tap and a multiplier instead of weighing food.
create table if not exists foods (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  portion    text not null default '1 portion',
  kcal       integer not null default 0,
  protein    numeric(6,1) not null default 0,
  carbs      numeric(6,1) not null default 0,
  fat        numeric(6,1) not null default 0,
  created_at timestamptz not null default now()
);

-- One row per thing eaten.
--
-- Name, portion and totals are copied in at logging time rather than read
-- through food_id, so editing or deleting a food later never rewrites what was
-- already eaten. The totals are already multiplied by servings.
create table if not exists food_logs (
  id         uuid primary key default gen_random_uuid(),
  -- Same idempotency guard as workout_logs: a retried write is a no-op.
  client_id  text unique,
  date       date not null,
  food_id    uuid references foods(id) on delete set null,
  name       text not null,
  portion    text not null default '',
  servings   numeric(5,2) not null default 1,
  kcal       integer not null default 0,
  protein    numeric(6,1) not null default 0,
  carbs      numeric(6,1) not null default 0,
  fat        numeric(6,1) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists food_logs_date_idx on food_logs (date desc);

-- Small key/value store for settings that have no table of their own.
-- 'profile' holds { sex, age } for the calorie target; weight and height come
-- from body_metrics so the target follows the scale.
create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- One note per day: why a session was missed, cut short, or how it went.
--
-- Keyed on the date, not on a session, because the days that most need a
-- note are the ones with no session at all. `tag` is an optional quick reason
-- (pain, sick, no-time, low-energy, cut-short, strong) for scanning the month.
create table if not exists day_notes (
  date       date primary key,
  tag        text not null default '',
  note       text not null default '',
  updated_at timestamptz not null default now()
);
