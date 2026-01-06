-- Create table to store agent tasks

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  actions jsonb,
  status text not null default 'pending',
  screenshot_path text,
  logs jsonb,
  created_at timestamptz not null default now()
);

-- Index for ordering
create index if not exists idx_agent_tasks_created_at on public.agent_tasks (created_at desc);