/**
 * GET /api/settings — public shop settings (e.g. shop_name for header). backend-technical-design §4.
 */

import { NextResponse } from "next/server";
import { getShopSettings } from "@/lib/db/settings";

function logError(context: string, err: unknown): void {
  console.error(`[api/settings] ${context}`, { error: err });
}

export async function GET() {
  try {
    const settings = await getShopSettings();
    return NextResponse.json(settings);
  } catch (err) {
    logError("GET failed", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}
