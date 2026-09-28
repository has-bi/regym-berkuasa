/**
 * Postgres access, replacing the Google Apps Script backend.
 *
 * Uses Neon's HTTP driver rather than a pooled TCP client: each Vercel
 * invocation is short-lived, so a per-request connection would spend more time
 * on handshakes than on queries, and a pool would leak across cold starts.
 *
 * Two classes of bug the Sheets backend kept producing are gone structurally
 * rather than by guard code — see db/schema.sql:
 *   target_reps is TEXT, so "10-12" can never be read back as a date
 *   client_id is UNIQUE, so a retried write cannot insert twice
 */
import { neon } from "@neondatabase/serverless";

export class DbError extends Error {
  constructor(message, kind) {
    super(message);
    this.name = "DbError";
    this.kind = kind;
  }
}

let cached = null;

/**
 * Wraps node-postgres in the same tagged-template shape `neon()` returns, so
 * every call site is written once and works against both.
 */
function pgTagged(pool) {
  return async (strings, ...values) => {
    const text = strings.reduce(
      (acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ""),
      ""
    );
    const res = await pool.query(text, values);
    return res.rows;
  };
}

function client() {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new DbError("DATABASE_URL is not set in the environment.", "config");
  }

  // The Neon HTTP driver derives an api.<host> endpoint from the URL, so it
  // only works against Neon. Anything else — a local Postgres in development —
  // goes over the normal wire protocol instead.
  if (/\.neon\.tech/.test(url)) {
    cached = neon(url);
  } else {
    // Required lazily so the Neon path never pulls pg into the bundle.
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true },
      max: 3,
    });
    cached = pgTagged(pool);
  }

  return cached;
}

/** Turns a driver failure into something the UI can actually act on. */
function wrap(err) {
  const msg = String(err?.message || err);

  if (err instanceof DbError) return err;
  if (/password authentication|role .* does not exist/i.test(msg)) {
    return new DbError("Database credentials were rejected. Check DATABASE_URL.", "auth");
  }
  if (/relation .* does not exist/i.test(msg)) {
    return new DbError("Tables are missing. Run db/schema.sql first.", "schema");
  }
  if (/timeout|ETIMEDOUT|ECONNREFUSED|fetch failed/i.test(msg)) {
    return new DbError("Can't connect to the database.", "network");
  }
  return new DbError(msg, "query");
}

/**
 * Every table the app needs, in a single round trip.
 *
 * Postgres can assemble the whole payload server-side, so what used to be five
 * concurrent Apps Script executions — which throttled each other and failed
 * together about half the time — is now one query.
 */
export async function fetchBundle() {
  const sql = client();
  try {
    const rows = await sql`
      select json_build_object(
        'exercises',   (select coalesce(json_agg(e order by e.name), '[]'::json) from exercises e),
        'programs',    (select coalesce(json_agg(p order by p.session, p.sort_order), '[]'::json) from programs p),
        'schedule',    (select coalesce(json_agg(s order by s.day_of_week), '[]'::json) from schedule s),
        'workoutLogs', (select coalesce(json_agg(w order by w.date, w.set_number), '[]'::json) from workout_logs w),
        'bodyMetrics', (select coalesce(json_agg(b order by b.date desc), '[]'::json) from body_metrics b)
      ) as bundle`;
    return rows[0].bundle;
  } catch (err) {
    throw wrap(err);
  }
}

export async function addWorkoutSet(p) {
  const sql = client();
  try {
    // ON CONFLICT is the whole idempotency story: a retry after a timeout
    // returns the row the first attempt already wrote.
    const rows = await sql`
      insert into workout_logs
        (client_id, date, session, exercise_name, set_number, weight, reps, rpe, notes)
      values (${p.client_id}, ${p.date}, ${p.session}, ${p.exercise_name},
              ${p.set_number}, ${p.weight}, ${p.reps}, ${p.rpe}, ${p.notes ?? ""})
      on conflict (client_id) do nothing
      returning id`;

    if (rows.length) return { id: rows[0].id, duplicate: false };

    const existing = await sql`select id from workout_logs where client_id = ${p.client_id}`;
    return { id: existing[0]?.id ?? null, duplicate: true };
  } catch (err) {
    throw wrap(err);
  }
}

export async function updateWorkoutSet(id, p) {
  const sql = client();
  try {
    const rows = await sql`
      update workout_logs
         set weight = ${p.weight}, reps = ${p.reps}, rpe = ${p.rpe}
       where id = ${id}
      returning id`;
    if (!rows.length) throw new DbError("That set no longer exists.", "notfound");
    return { id: rows[0].id };
  } catch (err) {
    throw wrap(err);
  }
}

export async function deleteWorkoutSet(id) {
  const sql = client();
  try {
    await sql`delete from workout_logs where id = ${id}`;
    return { ok: true };
  } catch (err) {
    throw wrap(err);
  }
}

export async function addBodyMetric(p) {
  const sql = client();
  try {
    const rows = await sql`
      insert into body_metrics (client_id, date, weight, waist, height, bmi)
      values (${p.client_id}, ${p.date}, ${p.weight}, ${p.waist}, ${p.height}, ${p.bmi})
      on conflict (client_id) do nothing
      returning id`;
    if (rows.length) return { id: rows[0].id, duplicate: false };

    const existing = await sql`select id from body_metrics where client_id = ${p.client_id}`;
    return { id: existing[0]?.id ?? null, duplicate: true };
  } catch (err) {
    throw wrap(err);
  }
}

export async function deleteBodyMetric(id) {
  const sql = client();
  try {
    await sql`delete from body_metrics where id = ${id}`;
    return { ok: true };
  } catch (err) {
    throw wrap(err);
  }
}
