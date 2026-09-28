"use client";
import { FiPlus, FiX } from "react-icons/fi";

function mmss(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Docked above the bottom nav so the countdown stays visible while scrolling
 * through the rest of the session.
 */
export default function RestTimerBar({ remaining, duration, label, isDone, onExtend, onStop }) {
  const pct = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] sm:bottom-6 z-40 px-4 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto max-w-2xl mx-auto rounded-2xl shadow-lg overflow-hidden animate-slide-up ${
          isDone ? "bg-emerald-600" : "bg-ink"
        }`}
      >
        {/* Progress fill doubles as the visual countdown */}
        <div className="relative h-1 bg-white/15">
          <div
            className="absolute inset-y-0 left-0 bg-white/50 transition-[width] duration-200 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-white/60 leading-none mb-1">
              {isDone ? "Go again!" : "Catch your breath"}
            </p>
            <p className="text-sm text-white/80 truncate leading-none">{label}</p>
          </div>

          <span className="text-2xl font-semibold text-white tabular leading-none">
            {mmss(remaining)}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onExtend(30)}
              aria-label="Add 30 seconds"
              className="h-9 px-2.5 inline-flex items-center gap-0.5 rounded-lg text-xs font-semibold
                         text-white/90 bg-white/10 hover:bg-white/20 transition-colors tabular"
            >
              <FiPlus size={12} />
              30
            </button>
            <button
              onClick={onStop}
              aria-label="Skip rest"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg
                         text-white/90 bg-white/10 hover:bg-white/20 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
