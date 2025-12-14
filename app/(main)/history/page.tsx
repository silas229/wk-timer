"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTeam } from "@/components/team-context";
import { indexedDB, type SavedRound } from "@/lib/indexeddb";
import {
  createRoundHandlers,
  getAllSavedRoundsFromStorage,
} from "@/lib/round-client";
import { LoadingState } from "@/components/history/loading-state";
import { RoundStatsHeader } from "@/components/history/round-stats-header";
import { EmptyState } from "@/components/history/empty-state";
import { RoundsList } from "@/components/history/rounds-list";
import { RoundDetailsDialog } from "@/components/round-details-dialog";

export default function HistoryPage() {
  const { teams, selectedTeamId, getCurrentTeam, isInitialized } = useTeam();
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [roundToDetail, setRoundToDetail] = useState<SavedRound | null>(null);

  const getAverageAge = useCallback(() => getCurrentTeam()?.averageAge, [getCurrentTeam]);

  const { handleUpdateRound, handleDetailsShare } = useMemo(() => {
    return createRoundHandlers({
      getAverageAge,
      getRoundById: (roundId: string) => savedRounds.find(r => r.id === roundId),
      setSavedRounds,
      setRoundToDetail,
    });
  }, [getAverageAge, savedRounds]);

  const loadSavedRounds = useCallback(async () => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);
      const rounds = await getAllSavedRoundsFromStorage();
      setSavedRounds(rounds);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Load rounds when initialized
  useEffect(() => {
    if (isInitialized) {
      loadSavedRounds();
    }
  }, [isInitialized, loadSavedRounds]);

  // Reload rounds when teams change (e.g., when a team is deleted)
  useEffect(() => {
    if (isInitialized && teams.length > 0) {
      loadSavedRounds();
    }
  }, [teams.length, isInitialized, loadSavedRounds]); // Use teams.length instead of teams array

  const deleteRound = useCallback(async (roundId: string) => {
    try {
      await indexedDB.deleteRound(roundId);
      const updatedRounds = savedRounds.filter((round: SavedRound) => round.id !== roundId);
      setSavedRounds(updatedRounds);
    } catch (error) {
      console.error('Failed to delete round:', error);
    }
  }, [savedRounds]);

  const clearAllRounds = useCallback(async () => {
    try {
      await indexedDB.clearAllRounds();
      setSavedRounds([]);
    } catch (error) {
      console.error('Failed to clear rounds:', error);
    }
  }, []);

  const handleOpenDetails = (round: SavedRound) => {
    setRoundToDetail(round);
    setDetailsDialogOpen(true);
  };

  // Filter rounds by selected team (only show current team's rounds)
  const filteredRounds = savedRounds.filter(round => round.teamId === selectedTeamId);

  return (
    <div className="flex items-start justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Loading state */}
        {(!isInitialized || isLoading) && (
          <LoadingState isInitialized={isInitialized} />
        )}

        {/* Main content - only show when initialized and not loading */}
        {isInitialized && !isLoading && (
          <>
            <RoundStatsHeader
              filteredRounds={filteredRounds}
              currentTeam={getCurrentTeam() || null}
              savedRoundsCount={savedRounds.length}
              onClearAllRounds={clearAllRounds}
            />

            {/* Rounds List */}
            {filteredRounds.length === 0 ? (
              <EmptyState currentTeam={getCurrentTeam() || null} />
            ) : (
              <RoundsList
                filteredRounds={filteredRounds}
                savedRounds={savedRounds}
                teams={teams}
                onDeleteRound={deleteRound}
                onOpenDetails={handleOpenDetails}
              />
            )}
          </>
        )}

        {/* Round Details Dialog */}
        {roundToDetail && (
          <RoundDetailsDialog
            open={detailsDialogOpen}
            onOpenChange={setDetailsDialogOpen}
            round={roundToDetail}
            onUpdateRound={handleUpdateRound}
            onShareRound={handleDetailsShare}
          />
        )}
      </div>
    </div>
  );
}
