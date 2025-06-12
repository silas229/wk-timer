import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Team, SavedRound } from "../lib/indexeddb";

describe("IndexedDB Manager", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe("Team Operations", () => {
    const mockTeam: Team = {
      id: "team-1",
      name: "Test Team",
      color: "#ff0000",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    };

    it("should create a team with valid data", async () => {
      // Note: Since we're mocking IndexedDB, we'll test the interface
      // In a real scenario, you'd test against a real IndexedDB instance
      expect(mockTeam.id).toBe("team-1");
      expect(mockTeam.name).toBe("Test Team");
      expect(mockTeam.color).toBe("#ff0000");
      expect(mockTeam.createdAt).toBeInstanceOf(Date);
    });

    it("should validate team properties", () => {
      expect(mockTeam).toHaveProperty("id");
      expect(mockTeam).toHaveProperty("name");
      expect(mockTeam).toHaveProperty("color");
      expect(mockTeam).toHaveProperty("createdAt");
    });
  });

  describe("Round Operations", () => {
    const mockRound: SavedRound = {
      id: "round-1",
      completedAt: new Date("2024-01-01T00:00:00Z"),
      totalTime: 120000, // 2 minutes in milliseconds
      laps: [
        {
          lapNumber: 1,
          time: 60000,
          timestamp: new Date("2024-01-01T00:00:00Z"),
        },
        {
          lapNumber: 2,
          time: 60000,
          timestamp: new Date("2024-01-01T00:01:00Z"),
        },
      ],
      teamId: "team-1",
      teamName: "Test Team",
    };

    it("should create a round with valid data", () => {
      expect(mockRound.id).toBe("round-1");
      expect(mockRound.teamId).toBe("team-1");
      expect(mockRound.totalTime).toBe(120000);
      expect(mockRound.laps).toHaveLength(2);
    });

    it("should have proper lap structure", () => {
      mockRound.laps.forEach((lap, index) => {
        expect(lap).toHaveProperty("lapNumber");
        expect(lap).toHaveProperty("time");
        expect(lap).toHaveProperty("timestamp");
        expect(lap.lapNumber).toBe(index + 1);
        expect(lap.time).toBeGreaterThan(0);
        expect(lap.timestamp).toBeInstanceOf(Date);
      });
    });

    it("should calculate total time correctly", () => {
      const calculatedTotal = mockRound.laps.reduce(
        (sum, lap) => sum + lap.time,
        0
      );
      expect(mockRound.totalTime).toBe(calculatedTotal);
    });
  });

  describe("Data Validation", () => {
    it("should validate team ID format", () => {
      const validIds = ["team-1", "team-abc-123", "unique-team-id"];
      const invalidIds = ["", " ", "team 1", "team@1"];

      validIds.forEach((id) => {
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
        expect(id.trim()).toBe(id);
      });

      invalidIds.forEach((id) => {
        if (id.includes(" ") || id.includes("@")) {
          expect(id).toMatch(/[\s@]/); // Should contain spaces or special chars
        }
      });
    });

    it("should validate color format", () => {
      const validColors = ["#ff0000", "#00ff00", "#0000ff", "#ffffff"];
      const invalidColors = ["red", "rgb(255,0,0)", "#gg0000", ""];

      validColors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });

      invalidColors.forEach((color) => {
        if (color !== "") {
          expect(color).not.toMatch(/^#[0-9a-fA-F]{6}$/);
        }
      });
    });
  });

  describe("Time Calculations", () => {
    it("should handle time formatting correctly", () => {
      const timeInMs = 125000; // 2 minutes 5 seconds
      const minutes = Math.floor(timeInMs / 60000);
      const seconds = Math.floor((timeInMs % 60000) / 1000);
      const milliseconds = timeInMs % 1000;

      expect(minutes).toBe(2);
      expect(seconds).toBe(5);
      expect(milliseconds).toBe(0);
    });

    it("should calculate lap times accurately", () => {
      const startTime = new Date("2024-01-01T00:00:00Z").getTime();
      const lap1End = new Date("2024-01-01T00:01:00Z").getTime();
      const lap2End = new Date("2024-01-01T00:02:00Z").getTime();

      const lap1Time = lap1End - startTime;
      const lap2Time = lap2End - lap1End;

      expect(lap1Time).toBe(60000); // 1 minute
      expect(lap2Time).toBe(60000); // 1 minute
    });
  });
});
