import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { PlayerProfile, AnalysisResult, VisibilityScore, ReadinessScore, RiskFlag, ActionItem, FunnelAnalysis, BenchmarkMetric } from "@/types";
import { NARRATIVE_SYSTEM_PROMPT, buildNarrativePrompt, getGenderSpecificContext } from "./prompts";
import { computeAllScores, type ComputedScores } from "@/lib/scoring";

// ============================================================================
// Zod Schemas for AI Narrative Response Validation
// AI only generates narrative content - scores are computed server-side
// ============================================================================

const AIRiskFlagSchema = z.object({
  category: z.string(),
  message: z.string(),
  severity: z.enum(["Low", "Medium", "High"]),
});

const AIActionItemSchema = z.object({
  timeframe: z.enum(["Next_30_Days", "Next_90_Days", "Next_12_Months"]),
  description: z.string(),
  impact: z.enum(["High", "Medium", "Low"]),
});

// Narrative-only response schema - AI provides text, server provides numbers
const AINarrativeResponseSchema = z.object({
  keyStrengths: z.array(z.string()),
  keyRisks: z.array(AIRiskFlagSchema),
  actionPlan: z.array(AIActionItemSchema),
  plainLanguageSummary: z.string(),
  coachShortEvaluation: z.string(),
});

// ============================================================================
// Combine Server Scores with AI Narrative
// ============================================================================

function combineScoresAndNarrative(
  computedScores: ComputedScores,
  aiNarrative: z.infer<typeof AINarrativeResponseSchema>
): AnalysisResult {
  // Transform key risks
  const keyRisks: RiskFlag[] = aiNarrative.keyRisks.map(risk => ({
    category: risk.category,
    message: risk.message,
    severity: risk.severity,
  }));

  // Transform action plan
  const actionPlan: ActionItem[] = aiNarrative.actionPlan.map(item => ({
    timeframe: item.timeframe,
    description: item.description,
    impact: item.impact,
  }));

  return {
    // Server-computed scores (deterministic)
    visibilityScores: computedScores.visibilityScores,
    readinessScore: computedScores.readinessScore,
    benchmarkAnalysis: computedScores.benchmarkAnalysis,
    funnelAnalysis: computedScores.funnelAnalysis,
    // AI-generated narrative (creative text)
    keyStrengths: aiNarrative.keyStrengths,
    keyRisks,
    actionPlan,
    plainLanguageSummary: aiNarrative.plainLanguageSummary,
    coachShortEvaluation: aiNarrative.coachShortEvaluation,
  };
}

// ============================================================================
// AI Service
// ============================================================================

export class ExposureAnalysisService {
  private genai: GoogleGenAI;
  private modelName = "gemini-2.0-flash";

  constructor(apiKey: string) {
    this.genai = new GoogleGenAI({ apiKey });
  }

  async analyzePlayer(profile: PlayerProfile): Promise<AnalysisResult> {
    // Step 1: Compute all scores server-side (deterministic)
    const computedScores = computeAllScores(profile);

    // Step 2: Build prompt with pre-computed scores for AI narrative generation
    const userPrompt = buildNarrativePrompt(profile, computedScores);
    const genderContext = getGenderSpecificContext(profile.gender);

    const fullSystemPrompt = `${NARRATIVE_SYSTEM_PROMPT}\n\n${genderContext}`;

    try {
      const response = await this.genai.models.generateContent({
        model: this.modelName,
        contents: userPrompt,
        config: {
          systemInstruction: fullSystemPrompt,
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI model");
      }

      // Parse and validate the narrative response
      const parsed = JSON.parse(text);
      const validated = AINarrativeResponseSchema.parse(parsed);

      // Combine server scores with AI narrative
      return combineScoresAndNarrative(computedScores, validated);
    } catch (error) {
      console.error("AI Analysis Error:", error);

      // Return a fallback analysis with error context
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        console.error("Validation errors:", zodError.issues);
        throw new Error(`Invalid AI response format: ${zodError.issues.map(e => e.message).join(", ")}`);
      }

      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let serviceInstance: ExposureAnalysisService | null = null;

export function getAnalysisService(): ExposureAnalysisService {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  if (!serviceInstance) {
    serviceInstance = new ExposureAnalysisService(apiKey);
  }

  return serviceInstance;
}

// ============================================================================
// Quick Score Calculator (for fallback/preview)
// ============================================================================

export function calculateQuickScore(profile: PlayerProfile): number {
  let score = 50; // Base score

  // League bonus - check across all seasons
  const leagueScores: Record<string, number> = {
    MLS_NEXT: 30,
    ECNL: 25,
    Girls_Academy: 22,
    USL_Academy: 20,
    USYS_National_League: 15,
    ECNL_RL: 12,
    NPL: 10,
    High_School: 5,
    Elite_Local: 3,
    Other: 2,
  };

  const allLeagues = profile.seasons.flatMap(s => s.league);
  const topLeague = allLeagues.reduce((max, league) => {
    const current = leagueScores[league] || 0;
    return current > max ? current : max;
  }, 0);
  score += topLeague;

  // Video bonus
  if (profile.videoLink) score += 10;

  // Outreach bonus
  if (profile.coachesContacted > 20) score += 5;
  if (profile.responsesReceived > 5) score += 5;

  // Academic bonus
  if (profile.academics.gpa >= 3.5) score += 5;
  else if (profile.academics.gpa >= 3.0) score += 3;

  return Math.min(100, Math.max(0, score));
}
