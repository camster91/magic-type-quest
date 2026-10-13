-- BloomType Supabase Schema
-- Run this in your Supabase SQL Editor after creating a project.

-- ===== PROFILES =====
create table if not exists profiles (
  id uuid primary key,
  name text not null default 'Player',
  avatar text default '🌸',
  high_score integer default 0,
  total_words integer default 0,
  total_stars integer default 0,
  completed_levels integer[] default '{}',
  achievements text[] default '{}',
  garden jsonb default '[]',
  key_sr jsonb default '{}',
  class_code text,
  updated_at timestamptz default now()
);

-- RLS: players own their profile; a teacher can read profiles in a class code
-- they own. Cloud sync must never be used without an authenticated session.
alter table profiles enable row level security;
drop policy if exists "Public read" on profiles;
drop policy if exists "Owner read" on profiles;
drop policy if exists "Teacher class read" on profiles;
drop policy if exists "Self update" on profiles;
drop policy if exists "Self insert" on profiles;
drop policy if exists "Self delete" on profiles;
create policy "Owner read" on profiles for select using (auth.uid() = id);
create policy "Self update" on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "Self insert" on profiles for insert with check (auth.uid() = id);
create policy "Self delete" on profiles for delete using (auth.uid() = id);

-- ===== GAME SESSIONS =====
create table if not exists game_sessions (
  id bigserial primary key,
  session_id uuid,
  profile_id uuid references profiles(id) on delete cascade,
  level integer not null,
  score integer default 0,
  wpm decimal(5,2) default 0,
  accuracy decimal(5,2) default 0,
  words_typed integer default 0,
  words_completed integer default 0,
  max_combo integer default 0,
  skips_used integer default 0,
  created_at timestamptz default now()
);

-- Existing deployments gain the client-generated id without rewriting legacy
-- rows. The partial unique index makes retries idempotent while allowing old
-- rows (which have no session_id) to remain intact.
alter table game_sessions add column if not exists session_id uuid;
create unique index if not exists idx_sessions_session_id
  on game_sessions(profile_id, session_id) where session_id is not null;

-- Index for teacher analytics (joins to profiles.class_code)
create index if not exists idx_sessions_profile on game_sessions(profile_id, created_at desc);
create index if not exists idx_profiles_class on profiles(class_code) where class_code is not null;

-- RLS: authenticated players may write/read only their own sessions. Teacher
-- access is added after teacher_codes exists below.
alter table game_sessions enable row level security;
drop policy if exists "Open insert" on game_sessions;
drop policy if exists "Owner insert" on game_sessions;
drop policy if exists "Owner read" on game_sessions;
drop policy if exists "Teacher session read" on game_sessions;
create policy "Owner insert" on game_sessions for insert
  with check (auth.uid() = profile_id);
create policy "Owner read" on game_sessions for select
  using (auth.uid() = profile_id);

-- ===== CLASS ROSTER =====
create table if not exists class_roster (
  id bigserial primary key,
  class_code text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  name text,
  avatar text,
  total_words integer default 0,
  total_stars integer default 0,
  high_score integer default 0,
  completed_levels integer[] default '{}',
  updated_at timestamptz default now(),
  unique(class_code, profile_id)
);

-- RLS must be enabled for policies to take effect
alter table class_roster enable row level security;

drop policy if exists "Class read" on class_roster;
drop policy if exists "Student upsert" on class_roster;
drop policy if exists "Student update" on class_roster;
drop policy if exists "Roster self read" on class_roster;
drop policy if exists "Roster self insert" on class_roster;
drop policy if exists "Roster self update" on class_roster;
drop policy if exists "Roster self delete" on class_roster;

-- ===== TEACHER CODES =====
create table if not exists teacher_codes (
  class_code text primary key,
  teacher_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- RLS must be enabled for policies to take effect
alter table teacher_codes enable row level security;

drop policy if exists "Teacher own codes" on teacher_codes;
drop policy if exists "Teacher read own codes" on teacher_codes;
drop policy if exists "Teacher delete own codes" on teacher_codes;
create policy "Teacher read own codes" on teacher_codes for select
  using (auth.uid() = teacher_id);
create policy "Teacher delete own codes" on teacher_codes for delete
  using (auth.uid() = teacher_id);

-- Students cannot read teacher_codes, so this narrow check answers only
-- "does this class exist?" without exposing who owns it.
create or replace function public.class_code_exists(code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from teacher_codes where class_code = code);
$$;
revoke all on function public.class_code_exists(text) from public, anon;
grant execute on function public.class_code_exists(text) to authenticated;

-- Class ownership is provisioned only by a trusted administrator or service
-- role. Authenticated browser clients must never claim or transfer codes.
revoke insert, update on teacher_codes from authenticated;

-- Student roster writes are self-scoped. Teachers may read roster and session
-- data only where teacher_codes proves ownership of the requested class.
create policy "Roster self read" on class_roster for select
  using (
    auth.uid() = profile_id or exists (
      select 1 from teacher_codes tc
      where tc.class_code = class_roster.class_code
        and tc.teacher_id = auth.uid()
    )
  );
create policy "Roster self insert" on class_roster for insert
  with check (auth.uid() = profile_id and public.class_code_exists(class_code));
create policy "Roster self update" on class_roster for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id and public.class_code_exists(class_code));
create policy "Roster self delete" on class_roster for delete
  using (auth.uid() = profile_id);
create policy "Teacher session read" on game_sessions for select
  using (
    auth.uid() = profile_id or exists (
      select 1 from class_roster cr
      join teacher_codes tc on tc.class_code = cr.class_code
      where cr.profile_id = game_sessions.profile_id
        and tc.teacher_id = auth.uid()
    )
  );

-- ===== RETIRED ANALYTICS RPCS =====
-- The browser dashboard derives its summaries from the RLS-filtered roster and
-- does not call database RPCs. Remove the obsolete functions from existing
-- projects so they cannot remain as an unnecessary PostgREST attack surface.
drop function if exists class_wpm_trends(text);
drop function if exists red_flag_students(text);

-- ===== STUDENT RPCS =====
-- Replace the student's class membership in one transaction so a failed
-- write can never leave them in two classes or in none. Runs as the caller,
-- so every row still passes the roster RLS policies above.
create or replace function public.sync_class_membership(
  p_class_code text,
  p_name text,
  p_avatar text,
  p_total_words integer,
  p_total_stars integer,
  p_high_score integer,
  p_completed_levels integer[]
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from class_roster
    where profile_id = auth.uid()
      and (p_class_code is null or class_code <> p_class_code);
  if p_class_code is not null then
    insert into class_roster (
      class_code, profile_id, name, avatar, total_words, total_stars,
      high_score, completed_levels, updated_at
    ) values (
      p_class_code, auth.uid(), left(p_name, 40), left(p_avatar, 16),
      greatest(p_total_words, 0), greatest(p_total_stars, 0),
      greatest(p_high_score, 0), coalesce(p_completed_levels, '{}'), now()
    )
    on conflict (class_code, profile_id) do update set
      name = excluded.name,
      avatar = excluded.avatar,
      total_words = excluded.total_words,
      total_stars = excluded.total_stars,
      high_score = excluded.high_score,
      completed_levels = excluded.completed_levels,
      updated_at = excluded.updated_at;
  end if;
end;
$$;
revoke all on function public.sync_class_membership(text, text, text, integer, integer, integer, integer[]) from public, anon;
grant execute on function public.sync_class_membership(text, text, text, integer, integer, integer, integer[]) to authenticated;

-- Delete the caller's learning data AND their sign-in account. Sessions and
-- roster rows cascade from profiles. Only ever acts on auth.uid().
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
