"use client";
import { useState, useMemo } from "react";
import { useProgram } from "@/hooks/useProgram";
import TutorialSheet from "@/components/workout/TutorialSheet";
import { DAY_NAMES, buildScheduleMap } from "@/lib/streak";
import { FiAlertCircle, FiHelpCircle, FiCalendar } from "react-icons/fi";

/** Monday-first for reading order; DAY_NAMES itself is Sunday-indexed. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0].map((i) => DAY_NAMES[i]);

export default function ProgramView() {
  const { loading, error, bySession, exercises, schedule } = useProgram();
  const [tutorialFor, setTutorialFor] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  const scheduleMap = useMemo(() => buildScheduleMap(schedule), [schedule]);
  const todayName = DAY_NAMES[new Date().getDay()];
  const todayPlan = scheduleMap[todayName];

  const exerciseByName = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.name, e])),
    [exercises]
  );

  /** Every session that exists, whether or not the schedule uses it. */
  const sessionNames = useMemo(() => {
    const scheduled = WEEK_ORDER.map((d) => scheduleMap[d]?.session)
      .filter((s) => s && s.toUpperCase() !== "REST");
    return [...new Set([...scheduled, ...Object.keys(bySession)])];
  }, [scheduleMap, bySession]);

  /** Which weekdays a session is pencilled in for — shown as context, not a rule. */
  const daysForSession = useMemo(() => {
    const map = {};
    WEEK_ORDER.forEach((day) => {
      const s = scheduleMap[day];
      if (!s || s.isRest) return;
      (map[s.session] ||= []).push(day);
    });
    return map;
  }, [scheduleMap]);

  const restDays = useMemo(
    () => WEEK_ORDER.filter((d) => !scheduleMap[d] || scheduleMap[d].isRest),
    [scheduleMap]
  );

  const hasTutorial = (name) => {
    const e = exerciseByName[name];
    return Boolean(e && (String(e.video_url || "").trim() || String(e.cues || "").trim()));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-36 rounded-lg bg-surface-raised animate-pulse" />
        <div className="h-9 w-full rounded-xl bg-surface-raised animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 w-full rounded-2xl bg-surface-raised animate-pulse" />
        ))}
      </div>
    );
  }

  // Open on whatever today suggests, but any session can be browsed freely.
  const selected =
    activeSession ??
    (todayPlan && !todayPlan.isRest ? todayPlan.session : sessionNames[0]) ??
    null;

  const list = selected ? bySession[selected] || [] : [];
  const totalSets = list.reduce((n, p) => n + (p.target_sets || 0), 0);
  const scheduledOn = selected ? daysForSession[selected] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="page-title">Program</h1>
        <p className="page-sub">Every session on the menu. Browse any of them.</p>
      </header>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
          <FiAlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Browse by session, not by day — the day is a hint, not a gate */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sessionNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveSession(name)}
            aria-pressed={selected === name}
            className={`btn btn-md shrink-0 whitespace-nowrap ${
              selected === name ? "btn-primary" : "btn-secondary"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{selected}</p>
              {scheduledOn?.length ? (
                <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1.5">
                  <FiCalendar size={11} className="shrink-0" />
                  Usually {scheduledOn.join(", ")}
                  {todayPlan?.session === selected && (
                    <span className="text-emerald-700 font-medium"> · today</span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-ink-faint mt-0.5">Not scheduled — do it any day</p>
              )}
            </div>
            {list.length > 0 && (
              <p className="text-xs text-ink-muted tabular shrink-0">
                {list.length} exercises · {totalSets} sets
              </p>
            )}
          </div>

          <div className="space-y-2">
            {list.map((p, idx) => (
              <div key={p._id} className="card px-4 py-3 flex items-center gap-3">
                <span className="w-5 shrink-0 text-xs font-semibold text-ink-faint tabular text-right">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{p.exercise_name}</p>
                  <p className="text-xs text-ink-muted mt-0.5 tabular">
                    {p.target_sets} × {p.target_reps}
                    {p.target_weight > 0 ? ` @ ${p.target_weight}kg` : ""}
                    {p.rest_seconds > 0 ? ` · ${p.rest_seconds}s` : ""}
                  </p>
                </div>
                {hasTutorial(p.exercise_name) && (
                  <button
                    onClick={() => setTutorialFor(p.exercise_name)}
                    aria-label={`Tutorial ${p.exercise_name}`}
                    className="btn btn-ghost btn-icon shrink-0"
                  >
                    <FiHelpCircle size={16} />
                  </button>
                )}
              </div>
            ))}

            {list.length === 0 && (
              <div className="card p-8 text-center">
                <p className="text-sm font-medium text-ink mb-1">{selected} is empty</p>
                <p className="text-sm text-ink-muted">
                  No exercises are set up for this session yet.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* The weekly plan, presented as a reference rather than a controller */}
      {restDays.length > 0 && (
        <div className="card p-4">
          <p className="section-label mb-2.5">Suggested week</p>
          <div className="space-y-1.5">
            {WEEK_ORDER.map((day) => {
              const p = scheduleMap[day];
              const rest = !p || p.isRest;
              const isToday = day === todayName;
              return (
                <div key={day} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-24 shrink-0 ${isToday ? "font-semibold text-ink" : "text-ink-muted"}`}
                  >
                    {day}
                  </span>
                  <span className={rest ? "text-ink-faint" : "text-ink"}>
                    {rest ? "rest" : p.session}
                  </span>
                  {isToday && (
                    <span className="text-xs text-emerald-700 font-medium ml-auto shrink-0">
                      today
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-faint mt-3 leading-relaxed">
            Just a suggestion. Lift whatever you want on any day — the streak keeps going.
          </p>
        </div>
      )}

      {tutorialFor && (
        <TutorialSheet
          exercise={exerciseByName[tutorialFor] ?? { name: tutorialFor }}
          programInfo={list.find((p) => p.exercise_name === tutorialFor) ?? null}
          onClose={() => setTutorialFor(null)}
        />
      )}
    </div>
  );
}
