import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { SavedRound } from "@/lib/indexeddb";
import { indexedDB as indexedDBManager } from "@/lib/indexeddb";
import * as roundClient from "@/lib/round-client";

function makeRound(overrides: Partial<SavedRound> = {}): SavedRound {
  return {
    id: "round-1",
    completedAt: new Date("2024-01-01T00:00:00Z"),
    totalTime: 120000,
    laps: [
      {
        lapNumber: 1,
        time: 60000,
        timestamp: new Date("2024-01-01T00:00:00Z"),
      },
    ],
    teamId: "team-1",
    teamName: "Test Team",
    ...overrides,
  };
}

function makeStateHarness<T>(initial: T) {
  let value = initial;

  const setState = vi.fn((next: T | ((prev: T) => T)) => {
    value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
  });

  return {
    get value() {
      return value;
    },
    setState,
  };
}

function createGetRoundById(getRounds: () => SavedRound[]) {
  return (id: string) => {
    for (const round of getRounds()) {
      if (round.id === id) return round;
    }
    return undefined;
  };
}

describe("round-client", () => {
  let saveRoundSpy: ReturnType<typeof vi.spyOn<typeof indexedDBManager, "saveRound">>;
  let getAllRoundsSpy: ReturnType<typeof vi.spyOn<typeof indexedDBManager, "getAllRounds">>;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    saveRoundSpy = vi
      .spyOn(indexedDBManager, "saveRound")
      .mockResolvedValue(undefined);
    getAllRoundsSpy = vi
      .spyOn(indexedDBManager, "getAllRounds")
      .mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("updateRoundInStorage", () => {
    it("merges round data and persists via indexedDB.saveRound", async () => {
      const existing = makeRound({ description: "before" });

      await roundClient.updateRoundInStorage(existing, {
        description: "after",
        totalTime: 999,
      });

      expect(saveRoundSpy).toHaveBeenCalledTimes(1);
      const savedArg = saveRoundSpy.mock.calls[0]?.[0] as SavedRound;
      expect(savedArg.id).toBe(existing.id);
      expect(savedArg.description).toBe("after");
      expect(savedArg.totalTime).toBe(999);
    });
  });

  describe("shareRoundAndPersist", () => {
    it("posts round payload, returns sharedUrl, and persists updated round", async () => {
      const round = makeRound({ description: "  hello  " });

      (
        globalThis.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: true,
        json: async () => ({ sharedUrl: "https://example.com/shared/abc" }),
      });

      const result = await roundClient.shareRoundAndPersist(round, 21);

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const fetchArgs = (
        globalThis.fetch as unknown as ReturnType<typeof vi.fn>
      ).mock.calls[0] as [string, RequestInit];

      expect(fetchArgs[0]).toBe("/api/share-round");
      expect(fetchArgs[1]?.method).toBe("POST");

      const body = JSON.parse(String(fetchArgs[1]?.body ?? "{}")) as {
        completedAt: string;
        laps: Array<{ timestamp: string }>;
        description?: string;
        teamAverageAge?: number;
      };

      expect(body.completedAt).toBe(round.completedAt.toISOString());
      expect(body.laps[0]?.timestamp).toBe(
        round.laps[0]?.timestamp.toISOString()
      );
      expect(body.description).toBe("hello");
      expect(body.teamAverageAge).toBe(21);

      expect(saveRoundSpy).toHaveBeenCalledTimes(1);
      const savedArg = saveRoundSpy.mock.calls[0]?.[0] as SavedRound;
      expect(savedArg.sharedUrl).toBe("https://example.com/shared/abc");

      expect(result.sharedUrl).toBe("https://example.com/shared/abc");
      expect(result.updatedRound.sharedUrl).toBe(
        "https://example.com/shared/abc"
      );
    });

    it("throws when response is not ok", async () => {
      const round = makeRound();
      (
        globalThis.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: false,
        json: async () => ({ sharedUrl: "https://example.com/shared/abc" }),
      });

      await expect(roundClient.shareRoundAndPersist(round)).rejects.toThrow(
        "Failed to share round"
      );

      expect(saveRoundSpy).not.toHaveBeenCalled();
    });

    it("throws when sharedUrl is missing", async () => {
      const round = makeRound();
      (
        globalThis.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await expect(roundClient.shareRoundAndPersist(round)).rejects.toThrow(
        "Failed to share round"
      );

      expect(saveRoundSpy).not.toHaveBeenCalled();
    });
  });

  describe("getAllSavedRoundsFromStorage", () => {
    it("returns rounds from indexedDB", async () => {
      const rounds = [makeRound({ id: "r1" }), makeRound({ id: "r2" })];
      getAllRoundsSpy.mockResolvedValue(rounds);

      await expect(roundClient.getAllSavedRoundsFromStorage()).resolves.toEqual(
        rounds
      );

      expect(getAllRoundsSpy).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when indexedDB throws", async () => {
      getAllRoundsSpy.mockRejectedValue(new Error("boom"));
      await expect(roundClient.getAllSavedRoundsFromStorage()).resolves.toEqual(
        []
      );

      expect(getAllRoundsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("replaceRoundInList", () => {
    it("replaces matching round by id", () => {
      const r1 = makeRound({ id: "a" });
      const r2 = makeRound({ id: "b" });
      const updated = makeRound({ id: "b", description: "updated" });

      const result = roundClient.replaceRoundInList([r1, r2], updated);
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe("a");
      expect(result[1]?.description).toBe("updated");
    });
  });

  describe("updateDetailRoundIfMatching", () => {
    it("returns updated round when ids match", () => {
      const current = makeRound({ id: "same" });
      const updated = makeRound({ id: "same", description: "new" });
      expect(roundClient.updateDetailRoundIfMatching(current, updated)).toBe(
        updated
      );
    });

    it("returns original when ids differ", () => {
      const current = makeRound({ id: "a" });
      const updated = makeRound({ id: "b" });
      expect(roundClient.updateDetailRoundIfMatching(current, updated)).toBe(
        current
      );
    });

    it("returns null when current is null", () => {
      const updated = makeRound({ id: "b" });
      expect(roundClient.updateDetailRoundIfMatching(null, updated)).toBeNull();
    });
  });

  describe("createRoundHandlers", () => {
    it("handleUpdateRound: no-ops when round not found", async () => {
      const savedRounds = makeStateHarness<SavedRound[]>([
        makeRound({ id: "x" }),
      ]);
      const detailRound = makeStateHarness<SavedRound | null>(null);

      const handlers = roundClient.createRoundHandlers({
        getAverageAge: () => 18,
        getRoundById: () => undefined,
        setSavedRounds: savedRounds.setState,
        setRoundToDetail: detailRound.setState,
      });

      await handlers.handleUpdateRound("missing", {
        description: "irrelevant",
      });

      expect(saveRoundSpy).not.toHaveBeenCalled();
      expect(savedRounds.setState).not.toHaveBeenCalled();
      expect(detailRound.setState).not.toHaveBeenCalled();
    });

    it("handleUpdateRound: updates storage and syncs list/detail/lastSaved", async () => {
      const r1 = makeRound({ id: "a" });
      const r2 = makeRound({ id: "b", description: "old" });

      const savedRounds = makeStateHarness<SavedRound[]>([r1, r2]);
      const detailRound = makeStateHarness<SavedRound | null>(r2);
      const lastSaved = makeStateHarness<SavedRound | null>(r2);

      const getRoundById = createGetRoundById(() => savedRounds.value);

      const handlers = roundClient.createRoundHandlers({
        getAverageAge: () => 18,
        getRoundById,
        setSavedRounds: savedRounds.setState,
        setRoundToDetail: detailRound.setState,
        setLastSavedRound: lastSaved.setState,
      });

      await handlers.handleUpdateRound("b", { description: "new" });

      expect(saveRoundSpy).toHaveBeenCalledTimes(1);
      expect(savedRounds.value.find((r) => r.id === "b")?.description).toBe(
        "new"
      );
      expect(detailRound.value?.description).toBe("new");
      expect(lastSaved.value?.description).toBe("new");
    });

    it("handleDetailsShare: returns url and syncs list/detail/lastSaved", async () => {
      const round = makeRound({ id: "b" });

      const savedRounds = makeStateHarness<SavedRound[]>([round]);
      const detailRound = makeStateHarness<SavedRound | null>(round);
      const lastSaved = makeStateHarness<SavedRound | null>(round);

      const getRoundById = createGetRoundById(() => savedRounds.value);

      (
        globalThis.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: true,
        json: async () => ({ sharedUrl: "https://example.com/shared/xyz" }),
      });

      const handlers = roundClient.createRoundHandlers({
        getAverageAge: () => 33,
        getRoundById,
        setSavedRounds: savedRounds.setState,
        setRoundToDetail: detailRound.setState,
        setLastSavedRound: lastSaved.setState,
      });

      const url = await handlers.handleDetailsShare(round);

      expect(url).toBe("https://example.com/shared/xyz");
      expect(savedRounds.value[0]?.sharedUrl).toBe(
        "https://example.com/shared/xyz"
      );
      expect(detailRound.value?.sharedUrl).toBe(
        "https://example.com/shared/xyz"
      );
      expect(lastSaved.value?.sharedUrl).toBe("https://example.com/shared/xyz");
    });

    it("handleDetailsShare: returns null on error", async () => {
      const round = makeRound({ id: "b" });

      const savedRounds = makeStateHarness<SavedRound[]>([round]);
      const detailRound = makeStateHarness<SavedRound | null>(round);

      const getRoundById = createGetRoundById(() => savedRounds.value);

      (
        globalThis.fetch as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "fail" }),
      });

      const handlers = roundClient.createRoundHandlers({
        getAverageAge: () => 33,
        getRoundById,
        setSavedRounds: savedRounds.setState,
        setRoundToDetail: detailRound.setState,
      });

      const url = await handlers.handleDetailsShare(round);
      expect(url).toBeNull();
    });
  });
});
