import { normalizeReps } from "@/lib/reps";

/**
 * Client-side data access.
 *
 * Postgres returns typed values, so most of the old coercion is gone. What
 * remains is the `id` → `_id` rename: the components were written against the
 * sheet's field name, and renaming one key here is a smaller change than
 * touching every component that renders a row.
 */

async function request(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: body ? "POST" : "GET",
      ...(body && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    });
  } catch {
    throw new Error("No connection.");
  }

  if (res.status === 401) throw new Error("Your session expired. Log in again.");

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `Request failed (${res.status}).`);
  }
  return data;
}

const row = (r) => ({ ...r, _id: r.id });

function deserializeWorkoutLog(r) {
  return {
    ...row(r),
    weight: Number(r.weight) || 0,
    reps: Number(r.reps) || 0,
    rpe: r.rpe == null ? 0 : Number(r.rpe),
    set_number: Number(r.set_number) || 0,
    date: String(r.date).slice(0, 10),
  };
}

function deserializeBodyMetric(r) {
  return {
    ...row(r),
    weight: Number(r.weight) || 0,
    waist: Number(r.waist) || 0,
    height: Number(r.height) || 173,
    bmi: Number(r.bmi) || 0,
    date: String(r.date).slice(0, 10),
  };
}

function deserializeProgram(r) {
  return {
    ...row(r),
    target_sets: Number(r.target_sets) || 0,
    // The column is TEXT now, so a rep range cannot arrive as a date. Kept as a
    // safety net for rows migrated from the sheet before that was repaired.
    target_reps: normalizeReps(r.target_reps),
    rest_seconds: Number(r.rest_seconds) || 0,
    target_weight: Number(r.target_weight) || 0,
    sort_order: Number(r.sort_order) || 0,
  };
}

export function fetchBundle() {
  return request("/api/data/bundle");
}

export function deserializeBundle(b) {
  return {
    exercises: (b.exercises || []).map(row),
    programs: (b.programs || []).map(deserializeProgram),
    schedule: (b.schedule || []).map(row),
    workoutLogs: (b.workoutLogs || []).map(deserializeWorkoutLog),
    bodyMetrics: (b.bodyMetrics || []).map(deserializeBodyMetric),
  };
}

export const workoutApi = {
  add: (payload) => request("/api/data/workout", { action: "add", payload }),
  update: (id, payload) => request("/api/data/workout", { action: "update", id, payload }),
  delete: (id) => request("/api/data/workout", { action: "delete", id }),
};

export const bodyApi = {
  add: (payload) => request("/api/data/body", { action: "add", payload }),
  delete: (id) => request("/api/data/body", { action: "delete", id }),
};
