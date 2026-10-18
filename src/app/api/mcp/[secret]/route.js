import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { TOOLS } from "@/lib/mcp/tools";

/**
 * Remote MCP server for the Claude connector: log food, read the day, add
 * notes and steps from chat.
 *
 * Streamable HTTP, stateless: every request is a self-contained JSON-RPC
 * message answered with plain JSON, which is all a handful of tools needs.
 * There is no session to keep, so it runs fine on short-lived functions.
 *
 * Auth is the secret path segment, compared in constant time against
 * MCP_SECRET. The connector is added with "No sign in", so whoever holds the
 * full URL can use it — rotate MCP_SECRET to revoke it. Without the variable
 * the endpoint does not exist.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER_INFO = { name: "latihan", version: "1.0.0" };

const INSTRUCTIONS =
  "Personal fitness and food tracker for one user in Indonesia. To log a meal: " +
  "search_foods for each item, log_food with the exact name and servings, then " +
  "reply with what was logged and the day's remaining calories and protein from " +
  "the result. If a food is missing, add_food with estimated values and say they " +
  "are estimates. Dates default to today in the user's time zone (Asia/Jakarta).";

function authorised(secret) {
  const expected = process.env.MCP_SECRET;
  if (!expected || expected.length < 32 || typeof secret !== "string") return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const result = (id, value) => ({ jsonrpc: "2.0", id, result: value });
const failure = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

async function handle(msg) {
  const { id, method, params } = msg ?? {};
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize": {
      const asked = params?.protocolVersion;
      return result(id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, {
        tools: TOOLS.map(({ name, description, inputSchema, annotations }) => ({
          name, description, inputSchema, ...(annotations && { annotations }),
        })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return failure(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const value = await tool.run(params?.arguments ?? {});
        return result(id, { content: [{ type: "text", text: JSON.stringify(value) }] });
      } catch (err) {
        // Tool failures go back as results so Claude can read them and recover.
        return result(id, { content: [{ type: "text", text: err.message }], isError: true });
      }
    }
    default:
      if (isNotification) return null; // notifications/initialized and friends
      return failure(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST(request, { params }) {
  const { secret } = await params;
  if (!authorised(secret)) return new NextResponse(null, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(failure(null, -32700, "Parse error"), { status: 400 });
  }

  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map(handle))).filter(Boolean);
    return replies.length ? NextResponse.json(replies) : new NextResponse(null, { status: 202 });
  }

  const reply = await handle(body);
  return reply ? NextResponse.json(reply) : new NextResponse(null, { status: 202 });
}

/** No server-initiated stream: this server only ever answers requests. */
export async function GET(request, { params }) {
  const { secret } = await params;
  if (!authorised(secret)) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export async function DELETE(request, { params }) {
  const { secret } = await params;
  if (!authorised(secret)) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
