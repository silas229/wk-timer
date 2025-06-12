import { forwardRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LAP_ACTIVITIES } from "@/lib/lap-activities"
import { ActivityItem } from "./activity-item"
import { CurrentActivityItem } from "./current-activity-item"
import type { ActivityTime, RoundComparison } from "@/lib/lap-activities"
import type { Lap } from "@/lib/indexeddb"

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
    // Get current activity being performed
    const getCurrentActivity = () => {
      if (state !== "running" || laps.length >= 13) return null

      // Find the last completed lap time
      const lastLap = laps.length > 0 ? laps[laps.length - 1] : null
      const lastLapTime = lastLap ? lastLap.time : 0

      // Find current activity based on the next lap to be recorded
      const nextLapIndex = laps.length + 1
      const currentActivity = LAP_ACTIVITIES.find(activity => activity.endIndex === nextLapIndex)

      if (currentActivity) {
        return {
          name: currentActivity.name,
          startTime: lastLapTime,
          currentTime: time - lastLapTime,
          totalTime: time
        }
      }

      return null
    }

    const currentActivity = getCurrentActivity()

    return (
      <Card>
        <CardContent>
          <div
            ref={ref}
            className="space-y-2 h-64 overflow-y-auto"
          >
            {activities.length === 0 && state === "stopped" ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Runden aufgezeichnet
              </p>
            ) : (
              <>
                {activities.map((activity, index) => {
                  const activityComparison = comparison?.activityComparisons[activity.name]
                  return (
                    <ActivityItem
                      key={`${activity.name}-${index}`}
                      activity={activity}
                      comparison={activityComparison}
                    />
                  )
                })}

                {currentActivity && (
                  <CurrentActivityItem currentActivity={currentActivity} />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
)

ActivitiesDisplay.displayName = "ActivitiesDisplay"
