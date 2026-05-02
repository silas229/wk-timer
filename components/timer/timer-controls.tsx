import { Button } from "@/components/ui/button";
import { Trash2, Calculator } from "lucide-react";
import { STARTABLE_RUNNERS, type StartRunner } from "@/lib/lap-activities";
import type { SavedRound, Lap } from "@/lib/indexeddb";

type TimerState = "stopped" | "running" | "finished"

// Button labels for each lap based on the German competition format
const BUTTON_LABELS = [
  "Start Läufer 2",
  "Start Läufer 3",
  "Start Schlauchrollen",
  "Ende Schlauchrollen",
  "Start Läufer 4",
  "Start Läufer 5",
  "Ende Anziehen",
  "Start Läufer 6",
  "Start Läufer 7",
  "Start Läufer 8",
  "Ende Kuppeln",
  "Start Läufer 9",
];

interface TimerControlsProps {
  state: TimerState
  laps: Lap[]
  lastSavedRound: SavedRound | null
  startRunner: StartRunner
  onStartRunnerChange: (runner: StartRunner) => void
  onButtonClick: () => void
  onDiscardRound: () => void
  onOpenDetails?: (round: SavedRound) => void
}

export function TimerControls({
  state,
  laps,
  lastSavedRound,
  startRunner,
  onStartRunnerChange,
  onButtonClick,
  onDiscardRound,
  onOpenDetails
}: Readonly<TimerControlsProps>) {
  const getButtonText = () => {
    if (state === "stopped") return "Start";
    if (state === "running") {
      if (laps.length === 0) return BUTTON_LABELS[0]; // "Start Läufer 1"
      if (laps.length < BUTTON_LABELS.length) return BUTTON_LABELS[laps.length];
      return "Ende";
    }
    if (state === "finished") return "Neustart";
    return "Start";
  };

  return (
    <div className="text-center space-y-3">
      <Button
        onClick={onButtonClick}
        size="xl"
        className="w-full text-lg py-6"
      >
        {getButtonText()}
      </Button>

      {state === "stopped" && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Start bei:</span>
          <div className="flex gap-1">
            {STARTABLE_RUNNERS.map((runner) => (
              <Button
                key={runner}
                variant={startRunner === runner ? "default" : "outline"}
                size="sm"
                onClick={() => onStartRunnerChange(runner)}
              >
                Läufer {runner}
              </Button>
            ))}
          </div>
        </div>
      )}

      {state === "finished" && lastSavedRound && (
        <div className="space-y-2">
          {onOpenDetails && (
            <Button
              onClick={() => onOpenDetails(lastSavedRound)}
              variant="outline"
              className="w-full"
            >
              <Calculator />
              Punkteberechnung und Teilen
            </Button>
          )}

          <Button
            onClick={onDiscardRound}
            variant="destructive"
            className="w-full"
          >
            <Trash2 />
            Runde verwerfen
          </Button>
        </div>
      )}
    </div>
  );
}
