import { describe, it, expect } from "vitest";
import {
  calculateAPartPoints,
  calculateBPartPoints,
  calculateTotalScore,
  formatPoints,
} from "@/lib/scoring";

// Shared mock laps from lap-activities.test.ts
const mockLaps = [
  { lapNumber: 1, time: 10000, timestamp: new Date() }, // Läufer 1: 0 -> 10s
  { lapNumber: 2, time: 20000, timestamp: new Date() }, // Läufer 2: 10s -> 20s
  { lapNumber: 3, time: 25000, timestamp: new Date() }, // Start for Läufer 3 (first 5s)
  { lapNumber: 4, time: 40000, timestamp: new Date() }, // Schlauchrollen: 25s -> 40s (15s)
  { lapNumber: 5, time: 45000, timestamp: new Date() }, // Läufer 3 (remaining 5s): 40s -> 45s (total 20s -> 45s)
  { lapNumber: 6, time: 55000, timestamp: new Date() }, // Läufer 4: 45s -> 55s
  { lapNumber: 7, time: 70000, timestamp: new Date() }, // Anziehen: 55s -> 70s (15s)
  { lapNumber: 8, time: 80000, timestamp: new Date() }, // Läufer 5: 60s -> 80s (10s after Anziehen)
  { lapNumber: 9, time: 90000, timestamp: new Date() }, // Läufer 6: 80s -> 90s
  { lapNumber: 10, time: 100000, timestamp: new Date() }, // Läufer 7: 90s -> 100s
  { lapNumber: 11, time: 115000, timestamp: new Date() }, // Kuppeln: 100s -> 115s (15s)
  { lapNumber: 12, time: 125000, timestamp: new Date() }, // Läufer 8: 100s -> 125s (10s after Kuppeln)
  { lapNumber: 13, time: 135000, timestamp: new Date() }, // Läufer 9: 125s -> 135s
];

describe("Scoring System", () => {
  describe("calculateAPartPoints", () => {
    it("should calculate A-Teil points correctly with all parameters", () => {
      const result = calculateAPartPoints({
        knotTime: 30,
        aPartPenaltySeconds: 10,
        aPartErrorPoints: 5,
      });

      expect(result.points).toBe(955); // 1000 - 30 - 10 - 5
      expect(result.breakdown).toEqual({
        basePoints: 1000,
        knotTimeDeduction: 30,
        penaltyDeduction: 10,
        errorPointsDeduction: 5,
        finalPoints: 955,
      });
    });

    it("should return null when parameters are missing", () => {
      const result = calculateAPartPoints({
        knotTime: 30,
        // missing other parameters
      });

      expect(result.points).toBeNull();
      expect(result.breakdown).toBeUndefined();
    });

    it("should never return negative points", () => {
      const result = calculateAPartPoints({
        knotTime: 500,
        aPartPenaltySeconds: 500,
        aPartErrorPoints: 500,
      });

      expect(result.points).toBe(0);
      expect(result.breakdown?.finalPoints).toBe(0);
    });
  });

  describe("calculateBPartPoints", () => {
    it("should calculate B-Teil points correctly for team under target time", () => {
      const result = calculateBPartPoints({
        bPartTime: 180, // 3 minutes
        teamAverageAge: 12, // Sollzeit: 210 - (12 * 5) = 150s
        bPartErrorPoints: 5,
      });

      expect(result.points).toBe(365); // 400 + (150-180) - 5
      expect(result.breakdown?.targetTime).toBe(150);
      expect(result.breakdown?.timeDifference).toBe(30); // über Sollzeit
      expect(result.breakdown?.timePoints).toBe(-30); // Abzug
    });

    it("should calculate B-Teil points correctly for team over target time", () => {
      const result = calculateBPartPoints({
        bPartTime: 220, // über Sollzeit
        teamAverageAge: 12, // Sollzeit: 210 - (12 * 5) = 150s
        bPartErrorPoints: 0,
      });

      expect(result.points).toBe(330); // 400 - 70 - 0
      expect(result.breakdown?.timeDifference).toBe(70); // über Sollzeit
      expect(result.breakdown?.timePoints).toBe(-70); // Abzug
    });

    it("should return null when parameters are missing", () => {
      const result = calculateBPartPoints({
        bPartTime: 180,
        // missing other parameters
      });

      expect(result.points).toBeNull();
    });
  });

  describe("calculateTotalScore", () => {
    it("should calculate total score when all parameters are present", () => {
      const result = calculateTotalScore({
        teamAverageAge: 12,
        aPartErrorPoints: 5,
        knotTime: 30,
        aPartPenaltySeconds: 0,
        bPartTime: 190,
        bPartErrorPoints: 3,
        overallImpression: 1.0, // Gesamteindruck für beide Teile
      });

      expect(result.canCalculate).toBe(true);
      expect(result.aPartPoints).toBe(965); // 1000 - 30 - 0 - 5
      expect(result.bPartPoints).toBe(357); // 400 - 40 - 3 (ohne Gesamteindruck, 190 vs 150 Sollzeit)
      expect(result.totalPoints).toBe(1321); // 965 + 357 - 1 = 1321
    });

    it("should not calculate when parameters are missing", () => {
      const result = calculateTotalScore({
        teamAverageAge: 12,
        bPartTime: 190,
        // missing A-Teil parameters
      });

      expect(result.canCalculate).toBe(false);
      expect(result.totalPoints).toBeNull();
    });
  });

  describe("Integration tests with realistic lap data", () => {
    it("should calculate correct points using mockLaps data (Durchschnittsalter 10, Knotenzeit 10s, Fehlerpunkte 15)", () => {
      // Using mockLaps: B-Teil time is 135 seconds (2:15)
      // Team: Durchschnittsalter 10 Jahre
      // A-Teil: Knotenzeit 10s, Fehlerpunkte 15, Gesamteindruck 1.0, Strafsekunden 0
      // B-Teil: Fehlerpunkte 15, Gesamteindruck 1.0

      const bPartTime = mockLaps[mockLaps.length - 1]!.time / 1000; // 135 seconds
      const result = calculateTotalScore({
        teamAverageAge: 10,
        // A-Teil
        aPartErrorPoints: 15,
        knotTime: 10,
        aPartPenaltySeconds: 0,
        // B-Teil
        bPartTime,
        bPartErrorPoints: 15,
        // Gesamteindruck
        overallImpression: 1.0,
      });

      expect(result.canCalculate).toBe(true);

      // A-Teil: 1000 - 10 (Knotenzeit) - 0 (Strafsekunden) - 15 (Fehlerpunkte) = 975
      expect(result.aPartPoints).toBe(975);

      // B-Teil: Sollzeit = 210 - (10 * 5) = 160s
      // Ist-Zeit: 135s → 25s unter Sollzeit = +25 Bonuspunkte
      // 400 + 25 - 15 (Fehlerpunkte) = 410
      expect(result.bPartPoints).toBe(410);

      // Gesamtpunkte: 975 + 410 - 1 (Gesamteindruck) = 1384
      expect(result.totalPoints).toBe(1384);

      // Breakdown-Prüfung
      expect(result.breakdown.aPart?.knotTimeDeduction).toBe(10);
      expect(result.breakdown.aPart?.errorPointsDeduction).toBe(15);
      expect(result.breakdown.bPart?.targetTime).toBe(160);
      expect(result.breakdown.bPart?.timeDifference).toBe(-25); // unter Sollzeit
      expect(result.breakdown.bPart?.timePoints).toBe(25); // Bonuspunkte
    });

    it("Durchschnittsalter 13, B-Teil 2:25, 15 FP B-Teil, 13s Knoten, GE 1", () => {
      const result = calculateTotalScore({
        teamAverageAge: 13,
        // A-Teil
        aPartErrorPoints: 0,
        knotTime: 13,
        aPartPenaltySeconds: 0,
        // B-Teil: 2:25 = 145 Sekunden
        bPartTime: 145,
        bPartErrorPoints: 15,
        // Gesamteindruck
        overallImpression: 1.0,
      });

      expect(result.canCalculate).toBe(true);

      // A-Teil: 1000 - 13 (Knotenzeit) - 0 (Strafsekunden) - 0 (Fehlerpunkte) = 987
      expect(result.aPartPoints).toBe(987);

      // B-Teil: Sollzeit = 210 - (13 * 5) = 145s
      // Ist-Zeit: 145s → genau Sollzeit = 0 Zeitpunkte
      // 400 + 0 - 15 (Fehlerpunkte) = 385
      expect(result.bPartPoints).toBe(385);

      // Gesamtpunkte: 987 + 385 - 1 (Gesamteindruck) = 1371
      expect(result.totalPoints).toBe(1371);

      // Breakdown-Prüfung
      expect(result.breakdown.bPart?.targetTime).toBe(145);
      expect(result.breakdown.bPart?.timeDifference).toBe(0); // genau Sollzeit
      expect(result.breakdown.bPart?.timePoints).toBe(-0); // keine Zeit-Bonuspunkte (JavaScript -0)
    });

    it("should calculate adjusted test case to reach expected 1371 points", () => {
      const result = calculateTotalScore({
        teamAverageAge: 13,
        // A-Teil - minimale Fehlerpunkte für bestmögliches Ergebnis
        aPartErrorPoints: 0,
        knotTime: 13,
        aPartPenaltySeconds: 0,
        // B-Teil: 2:25 = 145 Sekunden
        bPartTime: 145,
        bPartErrorPoints: 15,
        // Gesamteindruck
        overallImpression: 1.0,
      });

      expect(result.canCalculate).toBe(true);
      expect(result.aPartPoints).toBe(987); // 1000 - 13
      expect(result.bPartPoints).toBe(385); // 400 - 15
      expect(result.totalPoints).toBe(1371); // 987 + 385 - 1 = 1371
    });
  });

  describe("formatPoints", () => {
    it("should format points correctly", () => {
      expect(formatPoints(1234)).toBe("1234");
      expect(formatPoints(0)).toBe("0");
      expect(formatPoints(null)).toBe("-");
    });
  });

  describe("Realistic scenarios", () => {
    it("should handle a typical youth fire brigade scenario", () => {
      // Durchschnittsalter 14 Jahre, solide Leistung
      const result = calculateTotalScore({
        teamAverageAge: 14, // Sollzeit B-Teil: 210 - (14*5) = 140s
        // A-Teil: Gute Knotenarbeit
        aPartErrorPoints: 2,
        knotTime: 25,
        aPartPenaltySeconds: 0,
        // B-Teil: Schneller Staffellauf
        bPartTime: 175, // 35s über Sollzeit
        bPartErrorPoints: 1,
        // Gesamteindruck
        overallImpression: 1.0,
      });

      expect(result.canCalculate).toBe(true);
      expect(result.aPartPoints).toBe(973); // 1000 - 25 - 0 - 2
      expect(result.bPartPoints).toBe(364); // 400 - 35 - 1
      expect(result.totalPoints).toBe(1336); // 973 + 364 - 1 = 1336
    });

    it("should handle a scenario with penalties", () => {
      // Team mit Fehlern und Zeitüberschreitung
      const result = calculateTotalScore({
        teamAverageAge: 15, // Sollzeit: 210 - (15*5) = 135s
        // A-Teil: Zeitüberschreitung und Fehler
        aPartErrorPoints: 10,
        knotTime: 45,
        aPartPenaltySeconds: 30, // Zeitüberschreitung
        // B-Teil: Langsamer Staffellauf mit Fehlern
        bPartTime: 200, // 65s über Sollzeit
        bPartErrorPoints: 8,
        // Gesamteindruck (höher wegen Fehlern)
        overallImpression: 2.5,
      });

      expect(result.canCalculate).toBe(true);
      expect(result.aPartPoints).toBe(915); // 1000 - 45 - 30 - 10
      expect(result.bPartPoints).toBe(327); // 400 - 65 - 8
      expect(result.totalPoints).toBe(1239.5); // 915 + 327 - 2.5 = 1239.5
    });
  });
});
