import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, isSecureRuntime } from "@/lib/session";
import { verifyPin, configuredPin, MIN_PIN_LENGTH } from "@/lib/pin";
import { clientKey, checkLock, recordFailure, recordSuccess } from "@/lib/rateLimit";

// scrypt and node:crypto need the Node runtime, not Edge.
export const runtime = "nodejs";

/** One message for every rejection, so probing cannot map the failure modes. */
const GENERIC = "Wrong PIN.";

export async function POST(request) {
  const credential = configuredPin();
  if (!credential) {
    // Misconfiguration must fail closed rather than let everyone in.
    return NextResponse.json(
      { error: "Auth is not configured on the server." },
      { status: 500 }
    );
  }

  const key = clientKey(request);

  const lock = checkLock(key);
  if (lock.locked) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${lock.retryAfterSeconds} seconds.`,
        retryAfterSeconds: lock.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(lock.retryAfterSeconds) } }
    );
  }

  let pin;
  try {
    ({ pin } = await request.json());
  } catch {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  // Bound the input before handing it to a deliberately slow KDF.
  if (typeof pin !== "string" || pin.length < 4 || pin.length > 128) {
    recordFailure(key);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const ok = await verifyPin(pin, credential.value);

  if (!ok) {
    const { remaining, retryAfterSeconds } = recordFailure(key);
    return NextResponse.json(
      {
        error: retryAfterSeconds
          ? `Too many attempts. Try again in ${retryAfterSeconds} seconds.`
          : GENERIC,
        remaining,
        retryAfterSeconds,
      },
      { status: retryAfterSeconds ? 429 : 401 }
    );
  }

  recordSuccess(key);

  if (!credential.hashed) {
    console.warn(
      "[auth] AUTH_PIN_HASH is not set — the PIN is stored in plaintext. Run `node scripts/setup-auth.js` and set AUTH_PIN_HASH."
    );
  }
  if (credential.hashed === false && pin.length < MIN_PIN_LENGTH) {
    console.warn(`[auth] PIN is shorter than ${MIN_PIN_LENGTH} digits.`);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: isSecureRuntime(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
