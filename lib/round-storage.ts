// Interface for shared round data
export interface SharedRoundData {
  id: string; // UUID that serves as both local and shareable ID
  completedAt: string;
  totalTime: number;
  laps: Array<{
    lapNumber: number;
    time: number;
    timestamp: string;
  }>;
  teamName: string;
  description?: string;
  // A-Teil (Löschangriff)
  aPartErrorPoints?: number; // Fehlerpunkte A-Teil
  knotTime?: number; // Knotenzeit in Sekunden
  aPartPenaltySeconds?: number; // Strafsekunden bei Zeitüberschreitung A-Teil
  // B-Teil (Staffellauf)
  bPartErrorPoints?: number; // Fehlerpunkte B-Teil
  // Gemeinsamer Gesamteindruck für beide Teile
  overallImpression?: number; // Gesamteindruck (Durchschnitt mit einer Nachkommastelle)
  // Team-Info für Berechnung
  teamAverageAge?: number; // Durchschnittsalter des Teams
}

// Abstract storage interface
export interface RoundStorage {
  store(id: string, roundData: SharedRoundData): Promise<void>;
  retrieve(id: string): Promise<SharedRoundData | null>;
}
