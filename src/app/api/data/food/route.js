import { NextResponse } from "next/server";
import { addFood, updateFood, deleteFood, addFoodLog, deleteFoodLog, setSetting } from "@/lib/db";
import { fail } from "../fail";

export const runtime = "nodejs";

/** Only settings the Food tab owns can be written from here. */
const WRITABLE_SETTINGS = new Set(["profile"]);

export async function POST(request) {
  try {
    const { action, payload, id, key } = await request.json();

    switch (action) {
      case "addFood":    return NextResponse.json(await addFood(payload));
      case "updateFood": return NextResponse.json(await updateFood(id, payload));
      case "deleteFood": return NextResponse.json(await deleteFood(id));
      case "log":        return NextResponse.json(await addFoodLog(payload));
      case "deleteLog":  return NextResponse.json(await deleteFoodLog(id));
      case "setSetting":
        if (!WRITABLE_SETTINGS.has(key)) {
          return NextResponse.json({ error: "Unknown setting." }, { status: 400 });
        }
        return NextResponse.json(await setSetting(key, payload));
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (e) {
    return fail(e);
  }
}
