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
  // A-Teil (Löschangriff)
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
            {roundData.description && (
              <p className="text-sm mt-2 p-2 bg-muted rounded">
                {roundData.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Gesamtpunktzahl ganz oben groß */}
        {scoringResult && scoringResult.canCalculate && (
          <div className="mb-6 text-center">
            <div className="text-4xl font-bold text-green-700 mb-2">
              {formatPoints(scoringResult.totalPoints)} Punkte
            </div>
            <div className="text-sm text-muted-foreground">
              Gesamtpunktzahl
            </div>
          </div>
        )}

        {/* A-Teil (Löschangriff) */}
        {canCalculateScore && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">A-Teil (Löschangriff)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {roundData.knotTime !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Knotenzeit</div>
                  <div className="text-lg font-mono">{roundData.knotTime}s</div>
                </div>
              )}
              {roundData.aPartErrorPoints !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Fehlerpunkte</div>
                  <div className="text-lg font-mono">{roundData.aPartErrorPoints}</div>
                </div>
              )}
              {roundData.aPartPenaltySeconds !== undefined && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Strafsekunden</div>
                  <div className="text-lg font-mono">{roundData.aPartPenaltySeconds}s</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* B-Teil (Staffellauf) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">B-Teil (Staffellauf)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <div className="text-sm font-medium text-muted-foreground">Laufzeit</div>
              <div>
                <span className="text-lg font-mono font-bold">
                  {formatTime(roundData.totalTime, 'full')}
                </span>
                {roundData.teamAverageAge && targetTime && (
                  <span className={`ml-1 ${roundData.totalTime <= targetTime ? 'text-green-600' : 'text-red-600'}`}>
                    ({Math.floor(Math.abs(roundData.totalTime - targetTime) / 1000)}s {roundData.totalTime <= targetTime ? 'unter' : 'über'} Sollzeit)
                  </span>
                )}
              </div>
            </div>
            {roundData.bPartErrorPoints !== undefined && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Fehlerpunkte</div>
                <div className="text-lg font-mono">{roundData.bPartErrorPoints}</div>
              </div>
            )}
          </div>

          {/* Activity List als Teil des B-Teils */}
          <div className="mt-4">
            <h4 className="text-md font-medium mb-2">Rundenzeiten</h4>
            <ActivityList
              activities={activities}
              comparison={null}
              layout="single-column"
            />
          </div>
        </div>

        {/* Gesamteindruck und weitere Details */}
        {(roundData.overallImpression !== undefined || roundData.teamAverageAge !== undefined) && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Zusätzliche Informationen</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {roundData.overallImpression !== undefined && (
                <div>
                  <span className="font-medium">Gesamteindruck:</span> {roundData.overallImpression}
                </div>
              )}
              {roundData.teamAverageAge !== undefined && (
                <div>
                  <span className="font-medium">Durchschnittsalter:</span> {roundData.teamAverageAge} Jahre
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
