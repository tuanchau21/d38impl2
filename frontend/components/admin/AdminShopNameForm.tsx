"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAdminSettings, updateAdminSettings } from "@/lib/api";

function logError(context: string, err: unknown): void {
  if (typeof console !== "undefined" && console.error) {
    console.error(`[AdminShopNameForm] ${context}`, { error: err });
  }
}

export function AdminShopNameForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getAdminSettings()
      .then((s) => {
        if (!cancelled) {
          setShopName(s.shop_name ?? "");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logError("load settings", err);
          setError(t("errorLoadSettings"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    updateAdminSettings({ shop_name: shopName.trim() || undefined })
      .then(() => {
        setSaved(true);
        router.refresh();
      })
      .catch((err) => {
        logError("save settings", err);
        setError(err instanceof Error ? err.message : t("errorSaveSettings"));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  if (loading) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm">{t("loadingSettings")}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor="shop-name" className="sr-only">
          {t("shopNameLabel")}
        </label>
        <input
          id="shop-name"
          type="text"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder={t("shopNamePlaceholder")}
          className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 min-w-[200px] max-w-md"
          maxLength={255}
          aria-label={t("shopNameLabel")}
        />
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t("saved")}</p>
      )}
    </form>
  );
}
