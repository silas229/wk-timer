import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/base-url";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const format = searchParams.get("format") || "json";

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (format !== "json") {
    return NextResponse.json(
      { error: "Only JSON format is supported" },
      { status: 501, headers: corsHeaders }
    );
  }

  // Extract the round ID from the URL
  const urlMatch = url.match(/\/shared\/([^/?]+)/);
  if (!urlMatch) {
    return NextResponse.json(
      { error: "Invalid shared URL format" },
      { status: 400, headers: corsHeaders }
    );
  }

  const roundId = urlMatch[1];

  try {
    // Fetch the round data to get title and description
    const baseUrl = getBaseUrl(request.nextUrl.origin);
    const response = await fetch(`${baseUrl}/api/share-round?id=${roundId}`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Round not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const roundData = await response.json();

    // Create oEmbed response
    const oembedResponse = {
      version: "1.0",
      type: "rich",
      width: 430,
      height: 720,
      title: `${roundData.teamName} - Geteilter Durchgang`,
      author_name: "Wettkämpfe Timer",
      author_url: baseUrl,
      provider_name: "Wettkämpfe Timer",
      provider_url: baseUrl,
      html: `<iframe src="${baseUrl}/embed/${roundId}" width="430" height="720" frameborder="0" allowfullscreen></iframe>`,
      thumbnail_url: `${baseUrl}/icon-512x512.png`,
      thumbnail_width: 512,
      thumbnail_height: 512,
    };

    return NextResponse.json(oembedResponse, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating oEmbed response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
