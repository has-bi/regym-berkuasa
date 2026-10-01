/**
 * Scores a finished session out of 100 and picks the flavour text.
 *
 * Three things get points, and the sheet shows the split so the number is never
 * a black box:
 *   completion  50  did you finish what was programmed
 *   progression 30  volume against the last time you ran this same session
 *   records     20  personal bests set today
 *
 * Everything here is deterministic. Reopening the summary must show the same
 * words, so the flavour line is chosen by hashing date+session rather than at
 * random.
 */

const TIERS = [
  {
    min: 90,
    title: "Final Boss",
    tagline: "The barbell asked for a rematch.",
    lines: [
      "The bar begged for mercy, not you.",
      "Gravity just handed in its resignation.",
      "That wasn't a workout, it was a demonstration.",
    ],
  },
  {
    min: 78,
    title: "Heavier Than Your Rent",
    tagline: "The bar on your back weighed less than this month's bills.",
    lines: [
      "The squat rack is starting to know your name.",
      "More muscle, less overthinking. Fair trade.",
      "Sessions like this are what make the chart go up.",
    ],
  },
  {
    min: 62,
    title: "Certified Workhorse",
    tagline: "Clean, consistent, no drama.",
    lines: [
      "Not spectacular, but this is exactly what builds progress.",
      "Show up, lift, go home. Boring recipe, works every time.",
      "Your body doesn't need hype, it needs repetition.",
    ],
  },
  {
    min: 45,
    title: "Bent, Not Broken",
    tagline: "Got knocked around, still got up.",
    lines: [
      "Halfway is still further than zero.",
      "Called it a draw against the couch today. Not bad.",
      "Not every session has to be a highlight.",
    ],
  },
  {
    min: 25,
    title: "Global Warm-Up",
    tagline: "The temperature went up. A little.",
    lines: [
      "Sweat is sweat, even the shy kind.",
      "Your body took notes, even if they were short.",
      "Add one more set tomorrow and it's a different story.",
    ],
  },
  {
    min: 0,
    title: "Just Checking In",
    tagline: "Attendance still counts.",
    lines: [
      "Showing up already beat the version of you on the couch.",
      "The worst session still beats the one that never happened.",
      "Streak saved. That's what matters today.",
    ],
  },
];

/** Small stable hash so the same session always gets the same line. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Work done. Loaded sets count weight × reps; unloaded sets count reps, so a
 * bodyweight session can still show progression instead of scoring a flat zero
 * on both sides of the comparison. Units are mixed, but the number is only ever
 * compared against the same session, so the ratio stays meaningful.
 */
function volumeOf(sets) {
  return sets.reduce(
    (sum, l) => sum + (l.weight > 0 ? l.weight * (l.reps || 0) : l.reps || 0),
    0
  );
}

/**
 * @param todaySets  every set logged today for this session
 * @param priorSets  sets from the last day this same session was trained
 * @param targetSets total sets the program asks for
 * @param prCount    exercises where today beat the previous best
 */
export function scoreSession({ todaySets, priorSets = [], targetSets = 0, prCount = 0 }) {
  const done = todaySets.length;
  const volume = volumeOf(todaySets);
  const priorVolume = volumeOf(priorSets);

  // Nothing logged is nothing earned — no neutral credit for an empty session.
  if (done === 0) {
    return {
      total: 0,
      done: 0,
      targetSets,
      volume: 0,
      priorVolume,
      volumeDelta: null,
      prCount: 0,
      breakdown: [
        { label: "Finished the program", value: 0, max: 50 },
        { label: "Up from last session", value: 0, max: 30 },
        { label: "New records", value: 0, max: 20 },
      ],
    };
  }

  // 1. Completion — the biggest slice, because finishing the plan is the job.
  const completionRatio = targetSets > 0 ? clamp(done / targetSets, 0, 1) : done > 0 ? 1 : 0;
  const completion = Math.round(completionRatio * 50);

  // 2. Progression against the same session last time. With nothing to compare
  //    against, award the neutral middle rather than punishing a first run.
  let progression;
  let volumeDelta = null;
  if (priorVolume > 0 && volume > 0) {
    const ratio = volume / priorVolume;
    volumeDelta = ratio - 1;
    if (ratio >= 1.1) progression = 30;
    else if (ratio >= 1) progression = Math.round(20 + (ratio - 1) * 100);
    else if (ratio >= 0.9) progression = Math.round(10 + (ratio - 0.9) * 100);
    else progression = Math.round(clamp(ratio / 0.9, 0, 1) * 10);
  } else {
    progression = 20;
  }

  // 3. Personal bests.
  const records = clamp(prCount * 10, 0, 20);

  const total = clamp(completion + progression + records, 0, 100);

  return {
    total,
    done,
    targetSets,
    volume,
    priorVolume,
    volumeDelta,
    prCount,
    breakdown: [
      { label: "Finished the program", value: completion, max: 50 },
      { label: "Up from last session", value: progression, max: 30 },
      { label: "New records", value: records, max: 20 },
    ],
  };
}

export function tierFor(total, seed = "") {
  const tier = TIERS.find((t) => total >= t.min) ?? TIERS[TIERS.length - 1];
  const line = tier.lines[hash(seed + tier.title) % tier.lines.length];
  return { ...tier, line };
}
