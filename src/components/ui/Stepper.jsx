"use client";
import { useRef } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

/**
 * Large increment/decrement control for numeric entry.
 *
 * Typing a weight on a phone keyboard mid-workout is the slowest part of
 * logging, so ± buttons are the primary path and the value itself stays
 * tappable for the occasional odd number.
 */
export default function Stepper({ label, value, onChange, step = 1, min = 0, suffix, hint }) {
  const inputRef = useRef(null);
  const numeric = parseFloat(value);
  const current = Number.isFinite(numeric) ? numeric : 0;

  const nudge = (delta) => {
    const next = Math.max(min, Math.round((current + delta) * 100) / 100);
    onChange(String(next));
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-xs font-medium text-ink-muted">{label}</label>
        {hint && <span className="text-xs text-ink-faint tabular">{hint}</span>}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => nudge(-step)}
          aria-label={`Decrease ${label}`}
          className="btn btn-secondary h-14 w-14 shrink-0 rounded-xl"
        >
          <FiMinus size={20} />
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            className="w-full h-14 text-center text-3xl font-semibold tabular text-ink
                       bg-surface-raised rounded-xl border border-transparent
                       focus:border-ink focus:bg-surface focus:outline-none transition-colors"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => nudge(step)}
          aria-label={`Increase ${label}`}
          className="btn btn-secondary h-14 w-14 shrink-0 rounded-xl"
        >
          <FiPlus size={20} />
        </button>
      </div>
    </div>
  );
}
