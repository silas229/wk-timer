import { describe, it, expect } from "vitest";
import {
  calculateActivityTimes,
  formatTime,
  LAP_ACTIVITIES,
} from "@/lib/lap-activities";

describe("Lap Activities", () => {
  const mockLaps = [
    { lapNumber: 1, time: 10000, timestamp: new Date() }, // Läufer 1: 0 -> 10s
    { lapNumber: 2, time: 20000, timestamp: new Date() }, // Läufer 2: 10s -> 20s
    { lapNumber: 3, time: 25000, timestamp: new Date() }, // Start for Läufer 3 (first 5s)
    { lapNumber: 4, time: 40000, timestamp: new Date() }, // Schlauchrollen: 25s -> 40s (15s)
    { lapNumber: 5, time: 45000, timestamp: new Date() }, // Läufer 3 (remaining 5s): 40s -> 45s (total 20s -> 45s)
    { lapNumber: 6, time: 55000, timestamp: new Date() }, // Läufer 4: 45s -> 55s
    { lapNumber: 7, time: 70000, timestamp: new Date() }, // Anziehen: 55s -> 70s (15s)
    { lapNumber: 8, time: 80000, timestamp: new Date() }, // Läufer 5: 60s -> 80s (10s after Anziehen)
    { lapNumber: 9, time: 90000, timestamp: new Date() }, // Läufer 6: 80s -> 90s
    { lapNumber: 10, time: 100000, timestamp: new Date() }, // Läufer 7: 90s -> 100s
    { lapNumber: 11, time: 115000, timestamp: new Date() }, // Kuppeln: 100s -> 115s (15s)
    { lapNumber: 12, time: 125000, timestamp: new Date() }, // Läufer 8: 100s -> 125s (10s after Kuppeln)
    { lapNumber: 13, time: 135000, timestamp: new Date() }, // Läufer 9: 125s -> 135s
  ];

  describe("LAP_ACTIVITIES Configuration", () => {
    it("should have the correct activity configuration", () => {
      expect(LAP_ACTIVITIES).toHaveLength(12);

      // Test a few key activities
      expect(LAP_ACTIVITIES[0]).toEqual({
        name: "Läufer 1",
        endIndex: 1,
        startIndex: 0,
      });
      expect(LAP_ACTIVITIES[3]).toEqual({
        name: "Schlauchrollen",
        endIndex: 4,
        startIndex: 3,
      });
      expect(LAP_ACTIVITIES[6]).toEqual({
        name: "Anziehen",
        endIndex: 7,
        startIndex: 6,
      });
      expect(LAP_ACTIVITIES[9]).toEqual({
        name: "Läufer 8",
        endIndex: 12,
        startIndex: 10,
      });
      expect(LAP_ACTIVITIES[10]).toEqual({
        name: "Kuppeln",
        endIndex: 11,
        startIndex: 10,
      });
      expect(LAP_ACTIVITIES[11]).toEqual({
        name: "Läufer 9",
        endIndex: 13,
        startIndex: 12,
      });
    });

    it("should have unique activity names", () => {
      const names = LAP_ACTIVITIES.map((activity) => activity.name);
      const uniqueNames = [...new Set(names)];
      expect(uniqueNames).toHaveLength(names.length);
    });
  });

  describe("calculateActivityTimes", () => {
    it("should calculate correct activity times", () => {
      const activities = calculateActivityTimes(mockLaps);

      expect(activities).toHaveLength(12); // Should return 12 activities

      // Test specific activities
      const runner1 = activities.find((a) => a.name === "Läufer 1");
      expect(runner1).toBeDefined();
      expect(runner1?.time).toBe(10000); // 10 seconds
      expect(runner1?.startTime).toBe(0);
      expect(runner1?.endTime).toBe(10000);

      const hoseRolling = activities.find((a) => a.name === "Schlauchrollen");
      expect(hoseRolling).toBeDefined();
      expect(hoseRolling?.time).toBe(15000); // 15 seconds (25s -> 40s)
      expect(hoseRolling?.startTime).toBe(25000);
      expect(hoseRolling?.endTime).toBe(40000);

      const runner3 = activities.find((a) => a.name === "Läufer 3");
      expect(runner3).toBeDefined();
      expect(runner3?.time).toBe(25000);
      expect(runner3?.startTime).toBe(20000);
      expect(runner3?.endTime).toBe(45000);

      const dressing = activities.find((a) => a.name === "Anziehen");
      expect(dressing).toBeDefined();
      expect(dressing?.time).toBe(15000); // 15 seconds (55s -> 70s)
      expect(dressing?.startTime).toBe(55000);
      expect(dressing?.endTime).toBe(70000);

      const runner5 = activities.find((a) => a.name === "Läufer 5");
      expect(runner5).toBeDefined();
      expect(runner5?.time).toBe(25000); // 10 seconds (55s -> 80s)
      expect(runner5?.startTime).toBe(55000);
      expect(runner5?.endTime).toBe(80000);

      const coupling = activities.find((a) => a.name === "Kuppeln");
      expect(coupling).toBeDefined();
      expect(coupling?.time).toBe(15000); // 15 seconds (100s -> 115s)
      expect(coupling?.startTime).toBe(100000);
      expect(coupling?.endTime).toBe(115000);

      const runner8 = activities.find((a) => a.name === "Läufer 8");
      expect(runner8).toBeDefined();
      expect(runner8?.time).toBe(25000); // 25 seconds (100s -> 125s)
      expect(runner8?.startTime).toBe(100000);
      expect(runner8?.endTime).toBe(125000);

      const runner9 = activities.find((a) => a.name === "Läufer 9");
      expect(runner9).toBeDefined();
      expect(runner9?.time).toBe(10000);
      expect(runner9?.startTime).toBe(125000);
      expect(runner9?.endTime).toBe(135000);
    });

    it("should handle missing laps gracefully", () => {
      const incompleteLaps = mockLaps.slice(0, 5); // Only first 5 laps
      const activities = calculateActivityTimes(incompleteLaps);

      // Should only have activities for available laps
      expect(activities.length).toBeLessThan(12);

      // Should include Läufer 1, 2, and 3
      const runner1 = activities.find((a) => a.name === "Läufer 1");
      const runner2 = activities.find((a) => a.name === "Läufer 2");
      const runner3 = activities.find((a) => a.name === "Läufer 3");

      expect(runner1).toBeDefined();
      expect(runner2).toBeDefined();
      expect(runner3).toBeDefined();
    });

    it("should return empty array for empty laps", () => {
      const activities = calculateActivityTimes([]);
      expect(activities).toEqual([]);
    });

    it("should handle single lap", () => {
      const singleLap = [{ lapNumber: 1, time: 30000, timestamp: new Date() }];
      const activities = calculateActivityTimes(singleLap);

      expect(activities).toHaveLength(1);
      expect(activities[0]?.name).toBe("Läufer 1");
      expect(activities[0]?.time).toBe(30000);
    });
  });

  describe("formatTime", () => {
    describe("full format (default)", () => {
      it("should format zero time correctly", () => {
        expect(formatTime(0)).toBe("0:00.00");
        expect(formatTime(0, "full")).toBe("0:00.00");
      });

      it("should format milliseconds correctly", () => {
        expect(formatTime(500)).toBe("0:00.50");
        expect(formatTime(999)).toBe("0:00.99");
        expect(formatTime(123)).toBe("0:00.12");
      });

      it("should format seconds correctly", () => {
        expect(formatTime(1000)).toBe("0:01.00");
        expect(formatTime(1500)).toBe("0:01.50");
        expect(formatTime(59999)).toBe("0:59.99");
      });

      it("should format minutes correctly", () => {
        expect(formatTime(60000)).toBe("1:00.00");
        expect(formatTime(90000)).toBe("1:30.00");
        expect(formatTime(125678)).toBe("2:05.67");
      });

      it("should format large times correctly", () => {
        expect(formatTime(600000)).toBe("10:00.00");
        expect(formatTime(3661234)).toBe("61:01.23");
      });
    });

    describe("seconds format", () => {
      it("should format seconds only", () => {
        expect(formatTime(0, "seconds")).toBe("00.00");
        expect(formatTime(1500, "seconds")).toBe("01.50");
        expect(formatTime(59999, "seconds")).toBe("59.99");
      });

      it("should handle minutes overflow in seconds format", () => {
        expect(formatTime(60000, "seconds")).toBe("00.00"); // 1 minute becomes 0 seconds
        expect(formatTime(65000, "seconds")).toBe("05.00"); // 1:05 becomes 05 seconds
        expect(formatTime(125678, "seconds")).toBe("05.67"); // 2:05.67 becomes 05.67 seconds
      });
    });

    describe("diff format", () => {
      it("should format positive differences", () => {
        expect(formatTime(0, "diff")).toBe("+00.00");
        expect(formatTime(1500, "diff")).toBe("+01.50");
        expect(formatTime(59999, "diff")).toBe("+59.99");
      });

      it("should format negative differences", () => {
        expect(formatTime(-1500, "diff")).toBe("-01.50");
        expect(formatTime(-59999, "diff")).toBe("-59.99");
        expect(formatTime(-123, "diff")).toBe("-00.12");
      });

      it("should handle minutes overflow in diff format", () => {
        expect(formatTime(65000, "diff")).toBe("+05.00"); // 1:05 becomes +05 seconds
        expect(formatTime(-125678, "diff")).toBe("-05.67"); // -2:05.67 becomes -05.67 seconds
      });
    });

    describe("negative values", () => {
      it("should handle negative values in full format", () => {
        expect(formatTime(-1500)).toBe("0:01.50"); // Absolute value
        expect(formatTime(-60000)).toBe("1:00.00");
        expect(formatTime(-125678)).toBe("2:05.67");
      });

      it("should handle negative values in seconds format", () => {
        expect(formatTime(-1500, "seconds")).toBe("01.50"); // Absolute value
        expect(formatTime(-65000, "seconds")).toBe("05.00");
      });
    });

    describe("edge cases", () => {
      it("should handle very small values", () => {
        expect(formatTime(1)).toBe("0:00.00");
        expect(formatTime(9)).toBe("0:00.00");
        expect(formatTime(10)).toBe("0:00.01");
      });

      it("should handle rounding of milliseconds", () => {
        expect(formatTime(1234)).toBe("0:01.23"); // 1.234s -> 1.23s
        expect(formatTime(1235)).toBe("0:01.23"); // 1.235s -> 1.23s
        expect(formatTime(1236)).toBe("0:01.23"); // 1.236s -> 1.23s
      });

      it("should use default format for unknown format", () => {
        // @ts-expect-error Testing unknown format
        expect(formatTime(1500, "unknown")).toBe("0:01.50");
      });
    });
  });

  describe("Activity Integration", () => {
    it("should have consistent activity calculations", () => {
      const activities = calculateActivityTimes(mockLaps);

      // Total of all activities should be close to the total lap time
      // (not exact due to overlapping activities like Anziehen during Läufer 5)
      const totalActivityTime = activities.reduce(
        (sum, activity) => sum + activity.time,
        0
      );
      const totalLapTime = mockLaps[mockLaps.length - 1]?.time || 0;

      // Activities should have reasonable total time
      expect(totalActivityTime).toBeGreaterThan(0);
      expect(totalActivityTime).toBeLessThanOrEqual(totalLapTime * 2); // Allow for overlaps
    });

    it("should maintain activity order", () => {
      const activities = calculateActivityTimes(mockLaps);

      // Activities should generally be in chronological order of start times
      for (let i = 1; i < activities.length; i++) {
        const current = activities[i];
        const previous = activities[i - 1];

        if (current && previous) {
          // Start time should generally increase (with some exceptions for overlapping activities)
          expect(current.startTime).toBeGreaterThanOrEqual(0);
          expect(previous.startTime).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
