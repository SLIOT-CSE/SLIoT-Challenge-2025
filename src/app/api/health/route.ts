import { NextResponse } from "next/server";
import { getDb } from "@/server/db/client";
import { checkHealth } from "@/server/health";

// GET /api/health: used by the deploy (and by anyone checking the site is up).
// 200 when the app can read its database, 503 when it can't.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const health = checkHealth(getDb);
  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
