# ExposureEngine V2

## Quick Reference

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

## Test Usage
- No auth required - public tool
- Submit any player profile to test AI analysis

---

## Project Overview
Public-facing AI-powered college soccer recruiting visibility analyzer. Players input their profile and receive personalized visibility scores for D1/D2/D3/NAIA/JUCO with actionable 90-day plans.

## Tech Stack
- **Framework:** Next.js 16 + React 19 + TypeScript
- **AI:** Google Gemini 2.0-flash (via @google/genai)
- **Backend:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + Radix UI + shadcn/ui
- **Charts:** Recharts (radar, bar)
- **PDF:** html2pdf.js
- **Deploy:** Vercel

## Key Directories
- `/src/app` - Next.js App Router (page.tsx is main entry)
- `/src/app/api/analyze` - AI analysis API endpoint
- `/src/components/exposure` - PlayerInputForm, AnalysisResult, Header
- `/src/components/ui` - shadcn/ui components
- `/src/lib/ai` - Gemini service, prompts, validation
- `/src/lib/supabase` - Supabase client (client.ts, server.ts)
- `/src/types` - TypeScript interfaces
- `/supabase/migrations` - Database schema

## Related Projects
- **Scout Platform:** `~/projects/-WARUBI-Scout-Platform` - Uses evaluations for scout pipeline
- **ITP Apps:** `~/projects/ITP-Staff-App`, `~/projects/ITP-Player-App`

## AI Analysis Flow
1. Player fills multi-step form (profile, academics, seasons, events, outreach)
2. POST to `/api/analyze` with PlayerProfile
3. Gemini analyzes using scoring algorithm in `lib/ai/prompts.ts`
4. Returns AnalysisResult with visibility scores, risks, action plan
5. Results displayed with charts, saved to Supabase

## Scoring Algorithm (in prompts.ts)
- League tier classification (MLS NEXT, ECNL, etc.)
- Ability band from athletic ratings + role/minutes
- Academic band from GPA
- Base visibility by tier × college level
- Adjustments: ability, academics, maturity, video (0.6x penalty if none)
- Outreach funnel analysis (invisible/spamming/talent gap flags)

## Database Tables
- `evaluations` - Player profiles + AI analysis results (public read/insert)
- `pathway_leads` - Lead capture for Warubi pathways program

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY (server-side only)
```

## Key Types (src/types/index.ts)
- `PlayerProfile` - Form input data
- `AnalysisResult` - AI response structure
- `VisibilityScore` - D1/D2/D3/NAIA/JUCO percentages
- `RiskFlag` - Category, message, severity
- `ActionItem` - 30/90/360 day tasks with impact level

## No Authentication
This is a public tool. No login required. Results stored with email for future retrieval.
