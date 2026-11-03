-- Bring-your-own AI keys (encrypted by the API with AES-256-GCM) and per-user settings.
-- Rollback: supabase/rollbacks/20261105000000_byok.down.sql

create table if not exists public.provider_keys (
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('groq', 'gemini', 'openrouter')),
  encrypted_key text not null,
  last4 text not null check (char_length(last4) <= 4),
  created_at timestamptz not null default now(),
  primary key (user_id, provider)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  byok_only boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Only the API (service role) reads or writes these tables. Encrypted keys are
-- never readable with the anon key, even by their owner.
alter table public.provider_keys enable row level security;
alter table public.user_settings enable row level security;
create policy user_settings_self_read on public.user_settings for select using (auth.uid() = user_id);
