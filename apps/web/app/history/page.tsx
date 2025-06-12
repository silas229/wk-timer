"use client"

import { useState, useEffect, useCallback } from "react"
import { Trash2, Clock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@workspace/ui/components/accordion"
import { useTeam } from "@/components/team-context"
import { indexedDB, type SavedRound } from "@/lib/indexeddb"
import { calculateActivityTimes, formatTime } from "@/lib/lap-activities"

export default function HistoryPage() {
  const { teams, selectedTeamId, getCurrentTeam, isInitialized } = useTeam()
  const [savedRounds, setSavedRounds] = useState<SavedRound[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use unified time formatting functions
  const formatDurationChange = useCallback((milliseconds: number) => {
    return formatTime(milliseconds, 'diff')
  }, [])

  const formatDuration = useCallback((milliseconds: number) => {
    return formatTime(milliseconds, 'full')
  }, [])

  const formatTimeOfDay = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      timeStyle: 'short'
    }).format(date)
  }, [])

  const formatDayHeader = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'full'
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

  const getPreviousTeamComparison = (currentRound: SavedRound) => {
    // Find all rounds completed before this round (regardless of team)
    const previousRounds = savedRounds
      .filter(round => round.completedAt.getTime() < currentRound.completedAt.getTime())
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    
    const previousRound = previousRounds[0]
    
    if (!previousRound) {
      return null
    }

    const currentActivities = calculateActivityTimes(currentRound.laps)
    const previousActivities = calculateActivityTimes(previousRound.laps)
    
    // Compare total time
    const totalTimeDiff = currentRound.totalTime - previousRound.totalTime
    
    // Compare each activity
    const activityComparisons: { [activityName: string]: { 
      current: number; 
      previous: number; 
      diff: number; 
      isFaster: boolean 
    }} = {}
    
    currentActivities.forEach(currentActivity => {
      const previousActivity = previousActivities.find(p => p.name === currentActivity.name)
      if (previousActivity) {
        const diff = currentActivity.time - previousActivity.time
        activityComparisons[currentActivity.name] = {
          current: currentActivity.time,
          previous: previousActivity.time,
          diff,
          isFaster: diff < 0
        }
      }
    })
    
    return {
      previousRound,
      totalTimeDiff,
      isFasterOverall: totalTimeDiff < 0,
      activityComparisons
    }
  }

  // Filter rounds by selected team (only show current team's rounds)
  const filteredRounds = savedRounds.filter(round => round.teamId === selectedTeamId)

  // Group rounds by day
  const groupedRounds = useCallback(() => {
    const groups: { [key: string]: SavedRound[] } = {}
    
    filteredRounds.forEach(round => {
      const dateKey = round.completedAt.toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey]!.push(round)
    })
    
    // Sort each group by time (newest first)
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey]!.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
    })
    
    // Sort groups by date (newest first)
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
    
    return sortedGroups
  }, [filteredRounds])

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
            <div className="flex flex-col gap-4">            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Rundenverlauf</h2>
                <p className="text-muted-foreground">
                  {filteredRounds.length} gespeicherte {filteredRounds.length === 1 ? 'Runde' : 'Runden'}
                  {getCurrentTeam() && (
                    <span> für {getCurrentTeam()?.name}</span>
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
                  Alle löschen
                </Button>
              )}
            </div>
          </div>

        {/* Rounds List */}
        {filteredRounds.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {getCurrentTeam() ? `Keine Runden für ${getCurrentTeam()?.name}` : "Keine Gruppe ausgewählt"}
              </h3>
              <p className="text-muted-foreground">
                {getCurrentTeam() 
                  ? "Schließe eine Runde mit diesem Team ab, um sie hier zu sehen."
                  : "Wähle eine Gruppe aus der Navigation aus, um deren Runden zu sehen."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
            <Accordion 
            type="multiple" 
            defaultValue={(() => {
              const groups = groupedRounds()
              return groups.length > 0 && groups[0]?.[0] ? [groups[0][0]] : []
            })()}
            className="space-y-4"
            >
            {groupedRounds().map(([dateKey, roundsForDay]) => (
              <AccordionItem key={dateKey} value={dateKey} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="text-left">
                  <h3 className="text-lg font-semibold">
                    {formatDayHeader(new Date(dateKey))}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {roundsForDay.length} {roundsForDay.length === 1 ? 'Runde' : 'Runden'}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                {roundsForDay.map((round) => {
                  const previousComparison = getPreviousTeamComparison(round)
                  const activities = calculateActivityTimes(round.laps)
                  return (
                  <Card key={round.id}>
                    <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="w-full">
                      <div className="flex items-center gap-3 mb-1">
                        <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getTeamColor(round.teamId) }}
                        />
                        <CardTitle className="text-lg">
                        <span className="font-mono">{formatDuration(round.totalTime)}</span>
                        {previousComparison && (<span className={`ml-2 font-medium text-xs  p-1 align-middle border rounded ${previousComparison.isFasterOverall ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>{formatDurationChange(previousComparison.totalTimeDiff)}</span>)}
                        <span> ({formatTimeOfDay(round.completedAt)} Uhr)</span>
                        </CardTitle>
                      </div>
                      </div>
                      <Button
                      onClick={() => deleteRound(round.id)}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Runde löschen</span>
                      </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {activities.map((activity, index) => {
                      const activityComparison = previousComparison?.activityComparisons[activity.name]
                      return (
                        <div
                        key={`${activity.name}-${index}`}
                        className={"flex justify-between items-center p-2 rounded text-sm bg-muted/50"}>
                        <span className="font-medium">{activity.name}</span>
                        <div className="text-right">
                          <span className="font-mono">
                            {formatTime(activity.time, 'seconds')}
                          </span>
                          {activityComparison && (
                            <div className={`text-xs ${activityComparison.isFaster ? 'text-green-600' : 'text-red-600'}`}>
                              {formatDurationChange(activityComparison.diff)}
                            </div>
                          )}
                        </div>
                        </div>
                      )
                      })}
                    </div>
                    </CardContent>
                  </Card>
                  )
                })}
                </div>
              </AccordionContent>
              </AccordionItem>
            ))}
            </Accordion>
        )}
        </>
        )}
      </div>
    </div>
  )
}
