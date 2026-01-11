import type { PlayerProfile, CollegeLevel, Position, Gender } from "@/types";

// ============================================================================
// System Prompt with Research Data
// ============================================================================

export const SYSTEM_PROMPT = `You are an expert college soccer recruiting analyst with deep knowledge of the US youth-to-college soccer pathway. Your role is to provide honest, data-driven assessments of a player's visibility to college coaches at each division level.

## YOUR KNOWLEDGE BASE

### Youth League Tiers (Boys - Ranked by D1 Visibility)
1. **MLS NEXT** - Premier boys league, direct pathway to MLS academies. 90% of D1 men's recruits come from MLS NEXT, ECNL, or international.
2. **ECNL Boys** - Highly competitive, strong D1 pipeline
3. **USL Academy** - Growing, professional pathway focus
4. **USYS National League** - Strong regional competition
5. **ECNL Regional League (RL)** - Development tier below main ECNL
6. **NPL** - Regional quality varies significantly
7. **High School** - Limited D1 value alone (MLS NEXT starting 2025 adds tier allowing HS play)
8. **Elite Local/Rec** - Minimal D1 exposure

### Youth League Tiers (Girls - Ranked)
1. **ECNL** - Premier girls league nationally
2. **Girls Academy (GA)** - #2, catching up to ECNL
3. **USYS National League** - Strong competition
4. **ECNL Regional League** - Development tier
5. **High School** - More relevant than boys side for recruiting
6. **Local/Rec** - Minimal exposure

### College Soccer Statistics
| Level | Schools | Roster Size | Scholarships | % of HS Players Making It |
|-------|---------|-------------|--------------|---------------------------|
| D1 | 212 (M) / 335 (W) | 28 max | 28 (new 2025 rules) | ~1.1% |
| D2 | ~270 | ~31 avg | 9 (M) / 9.9 (W) | ~2.5% |
| D3 | 415+ | ~29 avg | 0 athletic | ~4.3% |
| NAIA | 188 | ~30 avg | 12 per team | ~3% |
| JUCO | 217 | ~19 avg | 18-24 per team | Pathway option |

### Critical Market Reality
- **International Player Impact**: 37% of D1 men's rosters are international; 11% for women
- US male odds: 108:1 for D1 spot (vs 41:1 for women)
- 74% of D1/D2 programs actively recruit internationally
- **Transfer Portal**: 25% of D1 rosters are transfers annually; 1,300-1,500 D1 players enter portal each year
- 2025 D1 roster cap of 28 is causing record portal entries (3,500+)

### Academic Requirements
- **D1**: 2.3 minimum core GPA, 16 core courses (10 before senior year)
- **D2**: 2.2 minimum core GPA
- **D3/NAIA/JUCO**: Varies by institution
- SAT/ACT no longer required by NCAA (eliminated 2023)

### Recruiting Timeline
- **9th-10th Grade**: 74% of D1 coaches start evaluating; focus on development
- **June 15 (after 10th)**: D1/D2 coaches can contact directly; verbal offers begin
- **11th Grade**: Peak recruiting activity; most verbal commits happen
- **Senior Fall**: Decision time, NLI signing (early November)
- **Senior Spring**: Late opportunities at D2/D3/NAIA/JUCO

### Video Requirements
- Length: 3-6 minutes, 20-25 clips (field players)
- First 30 seconds are critical (coaches often stop at 2 min)
- Lead with 5 best plays first
- Show 3 seconds before and after each "moment"
- No video = 60% visibility penalty across all levels
- Old video (>6 months) = 20% penalty
- Poor quality = 30% penalty

### Outreach Benchmarks
- 0 emails = Invisible (no visibility)
- <10 emails = Not serious effort
- 10-30 emails with <5% response = Targeting too high OR bad materials
- 30+ emails with 10%+ response = Strong funnel
- DMs achieve 300% higher response rate than emails
- Best send time: 4-8 PM, Tuesday-Sunday
- Most recruits need 20-50+ targeted outreach attempts

### Regional Hotspots
Top states: California, Texas, Florida, New York, Pennsylvania
Emerging: Georgia, Arizona, North Carolina, Michigan
Note: Dallas significantly stronger than Houston; Seattle rising

### Physical Benchmarks
- 40-yard dash: Under 6.0s (elite: sub-5.0s)
- 1 Mile: Under 6:00
- 2 Mile: Under 12:00
- Beep Test: Level 45+ minimum for competitive programs

## ANALYSIS RULES

1. **Be Honest, Not Nice**: Players deserve realistic assessments. Sugar-coating hurts their planning.

2. **Position-Specific Criteria**:
   - GK: Height (6'0"+ preferred), reflexes, distribution, command
   - Defenders: Aerial ability, 1v1, composure, versatility
   - Midfielders: Vision, stamina, technical control, two-way ability
   - Forwards: Finishing, pressing, movement, hold-up play

3. **Video Penalty Logic**:
   - No video = Apply 60% visibility reduction across all levels
   - This is the #1 killer of recruiting prospects

4. **International Competition Factor**:
   - For males: Account for 37% international roster share in D1 visibility
   - Suggest D2/D3 more prominently for male players

5. **Timeline Awareness**:
   - Freshman/Sophomore: Emphasize development, building resume
   - Junior: Peak urgency, verbal commit window NOW
   - Senior: Emergency mode, emphasize realistic options

6. **Funnel Analysis**:
   - Calculate conversion rate from contacts to responses
   - Identify the bottleneck (materials, targeting, timing)
   - Compare to benchmarks above

7. **Regional Context**:
   - Adjust for player's state and proximity to programs
   - Account for local vs national recruiting patterns

8. **Never Guarantee Anything**: Use probability language ("strong candidate for", "visible to", "competitive for")`;

// ============================================================================
// User Prompt Builder
// ============================================================================

export function buildAnalysisPrompt(profile: PlayerProfile): string {
  const currentYear = new Date().getFullYear();
  const yearsUntilCollege = profile.gradYear - currentYear;
  const gradeLevel = getGradeLevel(yearsUntilCollege);

  // Calculate funnel metrics
  const responseRate = profile.coachesContacted > 0
    ? ((profile.responsesReceived / profile.coachesContacted) * 100).toFixed(1)
    : "0";
  const offerRate = profile.responsesReceived > 0
    ? ((profile.offersReceived / profile.responsesReceived) * 100).toFixed(1)
    : "0";

  // Identify leagues played
  const leagues = profile.seasons.map(s => s.league);
  const uniqueLeagues = [...new Set(leagues)];

  // Format seasons
  const seasonsText = profile.seasons.length > 0
    ? profile.seasons.map(s =>
        `- ${s.year}: ${s.teamName} (${s.league.replace(/_/g, " ")}) - ${s.gamesPlayed} games, ${s.goals}G/${s.assists}A${s.cleanSheets ? `, ${s.cleanSheets} clean sheets` : ""}`
      ).join("\n")
    : "No seasons recorded";

  // Format events
  const eventsText = profile.events.length > 0
    ? profile.events.map(e =>
        `- ${e.name} (${e.type.replace(/_/g, " ")}) - ${e.date} @ ${e.location}`
      ).join("\n")
    : "No events recorded";

  // Format athletic profile
  const athleticText = profile.athleticProfile
    ? [
        profile.athleticProfile.fortyYardDash ? `40-yard dash: ${profile.athleticProfile.fortyYardDash}` : null,
        profile.athleticProfile.mileTime ? `Mile time: ${profile.athleticProfile.mileTime}` : null,
        profile.athleticProfile.beepTestLevel ? `Beep test level: ${profile.athleticProfile.beepTestLevel}` : null,
      ].filter(Boolean).join(", ") || "Not provided"
    : "Not provided";

  return `Analyze this player's college soccer recruiting visibility and provide a comprehensive assessment.

## PLAYER PROFILE

**Basic Info:**
- Name: ${profile.firstName} ${profile.lastName}
- Gender: ${profile.gender}
- Graduation Year: ${profile.gradYear} (${gradeLevel})
- Years Until College: ${yearsUntilCollege}
- State: ${profile.state}
- Citizenship: ${profile.citizenship || "US"}
- Height: ${profile.height || "Not specified"}
- Dominant Foot: ${profile.dominantFoot || "Not specified"}

**Position:**
- Primary: ${profile.position}
- Secondary: ${(profile.secondaryPositions || []).join(", ") || "None"}

**Experience Level:** ${profile.experienceLevel.replace(/_/g, " ")}

**Leagues Played:** ${uniqueLeagues.map(l => l.replace(/_/g, " ")).join(", ") || "Not specified"}

**Season History:**
${seasonsText}

**Exposure Events:**
${eventsText}

**Academics:**
- GPA: ${profile.gpa || "Not provided"}
- Test Score: ${profile.testScore || "Not provided"}

**Athletic Benchmarks:**
${athleticText}

**Marketing Status:**
- Has Highlight Video: ${profile.hasVideo ? "Yes" : "NO (CRITICAL GAP)"}
${profile.hasVideo && profile.videoAge ? `- Video Age: ${profile.videoAge}` : ""}
${profile.hasVideo && profile.videoQuality ? `- Video Quality: ${profile.videoQuality}` : ""}
- Coaches Contacted: ${profile.coachesContacted}
- Responses Received: ${profile.responsesReceived} (${responseRate}% response rate)
- Offers Received: ${profile.offersReceived} (${offerRate}% offer rate from responses)

---

## REQUIRED OUTPUT FORMAT

Return a JSON object with this exact structure:

{
  "visibilityScores": [
    { "level": "D1", "visibilityPercent": <0-100>, "notes": "<explanation>" },
    { "level": "D2", "visibilityPercent": <0-100>, "notes": "<explanation>" },
    { "level": "D3", "visibilityPercent": <0-100>, "notes": "<explanation>" },
    { "level": "NAIA", "visibilityPercent": <0-100>, "notes": "<explanation>" },
    { "level": "JUCO", "visibilityPercent": <0-100>, "notes": "<explanation>" }
  ],
  "readinessScore": {
    "athletic": <0-100>,
    "technical": <0-100>,
    "tactical": <0-100>,
    "academic": <0-100>,
    "market": <0-100>,
    "overall": <0-100>
  },
  "overallScore": <0-100>,
  "bucket": "<Elite|Strong|Developing|Limited|Challenging>",
  "rating": "<letter grade like A+, B-, etc>",
  "tags": ["<3-5 quick descriptive tags>"],
  "keyStrengths": ["<top 3-5 strengths>"],
  "keyRisks": [
    { "category": "<League|Minutes|Academics|Events|Location|Media|Communication|Timeline|Competition>", "message": "<specific risk>", "severity": "<Low|Medium|High>" }
  ],
  "positionAnalysis": {
    "positionFit": "<assessment of position fit>",
    "strengthsForPosition": ["<position-specific strengths>"],
    "areasToImprove": ["<areas to develop for this position>"],
    "collegePositionPrediction": "<what position they might play in college>"
  },
  "actionPlan": [
    { "timeframe": "<Next_30_Days|Next_90_Days|Next_12_Months>", "description": "<specific action>", "impact": "<High|Medium|Low>", "category": "<Outreach|Video|Events|Training|Academics>" }
  ],
  "plainLanguageSummary": "<2-3 paragraph honest assessment written for parents/players>",
  "coachShortEvaluation": "<2-3 sentences a college coach would write about this player>",
  "bestFitDivision": {
    "level": "<D1|D2|D3|NAIA|JUCO>",
    "reasoning": "<why this is the best fit>"
  },
  "funnelAnalysis": {
    "stage": "<Invisible|Outreach|Conversation|Evaluation|Closing>",
    "conversionRate": "<calculated rate>",
    "bottleneck": "<what's holding them back>",
    "advice": "<specific advice>",
    "benchmark": "<how they compare to typical recruits>"
  },
  "benchmarkAnalysis": [
    { "category": "<metric name>", "userScore": <0-100>, "d1Average": <0-100>, "d2Average": <0-100>, "d3Average": <0-100>, "feedback": "<gap analysis>", "gap": <number> }
  ],
  "campRecommendations": [
    { "name": "<camp/showcase name>", "type": "<ID Camp|Showcase|ODP>", "budget": "<$|$$|$$$>", "timing": "<when to attend>", "reason": "<why this camp>" }
  ],
  "emailTemplateSuggestion": "<personalized email opener for this player to use when contacting coaches>"
}

Provide honest, actionable insights. Do not sugarcoat. The player and family deserve realistic expectations.`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getGradeLevel(yearsUntilCollege: number): string {
  if (yearsUntilCollege <= 0) return "Graduated/Gap Year";
  if (yearsUntilCollege === 1) return "Senior (12th)";
  if (yearsUntilCollege === 2) return "Junior (11th) - PEAK RECRUITING WINDOW";
  if (yearsUntilCollege === 3) return "Sophomore (10th)";
  if (yearsUntilCollege === 4) return "Freshman (9th)";
  return `${yearsUntilCollege} years until college`;
}

export function getPositionRequirements(position: Position): string {
  const requirements: Record<Position, string> = {
    GK: "Height (6'0\"+), quick reflexes, commanding presence, distribution, communication",
    CB: "Aerial ability, 1v1 defending, composure on ball, reading of game, leadership",
    LB: "Pace, crossing ability, defensive recovery, stamina, attacking runs",
    RB: "Pace, crossing ability, defensive recovery, stamina, attacking runs",
    CDM: "Defensive positioning, passing range, stamina, tackling, game reading",
    CM: "Two-way stamina, technical ability, passing, vision, box-to-box running",
    CAM: "Creativity, final third passing, shooting, movement, pressing",
    LM: "Pace, stamina, crossing, defensive work rate, versatility",
    RM: "Pace, stamina, crossing, defensive work rate, versatility",
    LW: "Pace, dribbling, crossing/cutting inside, tracking back, goal threat",
    RW: "Pace, dribbling, crossing/cutting inside, tracking back, goal threat",
    ST: "Finishing, movement, hold-up play, pressing, aerial ability",
    CF: "Finishing, movement, link-up play, positioning, versatility"
  };
  return requirements[position];
}

export function getGenderSpecificContext(gender: Gender): string {
  if (gender === "Male") {
    return `CRITICAL CONTEXT FOR MALE PLAYER:
- 37% of D1 men's rosters are international players
- US male odds for D1: 108:1 (much harder than women's 41:1)
- D3 offers 3x better odds than D1 for US males
- 90% of D1 men's recruits come from: MLS NEXT + ECNL + International
- Consider D2/D3 as strong, realistic options, not "fallbacks"`;
  }
  return `CONTEXT FOR FEMALE PLAYER:
- 11% of D1 women's rosters are international (lower competition)
- US female odds for D1: 41:1 (better than men's 108:1)
- ECNL is the premier pathway
- Girls Academy is strong alternative, growing fast
- High school play is more valued in women's recruiting than men's`;
}
