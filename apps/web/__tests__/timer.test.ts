import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock timer functionality
describe("Timer Logic", () => {
  let startTime: number | null = null;
  let currentTime = 0;
  let laps: Array<{ lapNumber: number; time: number; timestamp: Date }> = [];

  beforeEach(() => {
    startTime = null;
    currentTime = 0;
    laps = [];
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  }

  function addLap(time: number): void {
    if (laps.length < 13) {
      laps.push({
        lapNumber: laps.length + 1,
        time,
        timestamp: new Date(),
      });
    }
  }

  it("should format time correctly", () => {
    expect(formatTime(0)).toBe("00:00.00");
    expect(formatTime(1000)).toBe("00:01.00");
    expect(formatTime(61500)).toBe("01:01.50");
    expect(formatTime(125000)).toBe("02:05.00");
  });

  it("should add laps correctly", () => {
    addLap(30000); // 30 seconds
    addLap(60000); // 1 minute
    addLap(90000); // 1.5 minutes

    expect(laps).toHaveLength(3);
    expect(laps[0]?.lapNumber).toBe(1);
    expect(laps[0]?.time).toBe(30000);
    expect(laps[1]?.lapNumber).toBe(2);
    expect(laps[1]?.time).toBe(60000);
    expect(laps[2]?.lapNumber).toBe(3);
    expect(laps[2]?.time).toBe(90000);
  });

  it("should not allow more than 13 laps", () => {
    // Add 15 laps
    for (let i = 1; i <= 15; i++) {
      addLap(i * 10000);
    }

    expect(laps).toHaveLength(13);
    expect(laps[12]?.lapNumber).toBe(13);
  });

  it("should calculate lap times correctly", () => {
    const lapTimes = [30000, 60000, 90000]; // Cumulative times

    lapTimes.forEach((time) => addLap(time));

    // Calculate individual lap times
    let previousTime = 0;
    const individualLapTimes = laps.map((lap) => {
      const lapTime = lap.time - previousTime;
      previousTime = lap.time;
      return lapTime;
    });

    expect(individualLapTimes[0]).toBe(30000); // First lap: 30s
    expect(individualLapTimes[1]).toBe(30000); // Second lap: 30s
    expect(individualLapTimes[2]).toBe(30000); // Third lap: 30s
  });

  it("should handle timer state transitions", () => {
    type TimerState = "stopped" | "running" | "finished";
    let state: TimerState = "stopped";

    // Start timer
    expect(state).toBe("stopped");

    state = "running";
    expect(state).toBe("running");

    // Finish after 13 laps
    for (let i = 1; i <= 13; i++) {
      addLap(i * 10000);
    }

    if (laps.length === 13) {
      state = "finished";
    }

    expect(state).toBe("finished");
    expect(laps).toHaveLength(13);
  });

  it("should reset timer correctly", () => {
    // Set up timer with some data
    currentTime = 120000;
    addLap(60000);
    addLap(120000);
    let state: "stopped" | "running" | "finished" = "finished";

    // Reset
    currentTime = 0;
    laps = [];
    state = "stopped";
    startTime = null;

    expect(currentTime).toBe(0);
    expect(laps).toHaveLength(0);
    expect(state).toBe("stopped");
    expect(startTime).toBeNull();
  });
});

describe("Round Data Structure", () => {
  interface SavedRound {
    id: string;
    completedAt: Date;
    totalTime: number;
    laps: Array<{ lapNumber: number; time: number; timestamp: Date }>;
    teamId: string;
    teamName: string;
  }

  it("should create valid round object", () => {
    const mockRound: SavedRound = {
      id: "round-123",
      completedAt: new Date("2024-01-01T12:00:00Z"),
      totalTime: 120000,
      laps: [
        {
          lapNumber: 1,
          time: 60000,
          timestamp: new Date("2024-01-01T12:00:00Z"),
        },
        {
          lapNumber: 2,
          time: 120000,
          timestamp: new Date("2024-01-01T12:01:00Z"),
        },
      ],
      teamId: "team-1",
      teamName: "Test Team",
    };

    expect(mockRound.id).toBeTruthy();
    expect(mockRound.completedAt).toBeInstanceOf(Date);
    expect(mockRound.totalTime).toBeGreaterThan(0);
    expect(mockRound.laps).toHaveLength(2);
    expect(mockRound.teamId).toBeTruthy();
    expect(mockRound.teamName).toBeTruthy();
  });

  it("should validate lap progression", () => {
    const laps = [
      { lapNumber: 1, time: 30000, timestamp: new Date() },
      { lapNumber: 2, time: 65000, timestamp: new Date() },
      { lapNumber: 3, time: 95000, timestamp: new Date() },
    ];

    // Verify lap numbers are sequential
    laps.forEach((lap, index) => {
      expect(lap.lapNumber).toBe(index + 1);
    });

    // Verify times are increasing
    for (let i = 1; i < laps.length; i++) {
      expect(laps[i]?.time).toBeGreaterThan(laps[i - 1]?.time || 0);
    }
  });
});
