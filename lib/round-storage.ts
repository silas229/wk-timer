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
}

// Abstract storage interface
export interface RoundStorage {
  store(id: string, roundData: SharedRoundData): Promise<void>;
  retrieve(id: string): Promise<SharedRoundData | null>;
}
