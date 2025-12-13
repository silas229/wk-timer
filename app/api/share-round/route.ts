import { NextRequest, NextResponse } from "next/server";
import { getRoundStorage } from "@/lib/round-storage-factory";
import type { SharedRoundData } from "@/lib/round-storage";
import { getBaseUrl } from "@/lib/base-url";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest) {
  try {
    const roundData = await request.json();

    // Validate required fields
    if (!roundData || !roundData.id || !roundData.laps || !roundData.teamName) {
      return NextResponse.json(
        { error: "Invalid round data" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use the existing round ID as the shareable ID (since it's already a UUID)
    const shareableId = roundData.id;

    // Create shared round data
    const sharedRound: SharedRoundData = {
      id: shareableId,
      completedAt: roundData.completedAt,
      totalTime: roundData.totalTime,
      laps: roundData.laps,
      teamName: roundData.teamName,
      // Prefer explicit top-level description, but also support description inside roundData
      description: roundData.description || undefined,
      // Include scoring data if available
      aPartErrorPoints: roundData.aPartErrorPoints,
      knotTime: roundData.knotTime,
      aPartPenaltySeconds: roundData.aPartPenaltySeconds,
      bPartErrorPoints: roundData.bPartErrorPoints,
      overallImpression: roundData.overallImpression,
      teamAverageAge: roundData.teamAverageAge,
    };

    // Store the shared round using the storage abstraction
    const storage = getRoundStorage();
    await storage.store(shareableId, sharedRound);

    // Generate the shareable URL
    const baseUrl = getBaseUrl();
    const sharedUrl = `${baseUrl}/shared/${shareableId}`;

    return NextResponse.json(
      {
        success: true,
        shareableId,
        sharedUrl,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error sharing round:", error);
    return NextResponse.json(
      { error: "Failed to share round" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("id");

    if (!roundId) {
      return NextResponse.json(
        { error: "Round ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Retrieve the shared round using the storage abstraction
    const storage = getRoundStorage();
    const sharedRound = await storage.retrieve(roundId);

    if (!sharedRound) {
      return NextResponse.json(
        { error: "Shared round not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(sharedRound, { headers: corsHeaders });
  } catch (error) {
    console.error("Error retrieving round:", error);
    return NextResponse.json(
      { error: "Failed to retrieve round" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
