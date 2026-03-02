"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ProductImage } from "@/lib/types";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const t = useTranslations("common");
  const [selected, setSelected] = useState(0);
  const list = images.length ? images.sort((a, b) => a.sort_order - b.sort_order) : [];

  if (list.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
        {t("noImages")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={list[selected].url}
          alt={`${productName} — image ${selected + 1}`}
          className="w-full h-full object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                i === selected
                  ? "border-gray-900 dark:border-white"
                  : "border-transparent hover:border-gray-400"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
