"use client";
import { DAY_SHORT } from "@/lib/schedule";
import { NOTE_TAGS } from "./DaySheet";
import { FiEdit3 } from "react-icons/fi";

const TAG_LABEL = Object.fromEntries(NOTE_TAGS.map((t) => [t.key, t.label]));

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

/** The food side: a small dot under the date, so it reads as a second layer. */
const BALANCE_LEGEND = [
  { label: "Deficit", swatch: "bg-emerald-500" },
  { label: "Surplus", swatch: "bg-amber-500" },
];

function balanceTitle(c) {
  if (c.deficit == null) return "";
  const n = Math.abs(c.balance).toLocaleString("en-US");
  return ` · ${c.deficit ? "deficit" : "surplus"} ${n} kcal`;
}

/**
 * This month at a glance: which days were gym days and which were not.
 * Today's plan sits above it, since that is what the screen is opened for.
 */
export default function MonthCard({ calendar, todayPlan, trainedToday, onSelectDay }) {
  const todayCell = calendar.cells.find((c) => c?.isToday);
  const todayNote = todayCell?.note;

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
          {/* Today's note, or the way to add one — same sheet as tapping the date */}
          {todayCell && (
            <button
              onClick={() => onSelectDay(todayCell.date)}
              className="mt-1.5 text-xs text-left text-sky-700 hover:text-sky-900 inline-flex items-start gap-1"
            >
              <FiEdit3 size={11} className="shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                {todayNote
                  ? [TAG_LABEL[todayNote.tag], todayNote.note].filter(Boolean).join(" — ")
                  : "Add a note"}
              </span>
            </button>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-ink-muted mb-1">{calendar.label}</p>
          <p className="text-sm font-semibold text-ink tabular">
            {calendar.gymDays}{" "}
            <span className="font-normal text-ink-muted">gym {calendar.gymDays === 1 ? "day" : "days"}</span>
          </p>
          {calendar.deficitDays + calendar.surplusDays > 0 && (
            <p className="text-xs text-ink-muted tabular mt-0.5">
              <span className="text-emerald-700 font-medium">{calendar.deficitDays}</span>
              {" "}of {calendar.deficitDays + calendar.surplusDays} days in deficit
            </p>
          )}
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
            <button
              key={c.date}
              onClick={() => onSelectDay(c.date)}
              aria-label={`${c.day}: ${c.session ? `${c.session}, ` : ""}${LABEL[c.status]}${balanceTitle(c)}${c.note ? ", has a note" : ""}`}
              className="flex flex-col items-center gap-0.5 rounded-lg py-0.5 hover:bg-surface-raised/60"
            >
              <span
                className={`relative h-8 w-8 rounded-full flex items-center justify-center text-xs tabular ${
                  CELL[c.status]
                } ${c.isToday && c.status === "done" ? "ring-2 ring-offset-2 ring-ink/20" : ""}`}
              >
                {c.day}
                {c.note && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-surface" />
                )}
              </span>
              {/* Always rendered so rows keep the same height with or without food data */}
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  c.deficit === true ? "bg-emerald-500" : c.deficit === false ? "bg-amber-500" : "bg-transparent"
                }`}
              />
            </button>
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
        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Note
        </span>
        {BALANCE_LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${l.swatch}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
