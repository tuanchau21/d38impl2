import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProducts,
  getProduct,
  getPromoted,
  getAdminProducts,
  createProduct,
  deleteProduct,
} from "./api";

const mockProduct = {
  id: 1,
  category_id: 1,
  sku: "SKU-1",
  name: "Test Shoe",
  slug: "test-shoe",
  description: null,
  price: 99.99,
  discount_percent: 10,
  quantity_per_box: 12,
  is_promoted: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("lib/api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  describe("getProducts", () => {
    it("builds URL without params", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [mockProduct] }),
      } as Response);

      await getProducts();

      expect(fetchMock).toHaveBeenCalledWith("/api/products", expect.any(Object));
    });

    it("builds URL with page, limit, category, promoted, q", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [] }),
      } as Response);

      await getProducts({
        page: 2,
        limit: 24,
        category: "sneakers",
        promoted: true,
        q: "blue",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products?page=2&limit=24&category=sneakers&promoted=true&q=blue",
        expect.any(Object)
      );
    });

    it("normalizes array response to { products }", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response);

      const result = await getProducts();

      expect(result).toEqual({ products: [mockProduct] });
    });

    it("returns object response as-is when already { products }", async () => {
      const fetchMock = vi.mocked(fetch);
      const body = { products: [mockProduct], hasMore: true };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(body),
      } as Response);

      const result = await getProducts();

      expect(result).toEqual(body);
    });

    it("throws on non-ok response with error message from body", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Error",
        text: () => Promise.resolve(JSON.stringify({ error: "Server error" })),
      } as Response);

      await expect(getProducts()).rejects.toThrow("Server error");
    });
  });

  describe("getProduct", () => {
    it("encodes id and returns product", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProduct),
      } as Response);

      const result = await getProduct("test-shoe");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products/test-shoe",
        expect.any(Object)
      );
      expect(result).toEqual(mockProduct);
    });

    it("encodes special characters in id", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProduct),
      } as Response);

      await getProduct("id/with/slash");

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/products/id%2Fwith%2Fslash",
        expect.any(Object)
      );
    });
  });

  describe("getPromoted", () => {
    it("returns array when API returns array", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response);

      const result = await getPromoted();

      expect(result).toEqual([mockProduct]);
    });

    it("returns products when API returns { products }", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [mockProduct] }),
      } as Response);

      const result = await getPromoted();

      expect(result).toEqual([mockProduct]);
    });

    it("returns empty array when products missing", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const result = await getPromoted();

      expect(result).toEqual([]);
    });
  });

  describe("getAdminProducts", () => {
    it("sends X-Admin-Key when adminKey provided", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ products: [] }),
      } as Response);

      await getAdminProducts({}, { adminKey: "secret" });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/products",
        expect.objectContaining({
          headers: { "X-Admin-Key": "secret" },
        })
      );
    });

    it("normalizes array response to { products }", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockProduct]),
      } as Response);

      const result = await getAdminProducts();

      expect(result).toEqual({ products: [mockProduct] });
    });
  });

  describe("createProduct", () => {
    it("sends POST with JSON body and admin key", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockProduct, id: 2 }),
      } as Response);

      await createProduct(
        { name: "New Shoe", price: 50 },
        { adminKey: "key" }
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/products",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Key": "key",
          },
          body: JSON.stringify({ name: "New Shoe", price: 50 }),
        })
      );
    });
  });

  describe("deleteProduct", () => {
    it("throws on non-ok response", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not found"),
      } as Response);

      await expect(deleteProduct(1)).rejects.toThrow("Not found");
    });

    it("does not throw when ok", async () => {
      const fetchMock = vi.mocked(fetch);
      fetchMock.mockResolvedValueOnce({ ok: true } as Response);

      await expect(deleteProduct(1)).resolves.toBeUndefined();
    });
  });
});
