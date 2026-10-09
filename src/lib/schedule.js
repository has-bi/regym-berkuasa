/**
 * Weekly schedule helpers and the month calendar on the Lift screen.
 *
 * A day scheduled as REST is planned rest, not a skipped day — that is why
 * rest days are explicit schedule rows rather than missing ones.
 */

/** Indexed to match Date#getDay(), where 0 is Sunday. */
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const REST = "REST";

export function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function parseDateStr(str) {
  return new Date(str + "T00:00:00");
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
 * as rest, so an incomplete schedule never marks a day as missed.
 */
export function getPlanFor(dateStr, scheduleMap) {
  const dayName = DAY_NAMES[parseDateStr(dateStr).getDay()];
  const entry = scheduleMap[dayName];
  if (!entry) return { dayName, session: "", notes: "", isRest: true, unscheduled: true };
  return { dayName, ...entry, unscheduled: false };
}

/**
 * Every day of the month containing `todayStr`, padded to whole Monday-first
 * weeks with nulls so it drops straight into a seven-column grid.
 *
 * status:
 *   done     something was logged that day
 *   rest     the plan said rest (past or today)
 *   missed   a past training day with nothing logged
 *   today    today's training, not logged yet
 *   planned  a future training day
 *   upcoming a future rest day
 *
 * Past days are read against the current schedule, so they reflect the plan
 * as it stands now, not whatever it was on that date.
 */
export function monthCalendar(logs, scheduleMap, todayStr) {
  const trained = new Set((logs || []).map((l) => l.date).filter(Boolean));
  const today = parseDateStr(todayStr);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // getDay() is Sunday-first; shift so Monday is column zero.
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) cells.push(null);

  let gymDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = toDateStr(new Date(year, month, d));
    const plan = getPlanFor(date, scheduleMap);
    const isToday = date === todayStr;
    const past = date < todayStr;

    let status;
    if (trained.has(date)) status = "done";
    else if (plan.isRest) status = past || isToday ? "rest" : "upcoming";
    else if (past) status = "missed";
    else status = isToday ? "today" : "planned";

    if (status === "done") gymDays += 1;
    cells.push({ date, day: d, isToday, status, session: plan.isRest ? "" : plan.session });
  }
  while (cells.length % 7) cells.push(null);

  return {
    label: today.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    cells,
    gymDays,
  };
}
