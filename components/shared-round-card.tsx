import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, ActivityTime } from '@/lib/lap-activities';
import { ActivityList } from '@/components/history/activity-list';
import { calculateTotalScore, formatPoints, calculateTargetTimeMs, type ScoringParameters } from '@/lib/scoring';

interface SharedRoundData {
  id: string;
  completedAt: string;
  totalTime: number;
  laps: Array<{
    lapNumber: number;
    time: number;
    timestamp: string;
  }>;
  teamName: string;
  description?: string;
  // A-Teil (Knoten)
  aPartErrorPoints?: number;
  knotTime?: number;
  aPartPenaltySeconds?: number;
  // B-Teil (Staffellauf)
  bPartErrorPoints?: number;
  // Gesamteindruck für beide Teile
  overallImpression?: number;
  // Team-Info für Berechnung
  teamAverageAge?: number;
}

interface SharedRoundCardProps {
  roundData: SharedRoundData;
  activities: ActivityTime[];
}

export function SharedRoundCard({ roundData, activities }: SharedRoundCardProps) {
  const completedAt = new Date(roundData.completedAt);

  // Calculate scoring if all data is available
  const canCalculateScore = roundData.teamAverageAge !== undefined &&
    roundData.aPartErrorPoints !== undefined &&
    roundData.knotTime !== undefined &&
    roundData.aPartPenaltySeconds !== undefined &&
    roundData.overallImpression !== undefined &&
    roundData.bPartErrorPoints !== undefined;

  let scoringResult = null;
  if (canCalculateScore) {
    const scoringParams: ScoringParameters = {
      teamAverageAge: roundData.teamAverageAge!,
      aPartErrorPoints: roundData.aPartErrorPoints!,
      knotTime: roundData.knotTime!,
      aPartPenaltySeconds: roundData.aPartPenaltySeconds!,
      overallImpression: roundData.overallImpression!,
      bPartTime: roundData.totalTime,
      bPartErrorPoints: roundData.bPartErrorPoints!,
    };
    scoringResult = calculateTotalScore(scoringParams);
  }

  const targetTime = calculateTargetTimeMs(roundData.teamAverageAge);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-1">
              <CardTitle className="text-lg">
                {roundData.teamName} • {completedAt.toLocaleDateString('de-DE')}
              </CardTitle>
            </div>
            <span className="font-mono text-xl font-bold">{formatTime(roundData.totalTime, 'full')}</span>
            {roundData.description && (
              <p className="text-sm mt-2 p-2 bg-muted rounded">
                {roundData.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scoring Results */}
        {scoringResult && scoringResult.canCalculate && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Punkteberechnung</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">A-Teil (Knoten)</div>
                <div className="text-lg font-mono">{formatPoints(scoringResult.aPartPoints)} Punkte</div>
              </div>
              <div>
                <div className="font-medium">B-Teil (Staffellauf)</div>
                <div className="text-lg font-mono">{formatPoints(scoringResult.bPartPoints)} Punkte</div>
              </div>
              <div>
                <div className="font-medium">Gesamt</div>
                <div className="text-xl font-mono font-bold text-green-700">
                  {formatPoints(scoringResult.totalPoints)} Punkte
                </div>
              </div>
            </div>

            {/* Additional scoring details */}
            {roundData.teamAverageAge && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="grid grid-cols-2 gap-4 text-xs text-green-700">
                  <div>
                    <span className="font-medium">Durchschnittsalter:</span> {roundData.teamAverageAge} Jahre
                  </div>
                  {scoringResult.breakdown.bPart && (
                    <div>
                      <span className="font-medium">Sollzeit B-Teil:</span> {formatTime(scoringResult.breakdown.bPart.targetTime)}
                      <span className={`ml-2 ${roundData.totalTime <= scoringResult.breakdown.bPart.targetTime ? 'text-green-600' : 'text-red-600'}`}>
                        ({roundData.totalTime <= scoringResult.breakdown.bPart.targetTime ? '-' : '+'}{Math.abs(roundData.totalTime - scoringResult.breakdown.bPart.targetTime)}s)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Target time display even without full scoring */}
        {!scoringResult?.canCalculate && roundData.teamAverageAge && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-800 mb-2">Zeitvergleich</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">Sollzeit B-Teil:</span> {formatTime(targetTime!)}
              </div>
              <div>
                <span className="font-medium">Ist-Zeit:</span> {formatTime(roundData.totalTime)}
                <span className={`ml-2 ${roundData.totalTime <= targetTime! ? 'text-green-600' : 'text-red-600'}`}>
                  ({roundData.totalTime <= targetTime! ? '-' : '+'}{Math.abs(roundData.totalTime - targetTime!)}s)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scoring parameters if available but incomplete */}
        {!canCalculateScore && (roundData.aPartErrorPoints !== undefined || roundData.bPartErrorPoints !== undefined) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">Verfügbare Parameter</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-yellow-700">
              {roundData.aPartErrorPoints !== undefined && (
                <div>Fehlerpunkte A-Teil: {roundData.aPartErrorPoints}</div>
              )}
              {roundData.knotTime !== undefined && (
                <div>Knotenzeit: {formatTime(roundData.knotTime)}</div>
              )}
              {roundData.aPartPenaltySeconds !== undefined && (
                <div>Strafsekunden A-Teil: {roundData.aPartPenaltySeconds}s</div>
              )}
              {roundData.bPartErrorPoints !== undefined && (
                <div>Fehlerpunkte B-Teil: {roundData.bPartErrorPoints}</div>
              )}
              {roundData.overallImpression !== undefined && (
                <div>Gesamteindruck: {roundData.overallImpression}</div>
              )}
              {roundData.teamAverageAge !== undefined && (
                <div>Durchschnittsalter: {roundData.teamAverageAge} Jahre</div>
              )}
            </div>
          </div>
        )}

        <ActivityList
          activities={activities}
          comparison={null}
          layout="single-column"
        />
      </CardContent>
    </Card>
  );
}
