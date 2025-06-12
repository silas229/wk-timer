"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTeam } from "@/components/team-context"
import { indexedDB, type Lap, type SavedRound } from "@/lib/indexeddb"
import { calculateActivityTimes, formatTime, LAP_ACTIVITIES, compareRounds, type ActivityTime } from "@/lib/lap-activities"
import { PWAInstallPrompt } from "@/components/pwa-install"
import { Trash2 } from "lucide-react"

type TimerState = "stopped" | "running" | "finished"

// Button labels for each lap based on the German competition format
const BUTTON_LABELS = [
  "Start Läufer 2",
  "Start Läufer 3",
  "Start Schlauchrollen",
  "Ende Schlauchrollen",
  "Start Läufer 4",
  "Start Läufer 5",
  "Ende Anziehen",
  "Start Läufer 6",
  "Start Läufer 7",
  "Start Läufer 8",
  "Ende Kuppeln",
  "Start Läufer 9",
]

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
  const activitiesRef = useRef<HTMLDivElement>(null)

  // Calculate activities whenever laps change
  useEffect(() => {
    const calculatedActivities = calculateActivityTimes(laps)
    setActivities(calculatedActivities)
  }, [laps])

  // Load saved rounds for comparison
  const loadSavedRounds = useCallback(async () => {
    if (!isInitialized) return

    try {
      const rounds = await indexedDB.getAllRounds()
      setSavedRounds(rounds)
    } catch (error) {
      console.error('Failed to load saved rounds:', error)
      setSavedRounds([])
    }
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

  // Get current activity being performed
  const getCurrentActivity = useCallback(() => {
    if (state !== "running" || laps.length >= 13) return null

    // Find the last completed lap time
    const lastLap = laps.length > 0 ? laps[laps.length - 1] : null
    const lastLapTime = lastLap ? lastLap.time : 0

    // Find current activity based on the next lap to be recorded
    const nextLapIndex = laps.length + 1
    const currentActivity = LAP_ACTIVITIES.find(activity => activity.endIndex === nextLapIndex)

    if (currentActivity) {
      return {
        name: currentActivity.name,
        startTime: lastLapTime,
        currentTime: time - lastLapTime,
        totalTime: time
      }
    }

    return null
  }, [state, laps, time])

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
          id: Date.now().toString(),
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

  const getButtonText = () => {
    if (state === "stopped") return "Start"
    if (state === "running") {
      if (laps.length === 0) return BUTTON_LABELS[0] // "Start Läufer 1"
      if (laps.length < BUTTON_LABELS.length) return BUTTON_LABELS[laps.length]
      return "Ende"
    }
    if (state === "finished") return "Neustart"
    return "Start"
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
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-mono font-bold">
              {formatTime(time, 'full')}
              {(() => {
                const comparison = getCurrentRoundComparison()
                return comparison && state === "finished" && comparison.totalTimeDiff !== null ? (
                  <div className={`mt-2 text-lg font-medium ${comparison.isFasterOverall ? 'text-green-600' : 'text-red-600'}`}>
                    {formatTime(comparison.totalTimeDiff, 'diff')}
                  </div>
                ) : null
              })()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {state === "stopped" && "Bereit zu starten"}
              {state === "running" && `Läuft - Runde ${laps.length + 1}/13`}
              {state === "finished" && "Durchgang abgeschlossen!"}
            </p>
          </CardHeader>
        </Card>

        {/* Activities Display */}
        <Card>
          <CardContent>
            <div
              ref={activitiesRef}
              className="space-y-2 h-64 overflow-y-auto"
            >
              {activities.length === 0 && state === "stopped" ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Runden aufgezeichnet
                </p>
              ) : (
                <>
                  {(() => {
                    const comparison = getCurrentRoundComparison()
                    return activities.map((activity, index) => {
                      const activityComparison = comparison?.activityComparisons[activity.name]
                      return (
                        <div
                          key={`${activity.name}-${index}`}
                          className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                        >
                          <span className="font-medium">{activity.name}</span>
                          <div className="text-right">
                            <div className="font-mono text-sm">
                              {formatTime(activity.time, 'seconds')}
                              {activityComparison && (
                                <span className={`ml-2 ${activityComparison.isFaster ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatTime(activityComparison.diff, 'diff')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(activity.startTime)}&nbsp;→&nbsp;{formatTime(activity.endTime)}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}

                  {/* Current Activity */}
                  {(() => {
                    const currentActivity = getCurrentActivity()
                    return currentActivity ? (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-blue-100 border-2 border-blue-300 dark:bg-blue-900 dark:border-blue-700">
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          {currentActivity.name} (aktuell)
                        </span>
                        <div className="text-right">
                          <div className="font-mono text-sm text-blue-800 dark:text-blue-200">
                            {formatTime(currentActivity.currentTime, 'seconds')}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Gestartet um {formatTime(currentActivity.startTime)}
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Control Button */}
        <div className="text-center space-y-3">
          <Button
            onClick={handleButtonClick}
            size="xl"
            className="w-full text-lg py-6"
          >
            {getButtonText()}
          </Button>

          {state === "finished" && lastSavedRound && (
            <Button
              onClick={handleDiscardRound}
              variant="destructive"
              className="w-full"
            >
              <Trash2 />
              Runde verwerfen
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
