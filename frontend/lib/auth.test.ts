import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAdminKeyFromRequest, requireAdminKey } from "./auth";

describe("lib/auth", () => {
  const originalEnv = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_API_KEY = originalEnv;
  });

  describe("getAdminKeyFromRequest", () => {
    it("returns X-Admin-Key header value", () => {
      const request = new Request("http://x", {
        headers: { "X-Admin-Key": "secret123" },
      });
      expect(getAdminKeyFromRequest(request)).toBe("secret123");
    });

    it("returns Authorization Bearer token if X-Admin-Key missing", () => {
      const request = new Request("http://x", {
        headers: { Authorization: "Bearer my-token" },
      });
      expect(getAdminKeyFromRequest(request)).toBe("my-token");
    });

    it("returns null when no key present", () => {
      const request = new Request("http://x");
      expect(getAdminKeyFromRequest(request)).toBeNull();
    });
  });

  describe("requireAdminKey", () => {
    it("returns 401 when ADMIN_API_KEY is set but request key is missing", () => {
      process.env.ADMIN_API_KEY = "expected";
      const request = new Request("http://x");
      const result = requireAdminKey(request);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(401);
        expect(result.body.error).toBe("Unauthorized");
      }
    });

    it("returns 401 when request key does not match", () => {
      process.env.ADMIN_API_KEY = "expected";
      const request = new Request("http://x", {
        headers: { "X-Admin-Key": "wrong" },
      });
      const result = requireAdminKey(request);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(401);
    });

    it("returns ok when key matches", () => {
      process.env.ADMIN_API_KEY = "expected";
      const request = new Request("http://x", {
        headers: { "X-Admin-Key": "expected" },
      });
      const result = requireAdminKey(request);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.key).toBe("expected");
    });
  });
});
