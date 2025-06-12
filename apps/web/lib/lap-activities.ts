// Configuration for displaying laps as activities with time differences
export interface LapActivity {
  name: string;
  endIndex: number;
  startIndex: number;
}

// Mapping of activities to lap indices
export const LAP_ACTIVITIES: LapActivity[] = [
  { name: "Läufer 1", endIndex: 1, startIndex: 0 }, // R1
  { name: "Läufer 2", endIndex: 2, startIndex: 1 }, // R2
  { name: "Läufer 3", endIndex: 5, startIndex: 2 }, // R3
  { name: "Schlauchrollen", endIndex: 4, startIndex: 3 }, // Rolling (R3 activity)
  { name: "Läufer 4", endIndex: 6, startIndex: 5 }, // R4
  { name: "Läufer 5", endIndex: 8, startIndex: 6 }, // R5
  { name: "Anziehen", endIndex: 7, startIndex: 6 }, // Dressing (R5 activity)
  { name: "Läufer 6", endIndex: 9, startIndex: 8 }, // R6
  { name: "Läufer 7", endIndex: 10, startIndex: 9 }, // R7
  { name: "Läufer 8", endIndex: 12, startIndex: 10 }, // R8
  { name: "Kuppeln", endIndex: 11, startIndex: 10 }, // Coupling (R8 activity)
  { name: "Läufer 9", endIndex: 13, startIndex: 12 }, // R9
];

export interface ActivityTime {
  name: string;
  time: number;
  startTime: number;
  endTime: number;
}

/**
 * Calculate activity times based on lap data
 * @param laps Array of lap data with cumulative times
 * @returns Array of activities with calculated time differences
 */
export function calculateActivityTimes(
  laps: { lapNumber: number; time: number; timestamp: Date }[]
): ActivityTime[] {
  const activities: ActivityTime[] = [];

  for (const activity of LAP_ACTIVITIES) {
    const startLap =
      activity.startIndex === 0
        ? null
        : laps.find((lap) => lap.lapNumber === activity.startIndex);
    const endLap = laps.find((lap) => lap.lapNumber === activity.endIndex);

    if (endLap) {
      const startTime = startLap ? startLap.time : 0;
      const endTime = endLap.time;
      const activityTime = endTime - startTime;

      activities.push({
        name: activity.name,
        time: activityTime,
        startTime,
        endTime,
      });
    }
  }

  return activities;
}

/**
 * Format time in milliseconds with various format options
 */
export type TimeFormat = "full" | "seconds" | "diff";

export function formatTime(
  milliseconds: number,
  format: TimeFormat = "full"
): string {
  const isNegative = milliseconds < 0;
  const absMilliseconds = Math.abs(milliseconds);

  const totalSeconds = Math.floor(absMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((absMilliseconds % 1000) / 10);

  switch (format) {
    case "full": // m:ss.ms format
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;

    case "seconds": // ss.ms format
      return `${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;

    case "diff": // +/-ss.ms format
      const prefix = isNegative ? "-" : "+";
      return `${prefix}${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;

    default:
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  }
}
