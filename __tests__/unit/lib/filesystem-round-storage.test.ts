import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import { FileSystemRoundStorage } from "@/lib/filesystem-round-storage";
import { SharedRoundData } from "@/lib/round-storage";

describe("FileSystemRoundStorage", () => {
  let storage: FileSystemRoundStorage;
  let testDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    testDir = path.join(process.cwd(), "__tests__", "tmp", `test-${Date.now()}`);
    storage = new FileSystemRoundStorage(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  });

  const createMockRoundData = (id: string): SharedRoundData => ({
    id,
    completedAt: new Date().toISOString(),
    totalTime: 120000,
    laps: [
      { lapNumber: 1, time: 60000, timestamp: new Date().toISOString() },
      { lapNumber: 2, time: 120000, timestamp: new Date().toISOString() },
    ],
    teamName: "Test Team",
    description: "Test round",
  });

  describe("Path Traversal Protection", () => {
    describe("store method", () => {
      it("should reject path traversal with ../ pattern", async () => {
        const invalidId = "../../../etc/passwd";
        const roundData = createMockRoundData(invalidId);

        await expect(storage.store(invalidId, roundData)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject UUID with ../ suffix", async () => {
        const invalidId = "550e8400-e29b-41d4-a716-446655440000/../other";
        const roundData = createMockRoundData(invalidId);

        await expect(storage.store(invalidId, roundData)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject path with null bytes", async () => {
        const invalidId = "550e8400-e29b-41d4-a716-446655440000\0.json";
        const roundData = createMockRoundData(invalidId);

        await expect(storage.store(invalidId, roundData)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject absolute paths", async () => {
        const invalidId = "/etc/passwd";
        const roundData = createMockRoundData(invalidId);

        await expect(storage.store(invalidId, roundData)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject relative paths", async () => {
        const invalidId = "./some/path";
        const roundData = createMockRoundData(invalidId);

        await expect(storage.store(invalidId, roundData)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject IDs with special characters", async () => {
        const invalidIds = [
          "id-with-spaces in it",
          "id/with/slashes",
          "id\\with\\backslashes",
          "id:with:colons",
          "id*with*asterisks",
          "id?with?questions",
        ];

        for (const invalidId of invalidIds) {
          const roundData = createMockRoundData(invalidId);
          await expect(storage.store(invalidId, roundData)).rejects.toThrow(
            "Invalid round ID (potential path traversal detected)"
          );
        }
      });

      it("should reject non-UUID strings", async () => {
        const invalidIds = [
          "not-a-uuid",
          "12345678-1234-1234-1234-1234567890123", // Too many digits
          "550e8400-e29b-41d4-a716", // Incomplete UUID
          "550e8400e29b41d4a716446655440000", // Missing hyphens
          "", // Empty string
          "g50e8400-e29b-41d4-a716-446655440000", // Invalid character
        ];

        for (const invalidId of invalidIds) {
          const roundData = createMockRoundData(invalidId);
          await expect(storage.store(invalidId, roundData)).rejects.toThrow(
            "Invalid round ID (potential path traversal detected)"
          );
        }
      });

      it("should accept valid UUID v1", async () => {
        const validId = "550e8400-e29b-11d4-8716-446655440000";
        const roundData = createMockRoundData(validId);

        await expect(storage.store(validId, roundData)).resolves.not.toThrow();
      });

      it("should accept valid UUID v4", async () => {
        const validId = "550e8400-e29b-41d4-a716-446655440000";
        const roundData = createMockRoundData(validId);

        await expect(storage.store(validId, roundData)).resolves.not.toThrow();
      });

      it("should accept valid UUID v5", async () => {
        const validId = "550e8400-e29b-51d4-9716-446655440000";
        const roundData = createMockRoundData(validId);

        await expect(storage.store(validId, roundData)).resolves.not.toThrow();
      });

      it("should accept UUID with uppercase letters", async () => {
        const validId = "550E8400-E29B-41D4-A716-446655440000";
        const roundData = createMockRoundData(validId);

        await expect(storage.store(validId, roundData)).resolves.not.toThrow();
      });
    });

    describe("retrieve method", () => {
      it("should reject path traversal with ../ pattern", async () => {
        const invalidId = "../../../etc/passwd";

        await expect(storage.retrieve(invalidId)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject UUID with ../ suffix", async () => {
        const invalidId = "550e8400-e29b-41d4-a716-446655440000/../other";

        await expect(storage.retrieve(invalidId)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject path with null bytes", async () => {
        const invalidId = "550e8400-e29b-41d4-a716-446655440000\0.json";

        await expect(storage.retrieve(invalidId)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject absolute paths", async () => {
        const invalidId = "/etc/passwd";

        await expect(storage.retrieve(invalidId)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject relative paths", async () => {
        const invalidId = "./some/path";

        await expect(storage.retrieve(invalidId)).rejects.toThrow(
          "Invalid round ID (potential path traversal detected)"
        );
      });

      it("should reject IDs with special characters", async () => {
        const invalidIds = [
          "id-with-spaces in it",
          "id/with/slashes",
          "id\\with\\backslashes",
          "id:with:colons",
          "id*with*asterisks",
          "id?with?questions",
        ];

        for (const invalidId of invalidIds) {
          await expect(storage.retrieve(invalidId)).rejects.toThrow(
            "Invalid round ID (potential path traversal detected)"
          );
        }
      });

      it("should reject non-UUID strings", async () => {
        const invalidIds = [
          "not-a-uuid",
          "12345678-1234-1234-1234-1234567890123",
          "550e8400-e29b-41d4-a716",
          "550e8400e29b41d4a716446655440000",
          "",
          "g50e8400-e29b-41d4-a716-446655440000",
        ];

        for (const invalidId of invalidIds) {
          await expect(storage.retrieve(invalidId)).rejects.toThrow(
            "Invalid round ID (potential path traversal detected)"
          );
        }
      });

      it("should return null for valid UUID that doesn't exist", async () => {
        const validId = "550e8400-e29b-41d4-a716-446655440000";
        const result = await storage.retrieve(validId);

        expect(result).toBeNull();
      });

      it("should retrieve stored data for valid UUID", async () => {
        const validId = "550e8400-e29b-41d4-a716-446655440000";
        const roundData = createMockRoundData(validId);

        await storage.store(validId, roundData);
        const retrieved = await storage.retrieve(validId);

        expect(retrieved).toEqual(roundData);
      });
    });
  });

  describe("Normal Operation", () => {
    it("should store and retrieve round data successfully", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      const roundData = createMockRoundData(validId);

      await storage.store(validId, roundData);
      const retrieved = await storage.retrieve(validId);

      expect(retrieved).toEqual(roundData);
      expect(retrieved?.id).toBe(validId);
      expect(retrieved?.teamName).toBe("Test Team");
      expect(retrieved?.laps).toHaveLength(2);
    });

    it("should create storage directory if it doesn't exist", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      const roundData = createMockRoundData(validId);

      // Storage directory should be created on store
      await storage.store(validId, roundData);

      // Verify directory exists
      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it("should return null for non-existent round", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      const result = await storage.retrieve(validId);

      expect(result).toBeNull();
    });

    it("should overwrite existing round data", async () => {
      const validId = "550e8400-e29b-41d4-a716-446655440000";
      const roundData1 = createMockRoundData(validId);
      roundData1.teamName = "Team 1";

      const roundData2 = createMockRoundData(validId);
      roundData2.teamName = "Team 2";

      await storage.store(validId, roundData1);
      await storage.store(validId, roundData2);

      const retrieved = await storage.retrieve(validId);
      expect(retrieved?.teamName).toBe("Team 2");
    });

    it("should handle multiple rounds independently", async () => {
      const id1 = "550e8400-e29b-41d4-a716-446655440000";
      const id2 = "660e8400-e29b-41d4-a716-446655440001";

      const roundData1 = createMockRoundData(id1);
      roundData1.teamName = "Team 1";

      const roundData2 = createMockRoundData(id2);
      roundData2.teamName = "Team 2";

      await storage.store(id1, roundData1);
      await storage.store(id2, roundData2);

      const retrieved1 = await storage.retrieve(id1);
      const retrieved2 = await storage.retrieve(id2);

      expect(retrieved1?.teamName).toBe("Team 1");
      expect(retrieved2?.teamName).toBe("Team 2");
    });
  });
});
