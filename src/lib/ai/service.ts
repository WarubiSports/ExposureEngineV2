import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { PlayerProfile, AnalysisResult, CollegeLevel, VisibilityScores } from "@/types";
import { SYSTEM_PROMPT, buildAnalysisPrompt, getGenderSpecificContext } from "./prompts";

// ============================================================================
// Zod Schemas for AI Response Validation
// ============================================================================

// AI returns array format for visibility scores
const AIVisibilityScoreSchema = z.object({
  level: z.enum(["D1", "D2", "D3", "NAIA", "JUCO"]),
  visibilityPercent: z.number().min(0).max(100),
  notes: z.string(),
});

const AIReadinessScoreSchema = z.object({
  athletic: z.number().min(0).max(100).optional(),
  technical: z.number().min(0).max(100).optional(),
  tactical: z.number().min(0).max(100).optional(),
  academic: z.number().min(0).max(100).optional(),
  market: z.number().min(0).max(100).optional(),
  overall: z.number().min(0).max(100).optional(),
});

const AIRiskFlagSchema = z.object({
  category: z.enum([
    "League", "Minutes", "Academics", "Events", "Location", "Media", "Communication", "Timeline", "Competition"
  ]).optional(),
  message: z.string().optional(),
  risk: z.string().optional(),
  mitigation: z.string().optional(),
  severity: z.enum(["Low", "Medium", "High"]).optional(),
});

const AIActionItemSchema = z.object({
  timeframe: z.enum(["Next_30_Days", "Next_90_Days", "Next_12_Months"]).optional(),
  description: z.string(),
  impact: z.enum(["High", "Medium", "Low"]).optional(),
  category: z.enum(["Outreach", "Video", "Events", "Training", "Academics"]).optional(),
});

const AIPositionAnalysisSchema = z.object({
  positionFit: z.string(),
  strengthsForPosition: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  collegePositionPrediction: z.string(),
});

const AIFunnelAnalysisSchema = z.object({
  stage: z.enum(["Invisible", "Outreach", "Conversation", "Evaluation", "Closing"]).optional(),
  status: z.enum(["invisible", "weak", "developing", "strong"]).optional(),
  conversionRate: z.string().optional(),
  responseRate: z.number().optional(),
  bottleneck: z.string().optional(),
  advice: z.string().optional(),
  assessment: z.string().optional(),
  benchmark: z.string().optional(),
  videoPenalty: z.number().optional(),
  recommendations: z.array(z.string()).optional(),
});

const AIBenchmarkMetricSchema = z.object({
  category: z.string().optional(),
  area: z.string().optional(),
  userScore: z.number().optional(),
  current: z.number().optional(),
  d1Average: z.number().optional(),
  benchmark: z.number().optional(),
  d2Average: z.number().optional(),
  d3Average: z.number().optional(),
  feedback: z.string().optional(),
  gap: z.number().optional(),
  difference: z.number().optional(),
});

const AICampRecommendationSchema = z.object({
  name: z.string(),
  type: z.string(),
  location: z.string().optional(),
  budget: z.string().optional(),
  cost: z.string().optional(),
  timing: z.string().optional(),
  reason: z.string().optional(),
  reasoning: z.string().optional(),
});

const AIBestFitDivisionSchema = z.object({
  level: z.enum(["D1", "D2", "D3", "NAIA", "JUCO"]),
  reasoning: z.string(),
});

// Full AI response schema (flexible to handle AI variations)
const AIResponseSchema = z.object({
  visibilityScores: z.array(AIVisibilityScoreSchema),
  readinessScore: AIReadinessScoreSchema.optional(),
  overallScore: z.number().min(0).max(100),
  bucket: z.enum(["Elite", "Strong", "Developing", "Limited", "Challenging"]).optional(),
  rating: z.string().optional(),
  tags: z.array(z.string()).optional(),
  keyStrengths: z.array(z.string()),
  keyRisks: z.array(AIRiskFlagSchema),
  positionAnalysis: AIPositionAnalysisSchema.optional(),
  actionPlan: z.union([
    z.array(AIActionItemSchema),
    z.object({
      immediate: z.array(z.string()),
      shortTerm: z.array(z.string()),
      longTerm: z.array(z.string()).optional(),
    }),
  ]).optional(),
  plainLanguageSummary: z.string(),
  coachShortEvaluation: z.string().optional(),
  bestFitDivision: AIBestFitDivisionSchema.optional(),
  funnelAnalysis: AIFunnelAnalysisSchema.optional(),
  benchmarkAnalysis: z.union([
    z.array(AIBenchmarkMetricSchema),
    z.object({ gaps: z.array(AIBenchmarkMetricSchema).optional() }),
  ]).optional(),
  campRecommendations: z.array(AICampRecommendationSchema).optional(),
  emailTemplateSuggestion: z.string().optional(),
});

// ============================================================================
// Transform AI Response to App Types
// ============================================================================

function transformAIResponse(aiResponse: z.infer<typeof AIResponseSchema>): AnalysisResult {
  // Transform visibility scores from array to record
  const visibilityScores: VisibilityScores = {
    D1: { score: 0, reasoning: "" },
    D2: { score: 0, reasoning: "" },
    D3: { score: 0, reasoning: "" },
    NAIA: { score: 0, reasoning: "" },
    JUCO: { score: 0, reasoning: "" },
  };

  for (const score of aiResponse.visibilityScores) {
    visibilityScores[score.level] = {
      score: score.visibilityPercent,
      reasoning: score.notes,
    };
  }

  // Transform key risks
  const keyRisks = aiResponse.keyRisks.map(risk => ({
    risk: risk.risk || risk.message || "",
    mitigation: risk.mitigation || "Address this concern to improve visibility",
  }));

  // Transform action plan
  let actionPlan: { immediate: string[]; shortTerm: string[]; longTerm?: string[] };
  if (Array.isArray(aiResponse.actionPlan)) {
    const items = aiResponse.actionPlan;
    actionPlan = {
      immediate: items.filter(a => a.timeframe === "Next_30_Days").map(a => a.description),
      shortTerm: items.filter(a => a.timeframe === "Next_90_Days").map(a => a.description),
      longTerm: items.filter(a => a.timeframe === "Next_12_Months").map(a => a.description),
    };
  } else if (aiResponse.actionPlan) {
    actionPlan = aiResponse.actionPlan;
  } else {
    actionPlan = { immediate: [], shortTerm: [] };
  }

  // Transform funnel analysis
  const funnelAnalysis = aiResponse.funnelAnalysis ? {
    status: aiResponse.funnelAnalysis.status ||
      (aiResponse.funnelAnalysis.stage === "Invisible" ? "invisible" :
       aiResponse.funnelAnalysis.stage === "Outreach" ? "weak" :
       aiResponse.funnelAnalysis.stage === "Conversation" ? "developing" : "strong") as "invisible" | "weak" | "developing" | "strong",
    responseRate: aiResponse.funnelAnalysis.responseRate ||
      (aiResponse.funnelAnalysis.conversionRate ? parseFloat(aiResponse.funnelAnalysis.conversionRate) : 0),
    assessment: aiResponse.funnelAnalysis.assessment || aiResponse.funnelAnalysis.advice || "",
    videoPenalty: aiResponse.funnelAnalysis.videoPenalty,
    recommendations: aiResponse.funnelAnalysis.recommendations,
  } : undefined;

  // Transform benchmark analysis
  let benchmarkAnalysis: { gaps?: { area: string; current: number; benchmark: number; difference: number; }[] } | undefined;
  if (aiResponse.benchmarkAnalysis) {
    if (Array.isArray(aiResponse.benchmarkAnalysis)) {
      benchmarkAnalysis = {
        gaps: aiResponse.benchmarkAnalysis.map(b => ({
          area: b.area || b.category || "Unknown",
          current: b.current || b.userScore || 0,
          benchmark: b.benchmark || b.d1Average || 0,
          difference: b.difference || b.gap || 0,
        })),
      };
    } else if ('gaps' in aiResponse.benchmarkAnalysis && aiResponse.benchmarkAnalysis.gaps) {
      benchmarkAnalysis = {
        gaps: aiResponse.benchmarkAnalysis.gaps.map(b => ({
          area: b.area || b.category || "Unknown",
          current: b.current || b.userScore || 0,
          benchmark: b.benchmark || b.d1Average || 0,
          difference: b.difference || b.gap || 0,
        })),
      };
    }
  }

  // Transform camp recommendations
  const campRecommendations = aiResponse.campRecommendations?.map(camp => ({
    name: camp.name,
    location: camp.location,
    type: camp.type,
    cost: camp.cost || camp.budget,
    reasoning: camp.reasoning || camp.reason || "",
    timing: camp.timing,
  }));

  // Transform readiness score
  const readinessScore = aiResponse.readinessScore ? {
    playingLevel: aiResponse.readinessScore.athletic,
    academics: aiResponse.readinessScore.academic,
    exposure: aiResponse.readinessScore.market,
    timeline: aiResponse.readinessScore.tactical,
    materials: aiResponse.readinessScore.technical,
    ...aiResponse.readinessScore,
  } : undefined;

  return {
    visibilityScores,
    readinessScore,
    overallScore: aiResponse.overallScore,
    bucket: aiResponse.bucket,
    rating: aiResponse.rating,
    tags: aiResponse.tags,
    keyStrengths: aiResponse.keyStrengths,
    keyRisks,
    actionPlan,
    positionAnalysis: aiResponse.positionAnalysis,
    plainLanguageSummary: aiResponse.plainLanguageSummary,
    coachShortEvaluation: aiResponse.coachShortEvaluation,
    bestFitDivision: aiResponse.bestFitDivision,
    funnelAnalysis,
    benchmarkAnalysis,
    campRecommendations,
    emailTemplateSuggestion: aiResponse.emailTemplateSuggestion,
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

  // League bonus
  const leagueScores: Record<string, number> = {
    MLS_NEXT: 30,
    ECNL: 25,
    Girls_Academy: 22,
    USL_Academy: 20,
    USYS_National: 15,
    ECNL_RL: 12,
    NPL: 10,
    High_School: 5,
    Club_Local: 3,
    Rec: 1,
    Other: 2,
  };

  const topLeague = profile.seasons.reduce((max, s) => {
    const current = leagueScores[s.league] || 0;
    return current > max ? current : max;
  }, 0);
  score += topLeague;

  // Video bonus
  if (profile.hasVideo) score += 10;

  // Outreach bonus
  if (profile.coachesContacted > 20) score += 5;
  if (profile.responsesReceived > 5) score += 5;

  // Academic bonus
  if (profile.gpa && profile.gpa >= 3.5) score += 5;
  if (profile.gpa && profile.gpa >= 3.0) score += 3;

  return Math.min(100, Math.max(0, score));
}
