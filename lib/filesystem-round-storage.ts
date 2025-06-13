import { promises as fs } from "fs";
import path from "path";
import { RoundStorage, SharedRoundData } from "./round-storage";

export class FileSystemRoundStorage implements RoundStorage {
  private readonly storageDir: string;

  constructor(storageDir: string = "./data/rounds") {
    this.storageDir = storageDir;
  }

  async store(id: string, roundData: SharedRoundData): Promise<void> {
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
