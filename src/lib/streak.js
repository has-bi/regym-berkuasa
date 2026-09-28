/**
 * Schedule + streak rules.
 *
 * The streak counts consecutive days of *following the plan*, not consecutive
 * days of training. A day scheduled as REST keeps the streak alive; only a
 * scheduled training day with no logged sets breaks it.
 */

/** Indexed to match Date#getDay(), where 0 is Sunday. */
export const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const REST = "REST";

export function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function parseDateStr(str) {
  return new Date(str + "T00:00:00");
}

export function addDays(dateStr, n) {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** Schedule rows keyed by weekday name. */
export function buildScheduleMap(rows) {
  const map = {};
  (rows || []).forEach((r) => {
    const day = String(r.day_of_week || "").trim();
    if (!day) return;
    const session = String(r.session || "").trim();
    map[day] = {
      session,
      notes: String(r.notes || "").trim(),
      isRest: !session || session.toUpperCase() === REST,
    };
  });
  return map;
}

/**
 * What the plan says for a given date. Days with no schedule row are treated
 * as rest so an incomplete schedule can never silently break a streak.
 */
export function getPlanFor(dateStr, scheduleMap) {
  const dayName = DAY_NAMES[parseDateStr(dateStr).getDay()];
  const entry = scheduleMap[dayName];
  if (!entry) return { dayName, session: "", notes: "", isRest: true, unscheduled: true };
  return { dayName, ...entry, unscheduled: false };
}

function buildTrainedSet(logs) {
  const set = new Set();
  (logs || []).forEach((l) => l.date && set.add(l.date));
  return set;
}

/**
 * Whether a single day counts as "kept": rest days always do, training days
 * only if something was logged.
 */
function dayKept(dateStr, scheduleMap, trained) {
  const plan = getPlanFor(dateStr, scheduleMap);
  if (plan.isRest) return true;
  return trained.has(dateStr);
}

export function computeStreak(logs, scheduleMap, todayStr) {
  const trained = buildTrainedSet(logs);
  const today = todayStr || toDateStr(new Date());

  const todayPlan = getPlanFor(today, scheduleMap);
  const trainedToday = trained.has(today);

  // A scheduled session that has not happened *yet* must not break the streak
  // mid-day, so counting starts from yesterday unless today is already kept.
  const todayCounts = todayPlan.isRest || trainedToday;

  let current = 0;
  let cursor = todayCounts ? today : addDays(today, -1);

  // Nothing logged ever means there is no streak to walk back through.
  const earliest = trained.size
    ? [...trained].sort()[0]
    : null;

  if (earliest) {
    while (cursor >= earliest && dayKept(cursor, scheduleMap, trained)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  // Longest run over the full logged history.
  let best = 0;
  let run = 0;
  if (earliest) {
    for (let d = earliest; d <= today; d = addDays(d, 1)) {
      // Today only extends the best run once it is actually kept.
      if (d === today && !todayCounts) break;
      if (dayKept(d, scheduleMap, trained)) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }
  }

  return {
    current,
    best: Math.max(best, current),
    todayPlan,
    trainedToday,
    /** True when today is a training day that still needs doing. */
    pendingToday: !todayPlan.isRest && !trainedToday,
  };
}

/** Last `count` days, oldest first — drives the week strip. */
export function recentDays(logs, scheduleMap, todayStr, count = 7) {
  const trained = buildTrainedSet(logs);
  const today = todayStr || toDateStr(new Date());
  const out = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const plan = getPlanFor(date, scheduleMap);
    const didTrain = trained.has(date);
    const isToday = date === today;

    let status;
    if (didTrain) status = "done";
    else if (plan.isRest) status = "rest";
    else if (isToday) status = "pending";
    else status = "missed";

    out.push({
      date,
      isToday,
      status,
      session: plan.session,
      dayShort: DAY_SHORT[parseDateStr(date).getDay()],
    });
  }
  return out;
}
