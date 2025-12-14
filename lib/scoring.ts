/**
 * Punkteberechnungssystem nach der Wettbewerbsordnung der Deutschen Jugendfeuerwehr (Stand 07.09.2013)
 */

export interface ScoringParameters {
  // Team-Daten
  teamAverageAge?: number;

  // A-Teil (Löschangriff)
  aPartErrorPoints?: number;
  knotTime?: number; // in Sekunden
  aPartPenaltySeconds?: number; // Strafsekunden bei Zeitüberschreitung

  // B-Teil (Staffellauf)
  bPartTime: number; // Zeit des B-Teils in Sekunden
  bPartErrorPoints?: number;

  // Gemeinsamer Gesamteindruck für beide Teile
  overallImpression?: number; // Gesamteindruck (Durchschnitt mit einer Nachkommastelle)
}

export interface ScoringResult {
  aPartPoints: number | null;
  bPartPoints: number | null;
  overallImpression: number | null;
  totalPoints: number | null;
  canCalculate: boolean;
  breakdown: {
    aPart?: {
      basePoints: number;
      knotTimeDeduction: number;
      penaltyDeduction: number;
      errorPointsDeduction: number;
      finalPoints: number;
    };
    bPart?: {
      basePoints: number;
      targetTime: number;
      timeDifference: number;
      timePoints: number;
      errorPointsDeduction: number;
      finalPoints: number;
    };
  };
}

/**
 * Berechnet die Punkte für den A-Teil (Löschangriff)
 *
 * Regeln:
 * - Start bei 1000 Punkten
 * - Vorgabezeit: 6 Minuten (360 Sekunden)
 * - Für jede Sekunde über der Zeit: -1 Punkt
 * - Knotenzeit in Sekunden: -1 Punkt je Sekunde
 * - Fehlerpunkte: direkt abziehen
 * - Gesamteindruck: Durchschnittswert als Minuspunkte
 */
export function calculateAPartPoints(params: {
  knotTime?: number;
  aPartPenaltySeconds?: number;
  aPartErrorPoints?: number;
}): { points: number | null; breakdown: ScoringResult["breakdown"]["aPart"] } {
  const { knotTime, aPartPenaltySeconds, aPartErrorPoints } = params;

  // Alle Parameter müssen gesetzt sein für eine Berechnung
  if (
    knotTime === undefined ||
    aPartPenaltySeconds === undefined ||
    aPartErrorPoints === undefined
  ) {
    return { points: null, breakdown: undefined };
  }

  const basePoints = 1000;
  const knotTimeDeduction = knotTime;
  const penaltyDeduction = aPartPenaltySeconds;
  const errorPointsDeduction = aPartErrorPoints;

  const finalPoints =
    basePoints - knotTimeDeduction - penaltyDeduction - errorPointsDeduction;

  return {
    points: Math.max(0, finalPoints), // Mindestens 0 Punkte
    breakdown: {
      basePoints,
      knotTimeDeduction,
      penaltyDeduction,
      errorPointsDeduction,
      finalPoints: Math.max(0, finalPoints),
    },
  };
}

/**
 * Berechnet die Punkte für den B-Teil (Staffellauf)
 *
 * Regeln:
 * - Start bei 400 Punkten
 * - Sollzeit = 210 - (Durchschnittsalter * 5)
 * - Differenz zur Sollzeit in Sekunden:
 *   - Unter Sollzeit: Bonuspunkte
 *   - Über Sollzeit: Minuspunkte
 * - Fehlerpunkte: direkt abziehen
 * - Gesamteindruck: Durchschnittswert als Minuspunkte
 */
export function calculateBPartPoints(params: {
  bPartTime: number;
  teamAverageAge?: number;
  bPartErrorPoints?: number;
}): { points: number | null; breakdown: ScoringResult["breakdown"]["bPart"] } {
  const { bPartTime, teamAverageAge, bPartErrorPoints } = params;

  // Alle Parameter müssen gesetzt sein für eine Berechnung
  if (teamAverageAge === undefined || bPartErrorPoints === undefined) {
    return { points: null, breakdown: undefined };
  }

  const basePoints = 400;
  const targetTime = calculateTargetTimeMs(teamAverageAge)! / 1000; // Umwandlung in Sekunden
  const timeDifference = bPartTime - targetTime;
  const timePoints = -timeDifference; // Negative Differenz = Bonus, positive = Abzug

  const finalPoints = basePoints + timePoints - bPartErrorPoints;

  return {
    points: Math.max(0, finalPoints), // Mindestens 0 Punkte
    breakdown: {
      basePoints,
      targetTime,
      timeDifference,
      timePoints,
      errorPointsDeduction: bPartErrorPoints,
      finalPoints: Math.max(0, finalPoints),
    },
  };
}

/**
 * Berechnet die Gesamtpunktzahl (A- und B-Teil)
 */
export function calculateTotalScore(params: ScoringParameters): ScoringResult {
  const aPartResult = calculateAPartPoints({
    knotTime: params.knotTime,
    aPartPenaltySeconds: params.aPartPenaltySeconds,
    aPartErrorPoints: params.aPartErrorPoints,
  });

  const bPartResult = calculateBPartPoints({
    bPartTime: params.bPartTime,
    teamAverageAge: params.teamAverageAge,
    bPartErrorPoints: params.bPartErrorPoints,
  });

  const canCalculate =
    aPartResult.points !== null && bPartResult.points !== null;
  const totalPoints = canCalculate
    ? aPartResult.points! +
      bPartResult.points! -
      (params.overallImpression || 0)
    : null;

  return {
    aPartPoints: aPartResult.points,
    bPartPoints: bPartResult.points,
    overallImpression: params.overallImpression || null,
    totalPoints,
    canCalculate,
    breakdown: {
      aPart: aPartResult.breakdown,
      bPart: bPartResult.breakdown,
    },
  };
}

/**
 * Hilfsfunktionen für die Formatierung
 */
export function formatPoints(points: number | null): string {
  if (points === null) return "-";
  return points.toString();
}

/**
 * Berechnet die Sollzeit für den B-Teil (Staffellauf) in Millisekunden
 * Formel: (210 - (Durchschnittsalter * 5)) * 1000
 *
 * @param teamAverageAge Durchschnittsalter des Teams
 * @returns Sollzeit in Millisekunden oder null wenn kein Durchschnittsalter angegeben
 */
export function calculateTargetTimeMs(teamAverageAge?: number): number | null {
  if (teamAverageAge === undefined) return null;
  return (210 - teamAverageAge * 5) * 1000;
}
