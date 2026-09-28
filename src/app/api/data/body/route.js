import { NextResponse } from "next/server";
import { addBodyMetric, deleteBodyMetric } from "@/lib/db";
import { fail } from "../fail";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { action, payload, id } = await request.json();

    if (action === "add") return NextResponse.json(await addBodyMetric(payload));
    if (action === "delete") return NextResponse.json(await deleteBodyMetric(id));

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
