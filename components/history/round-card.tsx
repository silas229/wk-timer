import { Trash2, Share2, BadgeInfo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateActivityTimes, formatTime, type RoundComparison } from "@/lib/lap-activities"
import { ActivityList } from "./activity-list"
import { calculateTotalScore, formatPoints, calculateTargetTimeMs } from "@/lib/scoring"
import type { SavedRound } from "@/lib/indexeddb"

interface Team {
  id: string
  name: string
  color: string
  createdAt: Date
  averageAge?: number
}

interface RoundCardProps {
  round: SavedRound
  comparison: RoundComparison | null
  teams: Team[]
  onDeleteRound: (roundId: string) => void
  onOpenDetails?: (round: SavedRound) => void
}

export function RoundCard({
  round,
  comparison,
  teams,
  onDeleteRound,
  onOpenDetails
}: Readonly<RoundCardProps>) {
  const activities = calculateActivityTimes(round.laps)

  const handleOpenDetails = () => {
    if (onOpenDetails) {
      onOpenDetails(round)
    }
  }

  const getTeamColor = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    return team?.color || "#6b7280"
  }

  const getTeam = (teamId: string) => {
    return teams.find(t => t.id === teamId)
  }

  const formatTimeOfDay = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      timeStyle: 'short'
    }).format(date)
  }

  // Calculate target time for B-Teil if team average age is available
  const team = getTeam(round.teamId)
  const targetTime = calculateTargetTimeMs(team?.averageAge)

  // Calculate scoring if possible
  const canCalculateScore = team?.averageAge !== undefined &&
    round.aPartErrorPoints !== undefined &&
    round.knotTime !== undefined &&
    round.aPartPenaltySeconds !== undefined &&
    round.overallImpression !== undefined &&
    round.bPartErrorPoints !== undefined

  let scoringResult = null
  if (canCalculateScore) {
    const scoringParams = {
      teamAverageAge: team.averageAge!,
      aPartErrorPoints: round.aPartErrorPoints!,
      knotTime: round.knotTime!,
      aPartPenaltySeconds: round.aPartPenaltySeconds!,
      overallImpression: round.overallImpression!,
      bPartTime: round.totalTime,
      bPartErrorPoints: round.bPartErrorPoints!,
    }
    scoringResult = calculateTotalScore(scoringParams)
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
            {/* Details Button */}
            {onOpenDetails && (
              <Button
                onClick={handleOpenDetails}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
                title="Details und Punkteberechnung"
              >
                <BadgeInfo className="h-4 w-4" />
                <span className="sr-only">Details und Punkteberechnung</span>
              </Button>
            )}

            <Button
              onClick={() => onDeleteRound(round.id)}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Runde löschen</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Target time and scoring info */}
        {(targetTime !== null || scoringResult) && (
          <div className="mb-3 space-y-2">
            {targetTime !== null && (
              <div className="flex text-sm gap-2">
                <span className="text-muted-foreground">Sollzeit B-Teil:</span>
                <span className="font-mono">
                  {formatTime(targetTime)}
                </span>
                {!!(round.totalTime) && (
                  <span className={`font-mono ${round.totalTime <= targetTime ? 'text-green-600' : 'text-red-600'}`}>
                    ({formatTime((round.totalTime - targetTime), 'diff-seconds')}s)
                  </span>
                )}
              </div>
            )}

            {scoringResult && scoringResult.canCalculate && (
              <div className="flex justify-between items-center text-sm p-2 bg-green-50 border border-green-200 rounded">
                <span className="font-medium text-green-800">Gesamtpunkte:</span>
                <span className="font-mono font-bold text-lg text-green-700">
                  {formatPoints(scoringResult.totalPoints)}
                </span>
              </div>
            )}
          </div>
        )}

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
