-- Testing Lab: one row per automated browser run of an extension.
-- Rollback: supabase/rollbacks/20261106000000_test_runs.down.sql

create table if not exists public.test_runs (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null references public.extensions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'passed', 'failed', 'error')),
  report jsonb,
  files_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists test_runs_ext_idx on public.test_runs (extension_id, created_at desc);
create index if not exists test_runs_user_idx on public.test_runs (user_id, created_at desc);

alter table public.test_runs enable row level security;
create policy test_runs_owner_read on public.test_runs for select using (auth.uid() = user_id);
