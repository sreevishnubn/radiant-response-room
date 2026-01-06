-- Create table to store saved action presets

create table if not exists public.agent_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  actions jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_presets_created_at on public.agent_presets (created_at desc);