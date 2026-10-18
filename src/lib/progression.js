/**
 * Next session's working weight, by double progression.
 *
 * Hold the weight until the working sets reach the top of the rep range, then
 * add one increment. It is the standard beginner rule and needs nothing but
 * the last session, so targets never fall behind the logs again — they used
 * to be fixed numbers in the program and went stale within weeks.
 *
 * Pain overrides progress for the legs and hips. A note tagged Pain / injury
 * on the day an exercise was last trained eases its next target by 20%; a
 * pain note since that session, within the last two weeks, holds it. Normal
 * progression resumes after a pain-free session of that exercise.
 */

const LOWER_BODY = new Set(["Quads", "Hamstrings", "Glutes", "Posterior Chain", "Calves"]);

const PAIN_WINDOW_DAYS = 14;
const EASE = 0.8;

const isLowerBody = (exercise) => LOWER_BODY.has(exercise?.muscle_group);

/**
 * Smallest jump that is available in a gym and sensible for the lift. Legs
 * and hips go up 2.5 kg at most: the back tweak in Oct 2026 followed a squat
 * that climbed from 8 to 15 kg of plates in a week.
 */
function incrementFor(exercise) {
  switch (exercise?.equipment) {
    case "Dumbbell": return 2;
    case "Cable":    return 2;
    default:         return 2.5;
  }
}

function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
}

/** Top of a rep target: "8-12" → 12, "12 per leg" → 12. Null when there is none ("AMRAP"). */
export function repCeiling(targetReps) {
  const s = String(targetReps ?? "");
  const range = s.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return parseInt(range[2], 10);
  const single = s.match(/^\s*(\d+)/);
  return single ? parseInt(single[1], 10) : null;
}

/**
 * @param program  the program row (target_sets, target_reps, target_weight)
 * @param lastSets sets from the last day this exercise was trained, before today
 * @param exercise the exercises row, for equipment and muscle group
 * @param pain     { dates: Set of yyyy-mm-dd with a pain note, today }
 * @returns { weight, increased, fromHistory, adjusted: null | "eased" | "held" }
 */
export function nextTarget(program, lastSets, exercise, pain = null) {
  const fallback = Number(program?.target_weight) || 0;
  if (!lastSets?.length) return { weight: fallback, increased: false, fromHistory: false, adjusted: null };

  const working = Math.max(...lastSets.map((s) => Number(s.weight) || 0));

  // Bodyweight work progresses by reps, which the logger already prefills.
  if (working === 0) return { weight: 0, increased: false, fromHistory: true, adjusted: null };

  if (pain?.dates?.size && isLowerBody(exercise)) {
    const lastDate = lastSets[0].date;
    if (pain.dates.has(lastDate)) {
      const step = incrementFor(exercise);
      const eased = Math.max(step, Math.round((working * EASE) / step) * step);
      return { weight: eased, increased: false, fromHistory: true, adjusted: "eased" };
    }
    const painSince = [...pain.dates].some(
      (d) => d > lastDate && daysBetween(d, pain.today) <= PAIN_WINDOW_DAYS
    );
    if (painSince) return { weight: working, increased: false, fromHistory: true, adjusted: "held" };
  }

  const top = repCeiling(program?.target_reps);
  const atWorking = lastSets.filter((s) => Number(s.weight) === working);

  // One set short of the prescription still counts, so a warm-up set logged at
  // a lighter weight does not hold progress back.
  const enoughSets = atWorking.length >= Math.max(1, (program?.target_sets || 1) - 1);
  const earned = top != null && enoughSets && atWorking.every((s) => (s.reps || 0) >= top);

  if (!earned) return { weight: working, increased: false, fromHistory: true, adjusted: null };

  const next = Math.round((working + incrementFor(exercise)) * 2) / 2;
  return { weight: next, increased: true, fromHistory: true, adjusted: null };
}
