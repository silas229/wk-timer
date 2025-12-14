import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Team {
  id: string
  name: string
  color: string
  createdAt: Date
}

interface EmptyStateProps {
  currentTeam: Team | null
}

export function EmptyState({ currentTeam }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {currentTeam ? `Keine Runden für ${currentTeam.name}` : "Keine Gruppe ausgewählt"}
        </h3>
        <p className="text-muted-foreground">
          {currentTeam
            ? "Schließe eine Runde mit diesem Team ab, um sie hier zu sehen."
            : "Wähle eine Gruppe aus der Navigation aus, um deren Runden zu sehen."
          }
        </p>
      </CardContent>
    </Card>
  );
}
