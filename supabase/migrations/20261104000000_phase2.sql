-- Phase 2: project metadata and persistent assistant conversations.
-- Rollback: supabase/rollbacks/20261104000000_phase2.down.sql

alter table public.extensions
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'ready', 'archived')),
  add column if not exists description text not null default ''
    check (char_length(description) <= 1000),
  add column if not exists last_audit jsonb;

create index if not exists extensions_user_updated_idx on public.extensions (user_id, updated_at desc);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null references public.extensions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null check (char_length(content) <= 8000),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists conversations_ext_idx on public.conversations (extension_id, created_at);

alter table public.conversations enable row level security;
create policy conversations_owner_read on public.conversations for select using (
  exists (select 1 from public.extensions e where e.id = extension_id and e.user_id = auth.uid())
);
