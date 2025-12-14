import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTime } from "@/lib/lap-activities"
import { calculateTargetTimeMs } from "@/lib/scoring"
import type { RoundComparison } from "@/lib/lap-activities"
import type { Lap } from "@/lib/indexeddb"

type TimerState = "stopped" | "running" | "finished"

interface TimerDisplayProps {
  time: number
  state: TimerState
  laps: Lap[]
  comparison: RoundComparison | null
  teamAverageAge?: number
}

export function TimerDisplay({ time, state, laps, comparison, teamAverageAge }: TimerDisplayProps) {
  const getStatusText = () => {
    if (state === "stopped") return "Bereit zu starten"
    if (state === "running") return `Läuft - Runde ${laps.length + 1}/13`
    if (state === "finished") return "Durchgang abgeschlossen!"
    return ""
  }

  // Calculate target time and difference if team average age is available
  const getTargetTimeInfo = () => {
    if (!teamAverageAge || state !== "finished") return null

    const targetTime = calculateTargetTimeMs(teamAverageAge)!
    const currentTime = time
    const timeDiff = currentTime - targetTime

    return {
      targetTime,
      timeDiff,
      isFaster: timeDiff < 0
    }
  }

  const targetTimeInfo = getTargetTimeInfo()

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-mono font-bold">
          {formatTime(time, 'full')}
          {comparison && state === "finished" && comparison.totalTimeDiff !== null && comparison.isFasterOverall !== null && (
            <div className={`mt-2 text-lg font-medium ${comparison.isFasterOverall ? 'text-green-600' : 'text-red-600'}`}>
              {formatTime(comparison.totalTimeDiff, 'diff')}
            </div>
          )}
          {targetTimeInfo && (
            <div className="mt-2 text-sm text-muted-foreground">
              <div>Sollzeit: {formatTime(targetTimeInfo.targetTime, 'full')}</div>
              <div className={`font-medium ${targetTimeInfo.isFaster ? 'text-green-600' : 'text-red-600'}`}>
                {targetTimeInfo.isFaster ? '-' : '+'}{formatTime(Math.abs(targetTimeInfo.timeDiff), 'full')}
              </div>
            </div>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getStatusText()}
        </p>
      </CardHeader>
    </Card>
  )
}
