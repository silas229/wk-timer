import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SharedRoundCard } from "@/components/shared-round-card";

describe("SharedRoundCard", () => {
  it("uses the same point calculation as the local history dialog", () => {
    render(
      <SharedRoundCard
        roundData={{
          id: "round-1",
          completedAt: "2025-01-01T10:00:00.000Z",
          totalTime: 140500,
          laps: [],
          teamName: "Team 1",
          aPartErrorPoints: 20,
          knotTime: 10,
          aPartPenaltySeconds: 5,
          bPartErrorPoints: 10,
          overallImpression: 1.5,
          teamAverageAge: 15,
        }}
        activities={[]}
      />,
    );

    expect(screen.getByText("1347.5 Punkte")).toBeInTheDocument();
  });
});
