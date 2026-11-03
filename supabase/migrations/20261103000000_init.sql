-- Extensio AI: initial Supabase schema (replaces MongoDB collections).
-- Down migration: supabase/rollbacks/20261103000000_init.down.sql

create extension if not exists pgcrypto;

-- Public profile for each Supabase Auth user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 100),
  legacy_mongo_id text unique,
  created_at timestamptz not null default now()
);

create table public.extensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  prompt text not null,
  files jsonb not null default '[]'::jsonb,
  is_public boolean not null default false,
  upvotes integer not null default 0,
  clone_count integer not null default 0,
  store_assets jsonb not null default '{}'::jsonb,
  monetization_link text,
  iteration_history jsonb not null default '[]'::jsonb,
  legacy_mongo_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index extensions_user_created_idx on public.extensions (user_id, created_at desc);
create index extensions_public_rank_idx on public.extensions (upvotes desc, created_at desc) where is_public;

-- Snapshots taken before every AI edit, for rollback.
create table public.extension_versions (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null references public.extensions (id) on delete cascade,
  files jsonb not null,
  note text,
  created_at timestamptz not null default now()
);
create index extension_versions_ext_idx on public.extension_versions (extension_id, created_at desc);

-- One upvote per user per extension.
create table public.extension_upvotes (
  extension_id uuid not null references public.extensions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (extension_id, user_id)
);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger extensions_touch before update on public.extensions
  for each row execute function public.touch_updated_at();

-- Atomic upvote: returns new count, or null if already voted / not public.
create or replace function public.upvote_extension(p_extension uuid, p_user uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare new_count integer;
begin
  if not exists (select 1 from extensions where id = p_extension and is_public) then
    return null;
  end if;
  insert into extension_upvotes (extension_id, user_id) values (p_extension, p_user)
    on conflict do nothing;
  if not found then return null; end if;
  update extensions set upvotes = upvotes + 1 where id = p_extension returning upvotes into new_count;
  return new_count;
end $$;
revoke execute on function public.upvote_extension(uuid, uuid) from public, anon, authenticated;

create or replace function public.increment_clone_count(p_extension uuid) returns void
language sql security definer set search_path = public as $$
  update extensions set clone_count = clone_count + 1 where id = p_extension and is_public;
$$;
revoke execute on function public.increment_clone_count(uuid) from public, anon, authenticated;

-- Auto-create profile on signup.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security. The backend uses the service-role key and enforces
-- ownership itself; these policies are defence in depth for anon-key access.
alter table public.profiles enable row level security;
alter table public.extensions enable row level security;
alter table public.extension_versions enable row level security;
alter table public.extension_upvotes enable row level security;

create policy profiles_self_read on public.profiles for select using (auth.uid() = id);
create policy profiles_self_update on public.profiles for update using (auth.uid() = id);

create policy extensions_read on public.extensions for select using (is_public or auth.uid() = user_id);
create policy extensions_insert on public.extensions for insert with check (auth.uid() = user_id);
create policy extensions_update on public.extensions for update using (auth.uid() = user_id);
create policy extensions_delete on public.extensions for delete using (auth.uid() = user_id);

create policy versions_owner_read on public.extension_versions for select using (
  exists (select 1 from public.extensions e where e.id = extension_id and e.user_id = auth.uid())
);
create policy upvotes_self_read on public.extension_upvotes for select using (auth.uid() = user_id);
