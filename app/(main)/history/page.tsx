"use client"

import { useState, useEffect, useCallback } from "react"
import { useTeam } from "@/components/team-context"
import { indexedDB, type SavedRound } from "@/lib/indexeddb"
import { LoadingState } from "@/components/history/loading-state"
import { RoundStatsHeader } from "@/components/history/round-stats-header"
import { EmptyState } from "@/components/history/empty-state"
import { RoundsList } from "@/components/history/rounds-list"
import { RoundDetailsDialog } from "@/components/round-details-dialog"

export default function HistoryPage() {
  const { teams, selectedTeamId, getCurrentTeam, isInitialized } = useTeam()
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [roundToDetail, setRoundToDetail] = useState<SavedRound | null>(null)

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

  const handleOpenDetails = (round: SavedRound) => {
    setRoundToDetail(round)
    setDetailsDialogOpen(true)
  }

  const handleUpdateRound = async (roundId: string, updatedData: Partial<SavedRound>): Promise<void> => {
    try {
      const existingRound = savedRounds.find(r => r.id === roundId)
      if (!existingRound) return

      const updatedRound = { ...existingRound, ...updatedData }
      await indexedDB.saveRound(updatedRound)

      setSavedRounds(prevRounds =>
        prevRounds.map(r => r.id === roundId ? updatedRound : r)
      )

      // Update the detail dialog round if it's the same
      if (roundToDetail?.id === roundId) {
        setRoundToDetail(updatedRound)
      }
    } catch (error) {
      console.error('Error updating round:', error)
      throw error
    }
  }

  const handleDetailsShare = async (round: SavedRound): Promise<string | null> => {
    try {
      const response = await fetch('/api/share-round', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roundData: {
            id: round.id,
            completedAt: round.completedAt.toISOString(),
            totalTime: round.totalTime,
            laps: round.laps.map(lap => ({
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
            teamAverageAge: getCurrentTeam()?.averageAge,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to share round')
      }

      const result = await response.json()

      // Update the round with shared URL and description
      const updatedRound: SavedRound = {
        ...round,
        sharedUrl: result.sharedUrl,
      }

      // Save the updated round to local storage
      await indexedDB.saveRound(updatedRound)

      // Update the local state
      setSavedRounds(prevRounds =>
        prevRounds.map(r => r.id === updatedRound.id ? updatedRound : r)
      )

      // Update detail dialog
      if (roundToDetail?.id === round.id) {
        setRoundToDetail(updatedRound)
      }

      return result.sharedUrl
    } catch (error) {
      console.error('Error sharing round:', error)
      return null
    }
  }

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
  )
}
