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

-- RLS: users can read/write their own profile
alter table profiles enable row level security;
create policy "Public read" on profiles for select using (true);
create policy "Self update" on profiles for update using (auth.uid() = id);
create policy "Self insert" on profiles for insert with check (auth.uid() = id);

-- ===== GAME SESSIONS =====
create table if not exists game_sessions (
  id bigserial primary key,
  profile_id uuid references profiles(id) on delete cascade,
  level text not null,
  score integer default 0,
  wpm decimal(5,2) default 0,
  accuracy decimal(5,2) default 0,
  words_typed integer default 0,
  words_completed integer default 0,
  max_combo integer default 0,
  skips_used integer default 0,
  created_at timestamptz default now()
);

-- Index for teacher analytics
create index if not exists idx_sessions_profile on game_sessions(profile_id, created_at desc);
create index if not exists idx_sessions_class on game_sessions(class_code, created_at desc) where class_code is not null;

-- RLS: anyone can insert (anonymous play), only profile owner can read
create policy "Open insert" on game_sessions for insert with check (true);
create policy "Owner read" on game_sessions for select using (auth.uid() = profile_id);

-- ===== CLASS ROSTER =====
create table if not exists class_roster (
  id bigserial primary key,
  class_code text not null,
  profile_id text not null,
  name text,
  avatar text,
  total_words integer default 0,
  total_stars integer default 0,
  high_score integer default 0,
  completed_levels integer[] default '{}',
  updated_at timestamptz default now(),
  unique(class_code, profile_id)
);

-- Teacher: read by class_code
create policy "Class read" on class_roster for select using (true);
create policy "Student upsert" on class_roster for insert with check (true);
create policy "Student update" on class_roster for update using (true);

-- ===== TEACHER CODES =====
create table if not exists teacher_codes (
  class_code text primary key,
  teacher_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create policy "Teacher own codes" on teacher_codes for all using (auth.uid() = teacher_id);

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
