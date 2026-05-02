"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/lap-activities";
import { calculateTargetTimeMs } from "@/lib/scoring";
import { ActivityChartDialog, TOTAL_TIME_KEY } from "@/components/history/activity-chart-dialog";
import type { RoundComparison } from "@/lib/lap-activities";
import type { Lap } from "@/lib/indexeddb";

type TimerState = "stopped" | "running" | "finished"

interface TimerDisplayProps {
  time: number
  state: TimerState
  laps: Lap[]
  comparison: RoundComparison | null
  teamAverageAge?: number
  teamId?: string
  roundId?: string
}

export function TimerDisplay({ time, state, laps, comparison, teamAverageAge, teamId, roundId }: Readonly<TimerDisplayProps>) {
  const [showTotalTimeChart, setShowTotalTimeChart] = useState(false);

  const getStatusText = () => {
    if (state === "stopped") return "Bereit zu starten";
    if (state === "running") return `Läuft - Runde ${laps.length + 1}/13`;
    if (state === "finished") return "Durchgang abgeschlossen!";
    return "";
  };

  // Calculate target time and difference if team average age is available
  const getTargetTimeInfo = () => {
    if (!teamAverageAge || state !== "finished") return null;

    const targetTime = calculateTargetTimeMs(teamAverageAge)!;
    const currentTime = time;
    const timeDiff = currentTime - targetTime;

    return {
      targetTime,
      timeDiff,
      isFaster: timeDiff < 0
    };
  };

  const targetTimeInfo = getTargetTimeInfo();
  const targetTimeMs = teamAverageAge ? calculateTargetTimeMs(teamAverageAge) : null;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-mono font-bold">
          <button
            type="button"
            onClick={() => teamId && state === "finished" && setShowTotalTimeChart(true)}
            className={teamId && state === "finished" ? "cursor-pointer hover:underline" : ""}
          >
            {formatTime(time, 'full')}
          </button>
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

      {teamId && (
        <ActivityChartDialog
          open={showTotalTimeChart}
          onOpenChange={setShowTotalTimeChart}
          activityName={TOTAL_TIME_KEY}
          teamId={teamId}
          referenceY={targetTimeMs}
          currentRoundId={roundId}
        />
      )}
    </Card>
  );
}
