"use client";
import { useState } from "react";
import LineChart from "@/components/ui/LineChart";

const RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "All", days: Infinity },
];

const SERIES = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "bmi", label: "BMI", unit: "" },
];

export default function MetricsChart({ metrics }) {
  const [range, setRange] = useState(RANGES[1]);
  const [series, setSeries] = useState(SERIES[0]);

  // `metrics` arrives newest-first; charts read left-to-right in time order.
  const ascending = [...metrics].reverse();

  const cutoff = Number.isFinite(range.days)
    ? Date.now() - range.days * 86400000
    : -Infinity;

  const data = ascending
    .filter((m) => new Date(m.date + "T00:00:00").getTime() >= cutoff)
    .map((m) => ({ date: m.date, value: m[series.key] }))
    .filter((d) => d.value > 0);

  const first = data[0]?.value;
  const last = data[data.length - 1]?.value;
  const change = first != null && last != null ? Math.round((last - first) * 10) / 10 : null;

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-ink">{series.label} Trend</p>
          {change != null && data.length >= 2 && (
            <p className="text-xs text-ink-muted mt-0.5 tabular">
              <span className={change < 0 ? "text-emerald-700 font-medium" : change > 0 ? "text-amber-700 font-medium" : ""}>
                {change > 0 ? "+" : ""}{change} {series.unit}
              </span>{" "}
              in this range
            </p>
          )}
        </div>

        <div className="flex gap-0.5 bg-surface-raised rounded-lg p-0.5 shrink-0">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRange(r)}
              className={`h-10 px-3 rounded-md text-xs font-medium transition-colors ${
                range.label === r.label ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {data.length >= 2 ? (
        <LineChart data={data} unit={series.unit} />
      ) : (
        <p className="text-sm text-ink-muted text-center py-10">
          Needs at least 2 weigh-ins in this range.
        </p>
      )}

      <div className="flex gap-1.5 mt-3">
        {SERIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setSeries(s)}
            className={`btn h-10 px-3.5 text-xs ${series.key === s.key ? "btn-primary" : "btn-secondary"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
