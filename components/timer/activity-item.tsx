import { formatTime } from "@/lib/lap-activities";
import type { ActivityTime, ActivityComparison } from "@/lib/lap-activities";

interface ActivityItemProps {
  activity: ActivityTime
  comparison?: ActivityComparison
}

export function ActivityItem({ activity, comparison }: ActivityItemProps) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
      <span className="font-medium">{activity.name}</span>
      <div className="text-right">
        <div className="font-mono text-sm">
          {formatTime(activity.time, 'seconds')}
          {comparison && (
            <span className={`ml-2 ${comparison.isFaster ? 'text-green-600' : 'text-red-600'}`}>
              {formatTime(comparison.diff, 'diff')}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(activity.startTime)}&nbsp;→&nbsp;{formatTime(activity.endTime)}
        </div>
      </div>
    </div>
  );
}
