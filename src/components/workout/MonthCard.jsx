"use client";
import { DAY_SHORT } from "@/lib/schedule";

/** Monday-first column headers. */
const HEADERS = [1, 2, 3, 4, 5, 6, 0].map((i) => DAY_SHORT[i]);

/** One look per status. Gym days are the only filled circles, so they read first. */
const CELL = {
  done: "bg-ink text-white font-semibold",
  rest: "bg-surface-raised text-ink-faint",
  missed: "bg-red-50 text-red-600 border border-red-200",
  today: "text-ink font-semibold border border-dashed border-ink",
  planned: "text-ink border border-dashed border-line-strong",
  upcoming: "bg-surface-raised text-ink-faint",
};

const LABEL = {
  done: "gym",
  rest: "rest",
  missed: "missed",
  today: "today",
  planned: "planned",
  upcoming: "rest",
};

const LEGEND = [
  { label: "Gym", swatch: "bg-ink" },
  { label: "Planned", swatch: "border border-dashed border-line-strong" },
  { label: "Missed", swatch: "bg-red-50 border border-red-200" },
  { label: "Rest", swatch: "bg-surface-raised" },
];

/**
 * This month at a glance: which days were gym days and which were not.
 * Today's plan sits above it, since that is what the screen is opened for.
 */
export default function MonthCard({ calendar, todayPlan, trainedToday }) {
  const headline = todayPlan?.isRest
    ? "Rest day"
    : trainedToday
      ? "Done. Nice."
      : todayPlan?.session || "Free day";

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4 mb-3.5">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted mb-1">Today</p>
          <p
            className={`text-sm font-semibold truncate ${
              todayPlan?.isRest ? "text-ink-muted" : trainedToday ? "text-emerald-700" : "text-ink"
            }`}
          >
            {headline}
          </p>
          {todayPlan?.notes && (
            <p className="text-xs text-ink-faint mt-0.5 line-clamp-2 leading-snug">{todayPlan.notes}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-ink-muted mb-1">{calendar.label}</p>
          <p className="text-sm font-semibold text-ink tabular">
            {calendar.gymDays}{" "}
            <span className="font-normal text-ink-muted">gym {calendar.gymDays === 1 ? "day" : "days"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {HEADERS.map((h) => (
          <span key={h} className="text-[10px] font-medium text-ink-faint pb-1">
            {h}
          </span>
        ))}
        {calendar.cells.map((c, i) =>
          c ? (
            <div key={c.date} className="flex justify-center">
              <span
                title={`${c.day}: ${c.session ? `${c.session} — ` : ""}${LABEL[c.status]}`}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs tabular ${
                  CELL[c.status]
                } ${c.isToday && c.status === "done" ? "ring-2 ring-offset-2 ring-ink/20" : ""}`}
              >
                {c.day}
              </span>
            </div>
          ) : (
            <span key={`pad-${i}`} />
          )
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3.5 pt-3 border-t border-line">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
            <span className={`h-2.5 w-2.5 rounded-full ${l.swatch}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
