import { RoundStorage } from "./round-storage";
import { FileSystemRoundStorage } from "./filesystem-round-storage";
import { MemoryRoundStorage } from "./memory-round-storage";

// Global storage instance
let storageInstance: RoundStorage | null = null;

export function getRoundStorage(): RoundStorage {
  if (!storageInstance) {
    if (process.env.NODE_ENV === "test") {
      // Use memory storage for tests
      storageInstance = new MemoryRoundStorage();
    } else {
      // Use filesystem storage for production/development
      const storageDir = process.env.ROUNDS_STORAGE_DIR || "./data/rounds";
      storageInstance = new FileSystemRoundStorage(storageDir);
    }
  }
  return storageInstance;
}

// Function to override storage for testing
export function setRoundStorage(storage: RoundStorage): void {
  storageInstance = storage;
}

// Function to reset storage (useful for tests)
export function resetRoundStorage(): void {
  storageInstance = null;
}
