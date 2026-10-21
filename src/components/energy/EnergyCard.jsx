"use client";

const fmt = (n) => Math.round(n).toLocaleString("en-US");

/**
 * In vs out for one day, as a single number: what was eaten against the whole
 * day's burn — resting, workout and steps. Comparing food with the workout
 * alone would call almost every day a surplus, since most of the burn is the
 * body simply running.
 *
 * Out is an estimate (lib/energy.js), so the card is for direction, not
 * precision. A week line underneath shows whether the days add up.
 */
export default function EnergyCard({ day, isToday, week, title = "Energy balance" }) {
  if (!day) return null;

  const deficit = day.balance > 0;
  const tone = !day.hasFood ? "text-ink-faint" : deficit ? "text-emerald-700" : "text-amber-700";
  const verdict = !day.hasFood ? "No food logged" : deficit ? "Deficit" : "Surplus";

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="section-label">{title}</p>
        {isToday && day.hasFood && <span className="text-xs text-ink-faint">so far today</span>}
      </div>

      {/* In − out = balance, left to right */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-ink-muted mb-1">In</p>
          <p className="text-xl font-semibold text-ink tabular leading-none">{fmt(day.eaten)}</p>
          <p className="text-[11px] text-ink-faint mt-1">food</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted mb-1">Out</p>
          <p className="text-xl font-semibold text-ink tabular leading-none">{fmt(day.burn)}</p>
          <p className="text-[11px] text-ink-faint mt-1">burned, est.</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted mb-1">{verdict}</p>
          <p className={`text-xl font-semibold tabular leading-none ${tone}`}>
            {day.hasFood ? fmt(Math.abs(day.balance)) : "—"}
          </p>
          <p className="text-[11px] text-ink-faint mt-1">kcal</p>
        </div>
      </div>

      {/* Where "out" comes from — most of it is just being alive */}
      <p className="text-xs text-ink-muted mt-3 pt-3 border-t border-line leading-relaxed tabular">
        Out = resting {fmt(day.rest)}
        {" + "}workout {fmt(day.exercise)}{day.planned && " (planned)"}
        {" + "}steps {fmt(day.steps)}
        {day.steps === 0 && <span className="text-ink-faint"> · log steps for a truer number</span>}
      </p>

      {week && week.logged > 0 && (
        <p className="text-xs text-ink-muted mt-1.5 leading-relaxed tabular">
          Last {week.days} days ({week.logged} logged):{" "}
          <span className={week.total > 0 ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
            {week.total > 0 ? "deficit" : "surplus"} {fmt(Math.abs(week.total))} kcal
          </span>
          {" "}≈ {Math.abs(week.kg).toFixed(2)} kg of fat {week.total > 0 ? "lost" : "gained"}
          <span className="text-ink-faint"> · avg {fmt(Math.abs(week.perDay))}/day</span>
        </p>
      )}
    </div>
  );
}
