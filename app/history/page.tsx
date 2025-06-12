"use client"

import { useState, useEffect, useCallback } from "react"
import { useTeam } from "@/components/team-context"
import { indexedDB, type SavedRound } from "@/lib/indexeddb"
import { LoadingState } from "@/components/history/loading-state"
import { RoundStatsHeader } from "@/components/history/round-stats-header"
import { EmptyState } from "@/components/history/empty-state"
import { RoundsList } from "@/components/history/rounds-list"

export default function HistoryPage() {
  const { teams, selectedTeamId, getCurrentTeam, isInitialized } = useTeam()
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadSavedRounds = useCallback(async () => {
    if (!isInitialized) return

    try {
      setIsLoading(true)
      const rounds = await indexedDB.getAllRounds()
      setSavedRounds(rounds)
    } catch (error) {
      console.error('Failed to load saved rounds:', error)
      setSavedRounds([])
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  // Load rounds when initialized
  useEffect(() => {
    if (isInitialized) {
      loadSavedRounds()
    }
  }, [isInitialized, loadSavedRounds])

  // Reload rounds when teams change (e.g., when a team is deleted)
  useEffect(() => {
    if (isInitialized && teams.length > 0) {
      loadSavedRounds()
    }
  }, [teams.length, isInitialized, loadSavedRounds]) // Use teams.length instead of teams array

  const deleteRound = useCallback(async (roundId: string) => {
    try {
      await indexedDB.deleteRound(roundId)
      const updatedRounds = savedRounds.filter((round: SavedRound) => round.id !== roundId)
      setSavedRounds(updatedRounds)
    } catch (error) {
      console.error('Failed to delete round:', error)
    }
  }, [savedRounds])

  const clearAllRounds = useCallback(async () => {
    try {
      await indexedDB.clearAllRounds()
      setSavedRounds([])
    } catch (error) {
      console.error('Failed to clear rounds:', error)
    }
  }, [])

  // Filter rounds by selected team (only show current team's rounds)
  const filteredRounds = savedRounds.filter(round => round.teamId === selectedTeamId)



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
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
