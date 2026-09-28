"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchBundle, deserializeBundle } from "@/actions/data";
import LineChart from "@/components/ui/LineChart";
import { FiAward, FiAlertCircle } from "react-icons/fi";

function startOfWeek(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday-first
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function SummaryView() {
  const [logs, setLogs] = useState([]);
  const [body, setBody] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    fetchBundle()
      .then((raw) => {
        const { workoutLogs, bodyMetrics } = deserializeBundle(raw);
        setLogs(workoutLogs);
        setBody([...bodyMetrics].sort((a, b2) => a.date.localeCompare(b2.date)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const exerciseNames = useMemo(
    () => [...new Set(logs.map((l) => l.exercise_name))].sort(),
    [logs]
  );

  useEffect(() => {
    if (exerciseNames.length && !selected) setSelected(exerciseNames[0]);
  }, [exerciseNames, selected]);

  /** Sessions this week vs last, so the headline number has a reference point. */
  const weekly = useMemo(() => {
    const thisWeek = startOfWeek(new Date());
    const lastWeek = new Date(thisWeek);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const sessionsIn = (from, to) =>
      new Set(
        logs
          .filter((l) => {
            const d = new Date(l.date + "T00:00:00");
            return d >= from && (!to || d < to);
          })
          .map((l) => l.date + l.session)
      ).size;

    return { current: sessionsIn(thisWeek, null), previous: sessionsIn(lastWeek, thisWeek) };
  }, [logs]);

  const stats = useMemo(() => {
    if (!selected) return null;
    const mine = logs.filter((l) => l.exercise_name === selected);
    if (!mine.length) return null;

    const best = mine.reduce((b, l) => (l.weight > b.weight ? l : b), mine[0]);
    const rpes = mine.filter((l) => l.rpe > 0);

    return {
      best,
      totalSets: mine.length,
      avgRpe: rpes.length ? (rpes.reduce((s, l) => s + l.rpe, 0) / rpes.length).toFixed(1) : null,
      volume: mine.reduce((s, l) => s + l.weight * l.reps, 0),
    };
  }, [logs, selected]);

  const exerciseProgress = useMemo(() => {
    if (!selected) return [];
    const byDate = {};
    logs
      .filter((l) => l.exercise_name === selected)
      .forEach((l) => {
        if (!byDate[l.date] || l.weight > byDate[l.date]) byDate[l.date] = l.weight;
      });
    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, value }));
  }, [logs, selected]);

  const bodyProgress = useMemo(
    () => body.filter((m) => m.weight > 0).map((m) => ({ date: m.date, value: m.weight })),
    [body]
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-32 rounded-lg bg-surface-raised animate-pulse" />
        <div className="h-24 w-full rounded-2xl bg-surface-raised animate-pulse" />
        <div className="h-48 w-full rounded-2xl bg-surface-raised animate-pulse" />
      </div>
    );
  }

  const totalSessions = new Set(logs.map((l) => l.date + l.session)).size;
  const totalVolume = logs.reduce((s, l) => s + l.weight * l.reps, 0);
  const weekDelta = weekly.current - weekly.previous;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="page-title">Report</h1>
        <p className="page-sub">Numbers don&rsquo;t lie</p>
      </header>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
          <FiAlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-medium text-ink mb-1">Nothing yet</p>
          <p className="text-sm text-ink-muted">Log a few sets and the charts will show up on their own.</p>
        </div>
      ) : (
        <>
          <div className="card flex divide-x divide-line">
            <div className="flex-1 px-4 py-3.5">
              <p className="text-xs text-ink-muted mb-1">This week</p>
              <p className="text-2xl font-semibold text-ink tabular leading-none flex items-baseline gap-1.5">
                {weekly.current}
                <span className="text-sm font-normal text-ink-faint">sessions</span>
                {weekly.previous > 0 && weekDelta !== 0 && (
                  <span
                    className={`text-xs font-semibold tabular ${
                      weekDelta > 0 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {weekDelta > 0 ? "+" : ""}
                    {weekDelta}
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-faint mt-1.5">
                {weekly.previous > 0 ? "vs last week" : "first week"}
              </p>
            </div>
            <div className="flex-1 px-4 py-3.5">
              <p className="text-xs text-ink-muted mb-1">Total sessions</p>
              <p className="text-2xl font-semibold text-ink tabular leading-none">{totalSessions}</p>
              <p className="text-xs text-ink-faint mt-1.5 tabular">{logs.length} sets</p>
            </div>
            <div className="flex-1 px-4 py-3.5 min-w-0">
              <p className="text-xs text-ink-muted mb-1">Volume</p>
              <p className="text-2xl font-semibold text-ink tabular leading-none truncate">
                {Math.round(totalVolume / 1000).toLocaleString("en-US")}
                <span className="text-sm font-normal text-ink-faint ml-1">t</span>
              </p>
              <p className="text-xs text-ink-faint mt-1.5">all time</p>
            </div>
          </div>

          {bodyProgress.length >= 2 && (
            <div className="card p-4">
              <p className="text-sm font-semibold text-ink mb-3">Body Weight Trend</p>
              <LineChart data={bodyProgress} unit="kg" />
            </div>
          )}

          {exerciseNames.length > 0 && (
            <div className="card p-4 space-y-4">
              <div>
                <label htmlFor="ex-select" className="field-label">View by exercise</label>
                <select
                  id="ex-select"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="field"
                >
                  {exerciseNames.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {stats && (
                <div className="flex divide-x divide-line rounded-xl bg-surface-raised">
                  <div className="flex-1 px-3 py-3">
                    <p className="text-xs text-ink-muted mb-1 flex items-center gap-1">
                      <FiAward size={11} />
                      Heaviest
                    </p>
                    <p className="text-lg font-semibold text-ink tabular leading-none">
                      {stats.best.weight}
                      <span className="text-xs font-normal text-ink-faint ml-0.5">kg</span>
                    </p>
                    <p className="text-xs text-ink-faint mt-1 tabular">× {stats.best.reps} reps</p>
                  </div>
                  <div className="flex-1 px-3 py-3">
                    <p className="text-xs text-ink-muted mb-1">Total set</p>
                    <p className="text-lg font-semibold text-ink tabular leading-none">{stats.totalSets}</p>
                  </div>
                  <div className="flex-1 px-3 py-3">
                    <p className="text-xs text-ink-muted mb-1">Average RPE</p>
                    <p className="text-lg font-semibold text-ink tabular leading-none">
                      {stats.avgRpe ?? "—"}
                    </p>
                  </div>
                </div>
              )}

              {exerciseProgress.length >= 2 ? (
                <div>
                  <p className="text-xs text-ink-muted mb-1">Heaviest weight per session (kg)</p>
                  <LineChart data={exerciseProgress} unit="kg" height={140} />
                </div>
              ) : (
                <p className="text-sm text-ink-muted text-center py-6">
                  Needs 2 sessions before a line shows up.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
