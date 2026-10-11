"use client";
import { useState, useEffect } from "react";
import { STEP_GOAL } from "@/actions/data";
import { FiCheck, FiEdit2 } from "react-icons/fi";

/**
 * Walking, judged on the seven-day average rather than on any one day.
 *
 * Stored apart from workout_logs on purpose: a walk is not a gym session, so
 * it never turns a rest day into a gym day on the calendar.
 */
export default function WalkCard({ today, steps, weekSteps, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(steps || ""));
  const [saving, setSaving] = useState(false);

  // A refetch can land while the card is open; follow it unless mid-edit.
  useEffect(() => {
    if (!editing) setValue(String(steps || ""));
  }, [steps, editing]);

  // Days with no entry are left out rather than counted as zero: an unlogged
  // day is missing data, not a day without walking.
  const logged = weekSteps.filter((d) => d.steps > 0);
  const avg = logged.length
    ? Math.round(logged.reduce((s, d) => s + d.steps, 0) / logged.length)
    : 0;

  const done = avg >= STEP_GOAL;
  const pct = Math.min(100, (avg / STEP_GOAL) * 100);

  const save = async () => {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 0) return;
    setSaving(true);
    await onSave(today, n);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted mb-1">Steps · 7-day average</p>
          <p className="text-2xl font-semibold text-ink tabular leading-none flex items-baseline gap-1.5">
            {avg.toLocaleString("en-US")}
            <span className="text-sm font-normal text-ink-faint">
              / {STEP_GOAL.toLocaleString("en-US")}
            </span>
            {done && <FiCheck size={16} className="text-emerald-700 self-center" strokeWidth={3} />}
          </p>
        </div>

        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <FiEdit2 size={13} />
            {steps > 0 ? "Edit today" : "Log today"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="step count"
            className="field tabular flex-1"
          />
          <button onClick={save} disabled={saving} className="btn btn-primary btn-md shrink-0">
            {saving ? "..." : "Save"}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(String(steps || "")); }}
            className="btn btn-ghost btn-md shrink-0"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                done ? "bg-emerald-600" : "bg-ink"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-baseline justify-between mt-2.5">
            <p className="text-xs text-ink-muted">
              Today{" "}
              <span className="font-medium text-ink tabular">
                {steps > 0 ? steps.toLocaleString("en-US") : "not logged"}
              </span>
            </p>
            <p className="text-xs text-ink-faint">
              {logged.length ? `${logged.length} of 7 days logged` : "Nothing logged this week"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
