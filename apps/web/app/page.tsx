"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useTeam } from "@/components/team-context"
import { indexedDB, type Lap, type SavedRound } from "@/lib/indexeddb"
import { calculateActivityTimes, formatTime, LAP_ACTIVITIES, type ActivityTime } from "@/lib/lap-activities"

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
  "Ende",
]

export default function Page() {
  const { selectedTeamId, getCurrentTeam, isInitialized } = useTeam()
  const [time, setTime] = useState(0)
  const [state, setState] = useState<TimerState>("stopped")
  const [laps, setLaps] = useState<Lap[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [activities, setActivities] = useState<ActivityTime[]>([])
  const [lastSavedRound, setLastSavedRound] = useState<SavedRound | null>(null)
  const activitiesRef = useRef<HTMLDivElement>(null)

  // Calculate activities whenever laps change
  useEffect(() => {
    const calculatedActivities = calculateActivityTimes(laps)
    setActivities(calculatedActivities)
  }, [laps])

  // IndexedDB functions
  const saveRoundToStorage = useCallback(async (round: SavedRound) => {
    if (!isInitialized) {
      console.warn('Database not initialized, cannot save round')
      return
    }
    
    try {
      await indexedDB.saveRound(round)
    } catch (error) {
      console.error('Failed to save round to IndexedDB:', error)
    }
  }, [isInitialized])

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

  const handleRestart = () => {
    setTime(0)
    setLaps([])
    setActivities([])
    setState("stopped")
    setStartTime(null)
    setLastSavedRound(null)
  }

  const handleDiscardRound = async () => {
    if (lastSavedRound) {
      try {
        await indexedDB.deleteRound(lastSavedRound.id)
        setLastSavedRound(null)
        handleRestart()
      } catch (error) {
        console.error('Failed to discard round:', error)
      }
    }
  }

  const getButtonText = () => {
    if (state === "stopped") return "Start"
    if (state === "running") {
      if (laps.length === 0) return BUTTON_LABELS[0] // "Start Läufer 1"
      if (laps.length < 13) return BUTTON_LABELS[laps.length]
      return "Stop"
    }
    if (state === "finished") return "Restart"
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
        {/* Timer Display */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-mono font-bold">
              {formatTime(time, 'full')}
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
          <CardHeader>
            <CardTitle className="text-xl">Aktivitäten ({laps.length}/13 Runden)</CardTitle>
          </CardHeader>
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
                  {activities.map((activity, index) => (
                    <div
                      key={`${activity.name}-${index}`}
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{activity.name}</span>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {formatTime(activity.time, 'seconds')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(activity.startTime)} → {formatTime(activity.endTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Current Activity */}
                  {(() => {
                    const currentActivity = getCurrentActivity()
                    return currentActivity ? (
                      <div className="flex justify-between items-center p-3 rounded-lg bg-blue-100 border-2 border-blue-300 dark:bg-blue-900 dark:border-blue-700">
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          {currentActivity.name} (current)
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
            size="lg"
            className="w-full text-lg py-6"
          >
            {getButtonText()}
          </Button>
          
          {state === "finished" && lastSavedRound && (
            <Button
              onClick={handleDiscardRound}
              variant="destructive"
              className="w-full"
              size="sm"
            >
              Runde verwerfen
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
