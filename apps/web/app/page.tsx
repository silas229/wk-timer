"use client"

import { useState, useEffect, useCallback } from "react"
import { Save } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useTeam } from "@/components/team-context"
import { indexedDB, type Lap, type SavedRound } from "@/lib/indexeddb"

type TimerState = "stopped" | "running" | "finished"

export default function Page() {
  const { selectedTeamId, getCurrentTeam, isInitialized } = useTeam()
  const [time, setTime] = useState(0)
  const [state, setState] = useState<TimerState>("stopped")
  const [laps, setLaps] = useState<Lap[]>([])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

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
    setState("stopped")
    setStartTime(null)
    setShowSaveDialog(false)
  }

  const handleSaveRound = async () => {
    const round = getCurrentRound()
    await saveRoundToStorage(round)
    setShowSaveDialog(false)
    handleRestart()
  }

  const handleDiscardRound = () => {
    setShowSaveDialog(false)
    handleRestart()
  }

  const getButtonText = () => {
    if (state === "stopped") return "Start"
    if (state === "running") {
      if (laps.length === 0) return "Lap"
      if (laps.length < 13) return `Lap ${laps.length + 1}`
      return "Stop"
    }
    if (state === "finished") return "Restart"
    return "Start"
  }

  const handleButtonClick = () => {
    if (state === "stopped") handleStart()
    else if (state === "running") {
      if (laps.length < 13) handleLap()
      else handleStop()
    }
    else if (state === "finished") handleRestart()
  }

  const getLastLapTime = (currentLap: Lap, previousLap?: Lap) => {
    if (!previousLap) return currentLap.time
    return currentLap.time - previousLap.time
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

        {/* Laps Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Laps ({laps.length}/13)</CardTitle>
          </CardHeader>
          <CardContent>
            {laps.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No laps recorded yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {laps.map((lap, index) => {
                  const lapTime = getLastLapTime(lap, laps[index - 1])
                  return (
                    <div
                      key={lap.lapNumber}
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">Lap {lap.lapNumber}</span>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {formatTime(lapTime)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total: {formatTime(lap.time)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
