import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, ActivityTime } from '@/lib/lap-activities';
import { ActivityList } from '@/components/history/activity-list';

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
}

interface SharedRoundCardProps {
  roundData: SharedRoundData;
  activities: ActivityTime[];
}

export function SharedRoundCard({ roundData, activities }: SharedRoundCardProps) {
  const completedAt = new Date(roundData.completedAt);

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
        <ActivityList
          activities={activities}
          comparison={null}
          layout="single-column"
        />
      </CardContent>
    </Card>
  );
}
