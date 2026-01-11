// ============================================================================
// ExposureEngine Types
// ============================================================================

// Youth League Tiers (ranked by visibility)
export type YouthLeague =
  | "MLS_NEXT"           // #1 Boys - Premier boys league, direct pathway to MLS academies
  | "ECNL"               // #1 Girls / #2 Boys - Premier girls league, highly competitive boys
  | "Girls_Academy"      // #2 Girls - Growing, catching up to ECNL
  | "USL_Academy"        // Growing, professional pathway focus
  | "USYS_National"      // Strong regional competition
  | "USYS_National_League" // Alias for USYS_National
  | "ECNL_RL"            // ECNL Regional League - development tier
  | "NPL"                // National Premier Leagues - regional quality varies
  | "High_School"        // Limited recruiting value (more relevant for girls)
  | "Elite_Local"        // Minimal D1 exposure
  | "Club_Local"         // Local club (alias)
  | "Rec"                // Recreational
  | "Other";

// College Division Levels
export type CollegeLevel = "D1" | "D2" | "D3" | "NAIA" | "JUCO";

// Player Positions
export type Position =
  | "GK"   // Goalkeeper
  | "CB"   // Center Back
  | "LB"   // Left Back
  | "RB"   // Right Back
  | "CDM"  // Defensive Midfielder
  | "CM"   // Central Midfielder
  | "CAM"  // Attacking Midfielder
  | "LM"   // Left Midfielder
  | "RM"   // Right Midfielder
  | "LW"   // Left Wing
  | "RW"   // Right Wing
  | "ST"   // Striker
  | "CF";  // Center Forward

// Experience Levels
export type ExperienceLevel =
  | "elite"           // Elite (Top-tier national)
  | "high"            // High (Regional/state level)
  | "moderate"        // Moderate (Competitive local)
  | "developing"      // Developing (Recreational+)
  | "Youth_Club_Only"
  | "High_School_Varsity"
  | "Adult_Amateur_League"
  | "Semi_Pro_UPSL_NPSL_WPSL"
  | "International_Academy_U19"
  | "Pro_Academy_Reserve";

// Gender
export type Gender = "Male" | "Female";

// Dominant Foot
export type DominantFoot = "Right" | "Left" | "Both";

// Athletic Rating Scale
export type AthleticRating =
  | "Below_Average"
  | "Average"
  | "Above_Average"
  | "Top_10_Percent"
  | "Elite";

// ============================================================================
// Season & Event Types
// ============================================================================

export interface SeasonStat {
  year: number;
  teamName: string;
  league: YouthLeague[];
  minutesPlayedPercent: number;
  mainRole: "Key_Starter" | "Rotation" | "Bench" | "Injured";
  goals: number;
  assists: number;
  honors: string;
}

export interface ExposureEvent {
  name: string;
  type: "Showcase" | "ID_Camp" | "ODP" | "HS_Playoffs" | "Other";
  collegesNoted: string;
}

// Simplified Season type for form input
export interface Season {
  year: number;
  league: YouthLeague;
  teamName: string;
  level?: string;
  gamesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets?: number;
}

// Simplified Event type for form input
export interface Event {
  name: string;
  type: "showcase" | "id_camp" | "tournament" | "training";
  date: string;
  location: string;
}

// ============================================================================
// Profile Types
// ============================================================================

export interface AcademicProfile {
  graduationYear: number;
  gpa: number;
  testScore?: string;
}

export interface AthleticProfile {
  // Simple metrics for form input
  fortyYardDash?: string;
  mileTime?: string;
  beepTestLevel?: number;
  // Detailed ratings (optional)
  speed?: AthleticRating;
  strength?: AthleticRating;
  endurance?: AthleticRating;
  workRate?: AthleticRating;
  technical?: AthleticRating;
  tactical?: AthleticRating;
}

export interface PlayerProfile {
  firstName: string;
  lastName: string;
  email?: string;
  gender: Gender;
  dateOfBirth?: string;
  citizenship?: string;
  experienceLevel: ExperienceLevel;
  position: Position;
  secondaryPositions?: Position[];
  dominantFoot?: DominantFoot;
  height?: string;
  gradYear: number;
  state: string;
  seasons: Season[];
  events: Event[];
  // Academics (simplified)
  gpa?: number;
  testScore?: string;
  // Athletic profile
  athleticProfile?: AthleticProfile;
  // Market Reality Fields
  hasVideo: boolean;
  videoAge?: "current" | "6_months" | "12_months" | "older";
  videoQuality?: "professional" | "good" | "poor";
  coachesContacted: number;
  responsesReceived: number;
  offersReceived: number;
}

// ============================================================================
// Analysis Result Types
// ============================================================================

// Visibility score per division
export interface VisibilityScoreItem {
  score: number;
  reasoning: string;
}

export type VisibilityScores = Record<CollegeLevel, VisibilityScoreItem>;

// Readiness score breakdown
export interface ReadinessScore {
  playingLevel?: number;
  academics?: number;
  exposure?: number;
  timeline?: number;
  materials?: number;
  // Legacy fields for compatibility
  athletic?: number;
  technical?: number;
  tactical?: number;
  academic?: number;
  market?: number;
  overall?: number;
}

// Risk with mitigation
export interface RiskItem {
  risk: string;
  mitigation: string;
}

// Action plan structure
export interface ActionPlan {
  immediate: string[];
  shortTerm: string[];
  longTerm?: string[];
}

// Funnel analysis
export interface FunnelAnalysis {
  status: "invisible" | "weak" | "developing" | "strong";
  responseRate: number;
  assessment: string;
  videoPenalty?: number;
  recommendations?: string[];
  // Legacy fields
  stage?: string;
  conversionRate?: string;
  bottleneck?: string;
  advice?: string;
  benchmark?: string;
}

// Benchmark analysis
export interface BenchmarkAnalysis {
  gaps?: {
    area: string;
    current: number;
    benchmark: number;
    difference: number;
  }[];
}

// Camp recommendation
export interface CampRecommendation {
  name: string;
  location?: string;
  type: string;
  cost?: string;
  reasoning: string;
  timing?: string;
}

// Position analysis
export interface PositionSpecificAnalysis {
  positionFit: string;
  strengthsForPosition: string[];
  areasToImprove: string[];
  collegePositionPrediction: string;
}

// Best fit division
export interface BestFitDivision {
  level: CollegeLevel;
  reasoning: string;
}

// Main analysis result
export interface AnalysisResult {
  // Core Scores
  visibilityScores: VisibilityScores;
  readinessScore?: ReadinessScore;
  overallScore: number;
  bucket?: string;
  rating?: string;
  tags?: string[];

  // Detailed Analysis
  keyStrengths: string[];
  keyRisks: RiskItem[];
  actionPlan: ActionPlan;
  positionAnalysis?: PositionSpecificAnalysis;

  // Narratives
  plainLanguageSummary: string;
  coachShortEvaluation?: string;
  bestFitDivision?: BestFitDivision;

  // Funnel & Benchmarks
  funnelAnalysis?: FunnelAnalysis;
  benchmarkAnalysis?: BenchmarkAnalysis;

  // Recommendations
  campRecommendations?: CampRecommendation[];
  emailTemplateSuggestion?: string;
}

// ============================================================================
// Database Types (Supabase)
// ============================================================================

export interface Evaluation {
  id: string;
  created_at: string;
  updated_at?: string;

  // Player Info
  first_name: string;
  last_name: string;
  email?: string;
  gender: Gender;
  date_of_birth?: string;
  grad_year: number;
  state: string;
  citizenship?: string;
  position: Position;
  secondary_positions: Position[];
  height?: string;
  dominant_foot: DominantFoot;

  // Experience
  experience_level: ExperienceLevel;
  seasons: Season[];
  events: Event[];

  // Academics
  gpa?: number;
  test_score?: string;

  // Athletic Profile
  athletic_profile: AthleticProfile;

  // Market Reality
  has_video: boolean;
  video_age?: string;
  video_quality?: string;
  coaches_contacted: number;
  responses_received: number;
  offers_received: number;

  // AI Results
  visibility_scores?: VisibilityScores;
  readiness_score?: ReadinessScore;
  overall_score?: number;
  bucket?: string;
  rating?: string;
  tags?: string[];
  key_strengths?: string[];
  key_risks?: RiskItem[];
  action_plan?: ActionPlan;
  position_analysis?: PositionSpecificAnalysis;
  plain_language_summary?: string;
  coach_short_evaluation?: string;
  best_fit_division?: BestFitDivision;
  funnel_analysis?: FunnelAnalysis;
  benchmark_analysis?: BenchmarkAnalysis;
  camp_recommendations?: CampRecommendation[];
  email_template_suggestion?: string;

  // Meta
  status: "pending" | "processing" | "completed" | "error";
}

export interface PathwayLead {
  id: string;
  created_at: string;
  role: "player" | "parent" | "coach";
  name: string;
  email: string;
  age?: string;
  grad_year?: string;
  goals: string[];
  current_level?: string;
  budget_preference?: string;
  gap_year_interest: boolean;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "closed";
  notes?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const LEAGUES: YouthLeague[] = [
  "MLS_NEXT",
  "ECNL",
  "Girls_Academy",
  "USL_Academy",
  "USYS_National_League",
  "ECNL_RL",
  "NPL",
  "High_School",
  "Elite_Local",
  "Other",
];

export const POSITIONS: Position[] = [
  "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"
];

export const LEVELS: CollegeLevel[] = [
  "D1", "D2", "D3", "NAIA", "JUCO"
];

export const ATHLETIC_RATINGS: AthleticRating[] = [
  "Below_Average",
  "Average",
  "Above_Average",
  "Top_10_Percent",
  "Elite",
];

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

// ============================================================================
// League Tier Data (from research)
// ============================================================================

export const LEAGUE_VISIBILITY_WEIGHTS: Record<YouthLeague, Record<CollegeLevel, number>> = {
  MLS_NEXT: { D1: 90, D2: 95, D3: 100, NAIA: 100, JUCO: 100 },
  ECNL: { D1: 85, D2: 95, D3: 100, NAIA: 100, JUCO: 100 },
  Girls_Academy: { D1: 80, D2: 90, D3: 100, NAIA: 100, JUCO: 100 },
  USL_Academy: { D1: 70, D2: 85, D3: 95, NAIA: 100, JUCO: 100 },
  USYS_National: { D1: 60, D2: 80, D3: 95, NAIA: 100, JUCO: 100 },
  USYS_National_League: { D1: 60, D2: 80, D3: 95, NAIA: 100, JUCO: 100 },
  ECNL_RL: { D1: 50, D2: 75, D3: 90, NAIA: 100, JUCO: 100 },
  NPL: { D1: 40, D2: 70, D3: 90, NAIA: 100, JUCO: 100 },
  High_School: { D1: 20, D2: 50, D3: 80, NAIA: 95, JUCO: 100 },
  Elite_Local: { D1: 10, D2: 40, D3: 70, NAIA: 90, JUCO: 100 },
  Club_Local: { D1: 10, D2: 40, D3: 70, NAIA: 90, JUCO: 100 },
  Rec: { D1: 2, D2: 15, D3: 40, NAIA: 60, JUCO: 80 },
  Other: { D1: 5, D2: 30, D3: 60, NAIA: 80, JUCO: 90 },
};

// College level statistics
export const COLLEGE_STATS = {
  D1: {
    schools: { men: 212, women: 335 },
    rosterSize: 28,
    scholarships: 28,
    percentFromHS: 1.1,
    internationalPercent: { men: 37, women: 11 },
  },
  D2: {
    schools: { men: 270, women: 270 },
    rosterSize: 31,
    scholarships: 9,
    percentFromHS: 2.5,
    internationalPercent: { men: 25, women: 8 },
  },
  D3: {
    schools: { men: 415, women: 450 },
    rosterSize: 29,
    scholarships: 0,
    percentFromHS: 4.3,
    internationalPercent: { men: 10, women: 5 },
  },
  NAIA: {
    schools: { men: 188, women: 200 },
    rosterSize: 30,
    scholarships: 12,
    percentFromHS: 3.0,
    internationalPercent: { men: 20, women: 10 },
  },
  JUCO: {
    schools: { men: 217, women: 150 },
    rosterSize: 19,
    scholarships: 24,
    percentFromHS: 2.0,
    internationalPercent: { men: 15, women: 5 },
  },
};

// Academic requirements by level
export const ACADEMIC_REQUIREMENTS = {
  D1: { minGPA: 2.3, coreCoursesRequired: 16 },
  D2: { minGPA: 2.2, coreCoursesRequired: 16 },
  D3: { minGPA: null, coreCoursesRequired: null }, // School-specific
  NAIA: { minGPA: 2.0, coreCoursesRequired: null },
  JUCO: { minGPA: null, coreCoursesRequired: null },
};
