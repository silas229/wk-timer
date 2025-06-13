import { Button } from "@/components/ui/button"
import { Trash2, Share2 } from "lucide-react"
import type { SavedRound, Lap } from "@/lib/indexeddb"

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
]

interface TimerControlsProps {
  state: TimerState
  laps: Lap[]
  lastSavedRound: SavedRound | null
  onButtonClick: () => void
  onDiscardRound: () => void
  onShareRound: () => void
}

export function TimerControls({
  state,
  laps,
  lastSavedRound,
  onButtonClick,
  onDiscardRound,
  onShareRound
}: TimerControlsProps) {
  const getButtonText = () => {
    if (state === "stopped") return "Start"
    if (state === "running") {
      if (laps.length === 0) return BUTTON_LABELS[0] // "Start Läufer 1"
      if (laps.length < BUTTON_LABELS.length) return BUTTON_LABELS[laps.length]
      return "Ende"
    }
    if (state === "finished") return "Neustart"
    return "Start"
  }

  return (
    <div className="text-center space-y-3">
      <Button
        onClick={onButtonClick}
        size="xl"
        className="w-full text-lg py-6"
      >
        {getButtonText()}
      </Button>

      {state === "finished" && lastSavedRound && (
        <div className="space-y-2">
          <Button
            onClick={onShareRound}
            variant="outline"
            className="w-full"
          >
            <Share2 />
            Runde teilen
          </Button>

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
  )
}
