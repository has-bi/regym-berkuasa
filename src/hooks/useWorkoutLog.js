"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { workoutApi, fetchBundle, deserializeBundle } from "@/actions/data";
import { buildScheduleMap, computeStreak, recentDays } from "@/lib/streak";

/** Fallback only — the real list comes from whatever sessions the data defines. */
export const SESSIONS = ["Upper A", "Lower A", "Upper B", "Lower B", "Kondisioning"];

function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Sets count toward volume as weight × reps; bodyweight work still counts reps. */
function setVolume(l) {
  return (l.weight || 0) * (l.reps || 0);
}

export function useWorkoutLog() {
  const today = getLocalToday();
  const [logs, setLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTouched, setSessionTouched] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // One request for every sheet. Fetching them separately meant five
      // concurrent Apps Script executions, which throttled and failed together.
      const bundle = deserializeBundle(await fetchBundle());
      setLogs(bundle.workoutLogs);
      setExercises(bundle.exercises);
      setPrograms(bundle.programs);
      setSchedule(bundle.schedule);
      setError(null);

      const todayLogs = bundle.workoutLogs.filter((l) => l.date === today);
      if (todayLogs.length > 0) {
        setActiveSession(todayLogs[todayLogs.length - 1].session);
        setSessionTouched(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);

  const scheduleMap = useMemo(() => buildScheduleMap(schedule), [schedule]);

  const streak = useMemo(
    () => computeStreak(logs, scheduleMap, today),
    [logs, scheduleMap, today]
  );

  const weekStrip = useMemo(
    () => recentDays(logs, scheduleMap, today, 7),
    [logs, scheduleMap, today]
  );

  /** Session names come from the data, falling back to the built-in split. */
  const sessions = useMemo(() => {
    const fromSheet = [
      ...new Set([
        ...schedule.map((s) => String(s.session || "").trim()),
        ...programs.map((p) => String(p.session || "").trim()),
      ]),
    ].filter((s) => s && s.toUpperCase() !== "REST");
    return fromSheet.length ? fromSheet : SESSIONS;
  }, [schedule, programs]);

  /**
   * Today's session comes from the schedule rather than a rotation guess, so
   * the app opens on whatever the plan actually says.
   */
  const suggestedSession = useMemo(() => {
    if (streak.todayPlan?.session && !streak.todayPlan.isRest) {
      return streak.todayPlan.session;
    }
    return sessions[0];
  }, [streak, sessions]);

  useEffect(() => {
    if (!loading && !sessionTouched && !activeSession) {
      setActiveSession(suggestedSession);
    }
  }, [loading, sessionTouched, activeSession, suggestedSession]);

  const selectSession = useCallback((s) => {
    setSessionTouched(true);
    setActiveSession(s);
  }, []);

  const todayByExercise = useMemo(() => {
    const map = {};
    todayLogs
      .filter((l) => l.session === activeSession)
      .sort((a, b) => a.set_number - b.set_number)
      .forEach((l) => {
        (map[l.exercise_name] ||= []).push(l);
      });
    return map;
  }, [todayLogs, activeSession]);

  const sessionProgram = useMemo(
    () => programs.filter((p) => p.session === activeSession).sort((a, b) => a.sort_order - b.sort_order),
    [programs, activeSession]
  );

  const todayExerciseNames = useMemo(() => {
    const programNames = sessionProgram.map((p) => p.exercise_name);
    const extras = Object.keys(todayByExercise).filter((n) => !programNames.includes(n));
    return [...programNames, ...extras];
  }, [sessionProgram, todayByExercise]);

  /** Every set logged today for the session on screen, flattened. */
  const todaySessionSets = useMemo(
    () => Object.values(todayByExercise).flat(),
    [todayByExercise]
  );

  /**
   * The same session's sets from the last day it was trained, used as the
   * comparison baseline in the summary.
   */
  const priorSessionSets = useMemo(() => {
    if (!activeSession) return [];
    const prior = logs.filter((l) => l.session === activeSession && l.date !== today);
    if (!prior.length) return [];
    const lastDate = prior.map((l) => l.date).sort((a, b) => b.localeCompare(a))[0];
    return prior.filter((l) => l.date === lastDate);
  }, [logs, activeSession, today]);

  /**
   * Exercises where today's best beats every earlier day. Compared against
   * prior days only, so a set does not count itself as the record it broke.
   */
  const todayPrCount = useMemo(() => {
    let count = 0;
    Object.entries(todayByExercise).forEach(([name, sets]) => {
      if (!sets.length) return;
      const earlier = logs.filter((l) => l.exercise_name === name && l.date !== today);
      if (!earlier.length) return;

      const loaded = earlier.some((l) => l.weight > 0) || sets.some((l) => l.weight > 0);
      if (loaded) {
        const best = Math.max(...earlier.map((l) => l.weight || 0));
        if (Math.max(...sets.map((l) => l.weight || 0)) > best) count += 1;
      } else {
        const best = Math.max(...earlier.map((l) => l.reps || 0));
        if (Math.max(...sets.map((l) => l.reps || 0)) > best) count += 1;
      }
    });
    return count;
  }, [todayByExercise, logs, today]);

  /** Overall completion for the session header: sets done vs. sets programmed. */
  const sessionProgress = useMemo(() => {
    const target = sessionProgram.reduce((sum, p) => sum + (p.target_sets || 0), 0);
    const done = Object.values(todayByExercise).reduce((sum, arr) => sum + arr.length, 0);
    const volume = Object.values(todayByExercise)
      .flat()
      .reduce((sum, l) => sum + setVolume(l), 0);
    return { done, target, volume, complete: target > 0 && done >= target };
  }, [sessionProgram, todayByExercise]);

  /**
   * The last time this exercise was trained on a different day — shown in the
   * logger so progressive overload is a decision, not a guess.
   */
  const getLastPerformance = useCallback(
    (exerciseName) => {
      const prior = logs.filter((l) => l.exercise_name === exerciseName && l.date !== today);
      if (!prior.length) return null;
      const lastDate = prior.map((l) => l.date).sort((a, b) => b.localeCompare(a))[0];
      const sets = prior
        .filter((l) => l.date === lastDate)
        .sort((a, b) => a.set_number - b.set_number);
      return { date: lastDate, sets };
    },
    [logs, today]
  );

  /**
   * Best effort on record, as { metric, value, log }.
   *
   * Loaded lifts rank by weight. Bodyweight work carries no load, so ranking it
   * by weight meant Pull Up could never show a best at all — those rank by reps
   * instead, which is how the effort actually progresses.
   */
  const getPersonalBest = useCallback(
    (exerciseName) => {
      const all = logs.filter((l) => l.exercise_name === exerciseName);
      if (!all.length) return null;

      const loaded = all.filter((l) => l.weight > 0);
      if (loaded.length) {
        const log = loaded.reduce((best, l) => (l.weight > best.weight ? l : best), loaded[0]);
        return { metric: "weight", value: log.weight, log };
      }

      const byReps = all.filter((l) => l.reps > 0);
      if (!byReps.length) return null;
      const log = byReps.reduce((best, l) => (l.reps > best.reps ? l : best), byReps[0]);
      return { metric: "reps", value: log.reps, log };
    },
    [logs]
  );

  const getLastWeight = useCallback(
    (exerciseName) => {
      const last = getLastPerformance(exerciseName);
      if (last?.sets?.length) {
        // `??` not `||`: a recorded 0 is a real bodyweight value, not "unset".
        return last.sets[last.sets.length - 1].weight ?? null;
      }
      const todaySets = logs
        .filter((l) => l.exercise_name === exerciseName && l.weight > 0)
        .sort((a, b) => b.date.localeCompare(a.date) || b.set_number - a.set_number);
      return todaySets[0]?.weight ?? null;
    },
    [getLastPerformance, logs]
  );

  const getLastReps = useCallback(
    (exerciseName) => {
      const last = getLastPerformance(exerciseName);
      if (last?.sets?.length) return last.sets[last.sets.length - 1].reps ?? null;
      return null;
    },
    [getLastPerformance]
  );

  const recentSessions = useMemo(() => {
    // Keyed by date *and* session: grouping on date alone merged two sessions
    // trained in one day and labelled them with whichever row happened to land
    // in the map first.
    const groups = {};
    logs
      .filter((l) => l.date !== today)
      .forEach((l) => {
        const key = `${l.date}__${l.session}`;
        groups[key] ||= { key, date: l.date, session: l.session, sets: 0, volume: 0 };
        groups[key].sets += 1;
        groups[key].volume += setVolume(l);
      });

    return Object.values(groups)
      .sort((a, b) => b.date.localeCompare(a.date) || a.session.localeCompare(b.session))
      .slice(0, 7);
  }, [logs, today]);

  /**
   * Sends a pending row and marks the outcome on the row itself.
   *
   * A failed write keeps its row — you already did the reps, so discarding it
   * would lose real work. The row carries `_status: "failed"` and its original
   * payload so the UI can offer a retry.
   */
  const push = useCallback(async (tempId, payload) => {
    setLogs((prev) =>
      prev.map((l) => (l._id === tempId ? { ...l, _status: "saving", _error: null } : l))
    );

    try {
      const result = await workoutApi.add(payload);
      setLogs((prev) =>
        prev.map((l) =>
          l._id === tempId ? { ...l, _id: result.id, _status: undefined, _payload: undefined } : l
        )
      );
      return true;
    } catch (err) {
      setLogs((prev) =>
        prev.map((l) =>
          l._id === tempId ? { ...l, _status: "failed", _error: err.message } : l
        )
      );
      return false;
    }
  }, []);

  const logSet = useCallback(
    async (exerciseName, weight, reps, rpe, notes = "") => {
      const existing = todayByExercise[exerciseName] || [];
      const setNumber = existing.length + 1;
      // Numbers stay numbers: the columns are numeric/integer, so stringifying
      // them was only ever a Sheets habit.
      const payload = {
        date: today,
        session: activeSession,
        exercise_name: exerciseName,
        set_number: setNumber,
        weight,
        reps,
        rpe: rpe || null,
        notes,
      };

      // Fixed for the life of this set, retries included. The server refuses a
      // second insert with the same id, so a write that landed before the app
      // gave up waiting cannot be duplicated by pressing retry.
      const clientId =
        globalThis.crypto?.randomUUID?.() ??
        `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      payload.client_id = clientId;

      const tempId = `temp_${clientId}`;
      setLogs((prev) => [
        ...prev,
        { _id: tempId, ...payload, weight, reps, rpe, set_number: setNumber, _payload: payload, _status: "saving" },
      ]);

      await push(tempId, payload);
    },
    [todayByExercise, today, activeSession, push]
  );

  const retrySet = useCallback(
    async (tempId) => {
      const row = logs.find((l) => l._id === tempId);
      if (!row?._payload) return;
      await push(tempId, row._payload);
    },
    [logs, push]
  );

  const updateSet = useCallback(
    async (id, { weight, reps, rpe }) => {
      const before = logs.find((l) => l._id === id);
      if (!before) return;

      setLogs((prev) =>
        prev.map((l) => (l._id === id ? { ...l, weight, reps, rpe } : l))
      );

      try {
        await workoutApi.update(id, { weight, reps, rpe: rpe || null });
      } catch (err) {
        // Put the old values back rather than leaving the UI ahead of the database.
        setLogs((prev) =>
          prev.map((l) =>
            l._id === id
              ? { ...l, weight: before.weight, reps: before.reps, rpe: before.rpe }
              : l
          )
        );
        setError(err.message);
      }
    },
    [logs]
  );

  const deleteSet = useCallback(
    async (id) => {
      const row = logs.find((l) => l._id === id);

      // A row that never reached the server has nothing to delete remotely.
      if (!row || row._status === "failed" || String(id).startsWith("temp_")) {
        setLogs((prev) => prev.filter((l) => l._id !== id));
        return;
      }

      const snapshot = logs;
      setLogs((prev) => prev.filter((l) => l._id !== id));
      try {
        await workoutApi.delete(id);
      } catch (err) {
        setLogs(snapshot);
        setError(err.message);
      }
    },
    [logs]
  );

  return {
    loading,
    error,
    today,
    activeSession,
    setActiveSession: selectSession,
    suggestedSession,
    todayByExercise,
    todayExerciseNames,
    sessionProgram,
    sessionProgress,
    todaySessionSets,
    priorSessionSets,
    todayPrCount,
    sessions,
    streak,
    weekStrip,
    exercises,
    recentSessions,
    getLastWeight,
    getLastReps,
    getLastPerformance,
    getPersonalBest,
    logSet,
    retrySet,
    updateSet,
    deleteSet,
    refetch: fetchAll,
  };
}
