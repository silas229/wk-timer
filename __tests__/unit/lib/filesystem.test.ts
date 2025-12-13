import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FileSystemRoundStorage } from "@/lib/filesystem-round-storage";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

describe("FileSystemRoundStorage.retrieve", () => {
  let tempDir: string;
  let storage: FileSystemRoundStorage;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wk-timer-"));
    storage = new FileSystemRoundStorage(tempDir);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("retrieves and parses stored round data (includes score field round-trip)", async () => {
    const id = "7b0a1a52-0f83-4b3a-9d3d-9b9b91c8c4fd";
    const roundData = {
      id,
      completedAt: "2024-01-01T12:00:00Z",
      totalTime: 450000,
      laps: [
        { lapNumber: 1, time: 120000, timestamp: "2024-01-01T12:02:00Z" },
        { lapNumber: 2, time: 150000, timestamp: "2024-01-01T12:04:30Z" },
        { lapNumber: 3, time: 180000, timestamp: "2024-01-01T12:07:30Z" },
      ],
      teamName: "Score Test Team",
    };

    const filePath = path.join(tempDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(roundData, null, 2), "utf-8");

    const retrieved = await storage.retrieve(id);

    expect(retrieved).toEqual(roundData);
  });

  it("returns null when the round file does not exist (valid UUID)", async () => {
    const id = "3f31b2e6-9c5b-4e59-9b2b-1b2d3b4e5f60";
    const retrieved = await storage.retrieve(id);
    expect(retrieved).toBeNull();
  });

  it("enforces UUID-only IDs and blocks path traversal attempts (does not read file)", async () => {
    const readSpy = vi.spyOn(fs, "readFile");

    await expect(storage.retrieve("../etc/passwd")).rejects.toThrow(
      /Invalid round ID/i
    );
    expect(readSpy).not.toHaveBeenCalled();

    await expect(storage.retrieve("..\\..\\windows\\system32")).rejects.toThrow(
      /Invalid round ID/i
    );
    expect(readSpy).not.toHaveBeenCalled();
  });

  it("rejects non-UUID IDs (does not read file)", async () => {
    const readSpy = vi.spyOn(fs, "readFile");

    await expect(storage.retrieve("not-a-uuid")).rejects.toThrow(
      /Invalid round ID/i
    );
    expect(readSpy).not.toHaveBeenCalled();
  });

  it("throws a wrapped error when the stored JSON is invalid", async () => {
    const id = "2e4f6c1a-1b2c-4d5e-8f90-1a2b3c4d5e6f";
    const filePath = path.join(tempDir, `${id}.json`);

    await fs.writeFile(filePath, "{ this is not valid JSON", "utf-8");

    await expect(storage.retrieve(id)).rejects.toThrow(
      /Failed to retrieve round/i
    );
  });
});

describe("FileSystemRoundStorage.store", () => {
  let tempDir: string;
  let storage: FileSystemRoundStorage;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wk-timer-"));
    storage = new FileSystemRoundStorage(tempDir);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("stores round data and can be retrieved (round-trip)", async () => {
    const roundData = {
      id: "7b0a1a52-0f83-4b3a-9d3d-9b9b91c8c4fd",
      completedAt: "2024-01-01T12:00:00Z",
      totalTime: 450000,
      laps: [
        { lapNumber: 1, time: 120000, timestamp: "2024-01-01T12:02:00Z" },
        { lapNumber: 2, time: 150000, timestamp: "2024-01-01T12:04:30Z" },
      ],
      teamName: "Test Team",
      description: "Test round",
    };

    await storage.store(roundData);

    const filePath = path.join(tempDir, `${roundData.id}.json`);
    const fileContent = await fs.readFile(filePath, "utf-8");
    expect(JSON.parse(fileContent)).toEqual(roundData);
  });

  it("overwrites existing round data with same ID", async () => {
    const id = "2e4f6c1a-1b2c-4d5e-8f90-1a2b3c4d5e6f";
    const firstData = {
      id,
      completedAt: "2024-01-01T12:00:00Z",
      totalTime: 100000,
      laps: [],
      teamName: "Team A",
      description: "First",
    };
    const secondData = {
      ...firstData,
      teamName: "Team B",
    };

    await storage.store(firstData);
    await storage.store(secondData);

    const retrieved = await storage.retrieve(id);
    expect(retrieved?.teamName).toBe("Team B");
  });

  it("creates file in correct location with UUID filename", async () => {
    const id = "a1b2c3d4-e5f6-47a8-9b0c-d1e2f3a4b5c6";
    const roundData = {
      id,
      completedAt: "2024-01-01T12:00:00Z",
      totalTime: 200000,
      laps: [],
      teamName: "Test",
      description: "Test",
    };

    await storage.store(roundData);

    const filePath = path.join(tempDir, `${id}.json`);
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    expect(fileExists).toBe(true);
  });

  it("throws error when storing with invalid ID format", async () => {
    const roundData = {
      id: "not-a-uuid",
      completedAt: "2024-01-01T12:00:00Z",
      totalTime: 100000,
      laps: [],
      teamName: "Test",
      description: "Test",
    };

    await expect(storage.store(roundData)).rejects.toThrow();
  });
});
