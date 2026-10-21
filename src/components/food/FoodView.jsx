"use client";
import { useState } from "react";
import { useFood } from "@/hooks/useFood";
import Sheet from "@/components/ui/Sheet";
import FoodPicker from "./FoodPicker";
import EnergyCard from "@/components/energy/EnergyCard";
import { FiPlus, FiTrash2, FiChevronLeft, FiChevronRight, FiAlertCircle, FiSettings } from "react-icons/fi";

function shiftDate(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(date, today) {
  if (date === today) return "Today";
  if (date === shiftDate(today, -1)) return "Yesterday";
  return new Date(date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

const fmt = (n) => Math.round(n).toLocaleString("en-US");

/** Sex and age, asked once; weight and height come from the Body tab. */
function ProfileSheet({ profile, latestMetric, onSave, onClose }) {
  const [sex, setSex] = useState(profile?.sex ?? "");
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const a = parseInt(age, 10);
  const valid = sex && Number.isFinite(a) && a >= 14 && a <= 99;

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await onSave({ sex, age: a });
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Sheet
      title="Calorie target"
      onClose={onClose}
      footer={
        <button onClick={save} disabled={!valid || busy} className="btn btn-primary btn-lg w-full">
          {busy ? "Saving..." : "Save"}
        </button>
      }
    >
      <div className="space-y-4 pb-2">
        <div>
          <p className="field-label">Sex</p>
          <div className="grid grid-cols-2 gap-2">
            {["male", "female"].map((s) => (
              <button key={s} onClick={() => setSex(s)} aria-pressed={sex === s}
                className={`btn btn-md capitalize ${sex === s ? "btn-primary" : "btn-secondary"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="profile-age" className="field-label">Age</label>
          <input id="profile-age" type="number" inputMode="numeric" min="14" max="99" className="field tabular"
            value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" />
        </div>
        <p className="text-xs text-ink-faint leading-relaxed">
          {latestMetric
            ? `Weight ${latestMetric.weight} kg and height ${latestMetric.height} cm come from your latest weigh-in, so the target updates as you log on the Body tab.`
            : "Log a weigh-in on the Body tab too — the target needs your weight and height."}
        </p>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </Sheet>
  );
}

function MacroBar({ label, value, target }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-ink-muted">{label}</span>
        <span className="text-xs text-ink tabular">
          {fmt(value)}{target ? <span className="text-ink-faint">/{target}g</span> : "g"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
        <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function FoodView() {
  const {
    loading, error, today, date, setDate, foods, dayLogs, totals, targets, profile, latestMetric, day, week,
    logFood, deleteLog, saveFood, deleteFood, saveProfile,
  } = useFood();
  const [picking, setPicking] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-32 rounded-lg bg-surface-raised animate-pulse" />
        <div className="h-36 w-full rounded-2xl bg-surface-raised animate-pulse" />
        <div className="h-24 w-full rounded-2xl bg-surface-raised animate-pulse" />
      </div>
    );
  }

  const remaining = targets ? targets.kcal - totals.kcal : null;
  const over = remaining != null && remaining < 0;
  const pct = targets ? Math.min(100, (totals.kcal / targets.kcal) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Food</h1>
          <p className="page-sub">{dayLabel(date, today)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day" className="btn btn-ghost btn-icon">
            <FiChevronLeft size={18} />
          </button>
          <button onClick={() => setDate(shiftDate(date, 1))} disabled={date >= today} aria-label="Next day"
            className="btn btn-ghost btn-icon disabled:opacity-30">
            <FiChevronRight size={18} />
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
          <FiAlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!profile && (
        <div className="card p-4">
          <p className="text-sm font-semibold text-ink">Set your calorie target</p>
          <p className="text-xs text-ink-muted mt-1 mb-3">
            Two quick answers — sex and age. Weight and height come from your weigh-ins.
          </p>
          <button onClick={() => setEditingProfile(true)} className="btn btn-primary btn-md">Set target</button>
        </div>
      )}

      {/* The day against the target */}
      <div className="card p-4">
        <div className="flex items-end justify-between gap-3 mb-2.5">
          <div>
            <p className="text-xs text-ink-muted mb-0.5">Eaten</p>
            <p className="text-3xl font-semibold text-ink tabular leading-none">
              {fmt(totals.kcal)}
              {targets && <span className="text-sm font-normal text-ink-faint"> / {fmt(targets.kcal)} kcal</span>}
            </p>
          </div>
          {targets && (
            <div className="text-right">
              <p className="text-xs text-ink-muted mb-0.5">{over ? "Over" : "Left"}</p>
              <p className={`text-lg font-semibold tabular leading-none ${over ? "text-amber-700" : "text-ink"}`}>
                {fmt(Math.abs(remaining))}
              </p>
            </div>
          )}
        </div>
        {targets && (
          <div className="h-2 rounded-full bg-surface-raised overflow-hidden mb-4">
            <div className={`h-full rounded-full transition-[width] duration-300 ${over ? "bg-amber-600" : "bg-ink"}`}
              style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="flex gap-3">
          <MacroBar label="Protein" value={totals.protein} target={targets?.protein} />
          <MacroBar label="Carbs" value={totals.carbs} target={targets?.carbs} />
          <MacroBar label="Fat" value={totals.fat} target={targets?.fat} />
        </div>
        {targets && (
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-faint">Target = burned − 500 kcal</p>
            <button onClick={() => setEditingProfile(true)} aria-label="Edit target profile"
              className="btn btn-ghost btn-icon shrink-0 -mr-2">
              <FiSettings size={13} />
            </button>
          </div>
        )}
      </div>

      <EnergyCard day={day} isToday={date === today} week={week} />

      <button onClick={() => setPicking(true)} className="btn btn-primary btn-lg w-full">
        <FiPlus size={16} /> Log food
      </button>

      {dayLogs.length > 0 ? (
        <ul className="card divide-y divide-line">
          {dayLogs.map((l) => (
            <li key={l._id} className="flex items-center gap-3 pl-4 pr-2 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{l.name}</p>
                <p className="text-xs text-ink-muted mt-0.5 tabular truncate">
                  {l.servings !== 1 && `${l.servings} × `}{l.portion} · P {l.protein} · C {l.carbs} · F {l.fat}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink tabular shrink-0">{l.kcal}</span>
              <button onClick={() => deleteLog(l._id)} aria-label={`Remove ${l.name}`} className="btn btn-ghost btn-icon shrink-0">
                <FiTrash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted text-center py-6">Nothing logged {date === today ? "today" : "this day"}.</p>
      )}

      {picking && (
        <FoodPicker
          foods={foods}
          onLog={(food, servings) => { logFood(food, servings); setPicking(false); }}
          onSaveFood={saveFood}
          onDeleteFood={deleteFood}
          onClose={() => setPicking(false)}
        />
      )}

      {editingProfile && (
        <ProfileSheet profile={profile} latestMetric={latestMetric} onSave={saveProfile} onClose={() => setEditingProfile(false)} />
      )}
    </div>
  );
}
