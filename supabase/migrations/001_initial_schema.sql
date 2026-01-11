-- ExposureEngine v2 Database Schema
-- Run this migration on your Supabase project

-- Player Evaluations
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Player Info
  first_name text not null,
  last_name text not null,
  email text,
  gender text,
  date_of_birth date,
  grad_year int,
  state text,
  citizenship text,
  position text,
  secondary_positions text[],
  height text,
  dominant_foot text,

  -- Experience
  experience_level text,
  seasons jsonb,
  events jsonb,

  -- Academics
  gpa numeric(3,2),
  test_score text,

  -- Athletic Profile
  athletic_profile jsonb,

  -- Market Reality
  has_video boolean default false,
  coaches_contacted int default 0,
  responses_received int default 0,
  offers_received int default 0,

  -- AI Results
  visibility_scores jsonb,
  readiness_score jsonb,
  key_strengths text[],
  key_risks jsonb,
  action_plan jsonb,
  plain_language_summary text,
  coach_short_evaluation text,
  funnel_analysis jsonb,
  benchmark_analysis jsonb,
  overall_score int,
  bucket text,
  rating text,
  tags text[],

  -- Meta
  status text default 'completed'
);

-- Pathway Leads
create table if not exists pathway_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  role text not null,
  name text not null,
  email text not null,
  age text,
  grad_year text,
  goals text[],
  current_level text,
  budget_preference text,
  gap_year_interest boolean default false,
  source text default 'pathways',
  status text default 'new',
  notes text
);

-- Enable Row Level Security
alter table evaluations enable row level security;
alter table pathway_leads enable row level security;

-- Public read access for evaluations (anyone can view their results via ID)
create policy "Public read access for evaluations"
  on evaluations for select
  using (true);

-- Public insert access for evaluations (anyone can create)
create policy "Public insert access for evaluations"
  on evaluations for insert
  with check (true);

-- Public insert access for leads
create policy "Public insert access for leads"
  on pathway_leads for insert
  with check (true);

-- Indexes for common queries
create index if not exists idx_evaluations_email on evaluations(email);
create index if not exists idx_evaluations_created_at on evaluations(created_at desc);
create index if not exists idx_pathway_leads_status on pathway_leads(status);
create index if not exists idx_pathway_leads_created_at on pathway_leads(created_at desc);
