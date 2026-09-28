/**
 * Latihan — Google Apps Script Web App
 *
 * MIGRATION SOURCE ONLY. The app reads and writes Postgres now; this file
 * exists so scripts/migrate-sheets-to-pg.mjs can drain the sheet. Once the
 * migration has run and the data is verified, the deployment and this file
 * can go.
 *
 * Setup:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file, replacing what's there
 * 3. Click Run → setupSheets() once to create tabs + headers
 * 4. Click Run → seedExercises() once to populate master exercise list
 * 5. Click Run → seedPrograms() once to populate default Upper/Lower program
 * 6. Click Run → seedSchedule() once to populate the weekly split + rest days
 * 7. Click Run → seedExerciseTutorials() once to fill technique notes
 * 8. Deploy → New deployment → Web app (Execute as: Me, Who: Anyone)
 * 9. Copy Web App URL → set as APPS_SCRIPT_URL in Vercel env vars
 *
 * Day-to-day you edit the Sheet, not the app:
 *   Schedule  — which session runs on each weekday; use REST for rest days
 *   Programs  — the exercises, sets, reps and rest_seconds per session
 *   Exercises — video_url and cues shown as the in-app tutorial
 */

const SPREADSHEET_ID = "1KeDvjqh_vf73zVw7xKlCAuAQYuXI-QKzsfOPrVkbYqk";

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const SCHEMAS = {
    BodyMetrics: ["_id", "client_id", "date", "weight", "waist", "height", "bmi"],
    Exercises:   ["_id", "name", "muscle_group", "equipment", "video_url", "cues"],
    WorkoutLogs: ["_id", "client_id", "date", "session", "exercise_name", "set_number", "weight", "reps", "rpe", "notes"],
    Programs:    ["_id", "session", "exercise_name", "target_sets", "target_reps", "rest_seconds", "target_weight", "sort_order"],
    Schedule:    ["_id", "day_of_week", "session", "notes"],
  };

  for (const [name, headers] of Object.entries(SCHEMAS)) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    const lastCol = sheet.getLastColumn();
    const existingHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

    if (existingHeaders.length === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    } else {
      headers.forEach((h) => {
        if (!existingHeaders.includes(h)) {
          const nextCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, nextCol).setValue(h);
          sheet.getRange(1, nextCol).setFontWeight("bold");
        }
      });
    }
  }

  // Rep ranges like "10-12" are read as dates unless the column is plain text.
  // This must happen before seedPrograms(), or the seeded values are coerced
  // the moment they are written.
  const programs = ss.getSheetByName("Programs");
  if (programs) {
    const headers = programs.getRange(1, 1, 1, programs.getLastColumn()).getValues()[0];
    const repsIdx = headers.indexOf("target_reps");
    if (repsIdx !== -1) {
      programs
        .getRange(2, repsIdx + 1, Math.max(programs.getMaxRows() - 1, 1), 1)
        .setNumberFormat("@");
    }
  }

  Logger.log("Setup complete: BodyMetrics, Exercises, WorkoutLogs, Programs, Schedule");
}

/**
 * Weekly training split. `session` must match a session name used in Programs,
 * or be REST for a planned rest day.
 *
 * Rest days are explicit rows rather than missing rows so the streak can tell
 * "planned rest" apart from "skipped" — a blank day would otherwise look like
 * a missed session and break the streak.
 */
function seedSchedule() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Schedule");
  if (sheet.getLastRow() > 1) {
    Logger.log("Schedule sheet already has data — skipping seed.");
    return;
  }

  const schedule = [
    ["Senin",  "Upper A",       ""],
    ["Selasa", "Lower A",       ""],
    ["Rabu",   "REST",          "Recovery — jalan santai boleh"],
    ["Kamis",  "Upper B",       ""],
    ["Jumat",  "Lower B",       ""],
    ["Sabtu",  "Kondisioning",  ""],
    ["Minggu", "REST",          "Full rest"],
  ];

  schedule.forEach(([day_of_week, session, notes]) => {
    sheet.appendRow([Utilities.getUuid(), day_of_week, session, notes]);
  });

  Logger.log("Seeded " + schedule.length + " schedule rows.");
}

/**
 * Fills the `cues` column for any seeded exercise that is still blank.
 *
 * Only writes empty cells, so re-running never overwrites notes you have
 * edited yourself. `video_url` is deliberately left alone — paste your own
 * links there; the app shows a video button only for rows that have one.
 */
function seedExerciseTutorials() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Exercises");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const nameCol = headers.indexOf("name");
  const cuesCol = headers.indexOf("cues");
  if (nameCol === -1 || cuesCol === -1) {
    Logger.log("Run setupSheets() first — 'cues' column is missing.");
    return;
  }

  const CUES = {
    "Bench Press": "Scapula ditarik ke belakang dan ke bawah. Turunkan bar ke bawah dada, siku ~45° dari badan. Kaki napak kuat, jangan angkat pinggul.",
    "Incline Bench Press": "Bangku 30–45°. Bar turun ke tulang selangka atas. Jaga siku tetap di bawah pergelangan.",
    "Incline DB Press": "Turunkan dumbbell sampai sejajar dada, tahan sebentar. Jangan benturkan dumbbell di atas.",
    "Cable Fly": "Siku sedikit ditekuk dan dikunci. Gerakan memeluk, rasakan regangan di dada, bukan bahu.",
    "Bent Over Row": "Punggung netral, badan ~45°. Tarik bar ke perut bawah, siku menyusur badan.",
    "Lat Pulldown": "Dada dibusungkan, tarik bar ke dada atas. Bayangkan siku ditarik ke saku, bukan tangan menarik.",
    "Seated Cable Row": "Punggung tegak, jangan ayun badan. Remas tulang belikat di akhir gerakan.",
    "Pull Up": "Gantung penuh, bahu aktif. Tarik sampai dagu lewat bar, turun terkontrol.",
    "Overhead Press": "Glutes dan core dikencangkan. Bar lewat depan dagu lalu kepala masuk ke bawah bar di atas.",
    "Lateral Raise": "Beban ringan. Angkat ke samping sampai sejajar bahu, siku sedikit ditekuk, jangan pakai momentum.",
    "Face Pull": "Tali setinggi wajah. Tarik ke arah dahi, buka siku lebar, putar bahu keluar.",
    "Bicep Curl": "Siku dikunci di sisi badan. Angkat tanpa mengayun punggung, turun pelan.",
    "Hammer Curl": "Telapak menghadap ke dalam sepanjang gerakan. Fokus ke brachialis dan lengan bawah.",
    "Tricep Pushdown": "Siku menempel di sisi badan. Hanya lengan bawah yang bergerak, luruskan penuh di bawah.",
    "Skull Crusher": "Siku tetap mengarah ke atas. Turunkan bar ke dahi, jangan lebarkan siku.",
    "Squat": "Kaki selebar bahu, lutut mengikuti arah jari kaki. Turun sampai paha minimal sejajar lantai, dada tetap tegak.",
    "Romanian Deadlift": "Lutut sedikit ditekuk dan dikunci. Dorong pinggul ke belakang, bar menyusur paha, rasakan tarikan hamstring.",
    "Deadlift": "Bar dekat tulang kering. Punggung netral, dorong lantai dengan kaki, kunci pinggul di atas.",
    "Leg Press": "Jangan kunci lutut di atas. Turunkan sampai lutut ~90°, punggung bawah tetap menempel.",
    "Leg Curl": "Gerakan terkontrol, jangan hentak. Tahan sebentar di puncak kontraksi.",
    "Leg Extension": "Luruskan penuh, tahan 1 detik. Turun pelan, jangan biarkan beban jatuh.",
    "Hip Thrust": "Punggung atas bertumpu di bangku. Dorong lewat tumit, kunci glutes di atas, dagu menunduk.",
    "Walking Lunge": "Langkah cukup panjang, lutut belakang hampir menyentuh lantai. Badan tetap tegak.",
    "Calf Raise": "Rentang gerak penuh — turun sampai regang, naik sampai jinjit maksimal. Tahan di atas.",
    "Treadmill": "Zona 2: masih bisa ngobrol sambil jalan/lari. Jaga postur tegak, jangan pegangan.",
    "Stationary Bike": "Sadel setinggi pinggul. Kadens 80–90 rpm, resistensi sedang.",
    "Rowing Machine": "Urutan: dorong kaki → ayun badan → tarik tangan. Balik urutannya saat kembali.",
  };

  let filled = 0;
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][nameCol]).trim();
    const existing = String(data[i][cuesCol] || "").trim();
    if (existing || !CUES[name]) continue;
    sheet.getRange(i + 1, cuesCol + 1).setValue(CUES[name]);
    filled++;
  }

  Logger.log("Filled cues for " + filled + " exercises. Paste your own links into video_url.");
}

function seedExercises() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Exercises");
  if (sheet.getLastRow() > 1) {
    Logger.log("Exercises sheet already has data — skipping seed.");
    return;
  }

  const exercises = [
    ["Bench Press",          "Dada",              "Barbell"],
    ["Incline Bench Press",  "Dada",              "Barbell"],
    ["Incline DB Press",     "Dada",              "Dumbbell"],
    ["Cable Fly",            "Dada",              "Cable"],
    ["Bent Over Row",        "Punggung",          "Barbell"],
    ["Lat Pulldown",         "Punggung",          "Cable"],
    ["Seated Cable Row",     "Punggung",          "Cable"],
    ["Pull Up",              "Punggung",          "Bodyweight"],
    ["Overhead Press",       "Bahu",              "Barbell"],
    ["Lateral Raise",        "Bahu",              "Dumbbell"],
    ["Face Pull",            "Bahu",              "Cable"],
    ["Bicep Curl",           "Bisep",             "Dumbbell"],
    ["Hammer Curl",          "Bisep",             "Dumbbell"],
    ["Tricep Pushdown",      "Trisep",            "Cable"],
    ["Skull Crusher",        "Trisep",            "Barbell"],
    ["Squat",                "Quadrisep",         "Barbell"],
    ["Romanian Deadlift",    "Hamstring",         "Barbell"],
    ["Deadlift",             "Posterior Chain",   "Barbell"],
    ["Leg Press",            "Quadrisep",         "Machine"],
    ["Leg Curl",             "Hamstring",         "Machine"],
    ["Leg Extension",        "Quadrisep",         "Machine"],
    ["Hip Thrust",           "Glutes",            "Barbell"],
    ["Walking Lunge",        "Quadrisep",         "Dumbbell"],
    ["Calf Raise",           "Betis",             "Machine"],
    ["Treadmill",            "Kardio",            "Machine"],
    ["Stationary Bike",      "Kardio",            "Machine"],
    ["Rowing Machine",       "Kardio",            "Machine"],
  ];

  exercises.forEach(([name, muscle_group, equipment]) => {
    sheet.appendRow([Utilities.getUuid(), name, muscle_group, equipment]);
  });

  Logger.log("Seeded " + exercises.length + " exercises.");
}

function seedPrograms() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Programs");
  if (sheet.getLastRow() > 1) {
    Logger.log("Programs sheet already has data — skipping seed.");
    return;
  }

  const programs = [
    ["Upper A", "Bench Press",          4, "8-12", 90,  60,  1],
    ["Upper A", "Incline DB Press",     3, "10-12", 90, 20,  2],
    ["Upper A", "Lat Pulldown",         4, "8-12", 90,  50,  3],
    ["Upper A", "Seated Cable Row",     3, "10-12", 90, 50,  4],
    ["Upper A", "Overhead Press",       3, "8-10", 90,  40,  5],
    ["Upper A", "Bicep Curl",           3, "12",   60,  12,  6],
    ["Upper A", "Tricep Pushdown",      3, "12",   60,  20,  7],
    ["Lower A", "Squat",                4, "6-10", 120, 60,  1],
    ["Lower A", "Romanian Deadlift",    3, "8-12", 90,  60,  2],
    ["Lower A", "Leg Press",            3, "10-15", 90, 80,  3],
    ["Lower A", "Leg Curl",             3, "10-12", 60, 30,  4],
    ["Lower A", "Calf Raise",           4, "15-20", 45, 40,  5],
    ["Upper B", "Incline Bench Press",  4, "8-12", 90,  50,  1],
    ["Upper B", "Cable Fly",            3, "12-15", 60, 15,  2],
    ["Upper B", "Bent Over Row",        4, "6-10", 90,  60,  3],
    ["Upper B", "Pull Up",              3, "AMRAP", 90,  0,  4],
    ["Upper B", "Lateral Raise",        3, "15",   60,   8,  5],
    ["Upper B", "Hammer Curl",          3, "12",   60,  12,  6],
    ["Upper B", "Skull Crusher",        3, "12",   60,  20,  7],
    ["Lower B", "Deadlift",             4, "4-6",  180, 80,  1],
    ["Lower B", "Leg Press",            3, "10-15", 90, 80,  2],
    ["Lower B", "Walking Lunge",        3, "12",   90,  10,  3],
    ["Lower B", "Leg Extension",        3, "12-15", 60, 30,  4],
    ["Lower B", "Hip Thrust",           3, "10-15", 90, 40,  5],
    ["Kondisioning", "Treadmill",          1, "30 min", 0, 0, 1],
    ["Kondisioning", "Stationary Bike",    1, "20 min", 0, 0, 2],
  ];

  programs.forEach(([session, exercise_name, target_sets, target_reps, rest_seconds, target_weight, sort_order]) => {
    sheet.appendRow([Utilities.getUuid(), session, exercise_name, target_sets, target_reps, rest_seconds, target_weight, sort_order]);
  });

  Logger.log("Seeded " + programs.length + " program entries.");
}

/**
 * Removes duplicate WorkoutLogs rows left behind before writes became
 * idempotent. Safe to run repeatedly.
 *
 * A duplicate is the same date + session + exercise + set_number + weight +
 * reps as an earlier row. The first occurrence is kept; later copies go. Rows
 * that merely repeat a set number with different numbers are left alone, since
 * those are real sets.
 */
function dedupeWorkoutLogs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("WorkoutLogs");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 2) {
    Logger.log("Nothing to dedupe.");
    return;
  }

  const headers = data[0];
  const col = (name) => headers.indexOf(name);
  const keyOf = (row) =>
    ["date", "session", "exercise_name", "set_number", "weight", "reps"]
      .map((h) => {
        const i = col(h);
        const v = i === -1 ? "" : row[i];
        return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(v);
      })
      .join("|");

  const seen = {};
  const doomed = [];
  for (let i = 1; i < data.length; i++) {
    const key = keyOf(data[i]);
    if (seen[key]) doomed.push(i + 1);
    else seen[key] = true;
  }

  // Delete bottom-up so earlier row numbers stay valid as rows disappear.
  for (let i = doomed.length - 1; i >= 0; i--) sheet.deleteRow(doomed[i]);

  invalidateBundleCache();
  Logger.log("Removed " + doomed.length + " duplicate rows.");
}

/**
 * Repairs the Programs sheet. Safe to run repeatedly.
 *
 * Google Sheets coerces a rep range like "10-12" into the date 12 October and
 * displays it back as "10-12", so the sheet looks right while getValues()
 * hands the API a Date that serialises to "2026-10-12".
 *
 * This does three things:
 *   1. renames a legacy `id` header to `_id`, which the app looks for
 *   2. converts already-coerced date cells back to "M-D" text
 *   3. formats target_reps as plain text so Sheets stops converting new edits
 */
function repairProgramSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName("Programs");
  if (!sheet) {
    Logger.log("No Programs sheet found.");
    return;
  }

  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // 1. Legacy header name.
  const idIdx = headers.indexOf("id");
  if (idIdx !== -1 && headers.indexOf("_id") === -1) {
    sheet.getRange(1, idIdx + 1).setValue("_id");
    Logger.log("Renamed header 'id' -> '_id'.");
  }

  const repsIdx = headers.indexOf("target_reps");
  if (repsIdx === -1) {
    Logger.log("No target_reps column — nothing further to repair.");
    return;
  }

  const repsCol = repsIdx + 1;

  // 2. Undo the coercion on existing rows, reading raw values to spot Dates.
  let fixed = 0;
  if (lastRow > 1) {
    const range = sheet.getRange(2, repsCol, lastRow - 1, 1);
    const values = range.getValues();

    const repaired = values.map(([v]) => {
      if (v instanceof Date && !isNaN(v)) {
        fixed++;
        return [`${v.getMonth() + 1}-${v.getDate()}`];
      }
      return [v === "" || v === null ? "" : String(v)];
    });

    // Format before writing, otherwise the repaired text is re-coerced on write.
    range.setNumberFormat("@");
    range.setValues(repaired);
  }

  // 3. Keep the whole column as text so future edits stay literal.
  sheet.getRange(2, repsCol, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat("@");

  Logger.log("Repaired " + fixed + " coerced rep ranges; target_reps is now plain text.");
}

/**
 * One-time migration: copy weight history from old Health sheet → BodyMetrics.
 * Run once from the GAS editor after setupSheets().
 */
function migrateHealthToBodyMetrics() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const healthSheet = ss.getSheetByName("Health");
  const bodySheet = ss.getSheetByName("BodyMetrics");

  if (!healthSheet || !bodySheet) {
    Logger.log("Health or BodyMetrics sheet not found.");
    return;
  }

  const healthData = healthSheet.getDataRange().getValues();
  const tz = Session.getScriptTimeZone();

  // De-duplicate by date — keep last recorded weight per day
  const byDate = {};
  for (let i = 1; i < healthData.length; i++) {
    let date = healthData[i][0];
    const weight = parseFloat(healthData[i][1]);
    if (!date || !weight || weight <= 0) continue;
    if (date instanceof Date) date = Utilities.formatDate(date, tz, "yyyy-MM-dd");
    byDate[String(date).substring(0, 10)] = weight;
  }

  const existingDates = bodySheet.getLastRow() > 1
    ? bodySheet.getRange(2, 2, bodySheet.getLastRow() - 1, 1).getValues().flat().map(String)
    : [];

  const HEIGHT = 173;
  let count = 0;

  Object.keys(byDate).sort().forEach((date) => {
    if (existingDates.includes(date)) return;
    const weight = byDate[date];
    const bmi = Math.round((weight / Math.pow(HEIGHT / 100, 2)) * 10) / 10;
    bodySheet.appendRow([Utilities.getUuid(), date, weight, 0, HEIGHT, bmi]);
    count++;
  });

  Logger.log("migrateHealthToBodyMetrics: " + count + " entries added.");
}

/** Sheets the app reads on startup. */
const BUNDLE_SHEETS = ["BodyMetrics", "Exercises", "WorkoutLogs", "Programs", "Schedule"];

const CACHE_KEY = "bundle_v1";
const CACHE_TTL_SECONDS = 300;

function doGet(e) {
  try {
    const { action, sheet: sheetName } = e.parameter;
    if (action === "getBundle") return jsonResponse(getBundle());
    if (action === "getAll") return jsonResponse(getAllRows(sheetName));
    return jsonResponse({ error: "Unknown action" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

/**
 * Every sheet the app needs, in one execution.
 *
 * The app used to request five sheets in parallel, which meant five
 * simultaneous executions of this script — each opening the spreadsheet
 * separately. Apps Script limits concurrent executions, so the requests
 * contended and timed out together roughly half the time. One call, one
 * openById, no contention.
 */
function getBundle() {
  const cache = CacheService.getScriptCache();

  const cached = cache.get(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      // Corrupt entry: fall through and rebuild rather than fail the request.
    }
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const out = {};
  BUNDLE_SHEETS.forEach((name) => {
    out[name] = readSheet(ss.getSheetByName(name));
  });

  try {
    cache.put(CACHE_KEY, JSON.stringify(out), CACHE_TTL_SECONDS);
  } catch (err) {
    // CacheService rejects values over 100KB. Serving uncached is still correct.
  }

  return out;
}

/** Dropped whenever a write lands, so the app never reads back stale rows. */
function invalidateBundleCache() {
  try {
    CacheService.getScriptCache().remove(CACHE_KEY);
  } catch (err) {
    // Cache eviction is best effort; the TTL bounds any staleness anyway.
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { action, sheet: sheetName, payload, id } = data;

    switch (action) {
      case "add":    return jsonResponse(withCacheReset(addRow(sheetName, payload)));
      case "update": return jsonResponse(withCacheReset(updateRow(sheetName, id, payload)));
      case "delete": return jsonResponse(withCacheReset(deleteRow(sheetName, id)));
      default:       return jsonResponse({ error: "Unknown action" });
    }
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function getAllRows(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return readSheet(ss.getSheetByName(sheetName));
}

/** Rows of one already-resolved sheet, as objects keyed by header. */
function readSheet(sheet) {
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const tz = Session.getScriptTimeZone();
  return data.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      const val = row[i];
      obj[h] = val instanceof Date ? Utilities.formatDate(val, tz, "yyyy-MM-dd") : val;
    });
    return obj;
  });
}

/**
 * Appends a row, at most once per client_id.
 *
 * Aborting the HTTP request does not abort this script: when the app gave up
 * waiting at 8 seconds, the append had often already committed, so the retry
 * wrote the same set a second time. One session ended up with eight copies of
 * the same stretch.
 *
 * The client now sends a client_id that stays fixed across retries, and a
 * request whose id is already present returns the original row instead of
 * appending another. The lock closes the remaining window where two requests
 * check before either writes.
 */
function addRow(sheetName, payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return { success: false, error: "Sheet lagi dipakai proses lain. Coba lagi." };
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, error: "Sheet " + sheetName + " nggak ketemu." };

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const clientId = payload.client_id;
    const clientCol = headers.indexOf("client_id");

    if (clientId && clientCol !== -1 && sheet.getLastRow() > 1) {
      const idCol = headers.indexOf("_id");
      const existing = sheet
        .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
        .getValues();

      for (let i = 0; i < existing.length; i++) {
        if (String(existing[i][clientCol]) === String(clientId)) {
          // Already written by an earlier attempt. Report the original row so
          // the app treats the retry as the success it actually was.
          return { success: true, _id: existing[i][idCol], duplicate: true };
        }
      }
    }

    const id = Utilities.getUuid();
    const row = headers.map((h) => (h === "_id" ? id : payload[h] !== undefined ? payload[h] : ""));
    sheet.appendRow(row);

    return { success: true, _id: id };
  } finally {
    lock.releaseLock();
  }
}

function updateRow(sheetName, id, payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("_id");

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      headers.forEach((h, j) => {
        if (h !== "_id" && payload[h] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(payload[h]);
        }
      });
      return { success: true };
    }
  }

  return { success: false, error: "Row not found" };
}

function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf("_id");

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: "Row not found" };
}

/** Passes a write result through after clearing the cached bundle. */
function withCacheReset(result) {
  invalidateBundleCache();
  return result;
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
