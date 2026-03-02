/**
 * Settings (key-value) for shop-level config. database-high-level-design §2.1, backend-technical-design GET/PUT /api/settings.
 */

import { query } from "./client";

const SHOP_NAME_KEY = "shop_name";
const DEFAULT_SHOP_NAME = "Bulk Shoe Shop";

export interface SettingsRow {
  k: string;
  v: string | null;
}

export interface ShopSettings {
  shop_name: string;
}

export async function getShopSettings(): Promise<ShopSettings> {
  const rows = await query<SettingsRow[]>("SELECT k, v FROM settings WHERE k = ?", [SHOP_NAME_KEY]);
  const row = rows[0];
  const shop_name = row?.v?.trim() ?? DEFAULT_SHOP_NAME;
  return { shop_name };
}

export async function setShopName(shopName: string): Promise<ShopSettings> {
  const trimmed = shopName.trim();
  await query(
    "INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)",
    [SHOP_NAME_KEY, trimmed]
  );
  return getShopSettings();
}
