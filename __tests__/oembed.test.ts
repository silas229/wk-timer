import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/oembed/route";
import { NextRequest } from "next/server";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("oEmbed API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return oEmbed JSON for valid shared URL", async () => {
    const mockRoundData = {
      id: "test-uuid",
      teamName: "Test Team",
      description: "Test description",
      completedAt: "2024-01-01T12:00:00Z",
      totalTime: 300000,
      laps: [],
    };

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
      width: 380,
      height: 500,
      title: "Test description",
      author_name: "Wettkämpfe Timer",
      provider_name: "Wettkämpfe Timer",
      html: expect.stringContaining(
        '<iframe src="http://localhost:3000/embed/test-uuid"'
      ),
    });
  });

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
});
