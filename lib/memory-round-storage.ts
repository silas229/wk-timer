import { RoundStorage, SharedRoundData } from "./round-storage";

export class MemoryRoundStorage implements RoundStorage {
  private rounds: Map<string, SharedRoundData> = new Map();

  async store(roundData: SharedRoundData): Promise<void> {
    this.rounds.set(roundData.id, { ...roundData }); // Store a copy to avoid mutations
  }

  async retrieve(id: string): Promise<SharedRoundData | null> {
    const round = this.rounds.get(id);
    return round ? { ...round } : null; // Return a copy to avoid mutations
  }

  // Additional methods for testing
  clear(): void {
    this.rounds.clear();
  }

  size(): number {
    return this.rounds.size;
  }

  has(id: string): boolean {
    return this.rounds.has(id);
  }
}
