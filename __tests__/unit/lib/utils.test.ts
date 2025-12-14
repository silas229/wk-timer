import { describe, it, expect } from "vitest";
import { generateUUID } from "@/lib/utils";

describe("UUID Utils", () => {
  describe("generateUUID", () => {
    it("should generate a valid UUID v4", () => {
      const uuid = generateUUID();

      // UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidPattern);
    });

    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });

    it("should generate UUIDs of correct length", () => {
      const uuid = generateUUID();

      expect(uuid).toHaveLength(36); // 32 chars + 4 hyphens
    });

    it("should generate UUIDs with correct format", () => {
      const uuid = generateUUID();
      const parts = uuid.split("-");

      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[3]).toHaveLength(4);
      expect(parts[4]).toHaveLength(12);
    });
  });
});
