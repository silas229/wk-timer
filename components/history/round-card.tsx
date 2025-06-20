import { Trash2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateActivityTimes, formatTime, type RoundComparison } from "@/lib/lap-activities"
import { ActivityList } from "./activity-list"
import type { SavedRound } from "@/lib/indexeddb"

interface Team {
  id: string
  name: string
  color: string
  createdAt: Date
}

interface RoundCardProps {
  round: SavedRound
  comparison: RoundComparison | null
  teams: Team[]
  onDeleteRound: (roundId: string) => void
  onShareRound?: (round: SavedRound) => void
}

export function RoundCard({
  round,
  comparison,
  teams,
  onDeleteRound,
  onShareRound
}: RoundCardProps) {
  const activities = calculateActivityTimes(round.laps)

  const handleShareRound = () => {
    if (onShareRound) {
      onShareRound(round)
    }
  }

  const getTeamColor = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    return team?.color || "#6b7280"
  }

  const formatTimeOfDay = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      timeStyle: 'short'
    }).format(date)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getTeamColor(round.teamId) }}
              />
              <CardTitle className="text-lg">
                <span className="font-mono">{formatTime(round.totalTime, 'full')}</span>
                {comparison && comparison.totalTimeDiff !== null && comparison.isFasterOverall !== null && (
                  <span className={`ml-2 font-medium text-xs p-1 align-middle border rounded ${comparison.isFasterOverall ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                    {formatTime(comparison.totalTimeDiff, 'diff')}
                  </span>
                )}
                <span> ({formatTimeOfDay(round.completedAt)} Uhr)</span>
              </CardTitle>
            </div>
            {round.sharedUrl && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Share2 className="h-3 w-3" />
                <span>Geteilt</span>
              </div>
            )}
          </div>          <div className="flex gap-2">
            <Button
              onClick={() => onDeleteRound(round.id)}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Runde löschen</span>
            </Button>

            {/* Share Button - always show if onShareRound is provided */}
            {onShareRound && (
              <Button
                onClick={handleShareRound}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                title={round.sharedUrl ? "Geteilten Link anzeigen" : "Runde teilen"}
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">{round.sharedUrl ? "Geteilten Link anzeigen" : "Runde teilen"}</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {round.description && (
          <div className="mb-3 p-2 bg-muted rounded text-sm">
            <strong>Beschreibung:</strong> {round.description}
          </div>
        )}
        <ActivityList
          activities={activities}
          comparison={comparison}
        />
      </CardContent>
    </Card>
  )
}
