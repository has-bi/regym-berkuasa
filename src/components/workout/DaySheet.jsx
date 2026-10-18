"use client";
import { useState } from "react";
import Sheet from "@/components/ui/Sheet";

/** Quick reasons, so a month of notes can be scanned without reading each one. */
export const NOTE_TAGS = [
  { key: "pain", label: "Pain / injury" },
  { key: "sick", label: "Sick" },
  { key: "no-time", label: "No time" },
  { key: "low-energy", label: "Low energy" },
  { key: "cut-short", label: "Cut short" },
  { key: "strong", label: "Felt strong" },
];

const fmt = (n) => Math.round(n).toLocaleString("en-US");

/** "15×12 · 15×12" for lifts; minutes or rounds for cardio, which log no weight. */
function setsLabel(sets) {
  return sets
    .map((s) => (s.weight > 0 ? `${s.weight}×${s.reps}` : `${s.reps}`))
    .join(" · ");
}

/**
 * One day from the calendar: what was planned, what happened, and a note on
 * why — a missed session, a short one, or a good one worth remembering.
 */
export default function DaySheet({ day, onSave, onClose }) {
  const [tag, setTag] = useState(day.note?.tag ?? "");
  const [note, setNote] = useState(day.note?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const title = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
  const planned = day.plan.isRest ? "Rest day" : `Planned: ${day.plan.session}`;
  const changed = tag !== (day.note?.tag ?? "") || note !== (day.note?.note ?? "");

  const save = async (values) => {
    setBusy(true);
    setError(null);
    try {
      await onSave(day.date, values);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Sheet
      subtitle={planned}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {day.note && (
            <button onClick={() => save({ tag: "", note: "" })} disabled={busy} className="btn btn-secondary btn-lg">
              Clear
            </button>
          )}
          <button
            onClick={() => save({ tag, note: note.trim() })}
            disabled={busy || !changed}
            className="btn btn-primary btn-lg flex-1"
          >
            {busy ? "Saving..." : "Save note"}
          </button>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        {/* What actually happened */}
        <section>
          <p className="section-label mb-2">Logged</p>
          {day.exercises.length ? (
            <ul className="card divide-y divide-line">
              {day.exercises.map((e) => (
                <li key={e.name} className="flex items-baseline justify-between gap-3 px-3.5 py-2.5">
                  <span className="text-sm text-ink min-w-0 truncate">{e.name}</span>
                  <span className="text-xs text-ink-muted tabular shrink-0">{setsLabel(e.sets)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Nothing logged{day.plan.isRest ? " — it was a rest day." : "."}</p>
          )}
          {day.energy?.hasFood && (
            <p className="text-xs text-ink-muted mt-2 tabular">
              Burned ~{fmt(day.energy.burn)} · ate {fmt(day.energy.eaten)} ·{" "}
              <span className={day.energy.balance > 0 ? "text-emerald-700" : "text-amber-700"}>
                {day.energy.balance > 0 ? "deficit" : "surplus"} {fmt(Math.abs(day.energy.balance))}
              </span>
            </p>
          )}
        </section>

        {/* The why */}
        <section>
          <p className="section-label mb-2">Note</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {NOTE_TAGS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTag(tag === t.key ? "" : t.key)}
                aria-pressed={tag === t.key}
                className={`h-9 px-3 rounded-full text-xs font-medium border transition-colors ${
                  tag === t.key ? "bg-ink text-white border-ink" : "bg-surface text-ink-muted border-line hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Why it was missed, cut short, or how it went"
            className="field h-auto min-h-[6rem] py-2.5 leading-relaxed"
          />
          {error && <p className="text-sm text-red-700 mt-2">{error}</p>}
        </section>
      </div>
    </Sheet>
  );
}
