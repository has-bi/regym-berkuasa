"use client";
import { useState, useEffect } from "react";
import { STEP_GOAL } from "@/actions/data";
import { FiCheck, FiEdit2 } from "react-icons/fi";

/**
 * Daily walking, kept visually apart from the session work.
 *
 * It sits below the streak on purpose: missing a walk does not break the
 * streak, and showing it inside that card would imply it does.
 */
export default function WalkCard({ today, steps, weekSteps, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(steps || ""));
  const [saving, setSaving] = useState(false);

  // A refetch can land while the card is open; follow it unless mid-edit.
  useEffect(() => {
    if (!editing) setValue(String(steps || ""));
  }, [steps, editing]);

  const done = steps >= STEP_GOAL;
  const pct = Math.min(100, (steps / STEP_GOAL) * 100);

  // Seven-day average says more than one day: NEAT is a weekly habit, and a
  // single quiet day means little on its own.
  const logged = weekSteps.filter((d) => d.steps > 0);
  const avg = logged.length
    ? Math.round(logged.reduce((s, d) => s + d.steps, 0) / logged.length)
    : 0;

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
          <p className="text-xs text-ink-muted mb-1">Jalan hari ini</p>
          <p className="text-2xl font-semibold text-ink tabular leading-none flex items-baseline gap-1.5">
            {steps.toLocaleString("id-ID")}
            <span className="text-sm font-normal text-ink-faint">
              / {STEP_GOAL.toLocaleString("id-ID")}
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
            {steps > 0 ? "Ubah" : "Catat"}
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
            placeholder="jumlah langkah"
            className="field tabular flex-1"
          />
          <button onClick={save} disabled={saving} className="btn btn-primary btn-md shrink-0">
            {saving ? "..." : "Simpan"}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(String(steps || "")); }}
            className="btn btn-ghost btn-md shrink-0"
          >
            Batal
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
              {avg > 0 ? (
                <>Rata-rata 7 hari <span className="font-medium text-ink tabular">{avg.toLocaleString("id-ID")}</span></>
              ) : (
                "Belum ada catatan minggu ini"
              )}
            </p>
            {!done && steps > 0 && (
              <p className="text-xs text-ink-faint tabular">
                kurang {(STEP_GOAL - steps).toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
