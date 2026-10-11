/**
 * Next session's working weight, by double progression.
 *
 * Hold the weight until the working sets reach the top of the rep range, then
 * add one increment. It is the standard beginner rule and needs nothing but
 * the last session, so targets never fall behind the logs again — they used
 * to be fixed numbers in the program and went stale within weeks.
 */

const LOWER_BODY = new Set(["Quads", "Hamstrings", "Glutes", "Posterior Chain", "Calves"]);

/** Smallest jump that is both available in a gym and sensible for the lift. */
function incrementFor(exercise) {
  const lower = LOWER_BODY.has(exercise?.muscle_group);
  switch (exercise?.equipment) {
    case "Barbell":  return lower ? 5 : 2.5;
    case "Machine":  return lower ? 5 : 2.5;
    case "Dumbbell": return 2;
    case "Cable":    return 2;
    default:         return 2.5;
  }
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
 * @returns { weight, increased, fromHistory }
 */
export function nextTarget(program, lastSets, exercise) {
  const fallback = Number(program?.target_weight) || 0;
  if (!lastSets?.length) return { weight: fallback, increased: false, fromHistory: false };

  const working = Math.max(...lastSets.map((s) => Number(s.weight) || 0));

  // Bodyweight work progresses by reps, which the logger already prefills.
  if (working === 0) return { weight: 0, increased: false, fromHistory: true };

  const top = repCeiling(program?.target_reps);
  const atWorking = lastSets.filter((s) => Number(s.weight) === working);

  // One set short of the prescription still counts, so a warm-up set logged at
  // a lighter weight does not hold progress back.
  const enoughSets = atWorking.length >= Math.max(1, (program?.target_sets || 1) - 1);
  const earned = top != null && enoughSets && atWorking.every((s) => (s.reps || 0) >= top);

  if (!earned) return { weight: working, increased: false, fromHistory: true };

  const next = Math.round((working + incrementFor(exercise)) * 2) / 2;
  return { weight: next, increased: true, fromHistory: true };
}
