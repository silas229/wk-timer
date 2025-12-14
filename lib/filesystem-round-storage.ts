import { promises as fs } from "fs";
import path from "path";
import { RoundStorage, SharedRoundData } from "./round-storage";
import { logger } from "./logger";

/**
 * Validate round ID: accept only UUIDs
 */
function isSafeId(id: string): boolean {
  // UUID v4 regex (simplified)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

export class FileSystemRoundStorage implements RoundStorage {
  private readonly storageDir: string;

  constructor(storageDir: string = "./data/rounds") {
    this.storageDir = storageDir;
  }

  async store(roundData: SharedRoundData): Promise<void> {
    if (!isSafeId(roundData?.id)) {
      throw new Error("Invalid round ID (potential path traversal detected)");
    }
    const log = logger.child({
      event: "storage.filesystem.store",
      roundId: roundData.id,
      storageDir: this.storageDir,
    });

    try {
      // Ensure the storage directory exists
      await fs.mkdir(this.storageDir, { recursive: true });

      // Write the round data to a JSON file
      const filePath = path.join(this.storageDir, `${roundData.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(roundData, null, 2), "utf-8");
      log.info("Round stored on filesystem");
    } catch (error) {
      log.error({ err: error }, "Failed to store round on filesystem");
      throw new Error(
        `Failed to store round: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async retrieve(id: string): Promise<SharedRoundData | null> {
    if (!isSafeId(id)) {
      throw new Error("Invalid round ID (potential path traversal detected)");
    }
    const log = logger.child({
      event: "storage.filesystem.retrieve",
      roundId: id,
      storageDir: this.storageDir,
    });
    try {
      const filePath = path.join(this.storageDir, `${id}.json`);
      const fileContent = await fs.readFile(filePath, "utf-8");
      log.debug("Round loaded from filesystem");
      return JSON.parse(fileContent) as SharedRoundData;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        // File doesn't exist
        log.warn("Round not found on filesystem");
        return null;
      }
      log.error({ err: error }, "Failed to retrieve round from filesystem");
      throw new Error(
        `Failed to retrieve round: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
