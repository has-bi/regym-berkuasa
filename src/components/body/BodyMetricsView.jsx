"use client";
import { useState } from "react";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import MetricsChart from "./MetricsChart";
import { FiTrash2, FiPlus, FiX, FiArrowDown, FiArrowUp, FiAlertCircle } from "react-icons/fi";

const BMI_BANDS = [
  { max: 18.5, label: "Underweight", tone: "text-sky-700" },
  { max: 25, label: "Normal", tone: "text-emerald-700" },
  { max: 30, label: "Overweight", tone: "text-amber-700" },
  { max: Infinity, label: "Obese", tone: "text-red-600" },
];

function bmiBand(bmi) {
  if (!bmi) return { label: "", tone: "text-ink" };
  return BMI_BANDS.find((b) => bmi < b.max);
}

function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const formatDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * A measurement on its own says little — the change since the last one is the
 * signal, so every stat carries its delta.
 */
function Stat({ label, value, unit, delta, tone, caption }) {
  const moved = delta != null && Math.abs(delta) >= 0.05;
  const down = delta < 0;

  return (
    <div className="flex-1 px-4 py-3.5 min-w-0">
      <p className="text-xs text-ink-muted mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular leading-none ${tone || "text-ink"}`}>
        {value ?? "—"}
        {unit && <span className="text-sm font-normal text-ink-faint ml-1">{unit}</span>}
      </p>
      {moved ? (
        <p
          className={`text-xs font-medium mt-1.5 flex items-center gap-0.5 tabular ${
            down ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {down ? <FiArrowDown size={11} /> : <FiArrowUp size={11} />}
          {Math.abs(Math.round(delta * 10) / 10)}
        </p>
      ) : (
        caption && <p className="text-xs text-ink-faint mt-1.5">{caption}</p>
      )}
    </div>
  );
}

export default function BodyMetricsView() {
  const { loading, error, metrics, latest, addMetric, deleteMetric } = useBodyMetrics();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight: "", waist: "", height: "173", date: getLocalToday() });

  const previous = metrics[1] ?? null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.weight || !form.waist) return;
    setSaving(true);
    await addMetric(form);
    setForm({ weight: "", waist: "", height: form.height, date: getLocalToday() });
    setShowForm(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-44 rounded-lg bg-surface-raised animate-pulse" />
        <div className="h-24 w-full rounded-2xl bg-surface-raised animate-pulse" />
        <div className="h-40 w-full rounded-2xl bg-surface-raised animate-pulse" />
      </div>
    );
  }

  const band = bmiBand(latest?.bmi);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Body</h1>
          <p className="page-sub">
            {latest ? `Last weighed ${formatDate(latest.date)}` : "Not weighed yet"}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`btn btn-md shrink-0 ${showForm ? "btn-secondary" : "btn-primary"}`}
        >
          {showForm ? <FiX size={15} /> : <FiPlus size={15} />}
          {showForm ? "Cancel" : "Log"}
        </button>
      </header>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
          <FiAlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {latest && (
        <div className="card flex divide-x divide-line">
          <Stat
            label="Weight"
            value={latest.weight}
            unit="kg"
            delta={previous ? latest.weight - previous.weight : null}
            caption={previous ? "no change" : "baseline"}
          />
          <Stat
            label="Waist"
            value={latest.waist}
            unit="cm"
            delta={previous ? latest.waist - previous.waist : null}
            caption={previous ? "no change" : "baseline"}
          />
          <Stat
            label="BMI"
            value={latest.bmi}
            tone={band.tone}
            delta={previous ? latest.bmi - previous.bmi : null}
            caption={band.label}
          />
        </div>
      )}

      {latest && <p className="text-xs text-ink-faint -mt-2 px-1">{band.label} · height {latest.height} cm</p>}

      {metrics.length >= 2 && <MetricsChart metrics={metrics} />}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-4 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Weigh in</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Weight (kg)", key: "weight", step: "0.1", placeholder: "84.5", required: true },
              { label: "Waist (cm)", key: "waist", step: "0.5", placeholder: "98", required: true },
              { label: "Height (cm)", key: "height", step: "1", placeholder: "173" },
            ].map(({ label, key, step, placeholder, required }) => (
              <div key={key}>
                <label htmlFor={`bm-${key}`} className="field-label">{label}</label>
                <input
                  id={`bm-${key}`}
                  type="number"
                  inputMode="decimal"
                  step={step}
                  required={required}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="field tabular"
                />
              </div>
            ))}
            <div>
              <label htmlFor="bm-date" className="field-label">Date</label>
              <input
                id="bm-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="field"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !form.weight || !form.waist}
            className="btn btn-primary btn-md w-full"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      {metrics.length > 0 && (
        <section>
          <p className="section-label mb-2.5">History</p>
          <div className="card divide-y divide-line">
            {metrics.map((m, i) => {
              const prev = metrics[i + 1];
              const d = prev ? m.weight - prev.weight : null;
              return (
                <div key={m._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{formatDate(m.date)}</p>
                    <p className="text-xs text-ink-muted mt-0.5 tabular">
                      {m.weight} kg · {m.waist} cm · BMI {m.bmi}
                    </p>
                  </div>
                  {d != null && Math.abs(d) >= 0.05 && (
                    <span
                      className={`text-xs font-semibold tabular shrink-0 ${
                        d < 0 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {d > 0 ? "+" : ""}
                      {Math.round(d * 10) / 10}
                    </span>
                  )}
                  <button
                    onClick={() => deleteMetric(m._id)}
                    aria-label={`Delete measurement from ${formatDate(m.date)}`}
                    className="btn btn-ghost btn-icon shrink-0"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {metrics.length === 0 && !showForm && (
        <div className="card p-8 text-center">
          <p className="text-sm font-medium text-ink mb-1">Nothing yet</p>
          <p className="text-sm text-ink-muted mb-4">
            Weigh in once to start. The trend shows up after two entries.
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-md mx-auto">
            <FiPlus size={15} />
            Weigh in now
          </button>
        </div>
      )}
    </div>
  );
}
