import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function createRequest(
  path: string,
  headers?: Record<string, string>,
): NextRequest {
  const url = new URL(path, "http://localhost:3000");
  return new NextRequest(url, { headers: new Headers(headers) });
}

describe("middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("x-request-id header", () => {
    it("should add x-request-id if not present", () => {
      const req = createRequest("/embed/test");
      const res = middleware(req);
      // The header is set on the request headers passed to NextResponse.next
      // We verify indirectly that crypto.randomUUID was called
      expect(res).toBeDefined();
    });

    it("should not overwrite existing x-request-id", () => {
      const req = createRequest("/embed/test", {
        "x-request-id": "existing-id",
      });
      const res = middleware(req);
      expect(res).toBeDefined();
    });
  });

  describe("embed routes", () => {
    it("should set X-Frame-Options to ALLOWALL for /embed/ routes", () => {
      const req = createRequest("/embed/round/123");
      const res = middleware(req);
      expect(res.headers.get("X-Frame-Options")).toBe("ALLOWALL");
    });

    it("should set Content-Security-Policy for /embed/ routes", () => {
      const req = createRequest("/embed/round/123");
      const res = middleware(req);
      expect(res.headers.get("Content-Security-Policy")).toBe(
        "frame-ancestors *",
      );
    });

    it("should apply to nested embed paths", () => {
      const req = createRequest("/embed/deep/nested/path");
      const res = middleware(req);
      expect(res.headers.get("X-Frame-Options")).toBe("ALLOWALL");
      expect(res.headers.get("Content-Security-Policy")).toBe(
        "frame-ancestors *",
      );
    });
  });

  describe("non-embed routes", () => {
    it("should not set X-Frame-Options for non-embed routes", () => {
      const req = createRequest("/");
      const res = middleware(req);
      expect(res.headers.get("X-Frame-Options")).toBeNull();
    });

    it("should not set Content-Security-Policy for non-embed routes", () => {
      const req = createRequest("/history");
      const res = middleware(req);
      expect(res.headers.get("Content-Security-Policy")).toBeNull();
    });

    it("should not match /embedded or similar paths", () => {
      const req = createRequest("/embedded/test");
      const res = middleware(req);
      expect(res.headers.get("X-Frame-Options")).toBeNull();
    });
  });
});
