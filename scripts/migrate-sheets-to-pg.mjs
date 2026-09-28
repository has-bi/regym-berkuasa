#!/usr/bin/env node
/**
 * Copies the Google Sheets backend into Postgres.
 *
 *   APPS_SCRIPT_URL=... DATABASE_URL=... node scripts/migrate-sheets-to-pg.mjs
 *   …add --dry-run to read and report without writing.
 *
 * Safe to run more than once. Every insert is ON CONFLICT DO NOTHING against a
 * natural key, so a second run reports zeroes rather than duplicating rows —
 * which matters because the sheet is the thing being drained and a half-failed
 * run needs to be resumable.
 */
import pg from "pg";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const DATABASE_URL = process.env.DATABASE_URL;
const DRY = process.argv.includes("--dry-run");

if (!APPS_SCRIPT_URL || !DATABASE_URL) {
  console.error("Set APPS_SCRIPT_URL and DATABASE_URL.");
  process.exit(1);
}

/** Apps Script gained getBundle late; fall back for an older deployment. */
async function readSheets() {
  const bundle = await fetch(`${APPS_SCRIPT_URL}?action=getBundle`).then((r) => r.json());
  if (!bundle?.error) return bundle;

  const names = ["Exercises", "Programs", "Schedule", "WorkoutLogs", "BodyMetrics"];
  const out = {};
  for (const n of names) {
    out[n] = await fetch(`${APPS_SCRIPT_URL}?action=getAll&sheet=${n}`).then((r) => r.json());
  }
  return out;
}

const str = (v) => (v === null || v === undefined ? "" : String(v).trim());
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const int = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};
/** Sheet dates arrive as yyyy-MM-dd already, but guard against a stray time. */
const date = (v) => {
  const s = str(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

async function main() {
  console.log(DRY ? "DRY RUN — nothing will be written\n" : "");
  const sheets = await readSheets();

  const counts = Object.fromEntries(
    Object.entries(sheets).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
  );
  console.log("Read from the sheet:", counts);

  if (DRY) {
    const bad = (sheets.WorkoutLogs || []).filter((r) => !date(r.date));
    if (bad.length) console.log(`\n${bad.length} workout rows have an unusable date and would be skipped.`);
    return;
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: true },
  });
  await client.connect();

  const done = {};
  const run = async (label, rows, fn) => {
    let inserted = 0;
    let skipped = 0;
    for (const row of rows || []) {
      const res = await fn(row);
      if (res === null) skipped++;
      else inserted += res.rowCount;
    }
    done[label] = { inserted, skipped, seen: (rows || []).length };
  };

  try {
    await client.query("begin");

    await run("exercises", sheets.Exercises, (r) => {
      const name = str(r.name);
      if (!name) return null;
      return client.query(
        `insert into exercises (name, muscle_group, equipment, video_url, cues)
         values ($1,$2,$3,$4,$5) on conflict (name) do nothing`,
        [name, str(r.muscle_group), str(r.equipment), str(r.video_url), str(r.cues)]
      );
    });

    await run("programs", sheets.Programs, (r) => {
      const session = str(r.session);
      const ex = str(r.exercise_name);
      if (!session || !ex) return null;
      return client.query(
        `insert into programs
           (session, exercise_name, target_sets, target_reps, rest_seconds, target_weight, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (session, exercise_name) do nothing`,
        [session, ex, int(r.target_sets), str(r.target_reps), int(r.rest_seconds),
         num(r.target_weight), int(r.sort_order)]
      );
    });

    await run("schedule", sheets.Schedule, (r) => {
      const day = str(r.day_of_week);
      if (!day) return null;
      return client.query(
        `insert into schedule (day_of_week, session, notes)
         values ($1,$2,$3) on conflict (day_of_week) do nothing`,
        [day, str(r.session) || "REST", str(r.notes)]
      );
    });

    await run("workout_logs", sheets.WorkoutLogs, (r) => {
      const d = date(r.date);
      if (!d) return null;
      // Older rows predate client_id; the sheet's own _id is already unique and
      // stable, so it keeps re-runs idempotent for them too.
      const cid = str(r.client_id) || str(r._id) || null;
      return client.query(
        `insert into workout_logs
           (client_id, date, session, exercise_name, set_number, weight, reps, rpe, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (client_id) do nothing`,
        [cid, d, str(r.session), str(r.exercise_name), int(r.set_number),
         num(r.weight), int(r.reps), r.rpe ? int(r.rpe) : null, str(r.notes)]
      );
    });

    await run("body_metrics", sheets.BodyMetrics, (r) => {
      const d = date(r.date);
      if (!d) return null;
      const cid = str(r.client_id) || str(r._id) || null;
      return client.query(
        `insert into body_metrics (client_id, date, weight, waist, height, bmi)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (client_id) do nothing`,
        [cid, d, num(r.weight), num(r.waist), num(r.height) || 173, num(r.bmi)]
      );
    });

    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    console.error("\nRolled back — nothing was written.");
    throw err;
  } finally {
    await client.end();
  }

  console.log("\nMigrated:");
  for (const [k, v] of Object.entries(done)) {
    const note = v.skipped ? `, ${v.skipped} skipped` : "";
    const dup = v.seen - v.inserted - v.skipped;
    console.log(
      `  ${k.padEnd(13)} ${String(v.inserted).padStart(4)} inserted` +
        (dup > 0 ? `, ${dup} already there` : "") + note
    );
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
