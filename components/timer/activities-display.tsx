import { forwardRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LAP_ACTIVITIES } from "@/lib/lap-activities";
import { ActivityItem } from "./activity-item";
import { CurrentActivityItem } from "./current-activity-item";
import type { ActivityTime, RoundComparison } from "@/lib/lap-activities";
import type { Lap } from "@/lib/indexeddb";

type TimerState = "stopped" | "running" | "finished"

interface ActivitiesDisplayProps {
  activities: ActivityTime[]
  comparison: RoundComparison | null
  state: TimerState
  time: number
  laps: Lap[]
}

export const ActivitiesDisplay = forwardRef<HTMLDivElement, ActivitiesDisplayProps>(
  ({ activities, comparison, state, time, laps }, ref) => {
    // Get current activities being performed (can be multiple)
    const getCurrentActivities = () => {
      if (state !== "running" || laps.length >= 13) return [];

      const currentActivities = [];

      // Check each activity to see if it's currently running
      for (const activity of LAP_ACTIVITIES) {
        // Check if we've started this activity but not finished it yet
        const hasStarted = laps.length >= activity.startIndex;
        const hasFinished = laps.some(lap => lap.lapNumber === activity.endIndex);

        if (hasStarted && !hasFinished) {
          // Find the start time for this activity
          const startLap = activity.startIndex === 0
            ? null
            : laps.find(lap => lap.lapNumber === activity.startIndex);
          const startTime = startLap ? startLap.time : 0;

          currentActivities.push({
            name: activity.name,
            startTime: startTime,
            currentTime: time - startTime,
            totalTime: time,
            endIndex: activity.endIndex
          });
        }
      }

      return currentActivities;
    };

    const currentActivities = getCurrentActivities();

    return (
      <Card>
        <CardContent>
          <div
            ref={ref}
            className={`space-y-2 transition-all duration-700 ease-in-out ${state === "finished"
                ? "max-h-[2000px] overflow-y-visible" // Large height, no scroll when finished
                : "h-64 max-h-64 overflow-y-auto" // Fixed height with scroll during round
              }`}
          >
            {activities.length === 0 && state === "stopped" ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Runden aufgezeichnet
              </p>
            ) : (
              <>
                {activities.map((activity, index) => {
                  const activityComparison = comparison?.activityComparisons[activity.name];
                  return (
                    <ActivityItem
                      key={`${activity.name}-${index}`}
                      activity={activity}
                      comparison={activityComparison}
                    />
                  );
                })}

                {currentActivities.map((currentActivity, index) => (
                  <CurrentActivityItem
                    key={`current-${currentActivity.name}-${index}`}
                    currentActivity={currentActivity}
                  />
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ActivitiesDisplay.displayName = "ActivitiesDisplay";
