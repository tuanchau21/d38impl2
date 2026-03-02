"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

/** Movement under this (px) is treated as a click and navigates to the product. */
const CLICK_THRESHOLD = 8;

interface PromotedCarouselProps {
  products: Product[];
}

export function PromotedCarousel({ products }: PromotedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] ?? "en";
  /** Drag state in ref to avoid re-renders during drag (smooth scroll per visual-design). */
  const dragRef = useRef<{
    startX: number;
    startY: number;
    scrollLeftStart: number;
    active: boolean;
    productSlug: string | null;
  }>({ startX: 0, startY: 0, scrollLeftStart: 0, active: false, productSlug: null });
  const [isDragging, setIsDragging] = useState(false);

  const scrollBy = useCallback((delta: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    const el = e.currentTarget as HTMLElement;
    const card = (e.target as HTMLElement).closest("[data-product-slug]");
    const productSlug = card?.getAttribute("data-product-slug") ?? null;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.scrollLeftStart = scrollRef.current.scrollLeft;
    dragRef.current.productSlug = productSlug;
    dragRef.current.active = true;
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active || !scrollRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    scrollRef.current.scrollLeft = dragRef.current.scrollLeftStart - dx;
    e.preventDefault();
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const { startX, startY, productSlug } = dragRef.current;
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (productSlug && moved < CLICK_THRESHOLD) {
        router.push(`/${locale}/products/${productSlug}`);
      }
      dragRef.current.active = false;
      dragRef.current.productSlug = null;
      setIsDragging(false);
      el.releasePointerCapture(e.pointerId);
    },
    [locale, router]
  );

  const t = useTranslations("common");
  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Optional arrow: left */}
      <button
        type="button"
        onClick={() => scrollBy(-320)}
        aria-label={t("scrollPromotedLeft")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Optional arrow: right */}
      <button
        type="button"
        onClick={() => scrollBy(320)}
        aria-label={t("scrollPromotedRight")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 select-none touch-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="flex-shrink-0 w-[280px] sm:w-[300px]"
            data-product-slug={p.slug || String(p.id)}
          >
            <ProductCard product={p} className="h-full" showCta />
          </div>
        ))}
      </div>
    </div>
  );
}
