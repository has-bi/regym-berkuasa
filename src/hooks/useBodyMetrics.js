"use client";
import { useState, useEffect, useMemo } from "react";
import { bodyApi, fetchBundle, deserializeBundle } from "@/actions/data";

function calcBMI(weight, height) {
  if (!weight || !height) return 0;
  return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
}

function getLocalToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useBodyMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchMetrics(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = deserializeBundle(await fetchBundle()).bodyMetrics;
      setMetrics(data.sort((a, b) => b.date.localeCompare(a.date)));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const latest = useMemo(() => metrics[0] ?? null, [metrics]);

  const addMetric = async ({ date, weight, waist }) => {
    // Height is no longer asked for: it carries over from the last entry, and
    // BMI is still stored so older rows and new ones stay comparable.
    const height = latest?.height || 173;
    const bmi = calcBMI(parseFloat(weight), height);
    const payload = {
      // Same idempotency guard as workout sets: a retry after a timeout must
      // not create a second measurement.
      client_id:
        globalThis.crypto?.randomUUID?.() ??
        `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      date: date || getLocalToday(),
      weight: parseFloat(weight) || 0,
      waist: parseFloat(waist) || 0,
      height,
      bmi,
    };
    // The row is returned as { id, duplicate }; a duplicate still means the
    // measurement is stored, so both cases refresh.
    const result = await bodyApi.add(payload);
    await fetchMetrics();
    return result;
  };

  const deleteMetric = async (id) => {
    setMetrics((prev) => prev.filter((m) => m._id !== id));
    try {
      await bodyApi.delete(id);
    } catch (err) {
      await fetchMetrics();
      setError(err.message);
    }
  };

  return { loading, error, metrics, latest, addMetric, deleteMetric };
}
