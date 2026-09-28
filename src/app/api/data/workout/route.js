import { NextResponse } from "next/server";
import { addWorkoutSet, updateWorkoutSet, deleteWorkoutSet } from "@/lib/db";
import { fail } from "../fail";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { action, payload, id } = await request.json();

    if (action === "add") return NextResponse.json(await addWorkoutSet(payload));
    if (action === "update") return NextResponse.json(await updateWorkoutSet(id, payload));
    if (action === "delete") return NextResponse.json(await deleteWorkoutSet(id));

    return NextResponse.json({ error: "Aksi nggak dikenal." }, { status: 400 });
  } catch (e) {
    return fail(e);
  }
}
