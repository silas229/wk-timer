import { NextRequest, NextResponse } from "next/server";

// Interface for shared round data
interface SharedRoundData {
  id: string; // UUID that serves as both local and shareable ID
  completedAt: string;
  totalTime: number;
  laps: Array<{
    lapNumber: number;
    time: number;
    timestamp: string;
  }>;
  teamName: string;
  description?: string;
}

// TODO: Replace with a proper database or persistent storage
const sharedRounds: Map<string, SharedRoundData> = new Map();

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roundData, description } = body;

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
      description: description || undefined,
    };

    // Store the shared round
    sharedRounds.set(shareableId, sharedRound);

    // Generate the shareable URL
    const baseUrl = request.nextUrl.origin;
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
  const { searchParams } = new URL(request.url);
  const roundId = searchParams.get("id");

  if (!roundId) {
    return NextResponse.json(
      { error: "Round ID is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  const sharedRound = sharedRounds.get(roundId);

  if (!sharedRound) {
    return NextResponse.json(
      { error: "Shared round not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json(sharedRound, { headers: corsHeaders });
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
