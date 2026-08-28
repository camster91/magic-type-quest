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
create policy "Owner read" on profiles for select using (auth.uid() = id);
create policy "Self update" on profiles for update using (auth.uid() = id);
create policy "Self insert" on profiles for insert with check (auth.uid() = id);

-- ===== GAME SESSIONS =====
create table if not exists game_sessions (
  id bigserial primary key,
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

-- ===== TEACHER CODES =====
create table if not exists teacher_codes (
  class_code text primary key,
  teacher_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- RLS must be enabled for policies to take effect
alter table teacher_codes enable row level security;

drop policy if exists "Teacher own codes" on teacher_codes;
create policy "Teacher own codes" on teacher_codes for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

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

-- ===== FUNCTIONS (Analytics) =====
-- Average WPM per class per day
create or replace function class_wpm_trends(p_class_code text)
returns table(day date, avg_wpm decimal, total_sessions bigint) as $$
begin
  return query
    select date(created_at) as day,
           avg(wpm)::decimal(5,2) as avg_wpm,
           count(*)::bigint as total_sessions
    from game_sessions gs
    join profiles p on p.id = gs.profile_id
    where p.class_code = p_class_code
    group by day
    order by day desc
    limit 30;
end;
$$ language plpgsql;

-- Red-flag students: accuracy < 60% in last 7 days
create or replace function red_flag_students(p_class_code text)
returns table(profile_id uuid, name text, avg_accuracy decimal, days_since_play bigint) as $$
begin
  return query
    select p.id, p.name,
           avg(gs.accuracy)::decimal(5,2) as avg_accuracy,
           extract(day from now() - max(gs.created_at))::bigint as days_since_play
    from profiles p
    left join game_sessions gs on gs.profile_id = p.id and gs.created_at > now() - interval '7 days'
    where p.class_code = p_class_code
    group by p.id, p.name
    having avg(gs.accuracy) < 60 or max(gs.created_at) < now() - interval '7 days'
    order by avg_accuracy asc nulls last;
end;
$$ language plpgsql;
