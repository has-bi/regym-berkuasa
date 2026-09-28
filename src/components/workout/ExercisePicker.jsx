"use client";
import { useState, useMemo } from "react";
import Sheet from "@/components/ui/Sheet";
import { FiSearch, FiPlus } from "react-icons/fi";

export default function ExercisePicker({ exercises, alreadyAdded, onSelect, onClose }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = exercises.filter(
      (e) =>
        !alreadyAdded.includes(e.name) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          (e.muscle_group || "").toLowerCase().includes(q))
    );

    const map = {};
    filtered.forEach((e) => {
      (map[e.muscle_group || "Other"] ||= []).push(e);
    });
    return map;
  }, [exercises, alreadyAdded, query]);

  const count = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);
  const trimmed = query.trim();

  return (
    <Sheet title="What are you lifting?" onClose={onClose}>
      <div className="sticky top-0 bg-surface pb-3 -mx-5 px-5 z-10">
        <div className="relative">
          <FiSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
          />
          <input
            autoFocus
            type="text"
            placeholder="Search by exercise or muscle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field pl-9"
          />
        </div>
      </div>

      <div className="pb-4">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-4 last:mb-0">
            <p className="section-label mb-1.5">{group}</p>
            <div className="space-y-0.5">
              {items.map((ex) => (
                <button
                  key={ex._id}
                  onClick={() => onSelect(ex.name)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-surface-raised transition-colors"
                >
                  <p className="text-sm font-medium text-ink">{ex.name}</p>
                  {ex.equipment && (
                    <p className="text-xs text-ink-muted mt-0.5">{ex.equipment}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {count === 0 && (
          <div className="text-center py-10">
            <p className="text-sm font-medium text-ink mb-1">No matches</p>
            <p className="text-sm text-ink-muted mb-4">
              {trimmed ? `Couldn't find "${trimmed}" in the list.` : "Every exercise is already added."}
            </p>
            {trimmed && (
              <button onClick={() => onSelect(trimmed)} className="btn btn-primary btn-md mx-auto">
                <FiPlus size={15} />
                Use &ldquo;{trimmed}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
