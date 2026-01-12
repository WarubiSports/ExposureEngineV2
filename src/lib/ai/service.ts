import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { PlayerProfile, AnalysisResult, VisibilityScore, ReadinessScore, RiskFlag, ActionItem, FunnelAnalysis, BenchmarkMetric } from "@/types";
import { SYSTEM_PROMPT, buildAnalysisPrompt, getGenderSpecificContext } from "./prompts";

// ============================================================================
// Zod Schemas for AI Response Validation
// ============================================================================

const AIVisibilityScoreSchema = z.object({
  level: z.enum(["D1", "D2", "D3", "NAIA", "JUCO"]),
  visibilityPercent: z.number().min(0).max(100),
  notes: z.string(),
});

const AIReadinessScoreSchema = z.object({
  athletic: z.number().min(0).max(100),
  technical: z.number().min(0).max(100),
  tactical: z.number().min(0).max(100),
  academic: z.number().min(0).max(100),
  market: z.number().min(0).max(100),
});

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

const AIFunnelAnalysisSchema = z.object({
  stage: z.enum(["Invisible", "Outreach", "Conversation", "Evaluation", "Closing"]),
  conversionRate: z.string(),
  bottleneck: z.string(),
  advice: z.string(),
});

const AIBenchmarkMetricSchema = z.object({
  category: z.string(),
  userScore: z.number().min(0).max(100),
  d1Average: z.number().min(0).max(100),
  d3Average: z.number().min(0).max(100),
  feedback: z.string(),
});

// Full AI response schema matching original types
const AIResponseSchema = z.object({
  visibilityScores: z.array(AIVisibilityScoreSchema),
  readinessScore: AIReadinessScoreSchema,
  keyStrengths: z.array(z.string()),
  keyRisks: z.array(AIRiskFlagSchema),
  actionPlan: z.array(AIActionItemSchema),
  plainLanguageSummary: z.string(),
  coachShortEvaluation: z.string(),
  funnelAnalysis: AIFunnelAnalysisSchema,
  benchmarkAnalysis: z.array(AIBenchmarkMetricSchema),
});

// ============================================================================
// Transform AI Response to App Types
// ============================================================================

function transformAIResponse(aiResponse: z.infer<typeof AIResponseSchema>): AnalysisResult {
  // Transform visibility scores - ensure we have all levels
  const visibilityScores: VisibilityScore[] = aiResponse.visibilityScores.map(score => ({
    level: score.level,
    visibilityPercent: score.visibilityPercent,
    notes: score.notes,
  }));

  // Ensure all 5 levels exist
  const levels = ["D1", "D2", "D3", "NAIA", "JUCO"] as const;
  for (const level of levels) {
    if (!visibilityScores.find(v => v.level === level)) {
      visibilityScores.push({
        level,
        visibilityPercent: 0,
        notes: "Data not available",
      });
    }
  }

  // Transform readiness score
  const readinessScore: ReadinessScore = {
    athletic: aiResponse.readinessScore.athletic,
    technical: aiResponse.readinessScore.technical,
    tactical: aiResponse.readinessScore.tactical,
    academic: aiResponse.readinessScore.academic,
    market: aiResponse.readinessScore.market,
  };

  // Transform key risks
  const keyRisks: RiskFlag[] = aiResponse.keyRisks.map(risk => ({
    category: risk.category,
    message: risk.message,
    severity: risk.severity,
  }));

  // Transform action plan
  const actionPlan: ActionItem[] = aiResponse.actionPlan.map(item => ({
    timeframe: item.timeframe,
    description: item.description,
    impact: item.impact,
  }));

  // Transform funnel analysis
  const funnelAnalysis: FunnelAnalysis = {
    stage: aiResponse.funnelAnalysis.stage,
    conversionRate: aiResponse.funnelAnalysis.conversionRate,
    bottleneck: aiResponse.funnelAnalysis.bottleneck,
    advice: aiResponse.funnelAnalysis.advice,
  };

  // Transform benchmark analysis
  const benchmarkAnalysis: BenchmarkMetric[] = aiResponse.benchmarkAnalysis.map(metric => ({
    category: metric.category,
    userScore: metric.userScore,
    d1Average: metric.d1Average,
    d3Average: metric.d3Average,
    feedback: metric.feedback,
  }));

  return {
    visibilityScores,
    readinessScore,
    keyStrengths: aiResponse.keyStrengths,
    keyRisks,
    actionPlan,
    plainLanguageSummary: aiResponse.plainLanguageSummary,
    coachShortEvaluation: aiResponse.coachShortEvaluation,
    funnelAnalysis,
    benchmarkAnalysis,
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
    const userPrompt = buildAnalysisPrompt(profile);
    const genderContext = getGenderSpecificContext(profile.gender);

    const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${genderContext}`;

    try {
      const response = await this.genai.models.generateContent({
        model: this.modelName,
        contents: userPrompt,
        config: {
          systemInstruction: fullSystemPrompt,
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI model");
      }

      // Parse and validate the response
      const parsed = JSON.parse(text);
      const validated = AIResponseSchema.parse(parsed);

      // Transform to app types
      return transformAIResponse(validated);
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
