"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { foodApi, fetchBundle, deserializeBundle } from "@/actions/data";
import { targetsFor } from "@/lib/nutrition";
import { energyModel, recentBalance } from "@/lib/energy";
import { toDateStr, buildScheduleMap, getPlanFor } from "@/lib/schedule";

const ZERO = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

function newClientId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );
}

/** Per-portion values × servings, rounded the way the entry will be stored. */
export function scaled(food, servings) {
  const r1 = (n) => Math.round(n * servings * 10) / 10;
  return {
    kcal: Math.round(food.kcal * servings),
    protein: r1(food.protein),
    carbs: r1(food.carbs),
    fat: r1(food.fat),
  };
}

export function useFood() {
  const today = toDateStr(new Date());
  const [date, setDate] = useState(today);
  const [foods, setFoods] = useState([]);
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [latestMetric, setLatestMetric] = useState(null);
  // Training data, for what each day burned.
  const [training, setTraining] = useState({ workoutLogs: [], programs: [], exercises: [], activity: [], schedule: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const b = deserializeBundle(await fetchBundle());
      setFoods(b.foods);
      setLogs(b.foodLogs);
      setProfile(b.settings.profile ?? null);
      setLatestMetric([...b.bodyMetrics].sort((x, y) => y.date.localeCompare(x.date))[0] ?? null);
      setTraining({
        workoutLogs: b.workoutLogs,
        programs: b.programs,
        exercises: b.exercises,
        activity: b.dailyActivity,
        schedule: b.schedule,
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const energy = useMemo(
    () => energyModel({ profile, metric: latestMetric, ...training, foodLogs: logs }),
    [profile, latestMetric, training, logs]
  );

  /**
   * What the selected day burned and the target that follows from it. Today
   * counts the scheduled session until the real one is logged, so the morning
   * target is not set as if it were a rest day.
   */
  const day = useMemo(() => {
    if (!energy) return null;
    const plan = date === today ? getPlanFor(date, buildScheduleMap(training.schedule)) : null;
    return energy(date, plan && !plan.isRest ? plan.session : "");
  }, [energy, date, today, training.schedule]);

  /** The last seven complete days, for the balance card's week line. */
  const week = useMemo(() => recentBalance(energy, today), [energy, today]);

  const targets = useMemo(
    () => (day ? { ...targetsFor(day.burn, { sex: profile.sex, weight: latestMetric.weight }), burn: day } : null),
    [day, profile, latestMetric]
  );

  const dayLogs = useMemo(() => logs.filter((l) => l.date === date), [logs, date]);

  const totals = useMemo(
    () =>
      dayLogs.reduce(
        (t, l) => ({
          kcal: t.kcal + l.kcal,
          protein: t.protein + l.protein,
          carbs: t.carbs + l.carbs,
          fat: t.fat + l.fat,
        }),
        ZERO
      ),
    [dayLogs]
  );

  /** Most-eaten first, so the usual meals are at the top of the picker. */
  const sortedFoods = useMemo(() => {
    const uses = {};
    logs.forEach((l) => l.food_id && (uses[l.food_id] = (uses[l.food_id] || 0) + 1));
    return [...foods].sort((a, b) => (uses[b._id] || 0) - (uses[a._id] || 0) || a.name.localeCompare(b.name));
  }, [foods, logs]);

  /** Logged optimistically; a failed write is taken back out and reported. */
  const logFood = useCallback(
    async (food, servings) => {
      const payload = {
        client_id: newClientId(),
        date,
        food_id: food._id,
        name: food.name,
        portion: food.portion,
        servings,
        ...scaled(food, servings),
      };
      const tempId = `temp_${payload.client_id}`;
      setLogs((prev) => [...prev, { ...payload, _id: tempId }]);
      try {
        const { id } = await foodApi.log(payload);
        setLogs((prev) => prev.map((l) => (l._id === tempId ? { ...l, _id: id, id } : l)));
      } catch (err) {
        setLogs((prev) => prev.filter((l) => l._id !== tempId));
        setError(err.message);
      }
    },
    [date]
  );

  const deleteLog = useCallback(
    async (id) => {
      const before = logs;
      setLogs((prev) => prev.filter((l) => l._id !== id));
      if (String(id).startsWith("temp_")) return;
      try {
        await foodApi.deleteLog(id);
      } catch (err) {
        setLogs(before);
        setError(err.message);
      }
    },
    [logs]
  );

  /** Library edits wait for the server: a duplicate name has to be refused, not shown. */
  const saveFood = useCallback(async (id, values) => {
    const saved = id ? await foodApi.updateFood(id, values) : await foodApi.addFood(values);
    const food = { ...saved, _id: saved.id, kcal: Number(saved.kcal), protein: Number(saved.protein), carbs: Number(saved.carbs), fat: Number(saved.fat) };
    setFoods((prev) => (id ? prev.map((f) => (f._id === id ? food : f)) : [...prev, food]));
    return food;
  }, []);

  const deleteFood = useCallback(async (id) => {
    await foodApi.deleteFood(id);
    setFoods((prev) => prev.filter((f) => f._id !== id));
  }, []);

  const saveProfile = useCallback(async (values) => {
    await foodApi.setProfile(values);
    setProfile(values);
  }, []);

  return {
    loading, error, today, date, setDate,
    foods: sortedFoods, dayLogs, totals, targets, profile, latestMetric, day, week,
    logFood, deleteLog, saveFood, deleteFood, saveProfile,
  };
}
