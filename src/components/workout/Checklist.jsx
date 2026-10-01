"use client";
import { useState, useEffect } from "react";
import { FiCheck, FiHelpCircle } from "react-icons/fi";

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

/**
 * Warm-up or cool-down as a tick list.
 *
 * These are done, not measured — there is no weight to beat — so they are
 * ticked off rather than logged as sets. Ticks live on the device, keyed by
 * date and session, and never reach the database or the progress count.
 */
export default function Checklist({ title, items, storageKey, hasTutorial, onShowTutorial }) {
  const [done, setDone] = useState([]);

  useEffect(() => { setDone(load(storageKey)); }, [storageKey]);

  if (!items.length) return null;

  const toggle = (name) => {
    const next = done.includes(name) ? done.filter((n) => n !== name) : [...done, name];
    setDone(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode): ticks still work for this visit.
    }
  };

  const count = items.filter((p) => done.includes(p.exercise_name)).length;

  return (
    <div className="card px-2 py-2">
      <div className="flex items-baseline justify-between px-2 pt-1 pb-1.5">
        <p className="section-label">{title}</p>
        <span className="text-xs text-ink-faint tabular">
          {count}/{items.length}
        </span>
      </div>
      <ul>
        {items.map((p) => {
          const checked = done.includes(p.exercise_name);
          return (
            <li key={p._id} className="flex items-center">
              <button
                onClick={() => toggle(p.exercise_name)}
                aria-pressed={checked}
                className="flex-1 min-w-0 flex items-center gap-3 px-2 py-2 rounded-xl text-left hover:bg-surface-raised/60 transition-colors"
              >
                <span
                  className={`shrink-0 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                    checked ? "bg-ink border-ink text-white" : "border-line-strong"
                  }`}
                >
                  {checked && <FiCheck size={12} strokeWidth={3} />}
                </span>
                <span className={`min-w-0 flex-1 text-sm truncate ${checked ? "text-ink-faint line-through" : "text-ink"}`}>
                  {p.exercise_name}
                </span>
                <span className="shrink-0 text-xs text-ink-muted tabular">{p.target_reps}</span>
              </button>
              {hasTutorial(p.exercise_name) && (
                <button
                  onClick={() => onShowTutorial(p.exercise_name)}
                  aria-label={`Tutorial ${p.exercise_name}`}
                  className="btn btn-ghost btn-icon shrink-0"
                >
                  <FiHelpCircle size={15} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
