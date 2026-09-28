"use client";
import { useState } from "react";
import Sheet from "@/components/ui/Sheet";
import Stepper from "@/components/ui/Stepper";
import { FiTrendingUp, FiAward } from "react-icons/fi";

const RPE_OPTIONS = [6, 7, 8, 9, 10];
const RPE_HINT = {
  6: "Easy · 4+ reps left",
  7: "Moderate · 3 reps left",
  8: "Hard · 2 reps left",
  9: "Very hard · 1 rep left",
  10: "Max · failure",
};

/** First number in a target like "8-12", "2-3 min" or "30 sec per side". */
function leadingNumber(text) {
  const m = String(text ?? "").match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function formatDaysAgo(dateStr) {
  const then = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const days = Math.round((now - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.floor(days / 7)} weeks ago`;
}

export default function SetInputModal({
  exerciseName,
  setNumber,
  prefillWeight,
  prefillReps,
  lastPerformance,
  personalBest,
  targetReps,
  prefillRpe,
  mode = "create",
  onConfirm,
  onClose,
}) {
  const isEdit = mode === "edit";
  const [weight, setWeight] = useState(prefillWeight != null ? String(prefillWeight) : "");
  const [reps, setReps] = useState(() => {
    if (prefillReps != null) return String(prefillReps);
    // No history yet: seed from the programmed target so bodyweight and
    // duration work ("2-3 min", "30 sec per side") is not left at zero.
    const fromTarget = leadingNumber(targetReps);
    return fromTarget != null ? String(fromTarget) : "";
  });
  const [rpe, setRpe] = useState(prefillRpe ?? 7);

  // Blank means bodyweight, not "unset" — plenty of exercises carry no load.
  const w = weight.trim() === "" ? 0 : parseFloat(weight);
  const r = parseInt(reps, 10);

  const isBodyweight = Number.isFinite(w) && w === 0;
  const valid = Number.isFinite(w) && w >= 0 && Number.isFinite(r) && r > 0;

  // Loaded lifts beat a weight record; bodyweight work beats a reps record.
  // Editing an existing set never claims a PR — the best already includes it.
  const isPR =
    valid && !isEdit && personalBest
      ? personalBest.metric === "weight"
        ? w > 0 && w > personalBest.value
        : isBodyweight && r > personalBest.value
      : false;

  // Compare against the matching set from last session, not just the last set,
  // so "set 3 vs set 3" is a like-for-like read.
  const referenceSet =
    lastPerformance?.sets?.[setNumber - 1] ??
    lastPerformance?.sets?.[lastPerformance.sets.length - 1] ??
    null;

  const delta = valid && referenceSet ? w - referenceSet.weight : null;

  return (
    <Sheet
      subtitle={isEdit ? `Edit set ${setNumber}` : `Set ${setNumber}`}
      title={exerciseName}
      onClose={onClose}
      footer={
        <div>
          <button
            onClick={() => valid && onConfirm(w, r, rpe)}
            disabled={!valid}
            className="btn btn-primary btn-lg w-full"
          >
            {isPR && <FiAward size={18} />}
            {isEdit ? "Save changes" : isPR ? "Log new PR" : "Log set"}
          </button>
          {/* Never leave a disabled button unexplained */}
          {!valid && (
            <p className="text-xs text-ink-muted text-center mt-2">
              Fill in the reps first. Weight can be 0 for bodyweight.
            </p>
          )}
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        {/* Reference row — the whole point of logging is beating this */}
        {referenceSet ? (
          <div className="card bg-surface-raised border-line p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ink-muted mb-0.5">
                  Last time · {formatDaysAgo(lastPerformance.date)}
                </p>
                <p className="text-sm font-semibold text-ink tabular">
                  {referenceSet.weight} kg × {referenceSet.reps}
                  {referenceSet.rpe ? (
                    <span className="font-normal text-ink-muted"> @ RPE {referenceSet.rpe}</span>
                  ) : null}
                </p>
              </div>
              {delta !== null && delta !== 0 && (
                <span
                  className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg tabular ${
                    delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-surface text-ink-muted border border-line"
                  }`}
                >
                  {delta > 0 && <FiTrendingUp size={12} />}
                  {delta > 0 ? "+" : ""}
                  {Math.round(delta * 10) / 10} kg
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="card bg-surface-raised border-line p-3.5">
            <p className="text-xs text-ink-muted">
              No history yet. This set becomes the benchmark.
            </p>
          </div>
        )}

        <Stepper
          label="Weight"
          value={weight}
          onChange={setWeight}
          step={2.5}
          suffix="kg"
          hint={
            isBodyweight
              ? "Bodyweight"
              : personalBest?.metric === "weight"
                ? `PR ${personalBest.value} kg`
                : null
          }
        />

        <Stepper
          label="Reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={0}
          hint={
            personalBest?.metric === "reps"
              ? `PR ${personalBest.value} reps`
              : targetReps
                ? `target ${targetReps}`
                : null
          }
        />

        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="text-xs font-medium text-ink-muted">RPE</label>
            <span className="text-xs text-ink-faint">{RPE_HINT[rpe]}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {RPE_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setRpe(v)}
                aria-pressed={rpe === v}
                className={`h-12 rounded-xl text-sm font-semibold tabular transition-colors ${
                  rpe === v
                    ? "bg-ink text-white"
                    : "bg-surface-raised text-ink-muted hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {isPR && (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl px-3.5 py-3">
            <FiAward size={16} className="shrink-0" />
            Record broken — previous best was {personalBest.value}
            {personalBest.metric === "weight" ? " kg" : " reps"}
          </div>
        )}
      </div>
    </Sheet>
  );
}
