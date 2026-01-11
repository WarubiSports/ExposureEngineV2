import { NextRequest, NextResponse } from "next/server";
import { getAnalysisService, calculateQuickScore } from "@/lib/ai";
import { createServerClient } from "@/lib/supabase/server";
import type { PlayerProfile, AnalysisResult, Evaluation } from "@/types";

export const maxDuration = 60; // Allow up to 60 seconds for AI analysis

export async function POST(request: NextRequest) {
  try {
    const profile: PlayerProfile = await request.json();

    // Validate required fields
    if (!profile.firstName || !profile.lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (!profile.position) {
      return NextResponse.json(
        { error: "Position is required" },
        { status: 400 }
      );
    }

    // Calculate quick score for immediate feedback
    const quickScore = calculateQuickScore(profile);

    // Run AI analysis
    const analysisService = getAnalysisService();
    const analysisResult = await analysisService.analyzePlayer(profile);

    // Save to Supabase if configured
    let evaluationId: string | null = null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createServerClient();

        const evaluationData: Partial<Evaluation> = {
          first_name: profile.firstName,
          last_name: profile.lastName,
          email: profile.email,
          gender: profile.gender,
          date_of_birth: profile.dateOfBirth,
          grad_year: profile.gradYear,
          state: profile.state,
          citizenship: profile.citizenship,
          position: profile.position,
          secondary_positions: profile.secondaryPositions,
          height: profile.height,
          dominant_foot: profile.dominantFoot,
          experience_level: profile.experienceLevel,
          seasons: profile.seasons,
          events: profile.events,
          gpa: profile.gpa,
          test_score: profile.testScore,
          athletic_profile: profile.athleticProfile,
          has_video: profile.hasVideo,
          video_age: profile.videoAge,
          video_quality: profile.videoQuality,
          coaches_contacted: profile.coachesContacted,
          responses_received: profile.responsesReceived,
          offers_received: profile.offersReceived,
          visibility_scores: analysisResult.visibilityScores,
          readiness_score: analysisResult.readinessScore,
          overall_score: analysisResult.overallScore,
          bucket: analysisResult.bucket,
          rating: analysisResult.rating,
          tags: analysisResult.tags,
          key_strengths: analysisResult.keyStrengths,
          key_risks: analysisResult.keyRisks,
          action_plan: analysisResult.actionPlan,
          position_analysis: analysisResult.positionAnalysis,
          plain_language_summary: analysisResult.plainLanguageSummary,
          coach_short_evaluation: analysisResult.coachShortEvaluation,
          best_fit_division: analysisResult.bestFitDivision,
          funnel_analysis: analysisResult.funnelAnalysis,
          benchmark_analysis: analysisResult.benchmarkAnalysis,
          camp_recommendations: analysisResult.campRecommendations,
          email_template_suggestion: analysisResult.emailTemplateSuggestion,
          status: "completed",
        };

        const { data, error } = await supabase
          .from("evaluations")
          .insert(evaluationData)
          .select("id")
          .single();

        if (error) {
          console.error("Supabase save error:", error);
        } else {
          evaluationId = data?.id;
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Continue without saving - analysis still works
      }
    }

    return NextResponse.json({
      success: true,
      evaluationId,
      quickScore,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
