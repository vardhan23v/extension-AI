-- GitHub connection per user. The OAuth token is encrypted by the API (AES-256-GCM).
-- Rollback: supabase/rollbacks/20261107000000_github.down.sql

create table if not exists public.github_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  encrypted_token text not null,
  login text not null,
  scope text not null default '',
  created_at timestamptz not null default now()
);

-- Only the API (service role) reads or writes this table.
alter table public.github_connections enable row level security;
