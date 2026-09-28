"use client";
import { useId } from "react";

/**
 * Compact trend line for a series of { date, value }.
 *
 * Uses a fixed viewBox that scales to the container, so type scales with the
 * chart and stays proportional at any width. Colours inherit via currentColor
 * so the chart follows the surrounding text colour.
 */
export default function LineChart({ data, unit = "", height = 150 }) {
  const gradientId = useId();

  if (!data || data.length < 2) return null;

  const W = 340;
  const H = height;
  const PAD = { top: 14, right: 14, bottom: 24, left: 38 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Pad a flat series so the line sits mid-chart instead of collapsing onto an edge.
  const span = rawMax - rawMin || Math.max(rawMax * 0.02, 1);
  const min = rawMin - span * 0.15;
  const max = rawMax + span * 0.15;

  const x = (i) => (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const y = (v) => chartH - ((v - min) / (max - min)) * chartH;

  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${x(0)},${chartH} ${line} ${x(data.length - 1)},${chartH}`;

  const last = data[data.length - 1];
  const showEveryDot = data.length <= 12;

  const fmtDate = (d) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const tickIdx = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full text-ink"
      role="img"
      aria-label={`Trend chart, from ${rawMin}${unit} to ${rawMax}${unit}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {[0, 0.5, 1].map((t) => {
          const gy = t * chartH;
          const val = max - t * (max - min);
          return (
            <g key={t}>
              <line
                x1={0} y1={gy} x2={chartW} y2={gy}
                stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
              />
              <text
                x={-6} y={gy + 3} textAnchor="end"
                fontSize={9} fill="currentColor" fillOpacity={0.45}
              >
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}

        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {showEveryDot &&
          data.slice(0, -1).map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.value)} r={2.5} fill="currentColor" fillOpacity={0.35} />
          ))}

        {/* Latest point gets a ring so the current value is unmistakable */}
        <circle cx={x(data.length - 1)} cy={y(last.value)} r={5} fill="currentColor" />
        <circle cx={x(data.length - 1)} cy={y(last.value)} r={9} fill="currentColor" fillOpacity={0.15} />

        {tickIdx.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={chartH + 16}
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
            fontSize={9}
            fill="currentColor"
            fillOpacity={0.45}
          >
            {fmtDate(data[i].date)}
          </text>
        ))}
      </g>
    </svg>
  );
}
