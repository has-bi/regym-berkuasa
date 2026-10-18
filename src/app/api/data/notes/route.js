import { NextResponse } from "next/server";
import { setDayNote } from "@/lib/db";
import { fail } from "../fail";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    if (action === "set") return NextResponse.json(await setDayNote(payload));
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
