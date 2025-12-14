import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Team, SavedRound } from "@/lib/indexeddb";
import { indexedDB as indexedDBManager } from "@/lib/indexeddb";
import { generateUUID } from "@/lib/uuid";

describe("IndexedDB Manager", () => {
  const DB_NAME = "WkTimerDB";

  const mockTeam: Team = {
    id: "team-1",
    name: "Test Team",
    color: "#ff0000",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  };

  const resetDatabase = async () =>
    new Promise<void>((resolve, reject) => {
      const request = globalThis.indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onblocked = () => resolve();
      request.onerror = () =>
        reject(
          new Error(request.error?.message ?? "Failed to delete database")
        );
    });

  const closeManagerDb = () => {
    const manager = indexedDBManager as unknown as { db: IDBDatabase | null };
    try {
      manager.db?.close();
    } catch {
      // ignore
    }
    manager.db = null;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    closeManagerDb();
    await resetDatabase();
    closeManagerDb();
    await indexedDBManager.init();
  });

  afterEach(async () => {
    closeManagerDb();
    await resetDatabase();
    closeManagerDb();
  });

  describe("Team Operations", () => {
    it("saves and retrieves a team with hydrated dates", async () => {
      await indexedDBManager.saveTeam(mockTeam);
      const teams = await indexedDBManager.getAllTeams();

      expect(teams).toHaveLength(1);
      expect(teams[0]?.id).toBe("team-1");
      expect(teams[0]?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Round Operations", () => {
    const mockRound: SavedRound = {
      id: generateUUID(),
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

    it("saves and retrieves rounds sorted by completion date", async () => {
      const olderRound: SavedRound = {
        ...mockRound,
        id: generateUUID(),
        completedAt: new Date("2024-01-01T00:00:00Z"),
      };
      const newerRound: SavedRound = {
        ...mockRound,
        id: generateUUID(),
        completedAt: new Date("2024-01-02T00:00:00Z"),
      };

      await indexedDBManager.saveRound(olderRound);
      await indexedDBManager.saveRound(newerRound);

      const rounds = await indexedDBManager.getAllRounds();
      expect(rounds.map((r) => r.id)).toEqual([newerRound.id, olderRound.id]);
      expect(rounds[0]?.completedAt).toBeInstanceOf(Date);
      expect(rounds[0]?.laps[0]?.timestamp).toBeInstanceOf(Date);
    });

    it("filters rounds by team", async () => {
      const otherTeamRound: SavedRound = {
        ...mockRound,
        id: generateUUID(),
        teamId: "team-2",
        teamName: "Other Team",
      };

      await indexedDBManager.saveRound(mockRound);
      await indexedDBManager.saveRound(otherTeamRound);

      const team1Rounds = await indexedDBManager.getRoundsByTeam("team-1");
      expect(team1Rounds).toHaveLength(1);
      expect(team1Rounds[0]?.teamId).toBe("team-1");
    });

    it("deletes team and its rounds", async () => {
      const roundForTeam1: SavedRound = {
        ...mockRound,
        id: generateUUID(),
      };
      const roundForTeam2: SavedRound = {
        ...mockRound,
        id: generateUUID(),
        teamId: "team-2",
        teamName: "Team 2",
      };

      await indexedDBManager.saveTeam(mockTeam);
      await indexedDBManager.saveTeam({ ...mockTeam, id: "team-2" });
      await indexedDBManager.saveRound(roundForTeam1);
      await indexedDBManager.saveRound(roundForTeam2);

      await indexedDBManager.deleteTeam("team-1");

      const remainingRounds = await indexedDBManager.getAllRounds();
      expect(remainingRounds).toHaveLength(1);
      expect(remainingRounds[0]?.teamId).toBe("team-2");
    });

    it("clears all rounds", async () => {
      await indexedDBManager.saveRound(mockRound);
      await indexedDBManager.clearAllRounds();

      const rounds = await indexedDBManager.getAllRounds();
      expect(rounds).toHaveLength(0);
    });
  });

  describe("Settings Operations", () => {
    it(
      "sets and gets settings values",
      async () => {
        await indexedDBManager.setSetting("theme", "dark");
        const value = await indexedDBManager.getSetting("theme");

        expect(value).toBe("dark");
      },
      { timeout: 30000 }
    );
  });
});
