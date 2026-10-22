/**
 * Signed session tokens.
 *
 * The old scheme stored the PIN itself as the cookie value, so the session
 * token *was* the credential — anyone who obtained the cookie held the PIN,
 * permanently. Here the cookie carries only a signed, expiring claim; the PIN
 * never leaves the login request.
 *
 * Built on Web Crypto rather than node:crypto so the identical verification
 * code runs in Edge middleware and in Node route handlers.
 */

const ENCODER = new TextEncoder();

/**
 * Session lifetime. A year, because this is a personal app installed on one
 * phone and re-entering the PIN every month is pure friction.
 *
 * Not longer: Chrome clamps any cookie expiry past 400 days, so a bigger
 * number here would make the token outlive the cookie that carries it and the
 * app would log out early anyway. A year sits safely under that ceiling.
 *
 * The trade-off is that a lost phone stays signed in for a year. Rotating
 * SESSION_SECRET or AUTH_PIN_HASH revokes every session at once, which is the
 * lever to pull if that happens.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * `__Host-` locks the cookie to this exact origin with no subdomain scope,
 * but the prefix is only honoured on HTTPS, so plain HTTP dev uses a bare name.
 */
export const SESSION_COOKIE = isSecureRuntime()
  ? "__Host-latihan_session"
  : "latihan_session";

export function isSecureRuntime() {
  return process.env.NODE_ENV === "production";
}

function b64urlEncode(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * The signing key mixes the session secret with the stored PIN credential, so
 * rotating *either* one invalidates every outstanding session automatically —
 * changing the PIN logs out a stolen device without extra bookkeeping.
 */
function keyMaterial() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters");
  }
  const credential = process.env.AUTH_PIN_HASH || process.env.AUTH_PIN || process.env.AUTH_SECRET || "";
  return `${secret}:${credential}`;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    ENCODER.encode(keyMaterial()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSession() {
  const now = Date.now();
  const payload = {
    v: 1,
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS * 1000,
    // Distinguishes otherwise identical tokens, so two logins differ.
    jti: b64urlEncode(crypto.getRandomValues(new Uint8Array(12))),
  };

  const body = b64urlEncode(ENCODER.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), ENCODER.encode(body));
  return `${body}.${b64urlEncode(new Uint8Array(sig))}`;
}

/**
 * Returns the payload for a valid token, or null. Never throws on malformed
 * input — an attacker-supplied cookie must not be able to crash middleware.
 */
export async function verifySession(token) {
  if (typeof token !== "string" || token.length > 1024) return null;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const body = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);

  try {
    // subtle.verify compares in constant time.
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      b64urlDecode(sigPart),
      ENCODER.encode(body)
    );
    if (!ok) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (payload?.v !== 1) return null;
    if (typeof payload.exp !== "number" || Date.now() >= payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
