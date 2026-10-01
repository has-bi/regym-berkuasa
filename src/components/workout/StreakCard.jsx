"use client";
import { FiCheck, FiMoon, FiX, FiZap } from "react-icons/fi";

const STATUS = {
  done: {
    ring: "bg-ink text-white border-ink",
    icon: <FiCheck size={13} strokeWidth={3} />,
    label: "selesai",
  },
  rest: {
    ring: "bg-surface-raised text-ink-faint border-line",
    icon: <FiMoon size={12} />,
    label: "istirahat",
  },
  missed: {
    ring: "bg-surface text-red-600 border-red-200",
    icon: <FiX size={13} strokeWidth={3} />,
    label: "bolos",
  },
  pending: {
    ring: "bg-surface text-ink-faint border-line-strong border-dashed",
    icon: null,
    label: "belum",
  },
};

export default function StreakCard({ streak, weekStrip }) {
  const { current, best, todayPlan, pendingToday, trainedToday } = streak;

  const headline = todayPlan?.isRest
    ? "Jatah rebahan"
    : trainedToday
      ? "Beres. Mantap."
      : todayPlan?.session || "Kosong, bebas";

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="shrink-0">
          <p className="text-xs text-ink-muted mb-1">Streak</p>
          <p className="text-3xl font-semibold text-ink tabular leading-none flex items-baseline gap-1.5">
            {current}
            <span className="text-sm font-normal text-ink-faint">hari</span>
            {current > 0 && current >= best && best > 1 && (
              <FiZap size={15} className="text-amber-500 self-center" />
            )}
          </p>
          <p className="text-xs text-ink-faint mt-1.5 tabular">
            {best > current ? `Rekormu ${best} hari` : current > 1 ? "Ini rekor terpanjangmu" : "Baru mulai. Gapapa."}
          </p>
        </div>

        <div className="text-right min-w-0 flex-1">
          <p className="text-xs text-ink-muted mb-1">Hari ini</p>
          <p
            className={`text-sm font-semibold truncate ${
              todayPlan?.isRest ? "text-ink-muted" : trainedToday ? "text-emerald-700" : "text-ink"
            }`}
          >
            {headline}
          </p>
          {todayPlan?.notes && (
            // Two lines, then clipped: schedule notes are free text and can be
            // any length, and the streak number must stay readable regardless.
            <p className="text-xs text-ink-faint mt-1 line-clamp-2 leading-snug">
              {todayPlan.notes}
            </p>
          )}
        </div>
      </div>

      {/* Seven-day strip: rest days read as kept, not as gaps */}
      <div className="flex justify-between gap-1">
        {weekStrip.map((d) => {
          const s = STATUS[d.status];
          return (
            <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
              <span
                className={`text-[10px] font-medium ${d.isToday ? "text-ink" : "text-ink-faint"}`}
              >
                {d.dayShort}
              </span>
              <span
                title={`${d.dayShort}: ${d.session || "Istirahat"} — ${s.label}`}
                className={`h-8 w-8 rounded-full border flex items-center justify-center ${s.ring} ${
                  d.isToday ? "ring-2 ring-offset-2 ring-ink/20" : ""
                }`}
              >
                {s.icon}
              </span>
            </div>
          );
        })}
      </div>

      {pendingToday && (
        <p className="text-xs text-ink-muted mt-3.5 text-center">
          Saran hari ini: <span className="font-medium text-ink">{todayPlan.session}</span>. Mau ganti yang lain juga boleh — yang penting kecatat.
        </p>
      )}
    </div>
  );
}
