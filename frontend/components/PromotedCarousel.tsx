"use client";

import { useRef, useState, useCallback } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

interface PromotedCarouselProps {
  products: Product[];
}

export function PromotedCarousel({ products }: PromotedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const scrollBy = useCallback((delta: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!scrollRef.current) return;
      setIsDragging(true);
      setStartX(e.clientX);
      setScrollLeftStart(scrollRef.current.scrollLeft);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !scrollRef.current) return;
      const dx = e.clientX - startX;
      scrollRef.current.scrollLeft = scrollLeftStart - dx;
    },
    [isDragging, startX, scrollLeftStart]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="relative">
      {/* Optional arrow: left */}
      <button
        type="button"
        onClick={() => scrollBy(-320)}
        aria-label="Scroll promoted products left"
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
        aria-label="Scroll promoted products right"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {products.map((p) => (
          <div key={p.id} className="flex-shrink-0 w-[280px] sm:w-[300px]">
            <ProductCard product={p} className="h-full" showCta />
          </div>
        ))}
      </div>
    </div>
  );
}
