/**
 * Server-side deterministic scoring calculator
 * Computes all numerical scores deterministically - AI only generates narrative text
 */

import type {
  PlayerProfile,
  YouthLeague,
  AthleticRating,
  ExperienceLevel,
  VisibilityScore,
  ReadinessScore,
  BenchmarkMetric,
  FunnelAnalysis,
} from "@/types";

// ============================================================================
// Types
// ============================================================================

export type LeagueTier = "Elite" | "High" | "Mid" | "Low";
export type AbilityBand = "High" | "Medium" | "Low";
export type AcademicBand = "High" | "Solid" | "Risky" | "Problem";

export interface ComputedScores {
  leagueTier: LeagueTier;
  abilityBand: AbilityBand;
  academicBand: AcademicBand;
  visibilityScores: VisibilityScore[];
  readinessScore: ReadinessScore;
  benchmarkAnalysis: BenchmarkMetric[];
  funnelAnalysis: FunnelAnalysis;
  videoMultiplier: number;
  outreachMultiplier: number;
  outreachTag: string | null;
}

interface BaseScores {
  D1: number;
  D2: number;
  D3: number;
  NAIA: number;
  JUCO: number;
}

// ============================================================================
// Section A - Classify League Tier
// ============================================================================

const ELITE_BOYS_LEAGUES: YouthLeague[] = ["MLS_NEXT", "ECNL"];
const HIGH_BOYS_LEAGUES: YouthLeague[] = ["ECNL_RL", "USYS_National_League", "USL_Academy"];
const MID_BOYS_LEAGUES: YouthLeague[] = ["NPL"];
const LOW_BOYS_LEAGUES: YouthLeague[] = ["High_School", "Elite_Local", "Other"];

const ELITE_GIRLS_LEAGUES: YouthLeague[] = ["ECNL", "Girls_Academy"];
const HIGH_GIRLS_LEAGUES: YouthLeague[] = ["ECNL_RL", "USYS_National_League", "USL_Academy"];
const MID_GIRLS_LEAGUES: YouthLeague[] = ["NPL"];
const LOW_GIRLS_LEAGUES: YouthLeague[] = ["High_School", "Elite_Local", "Other"];

export function classifyLeagueTier(
  profile: PlayerProfile
): LeagueTier {
  const { experienceLevel, gender, seasons } = profile;

  // Check experienceLevel FIRST for overrides
  if (
    experienceLevel === "Pro_Academy_Reserve" ||
    experienceLevel === "International_Academy_U19"
  ) {
    return "Elite";
  }

  if (experienceLevel === "Semi_Pro_UPSL_NPSL_WPSL") {
    // Can be Elite if also played MLS NEXT/ECNL, otherwise High
    const hasEliteLeague = seasons.some((s) =>
      s.league.some((l) =>
        gender === "Male"
          ? ELITE_BOYS_LEAGUES.includes(l)
          : ELITE_GIRLS_LEAGUES.includes(l)
      )
    );
    return hasEliteLeague ? "Elite" : "High";
  }

  // No seasons - default to Low
  if (seasons.length === 0) {
    return "Low";
  }

  // Get latest season
  const latestSeason = seasons.reduce((latest, s) =>
    s.year > latest.year ? s : latest
  );

  // Check league tier based on gender
  const leagues = latestSeason.league;

  if (gender === "Male") {
    if (leagues.some((l) => ELITE_BOYS_LEAGUES.includes(l))) return "Elite";
    if (leagues.some((l) => HIGH_BOYS_LEAGUES.includes(l))) return "High";
    if (leagues.some((l) => MID_BOYS_LEAGUES.includes(l))) return "Mid";
    return "Low";
  } else {
    if (leagues.some((l) => ELITE_GIRLS_LEAGUES.includes(l))) return "Elite";
    if (leagues.some((l) => HIGH_GIRLS_LEAGUES.includes(l))) return "High";
    if (leagues.some((l) => MID_GIRLS_LEAGUES.includes(l))) return "Mid";
    return "Low";
  }
}

// ============================================================================
// Section B - Classify Ability Band
// ============================================================================

const ELITE_RATINGS: AthleticRating[] = ["Elite", "Top_10_Percent"];

export function classifyAbilityBand(profile: PlayerProfile): AbilityBand {
  const { athleticProfile, seasons } = profile;

  if (!athleticProfile) {
    return "Low";
  }

  // Count elite ratings and weak ratings
  const ratings = [
    athleticProfile.speed,
    athleticProfile.strength,
    athleticProfile.endurance,
    athleticProfile.workRate,
    athleticProfile.technical,
    athleticProfile.tactical,
  ];

  const eliteCount = ratings.filter((r) => ELITE_RATINGS.includes(r)).length;
  const weakCount = ratings.filter((r) => r === "Below_Average").length;

  // Initial classification
  let band: AbilityBand;
  if (eliteCount >= 4) {
    band = "High";
  } else if (eliteCount >= 2 && weakCount <= 1) {
    band = "Medium";
  } else {
    band = "Low";
  }

  // Adjust for role and minutes from latest season
  if (seasons.length > 0) {
    const latestSeason = seasons.reduce((latest, s) =>
      s.year > latest.year ? s : latest
    );

    const { mainRole, minutesPlayedPercent } = latestSeason;

    // Move UP if Key_Starter with 70%+ minutes
    if (mainRole === "Key_Starter" && minutesPlayedPercent >= 70) {
      if (band === "Low") band = "Medium";
      else if (band === "Medium") band = "High";
    }

    // Move DOWN if Bench or low minutes
    if (mainRole === "Bench" || minutesPlayedPercent <= 30) {
      if (band === "High") band = "Medium";
      else if (band === "Medium") band = "Low";
    }
  }

  return band;
}

// ============================================================================
// Section C - Classify Academic Band
// ============================================================================

export function classifyAcademicBand(gpa: number): AcademicBand {
  if (gpa >= 3.7) return "High";
  if (gpa >= 3.0) return "Solid";
  if (gpa >= 2.5) return "Risky";
  return "Problem";
}

// ============================================================================
// Section D - Compute Base Scores
// ============================================================================

const BASE_SCORES_BOYS: Record<LeagueTier, BaseScores> = {
  Elite: { D1: 70, D2: 60, D3: 40, NAIA: 30, JUCO: 20 },
  High: { D1: 30, D2: 50, D3: 60, NAIA: 40, JUCO: 30 },
  Mid: { D1: 15, D2: 35, D3: 55, NAIA: 45, JUCO: 35 },
  Low: { D1: 5, D2: 20, D3: 40, NAIA: 45, JUCO: 50 },
};

const BASE_SCORES_GIRLS: Record<LeagueTier, BaseScores> = {
  Elite: { D1: 80, D2: 65, D3: 45, NAIA: 30, JUCO: 20 },
  High: { D1: 35, D2: 55, D3: 60, NAIA: 40, JUCO: 30 },
  Mid: { D1: 15, D2: 35, D3: 60, NAIA: 45, JUCO: 35 },
  Low: { D1: 5, D2: 20, D3: 45, NAIA: 45, JUCO: 50 },
};

export function computeBaseScores(
  tier: LeagueTier,
  gender: "Male" | "Female"
): BaseScores {
  return gender === "Male"
    ? { ...BASE_SCORES_BOYS[tier] }
    : { ...BASE_SCORES_GIRLS[tier] };
}

// ============================================================================
// Section E - Ability Adjustments (Shifts Peak Fit)
// ============================================================================

const ABILITY_ADJUSTMENTS: Record<AbilityBand, BaseScores> = {
  High: { D1: 15, D2: 5, D3: -10, NAIA: -15, JUCO: -20 },
  Medium: { D1: -20, D2: 10, D3: 15, NAIA: 5, JUCO: 0 },
  Low: { D1: -40, D2: -25, D3: 10, NAIA: 20, JUCO: 25 },
};

export function applyAbilityAdjustments(
  scores: BaseScores,
  abilityBand: AbilityBand
): BaseScores {
  const adj = ABILITY_ADJUSTMENTS[abilityBand];
  return {
    D1: scores.D1 + adj.D1,
    D2: scores.D2 + adj.D2,
    D3: scores.D3 + adj.D3,
    NAIA: scores.NAIA + adj.NAIA,
    JUCO: scores.JUCO + adj.JUCO,
  };
}

// ============================================================================
// Section F - Academic Adjustments
// ============================================================================

const ACADEMIC_ADJUSTMENTS: Record<AcademicBand, BaseScores> = {
  High: { D1: 5, D2: 5, D3: 20, NAIA: 0, JUCO: -10 },
  Solid: { D1: 0, D2: 5, D3: 10, NAIA: 0, JUCO: -5 },
  Risky: { D1: -10, D2: -5, D3: -5, NAIA: 5, JUCO: 10 },
  Problem: { D1: -25, D2: -20, D3: -15, NAIA: 10, JUCO: 25 },
};

export function applyAcademicAdjustments(
  scores: BaseScores,
  academicBand: AcademicBand
): BaseScores {
  const adj = ACADEMIC_ADJUSTMENTS[academicBand];
  return {
    D1: scores.D1 + adj.D1,
    D2: scores.D2 + adj.D2,
    D3: scores.D3 + adj.D3,
    NAIA: scores.NAIA + adj.NAIA,
    JUCO: scores.JUCO + adj.JUCO,
  };
}

// ============================================================================
// Section F2 - NCAA Eligibility Caps
// ============================================================================

/**
 * Apply hard eligibility caps based on NCAA/NAIA/JUCO requirements.
 *
 * NCAA D1: 2.3 GPA minimum (sliding scale with test scores, but we use GPA floor)
 * NCAA D2: 2.2 GPA minimum (sliding scale with test scores, but we use GPA floor)
 * NCAA D3: 2.0 GPA minimum (no sliding scale, school-determined)
 * NAIA: "2 of 3" rule - GPA 2.0+ OR 18 ACT/970 SAT OR Top 50% class
 *       (More lenient - no hard cap applied, academic adjustments handle penalties)
 * JUCO: NJCAA D2/D3 have open enrollment; D1 requires 2.0 GPA OR test scores
 *       (Most accessible - boosted when NCAA options are capped)
 */
export function applyEligibilityCaps(scores: BaseScores, gpa: number): BaseScores {
  const result = { ...scores };

  // GPA < 2.3: Cap D1, boost JUCO
  if (gpa < 2.3) {
    result.D1 = Math.min(result.D1, 15);
    result.JUCO = Math.max(result.JUCO, 60, result.JUCO + 20);
  }

  // GPA < 2.2: Cap D2
  if (gpa < 2.2) {
    result.D2 = Math.min(result.D2, 20);
  }

  // GPA < 2.0: Cap D3 only (NCAA requirement)
  // NAIA not capped here - their "2 of 3" rule allows eligibility via test scores or class rank
  if (gpa < 2.0) {
    result.D3 = Math.min(result.D3, 25);
  }

  return result;
}

// ============================================================================
// Section G - Role and Minutes Tweak (80%+ bonus)
// ============================================================================

export function applyMinutesBonus(
  scores: BaseScores,
  profile: PlayerProfile
): BaseScores {
  const result = { ...scores };

  if (profile.seasons.length === 0) return result;

  const latestSeason = profile.seasons.reduce((latest, s) =>
    s.year > latest.year ? s : latest
  );

  const { mainRole, minutesPlayedPercent } = latestSeason;

  // Bonus for heavy minutes (80%+)
  if (mainRole === "Key_Starter" && minutesPlayedPercent >= 80) {
    result.D1 += 5;
    result.D2 += 5;
  }

  // Penalty for very low minutes
  if (mainRole === "Bench" && minutesPlayedPercent <= 20) {
    result.D1 -= 10;
    result.D2 -= 5;
    result.D3 -= 5;
  }

  return result;
}

// ============================================================================
// Section G2 - Maturity & Experience Bonus
// ============================================================================

export function applyExperienceBonus(
  scores: BaseScores,
  profile: PlayerProfile
): BaseScores {
  const result = { ...scores };

  // Age factor
  const birthDate = new Date(profile.dateOfBirth);
  const today = new Date();
  const ageInYears =
    (today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (ageInYears > 18.5) {
    result.D1 += 5;
    result.D2 += 5;
    result.NAIA += 5;
  }

  // Experience level factor
  const { experienceLevel } = profile;

  if (
    experienceLevel === "Semi_Pro_UPSL_NPSL_WPSL" ||
    experienceLevel === "Pro_Academy_Reserve"
  ) {
    result.D1 += 15;
    result.D2 += 15;
    result.NAIA += 10;
  } else if (experienceLevel === "International_Academy_U19") {
    result.D1 += 10;
    result.D2 += 10;
    result.NAIA += 5;
  } else if (experienceLevel === "Adult_Amateur_League") {
    result.D2 += 5;
    result.NAIA += 5;
  }

  return result;
}

// ============================================================================
// Section H - Video and Outreach Multipliers
// ============================================================================

export function computeVideoMultiplier(hasVideo: boolean): number {
  return hasVideo ? 1.0 : 0.6;
}

export function computeOutreachMultiplier(
  coachesContacted: number,
  responsesReceived: number,
  offersReceived: number
): { multiplier: number; tag: string | null } {
  if (coachesContacted === 0) {
    return { multiplier: 0.7, tag: "Invisible" };
  }

  const responseRate =
    coachesContacted > 0 ? responsesReceived / coachesContacted : 0;

  if (coachesContacted >= 20 && responseRate < 0.05) {
    return { multiplier: 0.8, tag: "Spamming" };
  }

  if (responsesReceived >= 5 && offersReceived === 0) {
    return { multiplier: 0.9, tag: "Talent Gap" };
  }

  return { multiplier: 1.0, tag: null };
}

// ============================================================================
// Clamp utility
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Compute Final Visibility Scores
// ============================================================================

export function computeVisibilityScores(
  profile: PlayerProfile
): {
  scores: VisibilityScore[];
  leagueTier: LeagueTier;
  abilityBand: AbilityBand;
  academicBand: AcademicBand;
  videoMultiplier: number;
  outreachMultiplier: number;
  outreachTag: string | null;
} {
  // Step A: League tier
  const leagueTier = classifyLeagueTier(profile);

  // Step B: Ability band
  const abilityBand = classifyAbilityBand(profile);

  // Step C: Academic band
  const academicBand = classifyAcademicBand(profile.academics.gpa);

  // Step D: Base scores
  let scores = computeBaseScores(leagueTier, profile.gender);

  // Step E: Ability adjustments
  scores = applyAbilityAdjustments(scores, abilityBand);

  // Step F: Academic adjustments
  scores = applyAcademicAdjustments(scores, academicBand);

  // Step F2: Eligibility caps
  scores = applyEligibilityCaps(scores, profile.academics.gpa);

  // Step G: Minutes bonus
  scores = applyMinutesBonus(scores, profile);

  // Step G2: Experience bonus
  scores = applyExperienceBonus(scores, profile);

  // Clamp on_paper_fit scores
  const onPaperFit = {
    D1: clamp(scores.D1, 0, 100),
    D2: clamp(scores.D2, 0, 100),
    D3: clamp(scores.D3, 0, 100),
    NAIA: clamp(scores.NAIA, 0, 100),
    JUCO: clamp(scores.JUCO, 0, 100),
  };

  // Step H: Multipliers
  const videoMultiplier = computeVideoMultiplier(profile.videoLink);
  const { multiplier: outreachMultiplier, tag: outreachTag } =
    computeOutreachMultiplier(
      profile.coachesContacted,
      profile.responsesReceived,
      profile.offersReceived
    );

  // Final current_visibility
  const levels = ["D1", "D2", "D3", "NAIA", "JUCO"] as const;
  const visibilityScores: VisibilityScore[] = levels.map((level) => {
    const onPaper = onPaperFit[level];
    const current = clamp(
      Math.round(onPaper * videoMultiplier * outreachMultiplier),
      0,
      100
    );

    return {
      level,
      visibilityPercent: current,
      notes: `Base: ${onPaper}, Video: ${videoMultiplier}x, Outreach: ${outreachMultiplier}x`,
    };
  });

  return {
    scores: visibilityScores,
    leagueTier,
    abilityBand,
    academicBand,
    videoMultiplier,
    outreachMultiplier,
    outreachTag,
  };
}

// ============================================================================
// Compute Readiness Score
// ============================================================================

function ratingToNumber(rating: AthleticRating): number {
  const map: Record<AthleticRating, number> = {
    Below_Average: 30,
    Average: 50,
    Above_Average: 70,
    Top_10_Percent: 85,
    Elite: 95,
  };
  return map[rating];
}

export function computeReadinessScore(
  profile: PlayerProfile,
  abilityBand: AbilityBand,
  academicBand: AcademicBand
): ReadinessScore {
  const { athleticProfile, videoLink, coachesContacted, responsesReceived } =
    profile;

  // Athletic: from ability band
  const athleticMap: Record<AbilityBand, number> = {
    High: 95,
    Medium: 75,
    Low: 40,
  };
  const athletic = athleticMap[abilityBand];

  // Academic: from academic band
  const academicMap: Record<AcademicBand, number> = {
    High: 95,
    Solid: 80,
    Risky: 65,
    Problem: 40,
  };
  const academic = academicMap[academicBand];

  // Technical: average of technical/tactical ratings
  let technical = 50;
  let tactical = 50;

  if (athleticProfile) {
    technical = ratingToNumber(athleticProfile.technical);
    tactical = ratingToNumber(athleticProfile.tactical);

    // Bonus for semi-pro/pro experience
    if (
      profile.experienceLevel === "Semi_Pro_UPSL_NPSL_WPSL" ||
      profile.experienceLevel === "Pro_Academy_Reserve"
    ) {
      tactical = Math.min(100, tactical + 10);
    }
  }

  // Market: average of video and outreach health
  let marketScore = 0;
  marketScore += videoLink ? 50 : 10; // Video is huge

  // Outreach health
  if (coachesContacted === 0) {
    marketScore += 10;
  } else if (coachesContacted < 10) {
    marketScore += 25;
  } else if (responsesReceived > 0) {
    const rate = responsesReceived / coachesContacted;
    marketScore += rate > 0.1 ? 50 : 35;
  } else {
    marketScore += 30;
  }

  return {
    athletic,
    technical,
    tactical,
    academic,
    market: marketScore,
  };
}

// ============================================================================
// Compute Benchmark Analysis
// ============================================================================

export function computeBenchmarkAnalysis(
  leagueTier: LeagueTier,
  abilityBand: AbilityBand,
  academicBand: AcademicBand
): BenchmarkMetric[] {
  // Exposure score from League Tier
  const exposureMap: Record<LeagueTier, number> = {
    Elite: 95,
    High: 75,
    Mid: 55,
    Low: 35,
  };

  // Competition score from Ability Band
  const competitionMap: Record<AbilityBand, number> = {
    High: 95,
    Medium: 70,
    Low: 50,
  };

  // Academics score from Academic Band
  const academicsMap: Record<AcademicBand, number> = {
    High: 95,
    Solid: 80,
    Risky: 60,
    Problem: 40,
  };

  const exposureScore = exposureMap[leagueTier];
  const competitionScore = competitionMap[abilityBand];
  const academicsScore = academicsMap[academicBand];

  return [
    {
      category: "Exposure",
      userScore: exposureScore,
      d1Average: 90,
      d3Average: 65,
      feedback: generateBenchmarkFeedback("Exposure", exposureScore, 90, 65),
    },
    {
      category: "Competition",
      userScore: competitionScore,
      d1Average: 85,
      d3Average: 65,
      feedback: generateBenchmarkFeedback(
        "Competition",
        competitionScore,
        85,
        65
      ),
    },
    {
      category: "Academics",
      userScore: academicsScore,
      d1Average: 85,
      d3Average: 75,
      feedback: generateBenchmarkFeedback("Academics", academicsScore, 85, 75),
    },
  ];
}

function generateBenchmarkFeedback(
  category: string,
  userScore: number,
  d1Avg: number,
  d3Avg: number
): string {
  if (userScore >= d1Avg) {
    return `${category} level at or above D1 average`;
  } else if (userScore >= d3Avg) {
    return `${category} level between D1 and D3 average`;
  } else {
    return `${category} level below D3 average`;
  }
}

// ============================================================================
// Compute Funnel Analysis
// ============================================================================

export function computeFunnelAnalysis(
  coachesContacted: number,
  responsesReceived: number,
  offersReceived: number
): FunnelAnalysis {
  // Determine stage
  let stage: FunnelAnalysis["stage"];
  if (coachesContacted === 0) {
    stage = "Invisible";
  } else if (responsesReceived === 0) {
    stage = "Outreach";
  } else if (offersReceived === 0) {
    stage = "Conversation";
  } else if (offersReceived >= 3) {
    stage = "Closing";
  } else {
    stage = "Evaluation";
  }

  // Conversion rate
  const responseRate =
    coachesContacted > 0
      ? ((responsesReceived / coachesContacted) * 100).toFixed(1)
      : "0";
  const conversionRate = `${responseRate}% Reply Rate`;

  // Bottleneck and advice based on stage
  let bottleneck: string;
  let advice: string;

  switch (stage) {
    case "Invisible":
      bottleneck = "No outreach started";
      advice =
        "Begin contacting coaches - even 10 quality emails can generate responses";
      break;
    case "Outreach":
      bottleneck = "No responses yet";
      advice =
        "Review email content, subject lines, and video quality. Consider targeting fit-appropriate programs";
      break;
    case "Conversation":
      bottleneck = "Conversations not converting to offers";
      advice =
        "Focus on building relationships with interested coaches. Attend their camps/events";
      break;
    case "Evaluation":
      bottleneck = "Limited offer options";
      advice =
        "Continue conversations while evaluating current offers. Request official visits";
      break;
    case "Closing":
      bottleneck = "Decision time";
      advice = "Compare offers, visit campuses, and make your commitment decision";
      break;
  }

  return {
    stage,
    conversionRate,
    bottleneck,
    advice,
  };
}

// ============================================================================
// Main: Compute All Scores
// ============================================================================

export function computeAllScores(profile: PlayerProfile): ComputedScores {
  const {
    scores: visibilityScores,
    leagueTier,
    abilityBand,
    academicBand,
    videoMultiplier,
    outreachMultiplier,
    outreachTag,
  } = computeVisibilityScores(profile);

  const readinessScore = computeReadinessScore(
    profile,
    abilityBand,
    academicBand
  );

  const benchmarkAnalysis = computeBenchmarkAnalysis(
    leagueTier,
    abilityBand,
    academicBand
  );

  const funnelAnalysis = computeFunnelAnalysis(
    profile.coachesContacted,
    profile.responsesReceived,
    profile.offersReceived
  );

  return {
    leagueTier,
    abilityBand,
    academicBand,
    visibilityScores,
    readinessScore,
    benchmarkAnalysis,
    funnelAnalysis,
    videoMultiplier,
    outreachMultiplier,
    outreachTag,
  };
}
