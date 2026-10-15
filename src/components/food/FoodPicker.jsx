"use client";
import { useState, useMemo } from "react";
import Sheet from "@/components/ui/Sheet";
import Stepper from "@/components/ui/Stepper";
import { scaled } from "@/hooks/useFood";
import { FiSearch, FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";

const EMPTY = { name: "", portion: "1 portion", kcal: "", protein: "", carbs: "", fat: "" };

function Macros({ v, className = "" }) {
  return (
    <span className={`tabular ${className}`}>
      P {v.protein} · C {v.carbs} · F {v.fat}
    </span>
  );
}

/**
 * Pick a food and how much of it, or add / edit one in the library.
 * Three steps in one sheet so the flow never stacks dialogs.
 */
export default function FoodPicker({ foods, onLog, onSaveFood, onDeleteFood, onClose }) {
  const [step, setStep] = useState("list"); // list | amount | form
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [servings, setServings] = useState("1");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods;
  }, [foods, query]);

  const pick = (food) => {
    setPicked(food);
    setServings("1");
    setStep("amount");
  };

  const openForm = (food) => {
    setEditingId(food?._id ?? null);
    setForm(
      food
        ? { name: food.name, portion: food.portion, kcal: String(food.kcal), protein: String(food.protein), carbs: String(food.carbs), fat: String(food.fat) }
        : { ...EMPTY, name: query.trim() }
    );
    setFormError(null);
    setConfirmDelete(false);
    setStep("form");
  };

  const num = (s) => (String(s).trim() === "" ? 0 : parseFloat(s));
  const kcal = num(form.kcal);
  const formValid = form.name.trim() && Number.isFinite(kcal) && kcal >= 0 &&
    ["protein", "carbs", "fat"].every((k) => Number.isFinite(num(form[k])) && num(form[k]) >= 0);

  const submitForm = async () => {
    if (!formValid) return;
    setBusy(true);
    setFormError(null);
    try {
      const food = await onSaveFood(editingId, {
        name: form.name.trim(),
        portion: form.portion.trim() || "1 portion",
        kcal: Math.round(kcal),
        protein: num(form.protein),
        carbs: num(form.carbs),
        fat: num(form.fat),
      });
      // A new food goes straight to "how much", since it was added to be eaten.
      if (editingId) setStep("list");
      else pick(food);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeFood = async () => {
    setBusy(true);
    try {
      await onDeleteFood(editingId);
      setStep("list");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const s = parseFloat(servings);
  const servingsValid = Number.isFinite(s) && s > 0;

  if (step === "amount" && picked) {
    const total = servingsValid ? scaled(picked, s) : null;
    return (
      <Sheet
        subtitle={picked.portion}
        title={picked.name}
        onClose={onClose}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setStep("list")} className="btn btn-secondary btn-lg">Back</button>
            <button
              onClick={() => servingsValid && onLog(picked, s)}
              disabled={!servingsValid}
              className="btn btn-primary btn-lg flex-1"
            >
              Add {total ? `· ${total.kcal} kcal` : ""}
            </button>
          </div>
        }
      >
        <div className="space-y-5 pb-2">
          <Stepper label="Portions" value={servings} onChange={setServings} step={0.5} min={0.5} hint={picked.portion} />
          {total && (
            <div className="card bg-surface-raised border-line p-3.5 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-ink tabular">
                {total.kcal}<span className="text-sm font-normal text-ink-faint"> kcal</span>
              </span>
              <Macros v={total} className="text-xs text-ink-muted" />
            </div>
          )}
        </div>
      </Sheet>
    );
  }

  if (step === "form") {
    const fields = [
      { key: "kcal", label: "Calories (kcal)", step: "1" },
      { key: "protein", label: "Protein (g)", step: "0.1" },
      { key: "carbs", label: "Carbs (g)", step: "0.1" },
      { key: "fat", label: "Fat (g)", step: "0.1" },
    ];
    return (
      <Sheet
        title={editingId ? "Edit food" : "New food"}
        onClose={onClose}
        footer={
          <div className="flex gap-2">
            <button onClick={() => setStep("list")} className="btn btn-secondary btn-lg">Back</button>
            <button onClick={submitForm} disabled={!formValid || busy} className="btn btn-primary btn-lg flex-1">
              {busy ? "Saving..." : editingId ? "Save" : "Save & log"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          <div>
            <label htmlFor="food-name" className="field-label">Name</label>
            <input id="food-name" className="field" value={form.name} autoFocus={!editingId}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nasi goreng" />
          </div>
          <div>
            <label htmlFor="food-portion" className="field-label">One portion is</label>
            <input id="food-portion" className="field" value={form.portion}
              onChange={(e) => setForm((f) => ({ ...f, portion: e.target.value }))} placeholder="1 plate" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fields.map((fd) => (
              <div key={fd.key}>
                <label htmlFor={`food-${fd.key}`} className="field-label">{fd.label}</label>
                <input id={`food-${fd.key}`} type="number" inputMode="decimal" step={fd.step} min="0"
                  className="field tabular" value={form[fd.key]} placeholder="0"
                  onChange={(e) => setForm((f) => ({ ...f, [fd.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-faint">Macros can stay 0 if you only know the calories.</p>

          {formError && <p className="text-sm text-red-700">{formError}</p>}

          {editingId && (
            confirmDelete ? (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5">
                <span className="flex-1 text-sm text-red-700">Delete from your foods? Past entries stay.</span>
                <button onClick={removeFood} disabled={busy} className="btn btn-danger btn-sm">Delete</button>
                <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost btn-md w-full text-red-700">
                <FiTrash2 size={14} /> Delete food
              </button>
            )
          )}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title="Log food" onClose={onClose}>
      <div className="sticky top-0 bg-surface pb-3 -mx-5 px-5 z-10 flex gap-2">
        <div className="relative flex-1">
          <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          <input type="text" placeholder="Search your foods..." value={query}
            onChange={(e) => setQuery(e.target.value)} className="field pl-9" />
        </div>
        <button onClick={() => openForm(null)} className="btn btn-secondary btn-md shrink-0" aria-label="New food">
          <FiPlus size={15} /> New
        </button>
      </div>

      <ul className="pb-4 space-y-0.5">
        {filtered.map((f) => (
          <li key={f._id} className="flex items-center">
            <button onClick={() => pick(f)}
              className="flex-1 min-w-0 text-left px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-ink truncate">{f.name}</p>
                <p className="text-sm font-semibold text-ink tabular shrink-0">{f.kcal}</p>
              </div>
              <p className="text-xs text-ink-muted mt-0.5 truncate">
                {f.portion} · <Macros v={f} />
              </p>
            </button>
            <button onClick={() => openForm(f)} aria-label={`Edit ${f.name}`} className="btn btn-ghost btn-icon shrink-0">
              <FiEdit2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-ink-muted mb-4">
            {query.trim() ? `No "${query.trim()}" in your foods yet.` : "No foods yet."}
          </p>
          <button onClick={() => openForm(null)} className="btn btn-primary btn-md mx-auto">
            <FiPlus size={15} /> Add {query.trim() ? `"${query.trim()}"` : "a food"}
          </button>
        </div>
      )}
    </Sheet>
  );
}
