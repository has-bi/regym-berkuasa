"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiLock, FiAlertCircle } from "react-icons/fi";

function LoginForm() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);
  const [lockedFor, setLockedFor] = useState(0);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const params = useSearchParams();

  // Only accept an internal path, so ?next= cannot bounce to another origin.
  const rawNext = params.get("next") || "/log";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/log";

  // Count the lockout down so the wait is visible rather than a dead button.
  useEffect(() => {
    if (lockedFor <= 0) return;
    const id = setInterval(() => setLockedFor((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [lockedFor]);

  const locked = lockedFor > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        router.replace(next);
        router.refresh();
        return;
      }

      setPin("");
      setError(data.error || "Wrong PIN.");
      setRemaining(typeof data.remaining === "number" ? data.remaining : null);
      setLockedFor(data.retryAfterSeconds || 0);
    } catch {
      setError("Can't reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-ink flex items-center justify-center">
            <FiLock size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Latihan</h1>
          <p className="text-sm text-ink-muted mt-1.5">Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="pin" className="field-label">PIN</label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="••••••"
              required
              autoFocus
              disabled={locked}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "pin-error" : undefined}
              className="field text-center text-xl tracking-[0.5em] disabled:opacity-50"
            />
          </div>

          {error && (
            <div
              id="pin-error"
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3"
            >
              <FiAlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p>{locked ? `Locked. Try again in ${lockedFor} seconds.` : error}</p>
                {!locked && remaining != null && remaining > 0 && (
                  <p className="text-xs mt-0.5 opacity-80">
                    {remaining} {remaining === 1 ? "attempt" : "attempts"} left before a temporary lockout.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || locked || pin.length < 4}
            className="btn btn-primary btn-md w-full"
          >
            {loading ? "Checking..." : locked ? `Wait ${lockedFor}s` : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
