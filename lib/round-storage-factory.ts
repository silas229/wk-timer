import { RoundStorage } from "./round-storage";
import { FileSystemRoundStorage } from "./filesystem-round-storage";
import { MemoryRoundStorage } from "./memory-round-storage";
import { logger } from "./logger";

// Global storage instance
let storageInstance: RoundStorage | null = null;

export function getRoundStorage(): RoundStorage {
  if (!storageInstance) {
    if (process.env.NODE_ENV === "test") {
      // Use memory storage for tests
      storageInstance = new MemoryRoundStorage();
      logger.debug(
        { event: "storage.factory", type: "memory" },
        "Initialized memory storage for tests"
      );
    } else {
      // Use filesystem storage for production/development
      const storageDir = process.env.ROUNDS_STORAGE_DIR || "./data/rounds";
      storageInstance = new FileSystemRoundStorage(storageDir);
      logger.info(
        { event: "storage.factory", type: "filesystem", storageDir },
        "Initialized filesystem storage"
      );
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
