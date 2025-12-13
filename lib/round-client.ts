"use client";

import { indexedDB, type SavedRound } from "@/lib/indexeddb";

type ShareRoundApiResponse = {
  sharedUrl: string;
};

export async function updateRoundInStorage(
  existingRound: SavedRound,
  updatedData: Partial<SavedRound>
): Promise<SavedRound> {
  const updatedRound: SavedRound = { ...existingRound, ...updatedData };
  await indexedDB.saveRound(updatedRound);
  return updatedRound;
}

export async function shareRoundAndPersist(
  round: SavedRound,
  teamAverageAge?: number
): Promise<{ sharedUrl: string; updatedRound: SavedRound }> {
  const response = await fetch("/api/share-round", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roundData: {
        id: round.id,
        completedAt: round.completedAt.toISOString(),
        totalTime: round.totalTime,
        laps: round.laps.map((lap) => ({
          lapNumber: lap.lapNumber,
          time: lap.time,
          timestamp: lap.timestamp.toISOString(),
        })),
        teamName: round.teamName,
        description: round.description?.trim() || undefined,
        // Include scoring data
        aPartErrorPoints: round.aPartErrorPoints,
        knotTime: round.knotTime,
        aPartPenaltySeconds: round.aPartPenaltySeconds,
        bPartErrorPoints: round.bPartErrorPoints,
        overallImpression: round.overallImpression,
        teamAverageAge,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to share round");
  }

  const result = (await response.json()) as ShareRoundApiResponse;

  if (!result?.sharedUrl) {
    throw new Error("Failed to share round");
  }

  const updatedRound: SavedRound = {
    ...round,
    sharedUrl: result.sharedUrl,
  };

  await indexedDB.saveRound(updatedRound);

  return { sharedUrl: result.sharedUrl, updatedRound };
}

export async function getAllSavedRoundsFromStorage(): Promise<SavedRound[]> {
  try {
    return await indexedDB.getAllRounds();
  } catch (error) {
    console.error("Failed to load saved rounds:", error);
    return [];
  }
}

export function replaceRoundInList(
  rounds: SavedRound[],
  updatedRound: SavedRound
): SavedRound[] {
  return rounds.map((r) => (r.id === updatedRound.id ? updatedRound : r));
}

export function updateDetailRoundIfMatching(
  currentDetailRound: SavedRound | null,
  updatedRound: SavedRound
): SavedRound | null {
  return currentDetailRound?.id === updatedRound.id
    ? updatedRound
    : currentDetailRound;
}

type SetState<T> = (value: T | ((prev: T) => T)) => void;

function updateLastSavedRoundIfMatching(
  currentLastSavedRound: SavedRound | null,
  updatedRound: SavedRound
): SavedRound | null {
  return currentLastSavedRound?.id === updatedRound.id
    ? updatedRound
    : currentLastSavedRound;
}

export function createRoundHandlers(params: {
  getAverageAge: () => number | undefined;
  getRoundById: (roundId: string) => SavedRound | undefined;
  setSavedRounds: SetState<SavedRound[]>;
  setRoundToDetail: SetState<SavedRound | null>;
  setLastSavedRound?: SetState<SavedRound | null>;
}): {
  handleUpdateRound: (
    roundId: string,
    updatedData: Partial<SavedRound>
  ) => Promise<void>;
  handleDetailsShare: (round: SavedRound) => Promise<string | null>;
} {
  const {
    getAverageAge,
    getRoundById,
    setSavedRounds,
    setRoundToDetail,
    setLastSavedRound,
  } = params;

  const handleUpdateRound = async (
    roundId: string,
    updatedData: Partial<SavedRound>
  ): Promise<void> => {
    try {
      const existingRound = getRoundById(roundId);
      if (!existingRound) return;

      const updatedRound = await updateRoundInStorage(existingRound, updatedData);

      setSavedRounds((prevRounds) => replaceRoundInList(prevRounds, updatedRound));

      if (setLastSavedRound) {
        setLastSavedRound((prev) => updateLastSavedRoundIfMatching(prev, updatedRound));
      }

      setRoundToDetail((prev) => updateDetailRoundIfMatching(prev, updatedRound));
    } catch (error) {
      console.error("Error updating round:", error);
      throw error;
    }
  };

  const handleDetailsShare = async (round: SavedRound): Promise<string | null> => {
    try {
      const { sharedUrl, updatedRound } = await shareRoundAndPersist(
        round,
        getAverageAge()
      );

      setSavedRounds((prevRounds) => replaceRoundInList(prevRounds, updatedRound));

      if (setLastSavedRound) {
        setLastSavedRound((prev) => updateLastSavedRoundIfMatching(prev, updatedRound));
      }

      setRoundToDetail((prev) => updateDetailRoundIfMatching(prev, updatedRound));

      return sharedUrl;
    } catch (error) {
      console.error("Error sharing round:", error);
      return null;
    }
  };

  return { handleUpdateRound, handleDetailsShare };
}
