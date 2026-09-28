import { NextResponse } from "next/server";
import { DbError } from "@/lib/db";

/**
 * One place that decides the status, so the client can tell a misconfigured
 * deployment (500, nothing the user can retry) from a transient one (502).
 */
export function fail(e) {
  const kind = e instanceof DbError ? e.kind : "unknown";
  const status = kind === "config" || kind === "schema" ? 500 : kind === "notfound" ? 404 : 502;
  return NextResponse.json({ error: e.message, kind }, { status });
}
