import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Public paths. PWA assets must stay reachable while logged out, otherwise the
 * install prompt and home-screen icon break on a locked app.
 */
const PUBLIC_FILES = new Set([
  "/favicon.ico",
  "/manifest.webmanifest",
  "/robots.txt",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
]);

function isPublic(pathname) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  // The Claude connector cannot carry the session cookie; the route checks its
  // own secret path segment instead (see app/api/mcp/[secret]/route.js).
  if (pathname.startsWith("/api/mcp/")) return true;
  if (PUBLIC_FILES.has(pathname)) return true;
  // Next generates hashed icon routes (/icon.png, /apple-icon.png).
  if (/^\/(apple-)?icon\.png$/.test(pathname)) return true;
  return false;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // OAuth discovery. The Claude connector runs without sign-in, but a client
  // that looks here must get a plain "not found" — redirected to the PIN page,
  // it concludes there is an OAuth server and fails trying to register.
  if (pathname.startsWith("/.well-known/oauth")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/log", request.url));
    return NextResponse.next();
  }

  if (!session) {
    // API callers get a status they can act on; pages get sent to the form.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL("/login", request.url);
    // Remember where they were headed so login can return them there.
    if (pathname !== "/") url.searchParams.set("next", pathname);

    const res = NextResponse.redirect(url);
    // Clear a stale or tampered cookie so it stops being replayed.
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
