export interface Team {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  averageAge?: number; // Durchschnittsalter des Teams
}

export interface Lap {
  lapNumber: number;
  time: number;
  timestamp: Date;
}

export interface SavedRound {
  id: string; // UUID for both local storage and sharing
  completedAt: Date;
  totalTime: number;
  laps: Lap[];
  teamId: string;
  teamName: string;
  sharedUrl?: string; // URL for shared round
  description?: string; // User description for shared round
  // A-Teil (Löschangriff)
  aPartErrorPoints?: number; // Fehlerpunkte A-Teil
  knotTime?: number; // Knotenzeit in Sekunden
  aPartPenaltySeconds?: number; // Strafsekunden bei Zeitüberschreitung A-Teil
  // B-Teil (Staffellauf)
  bPartErrorPoints?: number; // Fehlerpunkte B-Teil
  // Gemeinsamer Gesamteindruck für beide Teile
  overallImpression?: number; // Gesamteindruck (Durchschnitt mit einer Nachkommastelle)
}

const DB_NAME = "WkTimerDB";
const DB_VERSION = 2;
const TEAMS_STORE = "teams";
const ROUNDS_STORE = "rounds";
const SETTINGS_STORE = "settings";

/* eslint-disable @typescript-eslint/no-explicit-any */
class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Create teams store
        if (!db.objectStoreNames.contains(TEAMS_STORE)) {
          const teamsStore = db.createObjectStore(TEAMS_STORE, {
            keyPath: "id",
          });
          teamsStore.createIndex("name", "name", { unique: false });
          teamsStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Create rounds store
        if (!db.objectStoreNames.contains(ROUNDS_STORE)) {
          const roundsStore = db.createObjectStore(ROUNDS_STORE, {
            keyPath: "id",
          });
          roundsStore.createIndex("teamId", "teamId", { unique: false });
          roundsStore.createIndex("completedAt", "completedAt", {
            unique: false,
          });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
        }

        // Migration from version 1 to 2: Add scoring fields
        if (oldVersion < 2) {
          // The scoring fields are optional, so no migration needed
          // New fields will be undefined for existing records
          console.log("Database migrated to version 2 with scoring support");
        }
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.db;
  }

  // Teams operations
  async getAllTeams(): Promise<Team[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TEAMS_STORE], "readonly");
      const store = transaction.objectStore(TEAMS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const teams = request.result.map((team: any) => ({
          ...team,
          createdAt: new Date(team.createdAt),
        }));
        resolve(teams);
      };

      request.onerror = () => {
        reject(new Error("Failed to get teams"));
      };
    });
  }

  async saveTeam(team: Team): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([TEAMS_STORE], "readwrite");
      const store = transaction.objectStore(TEAMS_STORE);
      const request = store.put(team);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save team"));
    });
  }

  async deleteTeam(teamId: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [TEAMS_STORE, ROUNDS_STORE],
        "readwrite"
      );

      // Delete team
      const teamsStore = transaction.objectStore(TEAMS_STORE);
      teamsStore.delete(teamId);

      // Delete all rounds for this team
      const roundsStore = transaction.objectStore(ROUNDS_STORE);
      const roundsIndex = roundsStore.index("teamId");
      const roundsRequest = roundsIndex.openCursor(teamId);

      const roundsToDelete: string[] = [];

      roundsRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          roundsToDelete.push(cursor.value.id);
          cursor.continue();
        } else {
          // Delete all collected rounds
          roundsToDelete.forEach((roundId) => {
            roundsStore.delete(roundId);
          });
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Failed to delete team"));
    });
  }

  // Rounds operations
  async getAllRounds(): Promise<SavedRound[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ROUNDS_STORE], "readonly");
      const store = transaction.objectStore(ROUNDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const rounds = request.result.map((round: any) => ({
          ...round,
          completedAt: new Date(round.completedAt),
          laps: round.laps.map((lap: any) => ({
            ...lap,
            timestamp: new Date(lap.timestamp),
          })),
        }));
        // Sort by completion date (newest first)
        rounds.sort(
          (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
        );
        resolve(rounds);
      };

      request.onerror = () => {
        reject(new Error("Failed to get rounds"));
      };
    });
  }

  async getRoundsByTeam(teamId: string): Promise<SavedRound[]> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ROUNDS_STORE], "readonly");
      const store = transaction.objectStore(ROUNDS_STORE);
      const index = store.index("teamId");
      const request = index.getAll(teamId);

      request.onsuccess = () => {
        const rounds = request.result.map((round: any) => ({
          ...round,
          completedAt: new Date(round.completedAt),
          laps: round.laps.map((lap: any) => ({
            ...lap,
            timestamp: new Date(lap.timestamp),
          })),
        }));
        // Sort by completion date (newest first)
        rounds.sort(
          (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
        );
        resolve(rounds);
      };

      request.onerror = () => {
        reject(new Error("Failed to get rounds by team"));
      };
    });
  }

  async saveRound(round: SavedRound): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ROUNDS_STORE], "readwrite");
      const store = transaction.objectStore(ROUNDS_STORE);
      const request = store.put(round);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save round"));
    });
  }

  async deleteRound(roundId: string): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ROUNDS_STORE], "readwrite");
      const store = transaction.objectStore(ROUNDS_STORE);
      const request = store.delete(roundId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete round"));
    });
  }

  async clearAllRounds(): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ROUNDS_STORE], "readwrite");
      const store = transaction.objectStore(ROUNDS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear rounds"));
    });
  }

  // Settings operations
  async getSetting(key: string): Promise<any> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], "readonly");
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value);
      };

      request.onerror = () => {
        reject(new Error("Failed to get setting"));
      };
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SETTINGS_STORE], "readwrite");
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to set setting"));
    });
  }
}

// Singleton instance
export const indexedDB = new IndexedDBManager();

// Initialize on first import
let initPromise: Promise<void> | null = null;

export const initializeDB = async (): Promise<void> => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    await indexedDB.init();
  })();

  return initPromise;
};
