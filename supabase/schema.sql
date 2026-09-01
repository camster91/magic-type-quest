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
create policy "Self update" on profiles for update using (auth.uid() = id);
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
  with check (auth.uid() = profile_id);
create policy "Roster self update" on class_roster for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
create policy "Roster self delete" on class_roster for delete
  using (auth.uid() = profile_id);
create policy "Teacher class read" on profiles for select
  using (
    auth.uid() = id or exists (
      select 1 from teacher_codes tc
      where tc.class_code = profiles.class_code
        and tc.teacher_id = auth.uid()
    )
  );
create policy "Teacher session read" on game_sessions for select
  using (
    auth.uid() = profile_id or exists (
      select 1 from profiles p
      join teacher_codes tc on tc.class_code = p.class_code
      where p.id = game_sessions.profile_id
        and tc.teacher_id = auth.uid()
    )
  );

-- ===== RETIRED ANALYTICS RPCS =====
-- The browser dashboard derives its summaries from the RLS-filtered roster and
-- does not call database RPCs. Remove the obsolete functions from existing
-- projects so they cannot remain as an unnecessary PostgREST attack surface.
drop function if exists class_wpm_trends(text);
drop function if exists red_flag_students(text);
