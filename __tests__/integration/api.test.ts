import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  GET as shareRoundGET,
  POST as shareRoundPOST,
  OPTIONS as shareRoundOPTIONS,
} from "@/app/api/share-round/route";
import {
  GET as oembedGET,
  OPTIONS as oembedOPTIONS,
} from "@/app/api/oembed/route";
import { NextRequest } from "next/server";
import {
  setRoundStorage,
  resetRoundStorage,
} from "@/lib/round-storage-factory";
import { MemoryRoundStorage } from "@/lib/memory-round-storage";

// Mock fetch for oEmbed tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Integration Tests", () => {
  let testStorage: MemoryRoundStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    testStorage = new MemoryRoundStorage();
    setRoundStorage(testStorage);
  });

  afterEach(() => {
    resetRoundStorage();
  });

  describe("CORS Preflight OPTIONS requests", () => {
    it("should handle OPTIONS request for share-round API", async () => {
      const response = await shareRoundOPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, OPTIONS"
      );
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );
    });

    it("should handle OPTIONS request for oEmbed API", async () => {
      const response = await oembedOPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe(
        "Content-Type"
      );
    });
  });

  describe("Cross-API integration: Share Round → oEmbed", () => {
    it("should successfully create a share and generate oEmbed for it", async () => {
      const roundData = {
        id: "cross-api-test-uuid",
        completedAt: "2024-01-01T12:00:00Z",
        totalTime: 180000,
        laps: [
          { lapNumber: 1, time: 60000, timestamp: "2024-01-01T12:01:00Z" },
          { lapNumber: 2, time: 120000, timestamp: "2024-01-01T12:02:00Z" },
        ],
        teamName: "Cross API Test Team",
      };

      const description = "Cross-API integration test";

      // Step 1: Share the round
      const shareRequest = new NextRequest(
        "http://localhost:3000/api/share-round",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundData, description }),
        }
      );

      const shareResponse = await shareRoundPOST(shareRequest);
      const shareData = await shareResponse.json();

      expect(shareResponse.status).toBe(200);
      expect(shareData.success).toBe(true);
      expect(shareData.shareableId).toBe(roundData.id);

      // Step 2: Mock the fetch for oEmbed (since it would call back to our API)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...roundData,
            description,
          }),
      });

      // Step 3: Generate oEmbed for the shared URL
      const oembedRequest = new NextRequest(
        `http://localhost:3000/api/oembed?url=${shareData.sharedUrl}&format=json`
      );

      const oembedResponse = await oembedGET(oembedRequest);
      const oembedData = await oembedResponse.json();

      expect(oembedResponse.status).toBe(200);

      // Basic structure validation
      expect(oembedData).toHaveProperty("version");
      expect(oembedData).toHaveProperty("type");
      expect(oembedData).toHaveProperty("width");
      expect(oembedData).toHaveProperty("height");
      expect(oembedData).toHaveProperty("title");
      expect(oembedData).toHaveProperty("html");

      // Content validation
      expect(oembedData.html).toContain("/embed/cross-api-test-uuid");

      // Verify the fetch was called with the correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/share-round?id=cross-api-test-uuid"
      );
    });
  });

  describe("Data validation edge cases", () => {
    it("should handle extremely large lap times", async () => {
      const roundDataWithLargeTimes = {
        id: "large-times-uuid",
        completedAt: "2024-01-01T12:00:00Z",
        totalTime: Number.MAX_SAFE_INTEGER,
        laps: [
          {
            lapNumber: 1,
            time: Number.MAX_SAFE_INTEGER / 2,
            timestamp: "2024-01-01T12:01:00Z",
          },
        ],
        teamName: "Large Times Team",
      };

      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundData: roundDataWithLargeTimes }),
      });

      const response = await shareRoundPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle empty laps array", async () => {
      const roundDataWithEmptyLaps = {
        id: "empty-laps-uuid",
        completedAt: "2024-01-01T12:00:00Z",
        totalTime: 0,
        laps: [],
        teamName: "Empty Laps Team",
      };

      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundData: roundDataWithEmptyLaps }),
      });

      const response = await shareRoundPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should handle special characters in team name and description", async () => {
      const roundDataWithSpecialChars = {
        id: "special-chars-uuid",
        completedAt: "2024-01-01T12:00:00Z",
        totalTime: 120000,
        laps: [
          { lapNumber: 1, time: 120000, timestamp: "2024-01-01T12:02:00Z" },
        ],
        teamName: "Team with 🏃‍♂️ emoji & special chars",
      };

      const description =
        'Description with <script>alert("test")</script> and "quotes"';

      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundData: roundDataWithSpecialChars,
          description,
        }),
      });

      const response = await shareRoundPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify we can retrieve it back with special characters intact
      const getRequest = new NextRequest(
        `http://localhost:3000/api/share-round?id=special-chars-uuid`
      );

      const getResponse = await shareRoundGET(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.teamName).toBe("Team with 🏃‍♂️ emoji & special chars");
      expect(getData.description).toBe(
        'Description with <script>alert("test")</script> and "quotes"'
      );
    });

    it("should handle very long team names and descriptions", async () => {
      const longString = "A".repeat(1000);
      const roundDataWithLongStrings = {
        id: "long-strings-uuid",
        completedAt: "2024-01-01T12:00:00Z",
        totalTime: 60000,
        laps: [
          { lapNumber: 1, time: 60000, timestamp: "2024-01-01T12:01:00Z" },
        ],
        teamName: longString,
      };

      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundData: roundDataWithLongStrings,
          description: longString,
        }),
      });

      const response = await shareRoundPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe("URL parsing edge cases for oEmbed", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "test-id",
            teamName: "Test Team",
            description: "Test Description",
          }),
      });
    });

    it("should handle URLs with fragments", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid%23fragment&format=json"
      );

      const response = await oembedGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.html).toContain("/embed/test-uuid");
    });

    it("should handle URLs with encoded characters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test%2Duuid&format=json"
      );

      const response = await oembedGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.html).toContain("/embed/test-uuid");
    });

    it("should handle URLs with multiple query parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid?param1=value1%26param2=value2&format=json"
      );

      const response = await oembedGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.html).toContain("/embed/test-uuid");
    });

    it("should reject URLs that do not contain /shared/ path", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/other/test-uuid&format=json"
      );

      const response = await oembedGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid shared URL format");
    });

    it("should handle case-sensitive URLs correctly", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/SHARED/test-uuid&format=json"
      );

      const response = await oembedGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid shared URL format");
    });
  });

  describe("Error propagation and handling", () => {
    it("should handle network timeout in oEmbed API", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockFetch.mockRejectedValueOnce(timeoutError);

      const request = new NextRequest(
        "http://localhost:3000/api/oembed?url=http://localhost:3000/shared/test-uuid&format=json"
      );

      const response = await oembedGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });

    it("should handle malformed JSON in share-round POST", async () => {
      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"roundData": {"id": "test", "incomplete": }', // Malformed JSON
      });

      const response = await shareRoundPOST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to share round");
    });

    it("should handle missing Content-Type header", async () => {
      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        // No Content-Type header
        body: JSON.stringify({
          roundData: {
            id: "test-uuid",
            teamName: "Test Team",
            laps: [],
          },
        }),
      });

      const response = await shareRoundPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
