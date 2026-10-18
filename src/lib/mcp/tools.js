/**
 * Tools the Claude connector can call. Each reads and writes the same tables
 * the app does, so anything logged from chat shows up on the Food tab and the
 * calendar straight away.
 *
 * Dates are the user's local day, not the server's: Vercel runs in UTC, and
 * a meal at 6 a.m. in Jakarta would otherwise land on the previous day.
 */
import { randomUUID } from "node:crypto";
import {
  fetchBundle, addFood, addFoodLog, deleteFoodLog, setDayNote, setDailyActivity, foodLogsOn,
} from "@/lib/db";
import { deserializeBundle } from "@/actions/data";
import { energyModel } from "@/lib/energy";
import { targetsFor } from "@/lib/nutrition";
import { buildScheduleMap, getPlanFor } from "@/lib/schedule";

const TIME_ZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";
const NOTE_TAGS = ["pain", "sick", "no-time", "low-energy", "cut-short", "strong"];

/** yyyy-mm-dd in the user's time zone. */
export function localToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

function dateArg(value) {
  if (value == null || value === "") return localToday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) throw new Error("date must be YYYY-MM-DD.");
  return String(value);
}

const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const r1 = (n) => Math.round(n * 10) / 10;

/** Exact name first, then every word of the query present in the name. */
function matchFoods(foods, query) {
  const q = norm(query);
  if (!q) return foods;
  const words = q.split(" ");
  return foods
    .filter((f) => words.every((w) => norm(f.name).includes(w)))
    .sort((a, b) => (norm(a.name) === q ? -1 : norm(b.name) === q ? 1 : a.name.length - b.name.length));
}

/**
 * Looser match for suggestions after a miss: any word whose first three
 * letters appear in the name, ranked by how many words hit. Catches typos
 * like "nasi padag".
 */
function suggestFoods(foods, query) {
  const stems = norm(query).split(" ").filter((w) => w.length >= 3).map((w) => w.slice(0, 3));
  return foods
    .map((f) => ({ f, hits: stems.filter((s) => norm(f.name).includes(s)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.f.name.length - b.f.name.length)
    .map((x) => x.f);
}

const foodView = (f) => ({
  name: f.name, portion: f.portion, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat,
});

/** The day as the Food tab sees it: target from that day's burn, totals, entries. */
function summarise(bundle, date) {
  const latest = [...bundle.bodyMetrics].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const profile = bundle.settings.profile ?? null;
  const entries = bundle.foodLogs.filter((l) => l.date === date);
  const eaten = entries.reduce(
    (t, l) => ({ kcal: t.kcal + l.kcal, protein: t.protein + l.protein, carbs: t.carbs + l.carbs, fat: t.fat + l.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const out = {
    date,
    eaten: { kcal: eaten.kcal, protein: r1(eaten.protein), carbs: r1(eaten.carbs), fat: r1(eaten.fat) },
    entries: entries.map((l) => ({
      entry_id: l.id, name: l.name, servings: l.servings, portion: l.portion, kcal: l.kcal, protein: l.protein,
    })),
  };

  const energy = energyModel({
    profile, metric: latest, workoutLogs: bundle.workoutLogs, programs: bundle.programs,
    exercises: bundle.exercises, activity: bundle.dailyActivity, foodLogs: bundle.foodLogs,
  });
  if (!energy) {
    out.target = null;
    out.note = "No calorie target yet: set sex and age on the Food tab, and log a weigh-in on the Body tab.";
    return out;
  }

  const plan = date === localToday() ? getPlanFor(date, buildScheduleMap(bundle.schedule)) : null;
  const day = energy(date, plan && !plan.isRest ? plan.session : "");
  const target = targetsFor(day.burn, { sex: profile.sex, weight: latest.weight });
  out.target = target;
  out.burn = { total: day.burn, resting: day.rest, workout: day.exercise, workout_is_planned: day.planned, steps: day.steps };
  out.remaining_kcal = target.kcal - eaten.kcal;
  out.remaining_protein = r1(target.protein - eaten.protein);
  out.balance_vs_burn = day.burn - eaten.kcal; // positive = deficit
  return out;
}

/**
 * The bundle, plus the given day's food entries even when that day is older
 * than the bundle's 60-day food window.
 */
async function loadBundle(date) {
  const b = deserializeBundle(await fetchBundle());
  if (date && !b.foodLogs.some((l) => l.date === date)) {
    const extra = deserializeBundle({ foodLogs: await foodLogsOn(date) }).foodLogs;
    b.foodLogs = [...b.foodLogs, ...extra];
  }
  return b;
}

export const TOOLS = [
  {
    name: "search_foods",
    description:
      "Search the user's personal food library (Indonesian dishes, warteg, packaged foods, kue). Returns name, portion, kcal and macros per portion. Always search before logging, and log with the exact name returned.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Words from the food name, e.g. 'nasi padang' or 'teh'." } },
      required: ["query"],
    },
    annotations: { readOnlyHint: true },
    async run({ query }) {
      const b = await loadBundle();
      const hits = matchFoods(b.foods, query).slice(0, 12).map(foodView);
      if (hits.length) return { matches: hits };
      const close = suggestFoods(b.foods, query).slice(0, 8).map(foodView);
      return {
        matches: [],
        similar: close,
        hint: "No exact match. Use one of `similar` if it is the same food; otherwise add it with add_food, with estimated values if no label is known.",
      };
    },
  },
  {
    name: "log_food",
    description:
      "Log something the user ate. `food` must be the exact name of a food in the library (use search_foods first). `servings` multiplies the stored portion: 0.5, 1, 1.5, 2... Defaults to today in the user's time zone.",
    inputSchema: {
      type: "object",
      properties: {
        food: { type: "string", description: "Exact food name from search_foods." },
        servings: { type: "number", description: "Number of portions. Default 1.", minimum: 0.1 },
        date: { type: "string", description: "YYYY-MM-DD. Default: today." },
      },
      required: ["food"],
    },
    async run({ food, servings = 1, date }) {
      const day = dateArg(date);
      const s = Number(servings);
      if (!Number.isFinite(s) || s <= 0) throw new Error("servings must be a positive number.");
      const b = await loadBundle();
      const item = b.foods.find((f) => norm(f.name) === norm(food));
      if (!item) {
        const close = suggestFoods(b.foods, food).slice(0, 5).map((f) => f.name);
        throw new Error(`No food named "${food}". ${close.length ? `Did you mean: ${close.join(", ")}?` : "Add it with add_food first."}`);
      }
      const { id } = await addFoodLog({
        client_id: `mcp_${randomUUID()}`,
        date: day,
        food_id: item.id,
        name: item.name,
        portion: item.portion,
        servings: s,
        kcal: Math.round(item.kcal * s),
        protein: r1(item.protein * s),
        carbs: r1(item.carbs * s),
        fat: r1(item.fat * s),
      });
      const summary = summarise(await loadBundle(day), day);
      return { logged: { entry_id: id, name: item.name, servings: s, kcal: Math.round(item.kcal * s) }, day: summary };
    },
  },
  {
    name: "add_food",
    description:
      "Add a food to the library, values per one portion. Use when search_foods finds nothing. If the user gives no nutrition label, estimate typical Indonesian portion values, make protein*4 + carbs*4 + fat*9 roughly equal kcal, and tell the user the numbers are estimates.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        portion: { type: "string", description: "What one portion is, e.g. '1 plate', '1 pack (85 g)', '100 g'." },
        kcal: { type: "number", minimum: 0 },
        protein: { type: "number", minimum: 0, description: "grams" },
        carbs: { type: "number", minimum: 0, description: "grams" },
        fat: { type: "number", minimum: 0, description: "grams" },
      },
      required: ["name", "portion", "kcal", "protein", "carbs", "fat"],
    },
    async run({ name, portion, kcal, protein, carbs, fat }) {
      if (!String(name).trim()) throw new Error("name is required.");
      const f = await addFood({
        name: String(name).trim(), portion: String(portion || "1 portion").trim(),
        kcal: Math.round(Number(kcal)), protein: r1(Number(protein)), carbs: r1(Number(carbs)), fat: r1(Number(fat)),
      });
      return { added: foodView({ ...f, kcal: Number(f.kcal), protein: Number(f.protein), carbs: Number(f.carbs), fat: Number(f.fat) }) };
    },
  },
  {
    name: "day_summary",
    description:
      "The day's calories and macros against the user's target. The target is that day's estimated burn (resting + logged workout + steps) minus 500 kcal. Lists each entry with its entry_id. Defaults to today.",
    inputSchema: {
      type: "object",
      properties: { date: { type: "string", description: "YYYY-MM-DD. Default: today." } },
    },
    annotations: { readOnlyHint: true },
    async run({ date }) {
      const day = dateArg(date);
      return summarise(await loadBundle(day), day);
    },
  },
  {
    name: "delete_food_log",
    description: "Remove one logged food entry, by the entry_id from day_summary or log_food.",
    inputSchema: {
      type: "object",
      properties: { entry_id: { type: "string" } },
      required: ["entry_id"],
    },
    annotations: { destructiveHint: true },
    async run({ entry_id }) {
      if (!/^[0-9a-f-]{36}$/i.test(String(entry_id))) throw new Error("entry_id must be an id from day_summary.");
      await deleteFoodLog(entry_id);
      return { deleted: entry_id };
    },
  },
  {
    name: "add_day_note",
    description:
      "Save the note for a day: why training was missed or cut short, or how it went. Replaces that day's note. A 'pain' tag eases the next leg and hip targets in the app.",
    inputSchema: {
      type: "object",
      properties: {
        note: { type: "string" },
        tag: { type: "string", enum: NOTE_TAGS, description: "Optional quick reason." },
        date: { type: "string", description: "YYYY-MM-DD. Default: today." },
      },
      required: ["note"],
    },
    async run({ note, tag = "", date }) {
      if (tag && !NOTE_TAGS.includes(tag)) throw new Error(`tag must be one of: ${NOTE_TAGS.join(", ")}.`);
      return setDayNote({ date: dateArg(date), tag, note: String(note).trim() });
    },
  },
  {
    name: "log_steps",
    description: "Set the day's step count (a running total, so it replaces the earlier number rather than adding to it).",
    inputSchema: {
      type: "object",
      properties: {
        steps: { type: "integer", minimum: 0 },
        date: { type: "string", description: "YYYY-MM-DD. Default: today." },
      },
      required: ["steps"],
    },
    async run({ steps, date }) {
      const n = Math.round(Number(steps));
      if (!Number.isFinite(n) || n < 0) throw new Error("steps must be a non-negative number.");
      const row = await setDailyActivity({ date: dateArg(date), steps: n });
      return { date: dateArg(date), steps: row.steps };
    },
  },
];
