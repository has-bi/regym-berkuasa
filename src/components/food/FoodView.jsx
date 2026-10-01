"use client";
import { useState } from "react";
import { RULES, EVERYDAY, CAFE } from "@/lib/food";
import { FiCheck, FiMinus, FiArrowRight } from "react-icons/fi";

const MODES = [
  { key: "everyday", label: "Everyday", data: EVERYDAY },
  { key: "cafe", label: "At a café", data: CAFE },
];

function List({ title, items, tone }) {
  const good = tone === "good";
  return (
    <section>
      <p className="section-label mb-2.5">{title}</p>
      <ul className="card divide-y divide-line">
        {items.map((item) => (
          <li key={item.name} className="flex gap-3 px-4 py-3">
            <span
              className={`shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                good ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {good ? <FiCheck size={12} strokeWidth={3} /> : <FiMinus size={12} strokeWidth={3} />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{item.name}</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{item.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function FoodView() {
  const [mode, setMode] = useState(MODES[0]);
  const { eat, limit, swaps } = mode.data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <header>
        <h1 className="page-title">Food</h1>
        <p className="page-sub">What to reach for, and what to keep rare</p>
      </header>

      {/* The three habits that do most of the work, whatever the setting */}
      <div className="card divide-y divide-line">
        {RULES.map((r, i) => (
          <div key={r.title} className="flex gap-3 px-4 py-3">
            <span className="shrink-0 w-5 text-sm font-semibold text-ink-faint tabular">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{r.title}</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-0.5 bg-surface-raised rounded-xl p-0.5" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.key}
            role="tab"
            aria-selected={mode.key === m.key}
            onClick={() => setMode(m)}
            className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
              mode.key === m.key ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Swaps first at a café: the decision is made at the counter */}
      {swaps && (
        <section>
          <p className="section-label mb-2.5">Easy swaps</p>
          <ul className="card divide-y divide-line">
            {swaps.map((s) => (
              <li key={s.from} className="flex items-center gap-2 px-4 py-3 text-sm">
                <span className="flex-1 min-w-0 text-ink-muted line-through decoration-ink-faint">{s.from}</span>
                <FiArrowRight size={14} className="shrink-0 text-ink-faint" />
                <span className="flex-1 min-w-0 text-right font-medium text-ink">{s.to}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <List title={mode.key === "cafe" ? "Order" : "Eat"} items={eat} tone="good" />
      <List title={mode.key === "cafe" ? "Skip" : "Keep rare"} items={limit} tone="limit" />

      <p className="text-xs text-ink-faint leading-relaxed px-1">
        General guidance for losing waist fat, not a diet plan. What you eat across
        the whole week matters more than any single meal.
      </p>
    </div>
  );
}
