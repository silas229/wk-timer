import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "@/app/api/share-round/route";
import { NextRequest } from "next/server";
import {
  setRoundStorage,
  resetRoundStorage,
} from "@/lib/round-storage-factory";
import { MemoryRoundStorage } from "@/lib/memory-round-storage";
import { Description } from "@radix-ui/react-dialog";

describe("Share Round API Unit Tests", () => {
  let testStorage: MemoryRoundStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    testStorage = new MemoryRoundStorage();
    setRoundStorage(testStorage);
  });

  afterEach(() => {
    resetRoundStorage();
  });

  describe("POST /api/share-round", () => {
    const validRoundData = {
      id: "test-uuid-123",
      completedAt: "2024-01-01T12:00:00Z",
      totalTime: 300000,
      laps: [
        { lapNumber: 1, time: 5000, timestamp: "2024-01-01T12:00:05Z" },
        { lapNumber: 2, time: 10000, timestamp: "2024-01-01T12:00:10Z" },
      ],
      teamName: "Test Team",
      description: "Test round description",
    };

    it("should successfully share a round with valid data", async () => {
      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRoundData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        shareableId: validRoundData.id,
        sharedUrl: expect.stringContaining(`/shared/${validRoundData.id}`),
      });
    });

    it("should successfully share a round without description", async () => {
      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRoundData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should store description when provided inside roundData", async () => {
      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validRoundData),
      });

      const postResponse = await POST(request);
      const postData = await postResponse.json();

      expect(postResponse.status).toBe(200);
      expect(postData.success).toBe(true);

      const getRequest = new NextRequest(
        `http://localhost:3000/api/share-round?id=${validRoundData.id}`
      );
      const getResponse = await GET(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.description).toBe("Test round description");
    });

    it("should return 400 for roundData missing required fields", async () => {
      const invalidRoundData = {
        id: "test-uuid",
        // Missing teamName, laps, etc.
      };

      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidRoundData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid round data");
    });

    it("should handle invalid JSON body", async () => {
      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to share round");
    });

    it("should include CORS headers in response", async () => {
      const requestBody = {
        roundData: validRoundData,
      };

      const request = new NextRequest("http://localhost:3000/api/share-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
        "POST"
      );
    });
  });

  describe("GET /api/share-round", () => {
    it("should return shared round data for valid ID", async () => {
      // First, create a shared round
      const roundData = {
        id: "get-test-uuid",
        completedAt: "2024-01-01T12:00:00Z",
        totalTime: 300000,
        laps: [{ lapNumber: 1, time: 5000, timestamp: "2024-01-01T12:00:05Z" }],
        teamName: "Get Test Team",
        description: "Test description",
      };

      const postRequest = new NextRequest(
        "http://localhost:3000/api/share-round",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roundData),
        }
      );

      await POST(postRequest);

      // Now test GET
      const getRequest = new NextRequest(
        "http://localhost:3000/api/share-round?id=get-test-uuid"
      );

      const response = await GET(getRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: "get-test-uuid",
        teamName: "Get Test Team",
        description: "Test description",
        totalTime: 300000,
        laps: expect.arrayContaining([
          expect.objectContaining({
            lapNumber: 1,
            time: 5000,
          }),
        ]),
      });
    });

    it("should return 400 for missing ID parameter", async () => {
      const request = new NextRequest("http://localhost:3000/api/share-round");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Round ID is required");
    });

    it("should return 404 for non-existent round ID", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/share-round?id=non-existent-uuid"
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Shared round not found");
    });

    it("should include CORS headers in GET response", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/share-round?id=non-existent"
      );

      const response = await GET(request);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
        "GET"
      );
    });
  });

  describe("Basic Integration: POST then GET", () => {
    it("should allow sharing and retrieving a round end-to-end", async () => {
      const roundData = {
        id: "integration-test-uuid",
        completedAt: "2024-01-01T12:00:00Z",
        totalTime: 450000,
        laps: [
          { lapNumber: 1, time: 5000, timestamp: "2024-01-01T12:00:05Z" },
          { lapNumber: 2, time: 10000, timestamp: "2024-01-01T12:00:10Z" },
          { lapNumber: 3, time: 15000, timestamp: "2024-01-01T12:00:15Z" },
        ],
        teamName: "Integration Test Team",
        description: "Integration test description",
      };

      // Step 1: Share the round
      const postRequest = new NextRequest(
        "http://localhost:3000/api/share-round",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roundData),
        }
      );

      const postResponse = await POST(postRequest);
      const postData = await postResponse.json();

      expect(postResponse.status).toBe(200);
      expect(postData.success).toBe(true);
      expect(postData.shareableId).toBe(roundData.id);

      // Step 2: Retrieve the shared round
      const getRequest = new NextRequest(
        `http://localhost:3000/api/share-round?id=${roundData.id}`
      );

      const getResponse = await GET(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData).toMatchObject({
        id: roundData.id,
        teamName: roundData.teamName,
        description: roundData.description,
        totalTime: roundData.totalTime,
        completedAt: roundData.completedAt,
        laps: roundData.laps,
      });
    });
  });
});
