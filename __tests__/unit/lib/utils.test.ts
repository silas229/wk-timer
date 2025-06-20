import { describe, it, expect } from "vitest";

describe("Time Utilities", () => {
  function formatTime(timeInMs: number): string {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((timeInMs % 1000) / 10);

    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  }

  function parseTimeToMs(timeString: string): number {
    const [minutes, rest] = timeString.split(":");
    if (!rest) throw new Error("Invalid time format");
    const [seconds, milliseconds] = rest.split(".");
    if (!seconds || !milliseconds) throw new Error("Invalid time format");

    return (
      parseInt(minutes || "0") * 60 * 1000 +
      parseInt(seconds) * 1000 +
      parseInt(milliseconds) * 10
    );
  }

  it("should format time correctly", () => {
    expect(formatTime(0)).toBe("0:00.00");
    expect(formatTime(1000)).toBe("0:01.00");
    expect(formatTime(60000)).toBe("1:00.00");
    expect(formatTime(61500)).toBe("1:01.50");
    expect(formatTime(125750)).toBe("2:05.75");
  });

  it("should parse time string to milliseconds", () => {
    expect(parseTimeToMs("0:00.00")).toBe(0);
    expect(parseTimeToMs("0:01.00")).toBe(1000);
    expect(parseTimeToMs("1:00.00")).toBe(60000);
    expect(parseTimeToMs("1:01.50")).toBe(61500);
    expect(parseTimeToMs("2:05.75")).toBe(125750);
  });

  it("should be reversible (format then parse)", () => {
    const testTimes = [0, 1000, 5500, 60000, 125750, 300000];

    testTimes.forEach((time) => {
      const formatted = formatTime(time);
      const parsed = parseTimeToMs(formatted);
      expect(parsed).toBe(time);
    });
  });
});

describe("Color Utilities", () => {
  function isValidHexColor(color: string): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(color);
  }

  function generateTeamColor(index: number, colors: string[]): string {
    const color = colors[index % colors.length];
    return color || "#000000"; // Fallback color
  }

  const teamColors = [
    "#f4884c",
    "#00469d",
    "#22c55e",
    "#eab308",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  it("should validate hex colors correctly", () => {
    expect(isValidHexColor("#ff0000")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#FFFFFF")).toBe(true);
    expect(isValidHexColor("#123abc")).toBe(true);

    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("#ff00")).toBe(false);
    expect(isValidHexColor("#gg0000")).toBe(false);
    expect(isValidHexColor("ff0000")).toBe(false);
    expect(isValidHexColor("")).toBe(false);
  });

  it("should generate team colors cyclically", () => {
    expect(generateTeamColor(0, teamColors)).toBe("#f4884c");
    expect(generateTeamColor(1, teamColors)).toBe("#00469d");
    expect(generateTeamColor(7, teamColors)).toBe("#f4884c"); // Cycles back
    expect(generateTeamColor(8, teamColors)).toBe("#00469d");
  });

  it("should handle all predefined team colors", () => {
    teamColors.forEach((color) => {
      expect(isValidHexColor(color)).toBe(true);
    });
  });
});

describe("ID Generation", () => {
  function generateId(prefix: string = ""): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefix
      ? `${prefix}-${timestamp}-${random}`
      : `${timestamp}-${random}`;
  }

  it("should generate unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe("string");
    expect(typeof id2).toBe("string");
    expect(id1.length).toBeGreaterThan(0);
    expect(id2.length).toBeGreaterThan(0);
  });

  it("should include prefix when provided", () => {
    const teamId = generateId("team");
    const roundId = generateId("round");

    expect(teamId).toMatch(/^team-/);
    expect(roundId).toMatch(/^round-/);
  });

  it("should not include prefix when not provided", () => {
    const id = generateId();

    expect(id).not.toMatch(/^team-/);
    expect(id).not.toMatch(/^round-/);
    expect(id).toMatch(/^\d+-.+/);
  });
});
