/**
 * Daily calorie and macro targets.
 *
 * Energy: the day's estimated burn (lib/energy.js) minus 500 kcal — the usual
 * deficit for roughly half a kilo a week. Because the burn includes that day's
 * workout, a gym day gets a bigger target than a rest day, instead of one
 * averaged number for every day.
 *
 * Macros: protein 1.6 g per kg of bodyweight, the level past which more
 * protein stopped adding muscle in the Morton et al. 2018 meta-analysis and
 * what keeps muscle on during a deficit; fat a quarter of the calories; carbs
 * take the rest.
 */

export const DEFICIT = 500;
const PROTEIN_PER_KG = 1.6;
const FAT_SHARE = 0.25;

/** Never prescribe below these, whatever the burn estimate says. */
const FLOOR = { male: 1500, female: 1200 };

/** Mifflin-St Jeor resting metabolic rate, kcal/day. */
export function bmr({ sex, age, weight, height }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "female" ? base - 161 : base + 5;
}

/** Targets for a day that burns `burn` kcal. */
export function targetsFor(burn, { sex, weight }) {
  const kcal = Math.round(Math.max(burn - DEFICIT, FLOOR[sex] ?? 1500) / 10) * 10;
  const protein = Math.round(weight * PROTEIN_PER_KG);
  const fat = Math.round((kcal * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}
