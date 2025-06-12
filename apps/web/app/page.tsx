"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Save } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useTeam } from "@/components/team-context"
import { indexedDB, type Lap, type SavedRound } from "@/lib/indexeddb"
import { calculateActivityTimes, formatActivityTime, LAP_ACTIVITIES, type ActivityTime } from "@/lib/lap-activities"

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
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [activities, setActivities] = useState<ActivityTime[]>([])
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

  const getCurrentRound = useCallback((): SavedRound => {
    const currentTeam = getCurrentTeam()
    return {
      id: Date.now().toString(),
      completedAt: new Date(),
      totalTime: time,
      laps: laps,
      teamId: selectedTeamId,
      teamName: currentTeam?.name || "Unknown Team"
    }
  }, [time, laps, selectedTeamId, getCurrentTeam])

  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const ms = Math.floor((milliseconds % 1000) / 10)
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }, [])

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

  const handleLap = () => {
    if (state === "running" && laps.length < 13) {
      const newLap: Lap = {
        lapNumber: laps.length + 1,
        time: time,
        timestamp: new Date()
      }
      setLaps([...laps, newLap])
      
      // Scroll to bottom of activities
      setTimeout(() => {
        if (activitiesRef.current) {
          activitiesRef.current.scrollTop = activitiesRef.current.scrollHeight
        }
      }, 100)
      
      // If this is the 12th lap, finish the round and show save dialog
      if (laps.length + 1 === 13) {
        setState("finished")
        setShowSaveDialog(true)
      }
    }
  }

  const handleRestart = () => {
    setTime(0)
    setLaps([])
    setActivities([])
    setState("stopped")
    setStartTime(null)
    setShowSaveDialog(false)
  }

  const handleSaveRound = async () => {
    const round = getCurrentRound()
    await saveRoundToStorage(round)
    setShowSaveDialog(false)
  }

  const handleDiscardRound = () => {
    setShowSaveDialog(false)
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
    <>
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                Save Round
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Round completed in {formatTime(time)}</p>
                <p>13 laps recorded</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveRound}
                  className="flex-1"
                  size="sm"
                >
                  Save
                </Button>
                <Button 
                  onClick={handleDiscardRound}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Timer Display */}
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-mono font-bold">
                {formatTime(time)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {state === "stopped" && "Ready to start"}
                {state === "running" && `Running - Lap ${laps.length + 1}/13`}
                {state === "finished" && "Round completed!"}
              </p>
            </CardHeader>
          </Card>

        {/* Activities Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Activities ({laps.length}/13 laps)</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={activitiesRef}
              className="space-y-2 h-64 overflow-y-auto"
            >
              {activities.length === 0 && state === "stopped" ? (
                <p className="text-center text-muted-foreground py-8">
                  No activities recorded yet
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
                          {formatActivityTime(activity.time)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatActivityTime(activity.startTime)} → {formatActivityTime(activity.endTime)}
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
                            {formatActivityTime(currentActivity.currentTime)}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Started at {formatActivityTime(currentActivity.startTime)}
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
        <div className="text-center">
          <Button
            onClick={handleButtonClick}
            size="lg"
            className="w-full text-lg py-6"
            variant={state === "finished" ? "secondary" : "default"}
          >
            {getButtonText()}
          </Button>
          
          {state === "running" && (
            <Button
              onClick={handleStop}
              variant="outline"
              className="w-full mt-2"
            >
              Stop
            </Button>
          )}
        </div>
        </div>
      </div>
    </>
  )
}
