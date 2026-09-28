import { NextResponse } from "next/server";
import { fetchBundle, DbError } from "@/lib/db";
import { fail } from "../fail";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await fetchBundle());
  } catch (e) {
    return fail(e);
  }
}
