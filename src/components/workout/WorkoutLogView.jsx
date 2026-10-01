"use client";
import { useState } from "react";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useRestTimer } from "@/hooks/useRestTimer";
import SetInputModal from "./SetInputModal";
import ExercisePicker from "./ExercisePicker";
import RestTimerBar from "./RestTimerBar";
import StreakCard from "./StreakCard";
import WalkCard from "./WalkCard";
import Checklist from "./Checklist";
import TutorialSheet from "./TutorialSheet";
import SessionSummarySheet from "./SessionSummarySheet";
import {
  FiPlus, FiTrash2, FiCheck, FiChevronDown, FiAlertCircle,
  FiHelpCircle, FiEdit2, FiRefreshCw, FiFlag,
} from "react-icons/fi";

const DEFAULT_REST = 90;

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

/** Filled = logged, hollow = still programmed. Reads at a glance mid-set. */
function SetDots({ done, target }) {
  if (!target) return null;
  const total = Math.max(done, target);
  return (
    <div className="flex items-center gap-1" aria-label={`${done} of ${target} sets`}>
      {Array.from({ length: Math.min(total, 8) }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-colors ${
            i < done ? "w-4 bg-ink" : "w-1.5 bg-line-strong"
          }`}
        />
      ))}
    </div>
  );
}

function SetRow({ log, index, onDelete, onRetry, onEdit }) {
  const [confirming, setConfirming] = useState(false);

  const saving = log._status === "saving";
  const failed = log._status === "failed";

  if (confirming) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50">
        <span className="w-5 text-xs font-semibold text-ink-faint tabular shrink-0">{index + 1}</span>
        <span className="flex-1 text-sm font-medium text-red-700">Delete this set?</span>
        <button onClick={() => onDelete(log._id)} className="btn btn-danger btn-sm px-2.5">
          Delete
        </button>
        <button onClick={() => setConfirming(false)} className="btn btn-ghost btn-sm px-2.5">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl transition-colors ${
        failed ? "bg-amber-50 border border-amber-200" : "odd:bg-surface-raised/60"
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="w-5 text-xs font-semibold text-ink-faint tabular shrink-0">
          {index + 1}
        </span>

        <span
          className={`flex-1 text-sm font-semibold tabular ${saving ? "opacity-40" : "text-ink"}`}
        >
          {log.weight} kg <span className="text-ink-faint font-normal mx-0.5">×</span> {log.reps}
        </span>

        {!failed && (
          <button
            onClick={() => onEdit(log)}
            aria-label={`Edit set ${index + 1}`}
            disabled={saving}
            className="btn btn-ghost btn-icon shrink-0 disabled:opacity-30"
          >
            <FiEdit2 size={13} />
          </button>
        )}

        <button
          onClick={() => setConfirming(true)}
          aria-label={`Delete set ${index + 1}`}
          className="btn btn-ghost btn-icon shrink-0"
        >
          <FiTrash2 size={13} />
        </button>
      </div>

      {/* A failed write keeps its row: the reps happened, only the save did not */}
      {failed && (
        <div className="flex items-center gap-2 px-3 pb-2.5">
          <FiAlertCircle size={13} className="text-amber-700 shrink-0" />
          <p className="flex-1 text-xs text-amber-800 leading-snug">
            {log._error || "Stuck. Not saved yet."}
          </p>
          <button
            onClick={() => onRetry(log._id)}
            className="btn btn-secondary btn-sm px-2.5 shrink-0"
          >
            <FiRefreshCw size={12} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({
  name, sets, programInfo, lastPerformance, hasTutorial,
  onShowTutorial, onLogSet, onDelete, onRetry, onEdit,
}) {
  const [open, setOpen] = useState(true);

  const target = programInfo?.target_sets ?? 0;
  const done = sets.length;
  const complete = target > 0 && done >= target;

  const targetLabel = programInfo
    ? `${programInfo.target_sets} × ${programInfo.target_reps}${
        programInfo.target_weight > 0 ? ` @ ${programInfo.target_weight}kg` : ""
      }`
    : "Extra";

  const lastSet = lastPerformance?.sets?.[lastPerformance.sets.length - 1];

  return (
    <div className={`card overflow-hidden ${complete ? "border-emerald-200" : ""}`}>
      {/* Expand and tutorial are siblings — a button cannot nest inside a button */}
      <div className="flex items-stretch">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex-1 min-w-0 flex items-center gap-3 pl-4 pr-2 py-3.5 text-left hover:bg-surface-raised/50 transition-colors"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {complete && (
                <span className="shrink-0 h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center">
                  <FiCheck size={11} className="text-white" strokeWidth={3} />
                </span>
              )}
              <p className="font-semibold text-sm text-ink truncate">{name}</p>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              {targetLabel}
              {programInfo?.rest_seconds > 0 && (
                <span className="text-ink-faint"> · {programInfo.rest_seconds}s rest</span>
              )}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-ink tabular">
              {done}
              {target > 0 && <span className="text-ink-faint font-normal">/{target}</span>}
            </span>
            <SetDots done={done} target={target} />
          </div>
        </button>

        <div className="flex items-center gap-0.5 pr-3 pl-1 shrink-0">
          {hasTutorial && (
            <button
              onClick={onShowTutorial}
              aria-label={`Tutorial ${name}`}
              className="btn btn-ghost btn-icon"
            >
              <FiHelpCircle size={16} />
            </button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Collapse" : "Expand"}
            className="btn btn-ghost btn-icon"
          >
            <FiChevronDown
              size={16}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {sets.length > 0 && (
            <div className="space-y-0.5">
              {sets.map((s, i) => (
                <SetRow
                  key={s._id}
                  log={s}
                  index={i}
                  onDelete={onDelete}
                  onRetry={onRetry}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}

          {sets.length === 0 && lastSet && (
            <p className="px-3 py-2 text-xs text-ink-muted">
              Last time:{" "}
              <span className="font-medium text-ink tabular">
                {lastSet.weight} kg × {lastSet.reps}
              </span>
            </p>
          )}

          <button onClick={onLogSet} className="btn btn-secondary btn-md w-full">
            <FiPlus size={15} />
            {sets.length === 0 ? "Start first set" : `Log set ${sets.length + 1}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function WorkoutLogView() {
  const {
    loading, error, today, activeSession, setActiveSession, suggestedSession,
    todayByExercise, todayExerciseNames, sessionProgram, sessionProgress,
    sessions, streak, weekPlan, warmups, cooldowns,
    stepsToday, weekSteps, saveSteps,
    todaySessionSets, priorSessionSets, todayPrCount,
    exercises, recentSessions,
    getLastWeight, getLastReps, getLastPerformance, getPersonalBest,
    logSet, retrySet, updateSet, deleteSet,
  } = useWorkoutLog();

  const timer = useRestTimer();
  const [loggingExercise, setLoggingExercise] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tutorialFor, setTutorialFor] = useState(null);

  /** Tutorial content lives on the exercises table, matched by name. */
  const exerciseByName = Object.fromEntries(exercises.map((e) => [e.name, e]));
  const hasTutorial = (name) => {
    const e = exerciseByName[name];
    return Boolean(e && (String(e.video_url || "").trim() || String(e.cues || "").trim()));
  };

  const todayLabel = new Date(today + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-8 w-44 rounded-lg bg-surface-raised animate-pulse" />
        <div className="h-4 w-32 rounded bg-surface-raised animate-pulse" />
        <div className="h-11 w-full rounded-xl bg-surface-raised animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 w-full rounded-2xl bg-surface-raised animate-pulse" />
        ))}
      </div>
    );
  }

  const pct = sessionProgress.target > 0
    ? Math.min(100, (sessionProgress.done / sessionProgress.target) * 100)
    : 0;

  const handleConfirm = (weight, reps) => {
    const name = loggingExercise;
    logSet(name, weight, reps);
    setLoggingExercise(null);

    const rest = sessionProgram.find((p) => p.exercise_name === name)?.rest_seconds || DEFAULT_REST;
    timer.start(rest, name);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-5">
      <header>
        <h1 className="page-title">Lift</h1>
        <p className="page-sub capitalize">{todayLabel}</p>
      </header>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3">
          <FiAlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Streak + this week, driven by the schedule */}
      <StreakCard streak={streak} weekPlan={weekPlan} />

      {/* Walking sits outside the streak on purpose — see WalkCard */}
      <WalkCard today={today} steps={stepsToday} weekSteps={weekSteps} onSave={saveSteps} />

      {/* Session selector — scrolls rather than wrapping, keeping the header a fixed height */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <p className="section-label">What are we hitting</p>
          {/* The schedule advises; tapping is the only thing that decides */}
          {suggestedSession && activeSession !== suggestedSession && (
            <button
              onClick={() => setActiveSession(suggestedSession)}
              className="text-xs text-ink-muted hover:text-ink underline underline-offset-2 shrink-0"
            >
              Suggested: {suggestedSession}
            </button>
          )}
        </div>

        {streak.todayPlan?.isRest && (
          <p className="text-xs text-ink-muted mb-2">
            Today&rsquo;s a rest day — but if you feel like lifting, just pick one. Your streak
            is safe either way.
          </p>
        )}
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sessions.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSession(s)}
              aria-pressed={activeSession === s}
              className={`btn btn-md shrink-0 whitespace-nowrap ${
                activeSession === s ? "btn-primary" : "btn-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Session progress — answers "am I done yet" without counting rows */}
      {activeSession && sessionProgress.target > 0 && (
        <div className="card p-4">
          <div className="flex items-end justify-between mb-2.5">
            <div>
              <p className="text-xs text-ink-muted mb-0.5">Progress</p>
              <p className="text-lg font-semibold text-ink tabular leading-none">
                {sessionProgress.done}
                <span className="text-ink-faint font-normal">/{sessionProgress.target} sets</span>
              </p>
            </div>
            {sessionProgress.volume > 0 && (
              <div className="text-right">
                <p className="text-xs text-ink-muted mb-0.5">Total lifted</p>
                <p className="text-lg font-semibold text-ink tabular leading-none">
                  {Math.round(sessionProgress.volume).toLocaleString("en-US")}
                  <span className="text-ink-faint font-normal text-sm"> kg</span>
                </p>
              </div>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-surface-raised overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                sessionProgress.complete ? "bg-emerald-600" : "bg-ink"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {sessionProgress.complete && (
            <p className="text-xs font-medium text-emerald-700 mt-2.5 flex items-center gap-1.5">
              <FiCheck size={13} strokeWidth={3} />
              Today&rsquo;s program is done. Brag a little.
            </p>
          )}

          {/* Available from the first set — a short session still deserves a verdict */}
          {sessionProgress.done > 0 && (
            <button
              onClick={() => setShowSummary(true)}
              className={`btn btn-md w-full mt-3.5 ${
                sessionProgress.complete ? "btn-primary" : "btn-secondary"
              }`}
            >
              <FiFlag size={15} />
              Finish session &amp; see report
            </button>
          )}
        </div>
      )}

      {/* Exercises */}
      {activeSession && (
        <div className="space-y-3">
          <Checklist
            title="Warm-up"
            items={warmups}
            storageKey={`checks:${today}:${activeSession}:warmup`}
            hasTutorial={hasTutorial}
            onShowTutorial={setTutorialFor}
          />

          {todayExerciseNames.map((name) => (
            <ExerciseCard
              key={name}
              name={name}
              sets={todayByExercise[name] || []}
              programInfo={sessionProgram.find((p) => p.exercise_name === name) ?? null}
              lastPerformance={getLastPerformance(name)}
              hasTutorial={hasTutorial(name)}
              onShowTutorial={() => setTutorialFor(name)}
              onLogSet={() => setLoggingExercise(name)}
              onDelete={deleteSet}
              onRetry={retrySet}
              onEdit={setEditingSet}
            />
          ))}

          {todayExerciseNames.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-sm font-medium text-ink mb-1">Nothing here</p>
              <p className="text-sm text-ink-muted mb-4">
                {activeSession} has no exercises yet. Add one so there&rsquo;s something to lift.
              </p>
              <button onClick={() => setShowPicker(true)} className="btn btn-primary btn-md mx-auto">
                <FiPlus size={15} />
                Add exercise
              </button>
            </div>
          )}

          {todayExerciseNames.length > 0 && (
            <button onClick={() => setShowPicker(true)} className="btn btn-ghost btn-md w-full border border-dashed border-line-strong">
              <FiPlus size={15} />
              Add another exercise
            </button>
          )}

          <Checklist
            title="Cool-down"
            items={cooldowns}
            storageKey={`checks:${today}:${activeSession}:cooldown`}
            hasTutorial={hasTutorial}
            onShowTutorial={setTutorialFor}
          />
        </div>
      )}

      {/* History */}
      {recentSessions.length > 0 && (
        <section>
          <p className="section-label mb-2.5">History</p>
          <div className="card divide-y divide-line">
            {recentSessions.map((s) => (
              <div key={s.key} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{s.session}</p>
                  <p className="text-xs text-ink-muted mt-0.5">{formatDate(s.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink tabular">{s.sets} sets</p>
                  {s.volume > 0 && (
                    <p className="text-xs text-ink-faint tabular mt-0.5">
                      {Math.round(s.volume).toLocaleString("en-US")} kg
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {loggingExercise && (
        <SetInputModal
          exerciseName={loggingExercise}
          setNumber={(todayByExercise[loggingExercise]?.length ?? 0) + 1}
          prefillWeight={getLastWeight(loggingExercise)}
          prefillReps={getLastReps(loggingExercise)}
          lastPerformance={getLastPerformance(loggingExercise)}
          personalBest={getPersonalBest(loggingExercise)}
          targetReps={sessionProgram.find((p) => p.exercise_name === loggingExercise)?.target_reps}
          onConfirm={handleConfirm}
          onClose={() => setLoggingExercise(null)}
        />
      )}

      {showSummary && (
        <SessionSummarySheet
          sessionName={activeSession}
          date={today}
          todaySets={todaySessionSets}
          priorSets={priorSessionSets}
          targetSets={sessionProgress.target}
          prCount={todayPrCount}
          onClose={() => setShowSummary(false)}
        />
      )}

      {editingSet && (
        <SetInputModal
          mode="edit"
          exerciseName={editingSet.exercise_name}
          setNumber={editingSet.set_number}
          prefillWeight={editingSet.weight}
          prefillReps={editingSet.reps}
          lastPerformance={getLastPerformance(editingSet.exercise_name)}
          personalBest={getPersonalBest(editingSet.exercise_name)}
          targetReps={sessionProgram.find((p) => p.exercise_name === editingSet.exercise_name)?.target_reps}
          onConfirm={(weight, reps) => {
            // RPE is no longer asked for; keep whatever an older set recorded.
            updateSet(editingSet._id, { weight, reps, rpe: editingSet.rpe });
            setEditingSet(null);
          }}
          onClose={() => setEditingSet(null)}
        />
      )}

      {showPicker && (
        <ExercisePicker
          exercises={exercises}
          alreadyAdded={todayExerciseNames}
          onSelect={(name) => { setShowPicker(false); setLoggingExercise(name); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {tutorialFor && (
        <TutorialSheet
          exercise={exerciseByName[tutorialFor] ?? { name: tutorialFor }}
          programInfo={sessionProgram.find((p) => p.exercise_name === tutorialFor) ?? null}
          onClose={() => setTutorialFor(null)}
        />
      )}

      {timer.active && (
        <RestTimerBar
          remaining={timer.remaining}
          duration={timer.duration}
          label={timer.label}
          isDone={timer.isDone}
          onExtend={timer.extend}
          onStop={timer.stop}
        />
      )}
    </div>
  );
}
