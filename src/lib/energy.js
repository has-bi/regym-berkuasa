/**
 * Calories burned and eaten, day by day, so a day can be called a deficit or
 * not — and so the day's calorie target follows the training actually done.
 *
 * Burn = resting (Mifflin-St Jeor BMR × 1.2, everyday life without exercise)
 *      + the workout logged that day
 *      + steps beyond the ~3,000 that everyday life already includes.
 *
 * Workouts are estimated with METs from the Compendium of Physical Activities,
 * net of the resting MET already counted in the baseline:
 *   lifting   MET 5  time = each set's rest + ~40 s under the bar
 *   cardio    MET 6  minutes as logged (reps on a cardio exercise are minutes)
 *   HIIT      MET 8  2 minutes per round (30 s hard + 90 s easy)
 *
 * These are estimates, good to perhaps ±15%. The point is a consistent
 * yardstick from day to day, not lab precision.
 */
import { bmr } from "@/lib/nutrition";

const BASELINE = 1.2;
const BASELINE_STEPS = 3000;
const KCAL_PER_STEP_PER_KG = 0.0004;
const SET_SECONDS = 40;
const DEFAULT_REST = 90;
const MET = { lift: 5, cardio: 6, hiit: 8 };

/** Net kcal per minute above rest, the standard MET formula less one MET. */
const perMinute = (met, weight) => ((met - 1) * 3.5 * weight) / 200;

const isHiit = (name) => /hiit/i.test(name);

/** First number in a target like "20-25 min, zone 2" or "6-10 rounds". */
const leadingNumber = (s) => parseInt(String(s ?? "").match(/\d+/)?.[0] ?? "0", 10);

/**
 * Builds a per-date energy lookup from the bundle. Returns null until the
 * profile and a weigh-in exist, since there is no resting rate without them.
 */
export function energyModel({ profile, metric, workoutLogs, programs, exercises, activity, foodLogs }) {
  const sex = profile?.sex;
  const age = Number(profile?.age);
  const weight = Number(metric?.weight);
  const height = Number(metric?.height);
  if (!sex || !age || !weight || !height) return null;

  const rest = bmr({ sex, age, weight, height }) * BASELINE;

  const cardio = new Set((exercises || []).filter((e) => e.muscle_group === "Cardio").map((e) => e.name));
  const restFor = {};
  (programs || []).forEach((p) => {
    if (p.rest_seconds > 0) restFor[p.exercise_name] = p.rest_seconds;
  });

  const kcalForSet = (name, reps, restSeconds) => {
    if (isHiit(name)) return reps * 2 * perMinute(MET.hiit, weight);
    if (cardio.has(name)) return reps * perMinute(MET.cardio, weight);
    return ((restSeconds + SET_SECONDS) / 60) * perMinute(MET.lift, weight);
  };

  const byDate = (rows) => {
    const map = {};
    (rows || []).forEach((r) => (map[r.date] ||= []).push(r));
    return map;
  };
  const setsOn = byDate(workoutLogs);
  const foodOn = byDate(foodLogs);
  const stepsOn = Object.fromEntries((activity || []).map((a) => [a.date, a.steps]));

  /** A session not logged yet, priced from the program so today's target is not too low. */
  const plannedKcal = (session) =>
    (programs || [])
      .filter((p) => p.session === session && p.sort_order >= 1 && p.sort_order < 90)
      .reduce((sum, p) => {
        const n = leadingNumber(p.target_reps);
        if (isHiit(p.exercise_name) || cardio.has(p.exercise_name)) return sum + kcalForSet(p.exercise_name, n, 0);
        return sum + (p.target_sets || 0) * kcalForSet(p.exercise_name, 0, p.rest_seconds || DEFAULT_REST);
      }, 0);

  /**
   * @param plannedSession today's scheduled session, used only while nothing
   *                       has been logged yet that day
   */
  return function forDate(date, plannedSession = "") {
    const sets = setsOn[date] || [];
    const logged = sets.reduce(
      (sum, s) => sum + kcalForSet(s.exercise_name, s.reps || 0, restFor[s.exercise_name] || DEFAULT_REST),
      0
    );
    const planned = !sets.length && plannedSession ? plannedKcal(plannedSession) : 0;
    const steps = Math.max(0, (stepsOn[date] || 0) - BASELINE_STEPS) * KCAL_PER_STEP_PER_KG * weight;

    const burn = Math.round(rest + logged + planned + steps);
    const food = foodOn[date] || [];
    const eaten = food.reduce((sum, f) => sum + f.kcal, 0);

    return {
      burn,
      rest: Math.round(rest),
      exercise: Math.round(logged + planned),
      planned: planned > 0,
      steps: Math.round(steps),
      eaten,
      hasFood: food.length > 0,
      balance: burn - eaten, // positive = deficit
    };
  };
}
