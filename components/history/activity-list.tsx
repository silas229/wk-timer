import { formatTime } from "@/lib/lap-activities"
import type { ActivityTime, RoundComparison } from "@/lib/lap-activities"

interface ActivityListProps {
  activities: ActivityTime[]
  comparison: RoundComparison | null
}

export function ActivityList({ activities, comparison }: ActivityListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {activities.map((activity, index) => {
        const activityComparison = comparison?.activityComparisons[activity.name]
        return (
          <div
            key={`${activity.name}-${index}`}
            className="flex justify-between items-center p-2 rounded text-sm bg-muted/50"
          >
            <span className="font-medium">{activity.name}</span>
            <div className="text-right">
              <span className="font-mono">
                {formatTime(activity.time, 'seconds')}
              </span>
              {activityComparison && (
                <div className={`text-xs ${activityComparison.isFaster ? 'text-green-600' : 'text-red-600'}`}>
                  {formatTime(activityComparison.diff, 'diff')}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
