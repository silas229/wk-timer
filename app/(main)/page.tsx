"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useTeam } from "@/components/team-context"
import { indexedDB, type Lap, type SavedRound } from "@/lib/indexeddb"
import { calculateActivityTimes, compareRounds, type ActivityTime } from "@/lib/lap-activities"
import { generateUUID } from "@/lib/uuid"
import {
  createRoundHandlers,
  getAllSavedRoundsFromStorage,
} from "@/lib/round-client"
import { PWAInstallPrompt } from "@/components/pwa-install"
import { TimerDisplay } from "@/components/timer/timer-display"
import { ActivitiesDisplay } from "@/components/timer/activities-display"
import { TimerControls } from "@/components/timer/timer-controls"
import { RoundDetailsDialog } from "@/components/round-details-dialog"

type TimerState = "stopped" | "running" | "finished"

export default function Page() {
  const { selectedTeamId, getCurrentTeam, isInitialized } = useTeam()
  const [time, setTime] = useState(0)
  const [state, setState] = useState<TimerState>("stopped")
  const [laps, setLaps] = useState<Lap[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [activities, setActivities] = useState<ActivityTime[]>([])
  const [lastSavedRound, setLastSavedRound] = useState<SavedRound | null>(null)
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([])
  const [previousRoundForComparison, setPreviousRoundForComparison] = useState<SavedRound | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [roundToDetail, setRoundToDetail] = useState<SavedRound | null>(null)
  const activitiesRef = useRef<HTMLDivElement>(null)

  const getAverageAge = useCallback(() => getCurrentTeam()?.averageAge, [getCurrentTeam])

  const { handleUpdateRound, handleDetailsShare } = useMemo(() => {
    return createRoundHandlers({
      getAverageAge,
      getRoundById: (roundId: string) => savedRounds.find(r => r.id === roundId),
      setSavedRounds,
      setRoundToDetail,
      setLastSavedRound,
    })
  }, [getAverageAge, savedRounds])

  // Calculate activities whenever laps change
  useEffect(() => {
    const calculatedActivities = calculateActivityTimes(laps)
    setActivities(calculatedActivities)
  }, [laps])

  // Load saved rounds for comparison
  const loadSavedRounds = useCallback(async () => {
    if (!isInitialized) return

    const rounds = await getAllSavedRoundsFromStorage()
    setSavedRounds(rounds)
  }, [isInitialized])

  // Load rounds when initialized
  useEffect(() => {
    if (isInitialized) {
      loadSavedRounds()
    }
  }, [isInitialized, loadSavedRounds])

  // Get last completed round for current team for comparison
  const getLastRoundForComparison = useCallback(() => {
    if (!selectedTeamId || savedRounds.length === 0) return null

    // Find the most recent completed round for the current team
    const teamRounds = savedRounds
      .filter(round => round.teamId === selectedTeamId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())

    return teamRounds[0] || null
  }, [selectedTeamId, savedRounds])

  // Get comparison data for current round vs last round
  const getCurrentRoundComparison = useCallback(() => {
    const lastRound = previousRoundForComparison
    if (!lastRound || activities.length === 0) return null

    // For running rounds, only calculate total time diff when finished
    const currentRoundData = {
      totalTime: time,
      laps: laps
    }

    const comparison = compareRounds(currentRoundData, lastRound)

    // Override total time diff to only show when finished
    if (comparison && state !== "finished") {
      return {
        ...comparison,
        totalTimeDiff: null,
        isFasterOverall: null
      }
    }

    return comparison
  }, [previousRoundForComparison, activities, laps, time, state])

  // IndexedDB functions
  const saveRoundToStorage = useCallback(async (round: SavedRound) => {
    if (!isInitialized) {
      console.warn('Database not initialized, cannot save round')
      return
    }

    try {
      await indexedDB.saveRound(round)
      // Reload saved rounds for comparison
      await loadSavedRounds()
    } catch (error) {
      console.error('Failed to save round to IndexedDB:', error)
    }
  }, [isInitialized, loadSavedRounds])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (state === "running") {
      interval = setInterval(() => {
        setTime(Date.now() - startTime!)
      }, 10)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state, startTime])

  const handleStart = () => {
    // Capture the current last round for comparison before starting the new round
    const lastRound = getLastRoundForComparison()
    setPreviousRoundForComparison(lastRound)

    setStartTime(Date.now() - time)
    setState("running")
  }

  const handleStop = () => {
    setState("stopped")
  }

  const handleLap = async () => {
    if (state === "running" && laps.length < 13) {
      const newLap: Lap = {
        lapNumber: laps.length + 1,
        time: time,
        timestamp: new Date()
      }
      const updatedLaps = [...laps, newLap]
      setLaps(updatedLaps)

      // Scroll to bottom of activities
      setTimeout(() => {
        if (activitiesRef.current) {
          activitiesRef.current.scrollTop = activitiesRef.current.scrollHeight
        }
      }, 100)

      // If this is the 13th lap, finish the round and automatically save it
      if (updatedLaps.length === 13) {
        setState("finished")

        // Auto-save the round
        const round: SavedRound = {
          id: generateUUID(),
          completedAt: new Date(),
          totalTime: time,
          laps: updatedLaps,
          teamId: selectedTeamId,
          teamName: getCurrentTeam()?.name || "Unbekannte Gruppe"
        }

        setLastSavedRound(round)
        await saveRoundToStorage(round)
      }
    }
  }

  const handleRestart = async () => {
    setTime(0)
    setLaps([])
    setActivities([])
    setState("stopped")
    setStartTime(null)
    setLastSavedRound(null)
    setPreviousRoundForComparison(null)
    // Reload saved rounds to get fresh comparison data
    await loadSavedRounds()
  }

  const handleDiscardRound = async () => {
    if (lastSavedRound) {
      try {
        await indexedDB.deleteRound(lastSavedRound.id)
        setLastSavedRound(null)
        await handleRestart()
      } catch (error) {
        console.error('Failed to discard round:', error)
      }
    }
  }

  const handleOpenDetails = (round: SavedRound) => {
    setRoundToDetail(round)
    setDetailsDialogOpen(true)
  }

  const handleButtonClick = () => {
    if (state === "stopped") {
      handleStart()
      // Scroll to bottom to show current activity
      setTimeout(() => {
        if (activitiesRef.current) {
          activitiesRef.current.scrollTop = activitiesRef.current.scrollHeight
        }
      }, 100)
    }
    else if (state === "running") {
      if (laps.length < 13) {
        handleLap()
        // Scrolling is already handled in handleLap
      }
      else handleStop()
    }
    else if (state === "finished") handleRestart()
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Timer Display */}
        <TimerDisplay
          time={time}
          state={state}
          laps={laps}
          comparison={getCurrentRoundComparison()}
          teamAverageAge={getCurrentTeam()?.averageAge}
        />

        {/* Activities Display */}
        <ActivitiesDisplay
          ref={activitiesRef}
          activities={activities}
          comparison={getCurrentRoundComparison()}
          state={state}
          time={time}
          laps={laps}
        />

        {/* Control Button */}
        <TimerControls
          state={state}
          laps={laps}
          lastSavedRound={lastSavedRound}
          onButtonClick={handleButtonClick}
          onDiscardRound={handleDiscardRound}
          onOpenDetails={handleOpenDetails}
        />

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
