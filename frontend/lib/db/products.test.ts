import { describe, it, expect, vi, beforeEach } from "vitest";
import * as client from "./client";
import {
  listProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductImageCount,
  addProductImages,
} from "./products";

vi.mock("./client", () => ({
  query: vi.fn(),
  insertAndGetId: vi.fn(),
}));

const mockQuery = vi.mocked(client.query);
const mockInsertId = vi.mocked(client.insertAndGetId);

describe("lib/db/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listProducts", () => {
    it("calls query with limit and offset from page/limit params", async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);
      await listProducts({ page: 2, limit: 24 });
      expect(mockQuery).toHaveBeenCalledTimes(2);
      const listCall = mockQuery.mock.calls[1];
      expect(listCall?.[1]).toEqual(expect.arrayContaining([24, 24]));
    });

    it("includes category and promoted in where clause", async () => {
      mockQuery
        .mockResolvedValueOnce([{ total: 0 }])
        .mockResolvedValueOnce([]);
      await listProducts({ category: 1, promoted: true });
      expect(mockQuery.mock.calls[0]?.[0]).toContain("category_id");
      expect(mockQuery.mock.calls[0]?.[0]).toContain("is_promoted");
    });
  });

  describe("getProductByIdOrSlug", () => {
    it("queries by id when idOrSlug is numeric", async () => {
      mockQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      await getProductByIdOrSlug("42");
      expect(mockQuery.mock.calls[0]?.[0]).toContain("id = ?");
      expect(mockQuery.mock.calls[0]?.[1]).toEqual(["42"]);
    });

    it("queries by slug when idOrSlug is not numeric", async () => {
      mockQuery
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      await getProductByIdOrSlug("my-slug");
      expect(mockQuery.mock.calls[0]?.[0]).toContain("slug = ?");
      expect(mockQuery.mock.calls[0]?.[1]).toEqual(["my-slug"]);
    });

    it("returns null when no row found", async () => {
      mockQuery.mockResolvedValueOnce([]);
      const result = await getProductByIdOrSlug("999");
      expect(result).toBeNull();
    });
  });

  describe("createProduct", () => {
    it("derives slug from name and inserts product", async () => {
      const row = {
        id: 1,
        category_id: null,
        sku: "SKU-X",
        name: "Blue Sneakers",
        slug: "blue-sneakers",
        description: null,
        price: 29.99,
        discount_percent: 0,
        quantity_per_box: 12,
        is_promoted: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockInsertId.mockResolvedValue(1);
      mockQuery.mockReset();
      mockQuery.mockResolvedValueOnce([row]);
      const product = await createProduct({
        name: "Blue Sneakers",
        sku: "SKU-X",
        price: 29.99,
        quantity_per_box: 12,
      });
      expect(mockInsertId).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO products"),
        expect.arrayContaining(["Blue Sneakers", "SKU-X", "blue-sneakers", 29.99, 12])
      );
      expect(product.slug).toBe("blue-sneakers");
    });
  });

  describe("updateProduct", () => {
    it("returns null when product does not exist", async () => {
      mockQuery.mockResolvedValueOnce([]);
      const result = await updateProduct(999, { name: "New" });
      expect(result).toBeNull();
    });
  });

  describe("deleteProduct", () => {
    it("returns true when a row is deleted", async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValueOnce({ affectedRows: 1 } as never);
      const result = await deleteProduct(1);
      expect(result).toBe(true);
    });

    it("returns false when no row deleted", async () => {
      mockQuery.mockReset();
      mockQuery.mockResolvedValueOnce({ affectedRows: 0 } as never);
      const result = await deleteProduct(999);
      expect(result).toBe(false);
    });
  });

  describe("getProductImageCount", () => {
    it("returns count from query", async () => {
      mockQuery.mockResolvedValue([{ count: 3 }]);
      const count = await getProductImageCount(1);
      expect(count).toBe(3);
    });
  });

  describe("addProductImages", () => {
    it("throws when adding would exceed MAX_IMAGES_PER_PRODUCT", async () => {
      mockQuery.mockResolvedValue([{ count: 6 }]);
      await expect(
        addProductImages(1, [{ url: "https://x/1.jpg", sort_order: 0 }])
      ).rejects.toThrow(/at most 6/);
    });

    it("inserts images and returns list", async () => {
      mockQuery.mockResolvedValue([{ count: 0 }]);
      mockInsertId.mockResolvedValueOnce(10).mockResolvedValueOnce(11);
      const result = await addProductImages(1, [
        { url: "https://x/a.jpg", sort_order: 0 },
        { url: "https://x/b.jpg", sort_order: 1 },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0]?.url).toBe("https://x/a.jpg");
      expect(result[1]?.url).toBe("https://x/b.jpg");
    });
  });
});
