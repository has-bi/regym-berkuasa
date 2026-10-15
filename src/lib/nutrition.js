/**
 * Daily calorie and macro targets.
 *
 * Energy: Mifflin-St Jeor resting rate × an activity factor, minus 500 kcal —
 * the usual deficit for roughly half a kilo a week. The factor is 1.55
 * ("exercise 3-5 days a week"), which matches three lifting days, a cardio day
 * and a 6,500-step average.
 *
 * Macros: protein 1.6 g per kg of bodyweight, the level past which more
 * protein stopped adding muscle in the Morton et al. 2018 meta-analysis and
 * what keeps muscle on during a deficit; fat a quarter of the calories; carbs
 * take the rest.
 *
 * Weight and height come from the latest weigh-in, so the target moves with
 * the scale instead of going stale.
 */

const ACTIVITY = 1.55;
const DEFICIT = 500;
const PROTEIN_PER_KG = 1.6;
const FAT_SHARE = 0.25;

/** Never prescribe below these, whatever the formula says. */
const FLOOR = { male: 1500, female: 1200 };

export function bmr({ sex, age, weight, height }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === "female" ? base - 161 : base + 5;
}

/** Null until there is enough to compute from: sex, age, weight and height. */
export function dailyTargets(profile, latestMetric) {
  const sex = profile?.sex;
  const age = Number(profile?.age);
  const weight = Number(latestMetric?.weight);
  const height = Number(latestMetric?.height);
  if (!sex || !age || !weight || !height) return null;

  const maintenance = bmr({ sex, age, weight, height }) * ACTIVITY;
  const kcal = Math.round(Math.max(maintenance - DEFICIT, FLOOR[sex] ?? 1500) / 10) * 10;

  const protein = Math.round(weight * PROTEIN_PER_KG);
  const fat = Math.round((kcal * FAT_SHARE) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));

  return { kcal, protein, carbs, fat, maintenance: Math.round(maintenance), weight, height };
}
