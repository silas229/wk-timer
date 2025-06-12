"use client"

import { useState, useEffect, useCallback } from "react"
import { Trash2, Clock, Filter } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useTeam } from "@/components/team-context"
import { indexedDB, type Lap, type SavedRound } from "@/lib/indexeddb"

export default function HistoryPage() {
  const { teams, isInitialized } = useTeam()
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  const formatTime = useCallback((milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const ms = Math.floor((milliseconds % 1000) / 10)
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }, [])

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }, [])

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
  }, [isInitialized]) // Remove loadSavedRounds from dependencies

  // Reload rounds when teams change (e.g., when a team is deleted)
  useEffect(() => {
    if (isInitialized && teams.length > 0) {
      loadSavedRounds()
    }
  }, [teams.length, isInitialized]) // Use teams.length instead of teams array

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

  const getLastLapTime = (currentLap: Lap, previousLap?: Lap) => {
    if (!previousLap) return currentLap.time
    return currentLap.time - previousLap.time
  }

  const getFastestLap = (laps: Lap[]) => {
    if (laps.length === 0) return null
    
    const firstLap = laps[0]
    if (!firstLap) return null
    
    let fastest = firstLap
    let fastestTime = getLastLapTime(firstLap)

    for (let i = 1; i < laps.length; i++) {
      const currentLap = laps[i]
      const previousLap = laps[i - 1]
      if (!currentLap || !previousLap) continue
      
      const lapTime = getLastLapTime(currentLap, previousLap)
      if (lapTime < fastestTime) {
        fastest = currentLap
        fastestTime = lapTime
      }
    }

    return { lap: fastest, time: fastestTime }
  }

  // Filter rounds by selected team
  const filteredRounds = selectedTeamId === "all" 
    ? savedRounds 
    : savedRounds.filter(round => round.teamId === selectedTeamId)

  const getTeamColor = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    return team?.color || "#6b7280"
  }

  useEffect(() => {
    if (isInitialized) {
      loadSavedRounds()
    }
  }, [isInitialized]) // Remove loadSavedRounds from dependencies

  // Reload rounds when teams change (e.g., when a team is deleted)
  useEffect(() => {
    if (isInitialized && teams.length > 0) {
      loadSavedRounds()
    }
  }, [teams.length, isInitialized]) // Use teams.length instead of teams array

  return (
    <div className="flex items-start justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Loading state */}
        {(!isInitialized || isLoading) && (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  {!isInitialized ? 'Initializing database...' : 'Loading rounds...'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main content - only show when initialized and not loading */}
        {isInitialized && !isLoading && (
          <>
            {/* Header with Team Filter */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Round History</h1>
                  <p className="text-muted-foreground">
                    {filteredRounds.length} saved {filteredRounds.length === 1 ? 'round' : 'rounds'}
                {selectedTeamId !== "all" && (
                  <span> for {teams.find(t => t.id === selectedTeamId)?.name}</span>
                )}
              </p>
            </div>
            {savedRounds.length > 0 && (
              <Button
                onClick={clearAllRounds}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {/* Team Filter */}
          {teams.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter by Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setSelectedTeamId("all")}
                    variant={selectedTeamId === "all" ? "default" : "secondary"}
                    size="sm"
                  >
                    All Teams ({savedRounds.length})
                  </Button>
                  {teams.map((team) => {
                    const teamRounds = savedRounds.filter(round => round.teamId === team.id)
                    return (
                      <Button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        variant={selectedTeamId === team.id ? "default" : "secondary"}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name} ({teamRounds.length})
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rounds List */}
        {filteredRounds.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {selectedTeamId === "all" ? "No rounds saved yet" : "No rounds for this team"}
              </h3>
              <p className="text-muted-foreground">
                {selectedTeamId === "all" 
                  ? "Complete a 13-lap round on the timer page to see your history here."
                  : "Complete a round with this team selected to see it here."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRounds.map((round) => {
              const fastestLap = getFastestLap(round.laps)
              return (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getTeamColor(round.teamId) }}
                          />
                          <CardTitle className="text-lg">{round.teamName}</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(round.completedAt)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Total: {formatTime(round.totalTime)}</span>
                          {fastestLap && fastestLap.lap && (
                            <span>
                              Fastest: {formatTime(fastestLap.time)} (Lap {fastestLap.lap.lapNumber})
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteRound(round.id)}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete round</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {round.laps.map((lap, index) => {
                        const lapTime = getLastLapTime(lap, round.laps[index - 1])
                        const isFastest = fastestLap && fastestLap.lap && lap.lapNumber === fastestLap.lap.lapNumber
                        return (
                          <div
                            key={lap.lapNumber}
                            className={`flex justify-between items-center p-2 rounded text-sm ${
                              isFastest 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'bg-muted/50'
                            }`}
                          >
                            <span className="font-medium">
                              Lap {lap.lapNumber}
                              {isFastest && <span className="text-primary ml-1">⚡</span>}
                            </span>
                            <span className="font-mono">
                              {formatTime(lapTime)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}
