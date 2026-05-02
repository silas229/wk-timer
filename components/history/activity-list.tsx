"use client";

import { useState } from "react";
import { formatTime } from "@/lib/lap-activities";
import type { ActivityTime, RoundComparison } from "@/lib/lap-activities";
import { ActivityChartDialog } from "./activity-chart-dialog";

interface ActivityListProps {
  activities: ActivityTime[]
  comparison: RoundComparison | null
  layout?: 'grid' | 'single-column'
  teamId?: string
  roundId?: string
  showTimestamps?: boolean
}

export function ActivityList({ activities, comparison, layout = 'grid', teamId, roundId, showTimestamps }: Readonly<ActivityListProps>) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const containerClass = layout === 'single-column'
    ? "space-y-2"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2";

  return (
    <>
      <div className={containerClass}>
        {activities.map((activity, index) => {
          const activityComparison = comparison?.activityComparisons[activity.name];
          return (
            <button
              key={`${activity.name}-${index}`}
              type="button"
              onClick={() => teamId && setSelectedActivity(activity.name)}
              className="flex justify-between items-center p-2 rounded text-sm bg-muted/50 w-full text-left transition-colors hover:bg-muted cursor-pointer"
            >
              <span className="font-medium">{activity.name}</span>
              <div className="text-right">
                <div className="font-mono">
                  {formatTime(activity.time, 'seconds')}
                  {activityComparison && (
                    <span className={`ml-2 text-xs ${activityComparison.isFaster ? 'text-green-600' : 'text-red-600'}`}>
                      {formatTime(activityComparison.diff, 'diff')}
                    </span>
                  )}
                </div>
                {showTimestamps && (
                  <div className="text-xs text-muted-foreground">
                    {formatTime(activity.startTime)}&nbsp;→&nbsp;{formatTime(activity.endTime)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {teamId && (
        <ActivityChartDialog
          open={selectedActivity !== null}
          onOpenChange={(open) => { if (!open) setSelectedActivity(null); }}
          activityName={selectedActivity ?? ""}
          teamId={teamId}
          currentRoundId={roundId}
        />
      )}
    </>
  );
}
