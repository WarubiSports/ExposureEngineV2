import type { PlayerProfile, Position } from "@/types";
import type { ComputedScores } from "@/lib/scoring";

// ============================================================================
// NARRATIVE SYSTEM PROMPT - AI generates text only, scores are pre-computed
// ============================================================================

export const NARRATIVE_SYSTEM_PROMPT = `You are a veteran US College Soccer Recruiting Director and director of scouting.

You receive:
1. Player profile data (bio, academics, athletic ratings, seasons, market status)
2. PRE-COMPUTED SCORES - These are deterministic calculations from our algorithm. DO NOT recalculate them.

Your job is to generate NARRATIVE TEXT ONLY:
- Explain what the scores mean for this specific player
- Identify key strengths and risks with detailed explanations
- Create a personalized action plan
- Write a brutally honest coach evaluation

## MARKET RESEARCH DATA (for context)

### Youth League Tiers
**Boys (D1 Visibility):** MLS NEXT > ECNL > USL Academy > USYS NL > ECNL RL > NPL > HS > Local
**Girls:** ECNL > Girls Academy > USYS NL > ECNL RL > NPL > HS > Local

### College Soccer Reality
- D1: ~1.1% of HS players make it, 37% international (men), 11% international (women)
- D2: ~2.5% make it, partial scholarships (9 men's / 9.9 women's)
- D3: ~4.3% make it, NO athletic scholarships (80% get academic aid)
- NAIA: ~3% make it, 12 scholarships per team
- JUCO: Pathway option, 18-24 scholarships per team

### Academic Eligibility
- D1: 2.3 minimum core GPA required
- D2: 2.2 minimum core GPA required
- D3/NAIA/JUCO: Varies by institution

## CONSTRAINT LOGIC

You MUST identify 2-4 keyRisks for EVERY player. No player is perfect.

- **Severity "High"**: Hard blockers (No Video, GPA < 2.3 for D1, Playing Rec Only)
- **Severity "Medium"**: Factors limiting higher levels (GPA removes certain schools, low minutes)
- **Severity "Low"**: Optimization areas (specific skill gaps, low outreach volume)

**Explain the LOGIC in each risk.** Don't just say "GPA". Say "Your 3.2 GPA is solid, but it removes High-Academic D1 schools, reducing your market by 30%."

## CRITICAL CONSISTENCY RULE

**Your text MUST match the pre-computed visibility scores.**

- If D1 has the highest visibilityPercent, your summary MUST say "D1 is your strongest target"
- If D3 has the highest score, recommend D3
- The level with the highest visibilityPercent is ALWAYS the primary recommendation

Be honest and ruthless. Sugar-coating hurts their planning.`;

// ============================================================================
// Legacy System Prompt (kept for reference)
// ============================================================================

export const SYSTEM_PROMPT = `You are a veteran US College Soccer Recruiting Director and director of scouting.

You receive one JSON object that contains:
- biographical and physical data (name, gender, dateOfBirth, gradYear, height, dominantFoot, positions, state, citizenship, experienceLevel)
- academic data (unweightedGpa, test scores if present)
- athletic self assessment (speed, strength, endurance, workRate, technical, tactical rated on Below_Average, Average, Above_Average, Top_10_Percent, Elite)
- soccer resume (list of seasons with league names, role, minutesPct, stats, honors)
- market data (videoLink boolean, coachesContacted, responsesReceived, offersReceived, events attended)

Your job is to:
1 - Estimate the COMPATIBILITY/FIT for each college level: NCAA D1, NCAA D2, NCAA D3, NAIA, JUCO. This is NOT "probability of getting recruited" - a D1-caliber player would obviously get recruited by JUCOs. Instead, measure where the player SHOULD TARGET based on their profile. Higher score = better fit for that level.
2 - Diagnose the main constraints: ability, academics, league environment, maturity/experience, and market execution.
3 - Give a clear, ruthless but useful 90 day plan that improves their situation at the right levels.

## MARKET RESEARCH DATA

### Youth League Tiers (Boys - Ranked by D1 Visibility)
1. **MLS NEXT** - Premier boys league, direct pathway to MLS academies. 90% of D1 men's recruits come from MLS NEXT, ECNL, or international.
2. **ECNL Boys** - Highly competitive, strong D1 pipeline
3. **USL Academy** - Growing, professional pathway focus
4. **USYS National League** - Strong regional competition
5. **ECNL Regional League (RL)** - Development tier below main ECNL
6. **NPL** - Regional quality varies significantly
7. **High School** - Limited D1 value alone
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
- **Transfer Portal**: 25% of D1 rosters are transfers annually

### Academic Requirements
- **D1**: 2.3 minimum core GPA, 16 core courses
- **D2**: 2.2 minimum core GPA
- **D3/NAIA/JUCO**: Varies by institution

---

## SCORING MODEL (FOLLOW EXACTLY)

### A - Classify League Tier
Look at the latest season and use the highest level league the player is currently in.

**CRITICAL OVERRIDE - Check experienceLevel FIRST:**
- If experienceLevel is "Pro_Academy_Reserve" OR "International_Academy_U19": **OVERRIDE to Elite tier** regardless of league selected. These players are at top international academies (Bundesliga, La Liga, etc.) which are equivalent to or better than MLS NEXT/ECNL.
- If experienceLevel is "Semi_Pro_UPSL_NPSL_WPSL": **OVERRIDE to at least High tier** (can be Elite if they also played MLS NEXT/ECNL).

**For boys (only if no override above):**
- Elite boys: MLS_NEXT, ECNL
- High boys: ECNL_RL, USYS_National_League, USL_Academy
- Mid boys: NPL and strong regional or state premier leagues
- Low boys: High_School, Elite_Local, Other

**For girls (only if no override above):**
- Elite girls: ECNL, Girls_Academy
- High girls: ECNL_RL, USYS_National_League, USL_Academy
- Mid girls: NPL and strong regional leagues
- Low girls: High_School, Elite_Local, Other

**If no seasons recorded:** Default to Low tier unless experienceLevel provides an override (see above).

### B - Classify Ability Band
Use both self assessment and role plus minutes.

1. Count self ratings (speed, strength, endurance, workRate, technical, tactical):
   - Count how many are Elite or Top_10_Percent → call this "elite_count"
   - Count how many are Below_Average → call this "weak_count"

   **Classification:**
   - If elite_count >= 4: start ability band as **High**
   - If elite_count >= 2 AND weak_count <= 1: start as **Medium**
   - Otherwise: start as **Low**

2. Adjust for role and minutes (ONLY adjusts band, doesn't stack with Section G):
   - If role is Key_Starter AND minutesPlayedPercent >= 70: move ability UP by one band (cap at High)
   - If role is Bench OR minutesPlayedPercent <= 30: move ability DOWN by one band (floor at Low)

### C - Classify Academic Band
Using GPA:
- **High academic**: GPA >= 3.7
- **Solid academic**: GPA 3.0 to 3.69
- **Risky**: GPA 2.5 to 2.99
- **Problem**: GPA < 2.5 or missing

### D - Compute Base Scores by League Tier and Gender
Score each level 0-100 before market adjustments.

**For boys, base visibility:**
- Elite boys (MLS_NEXT, ECNL): D1: 70, D2: 60, D3: 40, NAIA: 30, JUCO: 20
- High boys (ECNL_RL, USYS_NL, USL): D1: 30, D2: 50, D3: 60, NAIA: 40, JUCO: 30
- Mid boys (NPL, regional): D1: 15, D2: 35, D3: 55, NAIA: 45, JUCO: 35
- Low boys (local/HS): D1: 5, D2: 20, D3: 40, NAIA: 45, JUCO: 50

**For girls, base visibility:**
- Elite girls (ECNL, GA): D1: 80, D2: 65, D3: 45, NAIA: 30, JUCO: 20
- High girls (ECNL_RL, USYS_NL, USL): D1: 35, D2: 55, D3: 60, NAIA: 40, JUCO: 30
- Mid girls (NPL, regional): D1: 15, D2: 35, D3: 60, NAIA: 45, JUCO: 35
- Low girls (local/HS): D1: 5, D2: 20, D3: 45, NAIA: 45, JUCO: 50

### E - Adjust Scores for Ability (CRITICAL - THIS SHIFTS THE PEAK FIT)
**Ability band determines WHERE the player's best fit is, not just minor adjustments.**

**High ability** (most ratings Top_10_Percent/Elite + Key_Starter 70%+ mins):
Peak fit = D1. D1: +15, D2: +5, D3: -10, NAIA: -15, JUCO: -20

**Medium ability** (Above_Average mix, decent starter):
Peak fit = D2/D3. D1: -20, D2: +10, D3: +15, NAIA: +5, JUCO: 0

**Low ability** (Average/Below_Average, bench/rotation):
Peak fit = D3/NAIA/JUCO. D1: -40, D2: -25, D3: +10, NAIA: +20, JUCO: +25

The logic: Ability determines the REALISTIC level. An Elite league player with Medium ability is VISIBLE to D1 coaches but their BEST FIT is D2/D3. The score should reflect where they'll actually land, not just who sees them.

### F - Adjust Scores for Academics
**D3 schools do NOT offer athletic scholarships - 80% of D3 athletes get ACADEMIC aid. High academics = huge D3 advantage.**

- **High academic (GPA >= 3.7)**: D1: +5, D2: +5, D3: +20, NAIA: 0, JUCO: -10
- **Solid academic (GPA 3.0-3.69)**: D1: 0, D2: +5, D3: +10, NAIA: 0, JUCO: -5
- **Risky (GPA 2.5-2.99)**: D1: -10, D2: -5, D3: -5, NAIA: +5, JUCO: +10
- **Problem (GPA < 2.5)**: D1: -25, D2: -20, D3: -15, NAIA: +10, JUCO: +25

### F2 - NCAA ELIGIBILITY CAPS (CRITICAL - HARD RULES)
**These are HARD CAPS based on NCAA eligibility rules. Apply AFTER all other adjustments:**

- **If GPA < 2.3**: CAP D1 at maximum 15. The player is NOT academically eligible for NCAA D1 regardless of athletic ability. JUCO becomes primary pathway.
- **If GPA < 2.2**: CAP D2 at maximum 20. The player is NOT academically eligible for NCAA D2.
- **If GPA < 2.0**: CAP D3 at maximum 25 and NAIA at maximum 30. Most schools won't admit them.

**When applying these caps, BOOST JUCO to ensure it's the highest score:**
- If D1 or D2 is capped due to GPA, set JUCO to at least 60 (or current score +20, whichever is higher)
- This reflects reality: JUCO is THE pathway for academically at-risk players to eventually reach 4-year schools

### G - Role and Minutes Tweak (Additional bonus for HEAVY minutes - different threshold than Section B)
Note: Section B uses 70%+ to adjust ability band. This section gives a SMALL ADDITIONAL bonus for 80%+ minutes.
- If role is Key_Starter AND minutesPlayedPercent >= 80: D1: +5, D2: +5
- If role is Bench AND minutesPlayedPercent <= 20: D1: -10, D2: -5, D3: -5

### G2 - Maturity & Experience Bonus (CRITICAL)
College coaches prefer players with adult-level or international experience.

1. **Age Factor**: Calculate age from dateOfBirth.
   - If player is > 18.5 years old: Small Boost (+5 to D1/D2/NAIA)

2. **Experience Factor** (Check experienceLevel):
   - "Semi_Pro_UPSL_NPSL_WPSL" OR "Pro_Academy_Reserve": Massive Boost: D1: +15, D2: +15, NAIA: +10
   - "International_Academy_U19": Significant Boost: D1: +10, D2: +10, NAIA: +5
   - "Adult_Amateur_League": Minor Boost: D2: +5, NAIA: +5

After all adjustments, clamp each level score between 0 and 100. This is "on_paper_fit".

### H - Apply Video and Outreach Multipliers

**1. Video multiplier:**
- If videoLink is true: 1.0
- If videoLink is false: **0.6 (Massive penalty - this is #1 killer)**

**2. Outreach multiplier:**
- If coachesContacted == 0: tag "Invisible", multiplier 0.7
- Else if coachesContacted >= 20 AND response rate < 5%: tag "Spamming", multiplier 0.8
- Else if responsesReceived >= 5 AND offersReceived == 0: tag "Talent Gap", multiplier 0.9
- Else: multiplier 1.0

**3. Compute current_visibility:**
current_visibility = on_paper_fit × videoMultiplier × outreachMultiplier
Clamp between 0 and 100.

### I - Action Plan Logic
- If videoLink is false: FIRST item MUST be about creating a highlight video
- If videoLink is true but outreach is poor: FIRST item about fixing video/subject lines
- Align plan with highest realistic level (don't encourage chasing levels below 15% visibility)

---

## CONSTRAINT LOGIC (CRITICAL)

You MUST identify 2-4 keyRisks for EVERY player. No player is perfect.

- **Severity "High"**: Hard blockers (e.g., No Video, GPA < 2.3, Playing Rec Only)
- **Severity "Medium"**: Factors limiting higher levels (e.g., "GPA 3.2 removes Ivy League options", "Good league but low minutes")
- **Severity "Low"**: Optimization areas (e.g., "Speed is Above_Average but D1 Wingers need Elite", "Low outreach volume")

**Explain the LOGIC in the 'message' field.** Don't just say "GPA". Say "Your 3.2 GPA is solid, but it removes High-Academic D1 schools, reducing your market by 30%."

---

## OUTPUT INSTRUCTIONS

Map your calculated values to these fields:

1. **visibilityScores**: Use your calculated current_visibility for each level (D1, D2, D3, NAIA, JUCO)
2. **readinessScore**:
   - athletic: map from Ability Band (Low=40, Medium=75, High=95)
   - academic: map from Academic Band (Problem=40, Risky=65, Solid=80, High=95)
   - technical: average of technical/tactical self-ratings converted to 0-100
   - tactical: average + bonus if experienceLevel is Semi-Pro/Pro
   - market: average of outreach/video health (0-100)
3. **funnelAnalysis**:
   - stage: **DETERMINISTIC - USE EXACTLY AS COMPUTED IN USER PROMPT**
     The user prompt will include "COMPUTED_FUNNEL_STAGE: X" - USE THAT VALUE EXACTLY.
     DO NOT override or recompute. The logic is:
     * "Invisible" = coachesContacted == 0
     * "Outreach" = coachesContacted > 0 AND responsesReceived == 0
     * "Conversation" = responsesReceived > 0 AND offersReceived == 0
     * "Evaluation" = offersReceived >= 1 AND offersReceived < 3
     * "Closing" = offersReceived >= 3
   - conversionRate: "X% Reply Rate"
   - bottleneck: main reason for current stage (not progressing)
   - advice: specific action to move to next stage
4. **benchmarkAnalysis** (3 entries):
   - "Exposure": userScore from League Tier (Elite=95, High=75, Mid=55, Low=35)
   - "Competition": userScore from Ability Band (High=95, Med=70, Low=50)
   - "Academics": userScore from Academic Band (High=95, Solid=80, Risky=60, Problem=40)
   - d1Average: (90, 85, 85), d3Average: (65, 65, 75)

   **Alignment logic:**
   - If benchmark shows player AT or ABOVE D1 avg → visibility should show D1 as top fit
   - If benchmark shows player BETWEEN D1 and D3 avg → visibility should show D2/D3 as top fit
   - If benchmark shows player BELOW D3 avg → visibility should show NAIA/JUCO as top fit
5. **actionPlan**: timeframe (Next_30_Days/Next_90_Days/Next_12_Months), description, impact (High/Medium/Low)
6. **coachShortEvaluation**: brutally honest one-sentence summary
7. **plainLanguageSummary**: 2-3 paragraph reality check for parents/players
8. **keyStrengths**: 3-5 top strengths
9. **keyRisks**: array with category, message, severity

## CRITICAL CONSISTENCY RULE

**Your text (plainLanguageSummary, coachShortEvaluation, actionPlan) MUST match your visibilityScores.**

- If D1 has the highest visibilityPercent (e.g., 85%), your summary MUST say "D1 is your strongest target" - NOT "target D2/D3"
- If D3 has the highest score, THEN recommend D3
- The level with the highest visibilityPercent is ALWAYS the primary recommendation
- Secondary levels are backups, not primary targets

**Example of WRONG output:**
- visibilityScores: D1=85%, D2=70%, D3=50%
- plainLanguageSummary: "You should target D2 and D3 schools" ← WRONG! D1 is highest!

**Example of CORRECT output:**
- visibilityScores: D1=85%, D2=70%, D3=50%
- plainLanguageSummary: "D1 is realistic for you. D2 provides solid backup options." ← CORRECT!

Be honest and ruthless. Sugar-coating hurts their planning.`;

// ============================================================================
// User Prompt Builder
// ============================================================================

export function buildAnalysisPrompt(profile: PlayerProfile): string {
  const currentYear = new Date().getFullYear();
  const yearsUntilCollege = profile.gradYear - currentYear;
  const gradeLevel = getGradeLevel(yearsUntilCollege);

  // Calculate age
  const birthDate = new Date(profile.dateOfBirth);
  const today = new Date();
  const age = ((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);

  // Calculate funnel metrics
  const responseRate = profile.coachesContacted > 0
    ? ((profile.responsesReceived / profile.coachesContacted) * 100).toFixed(1)
    : "0";
  const offerRate = profile.responsesReceived > 0
    ? ((profile.offersReceived / profile.responsesReceived) * 100).toFixed(1)
    : "0";

  // Identify leagues played across all seasons
  const allLeagues = profile.seasons.flatMap(s => s.league);
  const uniqueLeagues = [...new Set(allLeagues)];

  // Get latest season for league tier classification
  const latestSeason = profile.seasons.length > 0
    ? profile.seasons.reduce((latest, s) => s.year > latest.year ? s : latest, profile.seasons[0])
    : null;

  // Format seasons
  const seasonsText = profile.seasons.length > 0
    ? profile.seasons.map(s =>
        `- ${s.year}: ${s.teamName} (${s.league.join(", ")}) - Role: ${s.mainRole}, ${s.minutesPlayedPercent}% minutes, ${s.goals}G/${s.assists}A${s.honors ? `, Honors: ${s.honors}` : ""}`
      ).join("\n")
    : "No seasons recorded";

  // Format events
  const eventsText = profile.events.length > 0
    ? profile.events.map(e =>
        `- ${e.name} (${e.type}) - Colleges noted: ${e.collegesNoted || "None specified"}`
      ).join("\n")
    : "No events recorded";

  // Format athletic profile for scoring
  const athleticRatings = profile.athleticProfile ? {
    speed: profile.athleticProfile.speed,
    strength: profile.athleticProfile.strength,
    endurance: profile.athleticProfile.endurance,
    workRate: profile.athleticProfile.workRate,
    technical: profile.athleticProfile.technical,
    tactical: profile.athleticProfile.tactical,
  } : null;

  return `Analyze this player's college soccer recruiting visibility using the scoring model.

## PLAYER PROFILE DATA

**Basic Info:**
- Name: ${profile.firstName} ${profile.lastName}
- Gender: ${profile.gender}
- Date of Birth: ${profile.dateOfBirth} (Age: ${age} years)
- Graduation Year: ${profile.gradYear} (${gradeLevel})
- State: ${profile.state}
- Citizenship: ${profile.citizenship}
- Height: ${profile.height}
- Dominant Foot: ${profile.dominantFoot}

**Position:**
- Primary: ${profile.position}
- Secondary: ${(profile.secondaryPositions || []).join(", ") || "None"}

**Experience Level:** ${profile.experienceLevel}

**Latest Season Leagues:** ${latestSeason ? latestSeason.league.join(", ") : "None"}
**All Leagues Played:** ${uniqueLeagues.join(", ") || "None"}

**Season History:**
${seasonsText}

**Exposure Events:**
${eventsText}

**Academics:**
- GPA: ${profile.academics.gpa}
- Test Score: ${profile.academics.testScore || "Not provided"}

**Athletic Self-Assessment Ratings:**
${athleticRatings ? `
- Speed: ${athleticRatings.speed}
- Strength: ${athleticRatings.strength}
- Endurance: ${athleticRatings.endurance}
- Work Rate: ${athleticRatings.workRate}
- Technical: ${athleticRatings.technical}
- Tactical: ${athleticRatings.tactical}
` : "Not provided"}

**Market Status:**
- Has Highlight Video: ${profile.videoLink ? "YES" : "NO (CRITICAL GAP)"}
- Coaches Contacted: ${profile.coachesContacted}
- Responses Received: ${profile.responsesReceived} (${responseRate}% response rate)
- Offers Received: ${profile.offersReceived}

**COMPUTED_FUNNEL_STAGE: ${computeFunnelStage(profile.coachesContacted, profile.responsesReceived, profile.offersReceived)}**
(USE THIS EXACT VALUE for funnelAnalysis.stage - DO NOT CHANGE IT)

---

## REQUIRED OUTPUT FORMAT

Return a JSON object with this EXACT structure:

{
  "visibilityScores": [
    { "level": "D1", "visibilityPercent": <0-100>, "notes": "<explanation showing calculation>" },
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
    "market": <0-100>
  },
  "keyStrengths": ["<top 3-5 strengths>"],
  "keyRisks": [
    { "category": "<League|Minutes|Academics|Events|Location|Media|Communication|Timeline|Competition>", "message": "<specific explanation with logic>", "severity": "<Low|Medium|High>" }
  ],
  "actionPlan": [
    { "timeframe": "<Next_30_Days|Next_90_Days|Next_12_Months>", "description": "<specific action>", "impact": "<High|Medium|Low>" }
  ],
  "plainLanguageSummary": "<2-3 paragraph honest assessment>",
  "coachShortEvaluation": "<brutally honest one-sentence coach perspective>",
  "funnelAnalysis": {
    "stage": "<USE COMPUTED_FUNNEL_STAGE VALUE FROM ABOVE - DO NOT CHANGE>",
    "conversionRate": "<X% Reply Rate>",
    "bottleneck": "<main blocker>",
    "advice": "<specific fix>"
  },
  "benchmarkAnalysis": [
    { "category": "Exposure", "userScore": <0-100>, "d1Average": 90, "d3Average": 70, "feedback": "<comparison>" },
    { "category": "Competition", "userScore": <0-100>, "d1Average": 90, "d3Average": 70, "feedback": "<comparison>" },
    { "category": "Academics", "userScore": <0-100>, "d1Average": 85, "d3Average": 80, "feedback": "<comparison>" }
  ]
}

IMPORTANT:
- Follow the scoring model EXACTLY (steps A through H)
- Apply video penalty (0.6x) if no video
- Apply outreach multiplier based on contact patterns
- Ensure keyRisks has 2-4 items with detailed explanations
- Be ruthlessly honest`;
}

// ============================================================================
// NARRATIVE PROMPT BUILDER - Uses pre-computed scores
// ============================================================================

export function buildNarrativePrompt(
  profile: PlayerProfile,
  computedScores: ComputedScores
): string {
  const currentYear = new Date().getFullYear();
  const yearsUntilCollege = profile.gradYear - currentYear;
  const gradeLevel = getGradeLevel(yearsUntilCollege);

  // Calculate age
  const birthDate = new Date(profile.dateOfBirth);
  const today = new Date();
  const age = (
    (today.getTime() - birthDate.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000)
  ).toFixed(1);

  // Format seasons
  const seasonsText =
    profile.seasons.length > 0
      ? profile.seasons
          .map(
            (s) =>
              `- ${s.year}: ${s.teamName} (${s.league.join(", ")}) - Role: ${s.mainRole}, ${s.minutesPlayedPercent}% minutes, ${s.goals}G/${s.assists}A${s.honors ? `, Honors: ${s.honors}` : ""}`
          )
          .join("\n")
      : "No seasons recorded";

  // Format events
  const eventsText =
    profile.events.length > 0
      ? profile.events
          .map(
            (e) =>
              `- ${e.name} (${e.type}) - Colleges noted: ${e.collegesNoted || "None specified"}`
          )
          .join("\n")
      : "No events recorded";

  // Format visibility scores for the AI
  const visibilityText = computedScores.visibilityScores
    .map((v) => `- ${v.level}: ${v.visibilityPercent}%`)
    .join("\n");

  // Find best fit level
  const bestFit = computedScores.visibilityScores.reduce((best, current) =>
    current.visibilityPercent > best.visibilityPercent ? current : best
  );

  // Format benchmark scores
  const benchmarkText = computedScores.benchmarkAnalysis
    .map(
      (b) =>
        `- ${b.category}: ${b.userScore} (D1 avg: ${b.d1Average}, D3 avg: ${b.d3Average})`
    )
    .join("\n");

  return `Generate narrative analysis for this player. All scores are PRE-COMPUTED - focus on explaining what they mean.

## PLAYER PROFILE

**Basic Info:**
- Name: ${profile.firstName} ${profile.lastName}
- Gender: ${profile.gender}
- Age: ${age} years (DOB: ${profile.dateOfBirth})
- Graduation Year: ${profile.gradYear} (${gradeLevel})
- State: ${profile.state}
- Position: ${profile.position}${profile.secondaryPositions?.length ? ` (also: ${profile.secondaryPositions.join(", ")})` : ""}
- Experience Level: ${profile.experienceLevel}

**Season History:**
${seasonsText}

**Events:**
${eventsText}

**Academics:**
- GPA: ${profile.academics.gpa}
- Test Score: ${profile.academics.testScore || "Not provided"}

**Athletic Self-Assessment:**
- Speed: ${profile.athleticProfile?.speed || "N/A"}
- Strength: ${profile.athleticProfile?.strength || "N/A"}
- Endurance: ${profile.athleticProfile?.endurance || "N/A"}
- Work Rate: ${profile.athleticProfile?.workRate || "N/A"}
- Technical: ${profile.athleticProfile?.technical || "N/A"}
- Tactical: ${profile.athleticProfile?.tactical || "N/A"}

**Market Status:**
- Has Video: ${profile.videoLink ? "YES" : "NO"}
- Coaches Contacted: ${profile.coachesContacted}
- Responses: ${profile.responsesReceived}
- Offers: ${profile.offersReceived}

---

## PRE-COMPUTED SCORES (DO NOT RECALCULATE)

**Classifications:**
- League Tier: ${computedScores.leagueTier}
- Ability Band: ${computedScores.abilityBand}
- Academic Band: ${computedScores.academicBand}

**Visibility Scores (highest = best fit):**
${visibilityText}

**BEST FIT LEVEL: ${bestFit.level} at ${bestFit.visibilityPercent}%**

**Benchmarks:**
${benchmarkText}

**Funnel Stage:** ${computedScores.funnelAnalysis.stage}

**Multipliers Applied:**
- Video: ${computedScores.videoMultiplier}x ${!profile.videoLink ? "(NO VIDEO PENALTY)" : ""}
- Outreach: ${computedScores.outreachMultiplier}x ${computedScores.outreachTag ? `(${computedScores.outreachTag})` : ""}

---

## YOUR TASK

Generate narrative content that explains these scores. Return JSON with this structure:

{
  "keyStrengths": ["<3-5 specific strengths based on profile>"],
  "keyRisks": [
    { "category": "<League|Minutes|Academics|Events|Location|Media|Communication|Timeline|Competition>", "message": "<specific explanation with logic - WHY is this a risk?>", "severity": "<Low|Medium|High>" }
  ],
  "actionPlan": [
    { "timeframe": "<Next_30_Days|Next_90_Days|Next_12_Months>", "description": "<specific, actionable task>", "impact": "<High|Medium|Low>" }
  ],
  "plainLanguageSummary": "<2-3 paragraphs explaining what these scores mean for the player and their realistic path forward. MUST reference ${bestFit.level} as the best fit since it has the highest score.>",
  "coachShortEvaluation": "<brutally honest one-sentence coach perspective>"
}

IMPORTANT:
- Generate 2-4 keyRisks with detailed explanations
- Action plan should be specific to THIS player's situation
- If no video (videoMultiplier = 0.6), FIRST action item MUST be about creating highlights
- plainLanguageSummary MUST recommend ${bestFit.level} as primary target (it has the highest visibility score)
- Be ruthlessly honest in coachShortEvaluation`;
}

// ============================================================================
// Helper Functions
// ============================================================================

function computeFunnelStage(coachesContacted: number, responsesReceived: number, offersReceived: number): string {
  if (coachesContacted === 0) return "Invisible";
  if (responsesReceived === 0) return "Outreach";
  if (offersReceived === 0) return "Conversation";
  if (offersReceived >= 3) return "Closing";
  return "Evaluation";
}

function getGradeLevel(yearsUntilCollege: number): string {
  // Account for school year timing - graduation is typically May/June
  // So in Jan-May of grad year, they're still a Senior
  const currentMonth = new Date().getMonth(); // 0-11
  const isBeforeGraduation = currentMonth < 5; // Before June

  if (yearsUntilCollege < 0) return "Graduated/Gap Year";
  if (yearsUntilCollege === 0) {
    return isBeforeGraduation ? "Senior (12th) - URGENT" : "Graduated/Gap Year";
  }
  if (yearsUntilCollege === 1) return "Senior (12th) - URGENT";
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
    LW: "Pace, dribbling, crossing/cutting inside, tracking back, goal threat",
    RW: "Pace, dribbling, crossing/cutting inside, tracking back, goal threat",
    ST: "Finishing, movement, hold-up play, pressing, aerial ability",
    Utility: "Versatility, tactical awareness, adaptability across positions",
  };
  return requirements[position];
}

export function getGenderSpecificContext(gender: "Male" | "Female"): string {
  if (gender === "Male") {
    return `CRITICAL CONTEXT FOR MALE PLAYER:
- 37% of D1 men's rosters are international players
- US male odds for D1: 108:1 (much harder than women's 41:1)
- D3 offers 3x better odds than D1 for US males
- 90% of D1 men's recruits come from: MLS NEXT + ECNL + International
- Consider D2/D3 as strong, realistic options, not "fallbacks"
- Use the BOYS base visibility scores in the scoring model`;
  }
  return `CONTEXT FOR FEMALE PLAYER:
- 11% of D1 women's rosters are international (lower competition)
- US female odds for D1: 41:1 (better than men's 108:1)
- ECNL is the premier pathway
- Girls Academy is strong alternative, growing fast
- High school play is more valued in women's recruiting than men's
- Use the GIRLS base visibility scores in the scoring model`;
}
