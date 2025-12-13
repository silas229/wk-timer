import { promises as fs } from "fs";
import path from "path";
import { RoundStorage, SharedRoundData } from "./round-storage";

// Validate round ID: accept only UUIDs (or adjust regex as needed)
function isSafeId(id: string): boolean {
  // UUID v4 regex (simplified): /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  // For more general case: /^[a-zA-Z0-9\-]+$/
  // Adjust as needed for your IDs' format.
  return /^[a-zA-Z0-9\-]+$/.test(id);
}

export class FileSystemRoundStorage implements RoundStorage {
  private readonly storageDir: string;

  constructor(storageDir: string = "./data/rounds") {
    this.storageDir = storageDir;
  }

  async store(id: string, roundData: SharedRoundData): Promise<void> {
    if (!isSafeId(id)) {
      throw new Error("Invalid round ID (potential path traversal detected)");
    }
    try {
      // Ensure the storage directory exists
      await fs.mkdir(this.storageDir, { recursive: true });

      // Write the round data to a JSON file
      const filePath = path.join(this.storageDir, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(roundData, null, 2), "utf-8");
    } catch (error) {
      console.error(`Failed to store round ${id}:`, error);
      throw new Error(
        `Failed to store round: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async retrieve(id: string): Promise<SharedRoundData | null> {
    if (!isSafeId(id)) {
      throw new Error("Invalid round ID (potential path traversal detected)");
    }
    try {
      const filePath = path.join(this.storageDir, `${id}.json`);
      const fileContent = await fs.readFile(filePath, "utf-8");
      return JSON.parse(fileContent) as SharedRoundData;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        // File doesn't exist
        return null;
      }
      console.error(`Failed to retrieve round ${id}:`, error);
      throw new Error(
        `Failed to retrieve round: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
