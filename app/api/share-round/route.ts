import { NextRequest, NextResponse } from "next/server";
import { getRoundStorage } from "@/lib/round-storage-factory";
import type { SharedRoundData } from "@/lib/round-storage";
import { getBaseUrl } from "@/lib/base-url";
import { logError, withRequest } from "@/lib/logger";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const { log, reqId } = withRequest(request, {
    route: "share-round",
    method: "POST",
  });

  try {
    const roundData = await request.json();
    const roundSummary = {
      id: roundData?.id,
      teamName: roundData?.teamName,
      lapCount: Array.isArray(roundData?.laps)
        ? roundData.laps.length
        : undefined,
    };

    log.info(
      { event: "share_round.request", round: roundSummary },
      "Share round request received"
    );

    // Validate required fields
    if (!roundData || !roundData.id || !roundData.laps || !roundData.teamName) {
      log.warn(
        { event: "share_round.validation_failed", round: roundSummary },
        "Invalid round payload"
      );
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
    await storage.store(sharedRound);
    log.info(
      {
        event: "share_round.stored",
        roundId: shareableId,
        durationMs: Date.now() - startedAt,
      },
      "Shared round stored successfully"
    );

    // Generate the shareable URL
    const baseUrl = getBaseUrl();
    const sharedUrl = `${baseUrl}/shared/${shareableId}`;

    log.info(
      {
        event: "share_round.response",
        roundId: shareableId,
        sharedUrl,
        durationMs: Date.now() - startedAt,
      },
      "Share round response sent"
    );

    return NextResponse.json(
      {
        success: true,
        shareableId,
        sharedUrl,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    logError(log, error, "Error sharing round", {
      event: "share_round.error",
      durationMs: Date.now() - startedAt,
      reqId,
    });
    return NextResponse.json(
      { error: "Failed to share round" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const { log, reqId } = withRequest(request, {
    route: "share-round",
    method: "GET",
  });

  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("id");

    if (!roundId) {
      log.warn({ event: "share_round.validation_failed" }, "Round ID missing");
      return NextResponse.json(
        { error: "Round ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Retrieve the shared round using the storage abstraction
    const storage = getRoundStorage();
    const sharedRound = await storage.retrieve(roundId);

    if (!sharedRound) {
      log.warn(
        {
          event: "share_round.not_found",
          roundId,
          durationMs: Date.now() - startedAt,
        },
        "Shared round not found"
      );
      return NextResponse.json(
        { error: "Shared round not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    log.info(
      {
        event: "share_round.retrieved",
        roundId,
        durationMs: Date.now() - startedAt,
      },
      "Shared round retrieved"
    );

    return NextResponse.json(sharedRound, { headers: corsHeaders });
  } catch (error) {
    logError(log, error, "Error retrieving shared round", {
      event: "share_round.error",
      durationMs: Date.now() - startedAt,
      reqId,
    });
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
