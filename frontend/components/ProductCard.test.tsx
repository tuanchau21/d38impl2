import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import { IntlWrapper } from "./test-utils";
import type { Product } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/products/test",
}));

function renderWithIntl(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => <IntlWrapper>{children}</IntlWrapper>,
  });
}

const baseProduct: Product = {
  id: 1,
  category_id: 1,
  sku: "SKU-1",
  name: "Test Shoe",
  slug: "test-shoe",
  description: null,
  price: 99.99,
  discount_percent: 0,
  quantity_per_box: 12,
  is_promoted: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("ProductCard", () => {
  it("renders name, sku, price and quantity per box", () => {
    renderWithIntl(<ProductCard product={baseProduct} />);
    expect(screen.getByText("Test Shoe")).toBeInTheDocument();
    expect(screen.getByText("SKU-1")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText(/12 per box/)).toBeInTheDocument();
  });

  it("empty state: shows No image when product has no images", () => {
    renderWithIntl(<ProductCard product={baseProduct} />);
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  it("shows image with loading=lazy when product has image", () => {
    const productWithImage: Product = {
      ...baseProduct,
      images: [{ id: 1, product_id: 1, url: "https://example.com/img.jpg", sort_order: 0 }],
    };
    renderWithIntl(<ProductCard product={productWithImage} />);
    const img = screen.getByRole("img", { name: "Test Shoe" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("src", "https://example.com/img.jpg");
  });

  it("computes discounted price and shows original struck through", () => {
    const discounted: Product = {
      ...baseProduct,
      price: 100,
      discount_percent: 20,
    };
    renderWithIntl(<ProductCard product={discounted} />);
    expect(screen.getByText("$80.00")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toHaveClass("line-through");
  });

  it("shows Promoted badge when is_promoted is true", () => {
    renderWithIntl(<ProductCard product={{ ...baseProduct, is_promoted: true }} />);
    expect(screen.getByText("Promoted")).toBeInTheDocument();
  });

  it("links to product by slug", () => {
    renderWithIntl(<ProductCard product={baseProduct} />);
    const link = screen.getByRole("link", { name: /Test Shoe/i });
    expect(link).toHaveAttribute("href", "/en/products/test-shoe");
  });

  it("links by id when slug is empty", () => {
    renderWithIntl(<ProductCard product={{ ...baseProduct, slug: "" }} />);
    const link = screen.getByRole("link", { name: /Test Shoe/i });
    expect(link).toHaveAttribute("href", "/en/products/1");
  });
});
