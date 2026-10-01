import { NextResponse } from "next/server";
import { setDailyActivity } from "@/lib/db";
import { fail } from "../fail";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { action, payload } = await request.json();
    if (action === "set") return NextResponse.json(await setDailyActivity(payload));
    return NextResponse.json({ error: "Aksi nggak dikenal." }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
