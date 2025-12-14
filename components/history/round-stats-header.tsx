import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SavedRound } from "@/lib/indexeddb";

interface Team {
  id: string
  name: string
  color: string
  createdAt: Date
}

interface RoundStatsHeaderProps {
  filteredRounds: SavedRound[]
  currentTeam: Team | null
  savedRoundsCount: number
  onClearAllRounds: () => void
}

export function RoundStatsHeader({
  filteredRounds,
  currentTeam,
  savedRoundsCount,
  onClearAllRounds
}: RoundStatsHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Rundenverlauf</h2>
          {savedRoundsCount > 0 && (
            <Button
              onClick={onClearAllRounds}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Alle löschen
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          {filteredRounds.length} gespeicherte {filteredRounds.length === 1 ? 'Durchgang' : 'Durchgänge'}
          {currentTeam && (
            <span> für {currentTeam.name}</span>
          )}
        </p>
      </div>
    </div>
  );
}
