"use client";
import { FiZap } from "react-icons/fi";

/**
 * Streak, today's plan and the week, in as little height as possible: this
 * sits above the work on the screen used mid-session.
 */
export default function StreakCard({ streak, weekPlan }) {
  const { current, best, todayPlan, trainedToday } = streak;

  const headline = todayPlan?.isRest
    ? "Rest day"
    : trainedToday
      ? "Done. Nice."
      : todayPlan?.session || "Free day";

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="shrink-0">
          <p className="text-xs text-ink-muted mb-1">Streak</p>
          <p className="text-3xl font-semibold text-ink tabular leading-none flex items-baseline gap-1.5">
            {current}
            <span className="text-sm font-normal text-ink-faint">{current === 1 ? "day" : "days"}</span>
            {current > 0 && current >= best && best > 1 && (
              <FiZap size={15} className="text-amber-500 self-center" />
            )}
          </p>
          {best > current && (
            <p className="text-xs text-ink-faint mt-1.5 tabular">Best: {best} days</p>
          )}
        </div>

        <div className="text-right min-w-0 flex-1">
          <p className="text-xs text-ink-muted mb-1">Today</p>
          <p
            className={`text-sm font-semibold truncate ${
              todayPlan?.isRest ? "text-ink-muted" : trainedToday ? "text-emerald-700" : "text-ink"
            }`}
          >
            {headline}
          </p>
          {todayPlan?.notes && (
            // Two lines, then clipped: schedule notes are free text and can be
            // any length, and the streak number must stay readable regardless.
            <p className="text-xs text-ink-faint mt-1 line-clamp-2 leading-snug">
              {todayPlan.notes}
            </p>
          )}
        </div>
      </div>

      {/* The week as a suggestion, not a gate — any session can be picked below */}
      <p className="text-xs text-ink-faint mt-3 pt-3 border-t border-line leading-relaxed">
        {weekPlan.map((d, i) => (
          <span key={d.day} className={d.isToday ? "font-semibold text-ink" : ""}>
            {i > 0 && <span className="text-ink-faint font-normal"> · </span>}
            {d.day} {d.session || "Rest"}
          </span>
        ))}
      </p>
    </div>
  );
}
