import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageGallery } from "./ImageGallery";
import { IntlWrapper } from "./test-utils";
import type { ProductImage } from "@/lib/types";

function renderWithIntl(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => <IntlWrapper>{children}</IntlWrapper>,
  });
}

describe("ImageGallery", () => {
  it("empty state: shows No images when images array is empty", () => {
    renderWithIntl(<ImageGallery images={[]} productName="Test Product" />);
    expect(screen.getByText("No images")).toBeInTheDocument();
  });

  it("renders single image with correct alt", () => {
    const images: ProductImage[] = [
      { id: 1, product_id: 1, url: "https://example.com/1.jpg", sort_order: 0 },
    ];
    renderWithIntl(<ImageGallery images={images} productName="Test Product" />);
    const img = screen.getByRole("img", { name: /Test Product — image 1/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/1.jpg");
  });

  it("sorts images by sort_order (first image is selected)", () => {
    const images: ProductImage[] = [
      { id: 2, product_id: 1, url: "/b.jpg", sort_order: 1 },
      { id: 1, product_id: 1, url: "/a.jpg", sort_order: 0 },
    ];
    renderWithIntl(<ImageGallery images={images} productName="Shoe" />);
    const mainImg = screen.getByRole("img", { name: /Shoe — image 1/i });
    expect(mainImg).toHaveAttribute("src", "/a.jpg");
  });
});
