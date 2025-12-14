import { formatTime } from "@/lib/lap-activities";

interface CurrentActivity {
  name: string
  startTime: number
  currentTime: number
  totalTime: number
}

interface CurrentActivityItemProps {
  currentActivity: CurrentActivity
}

export function CurrentActivityItem({ currentActivity }: CurrentActivityItemProps) {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-blue-100 border-2 border-blue-300 dark:bg-blue-900 dark:border-blue-700">
      <span className="font-medium text-blue-800 dark:text-blue-200">
        {currentActivity.name} (aktuell)
      </span>
      <div className="text-right">
        <div className="font-mono text-sm text-blue-800 dark:text-blue-200">
          {formatTime(currentActivity.currentTime, 'seconds')}
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400">
          Gestartet um {formatTime(currentActivity.startTime)}
        </div>
      </div>
    </div>
  );
}
