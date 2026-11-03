drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.increment_clone_count(uuid);
drop function if exists public.upvote_extension(uuid, uuid);
drop table if exists public.extension_upvotes;
drop table if exists public.extension_versions;
drop table if exists public.extensions;
drop table if exists public.profiles;
drop function if exists public.touch_updated_at();
