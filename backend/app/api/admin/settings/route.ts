/**
 * GET /api/admin/settings — get shop settings (admin). PUT — update shop name. admin-high-level-design dashboard.
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getShopSettings, setShopName } from "@/lib/db/settings";

const MAX_SHOP_NAME_LENGTH = 255;

function logError(context: string, err: unknown): void {
  console.error(`[api/admin/settings] ${context}`, { error: err });
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  try {
    const settings = await getShopSettings();
    return NextResponse.json(settings);
  } catch (err) {
    logError("GET failed", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  try {
    const body = await request.json();
    const shopName = body?.shop_name;
    if (shopName !== undefined) {
      if (typeof shopName !== "string") {
        return NextResponse.json({ error: "shop_name must be a string" }, { status: 400 });
      }
      const trimmed = shopName.trim();
      if (trimmed.length === 0) {
        return NextResponse.json({ error: "shop_name cannot be empty" }, { status: 400 });
      }
      if (trimmed.length > MAX_SHOP_NAME_LENGTH) {
        return NextResponse.json(
          { error: `shop_name must be at most ${MAX_SHOP_NAME_LENGTH} characters` },
          { status: 400 }
        );
      }
      const settings = await setShopName(trimmed);
      return NextResponse.json(settings);
    }
    return NextResponse.json(await getShopSettings());
  } catch (err) {
    logError("PUT failed", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
