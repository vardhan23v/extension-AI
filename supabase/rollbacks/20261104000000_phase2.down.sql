drop table if exists public.conversations;
drop index if exists public.extensions_user_updated_idx;
alter table public.extensions drop column if exists last_audit;
alter table public.extensions drop column if exists description;
alter table public.extensions drop column if exists status;
