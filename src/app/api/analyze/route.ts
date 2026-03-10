import { NextRequest, NextResponse } from "next/server";
import { getAnalysisService } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import type { PlayerProfile } from "@/types";

export const maxDuration = 60; // Allow up to 60 seconds for AI analysis

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, remaining } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" } }
      );
    }

    const profile: PlayerProfile = await request.json();

    // Validate required fields
    if (!profile.firstName || !profile.lastName) {
      return NextResponse.json(
        { success: false, error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (!profile.position) {
      return NextResponse.json(
        { success: false, error: "Position is required" },
        { status: 400 }
      );
    }

    // Run AI analysis
    const analysisService = getAnalysisService();
    const result = await analysisService.analyzePlayer(profile);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
