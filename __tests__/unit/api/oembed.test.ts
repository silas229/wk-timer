import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/oembed/route";
import { NextRequest } from "next/server";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("oEmbed API Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRoundData = {
    id: "test-uuid",
    teamName: "Test Team",
    description: "Test description",
    completedAt: "2024-01-01T12:00:00Z",
    totalTime: 300000,
    laps: [
      { lapNumber: 1, time: 5000, timestamp: "2024-01-01T12:00:05Z" },
      { lapNumber: 2, time: 10000, timestamp: "2024-01-01T12:00:10Z" },
    ],
  };

  describe("Valid oEmbed requests", () => {
    it("should return oEmbed JSON for valid shared URL", async () => {
      // Mock the fetch to share-round API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoundData),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        version: "1.0",
        type: "rich",
        width: 430,
        height: 720,
        title: "Test description",
        author_name: "Wettkämpfe Timer",
        provider_name: "Wettkämpfe Timer",
        html: expect.stringContaining(
          '<iframe src="http://localhost:3000/embed/test-uuid"'
        ),
        thumbnail_url: "http://localhost:3000/icon-512x512.png",
        thumbnail_width: 512,
        thumbnail_height: 512,
      });

      // Verify the fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/share-round?id=test-uuid"
      );
    });

    it("should use team name as title when no description", async () => {
      const roundDataWithoutDescription = {
        ...mockRoundData,
        description: undefined,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(roundDataWithoutDescription),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Test Team - Geteilter Durchgang");
    });

    it("should handle URLs with query parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoundData),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid?some=param&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.html).toContain("/embed/test-uuid");
    });

    it("should default to json format when format parameter is missing", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoundData),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.version).toBe("1.0");
    });
  });

  describe("Error handling", () => {
    it("should return 400 for missing url parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing url parameter");
    });

    it("should return 400 for invalid URL format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/invalid&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid shared URL format");
    });

    it("should return 404 when round is not found", async () => {
      // Mock the fetch to share-round API returning 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/nonexistent&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Round not found");
    });

    it("should return 501 for unsupported format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid&format=xml"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(501);
      expect(data.error).toBe("Only JSON format is supported");
    });

    it("should return 500 when share-round API returns unexpected error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Round not found");
    });
  });

  describe("CORS headers", () => {
    it("should include CORS headers in successful response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoundData),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid&format=json"
      );

      const response = await GET(request);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Cache-Control")).toBe(
        "public, max-age=3600"
      );
    });

    it("should include CORS headers in error responses", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?format=json"
      );

      const response = await GET(request);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );
    });
  });

  describe("URL parsing edge cases", () => {
    it("should handle URLs with trailing slash", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoundData),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid/&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.html).toContain("/embed/test-uuid");
    });

    it("should handle URLs with different domains", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoundData),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=https://example.com/shared/test-uuid&format=json"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.html).toContain("http://localhost:3000/embed/test-uuid");
    });
  });
});
