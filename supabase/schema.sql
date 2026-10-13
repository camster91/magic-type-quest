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

-- One child can play on several linked devices (see LINKED DEVICES). Every
-- device writes its own row; student_id groups them so a teacher sees one.
alter table class_roster add column if not exists student_id uuid;
create index if not exists idx_roster_student on class_roster(student_id);

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

-- ===== LINKED DEVICES =====
-- Children sign in anonymously, so each device is its own account. A short
-- link code, made on a device that already has the child's progress and typed
-- on another, joins that device to the same student: progress follows the
-- child and the teacher sees one row. The code is stored only as a SHA-256
-- hash, lasts 14 days, and both tables are reachable only through the
-- functions below or the narrow policies here.
create extension if not exists pgcrypto with schema extensions;

create table if not exists student_link_codes (
  owner_id uuid primary key references profiles(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null
);
alter table student_link_codes enable row level security;
-- No policies on purpose: browsers never read or write link codes directly.

create table if not exists linked_devices (
  device_id uuid primary key references profiles(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  linked_at timestamptz default now()
);
alter table linked_devices enable row level security;
drop policy if exists "Linked device read" on linked_devices;
drop policy if exists "Linked device delete" on linked_devices;
create policy "Linked device read" on linked_devices for select
  using (auth.uid() = device_id or auth.uid() = student_id);
create policy "Linked device delete" on linked_devices for delete
  using (auth.uid() = device_id or auth.uid() = student_id);
revoke insert, update on linked_devices from authenticated;

-- The student this account belongs to: the account it was linked to, or itself.
create or replace function public.my_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select student_id from linked_devices where device_id = auth.uid()),
    auth.uid()
  );
$$;
revoke all on function public.my_student_id() from public, anon;
grant execute on function public.my_student_id() to authenticated;

-- Every account that belongs to the caller's student: the student's own
-- account and each device linked to it.
create or replace function public.my_student_device_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.my_student_id() where auth.uid() is not null
  union
  select device_id from linked_devices
    where student_id = public.my_student_id() and auth.uid() is not null;
$$;
revoke all on function public.my_student_device_ids() from public, anon;
grant execute on function public.my_student_device_ids() to authenticated;

-- A child's linked devices may read each other's learning data, so progress
-- and exports cover the whole student. Writes stay limited to the caller.
drop policy if exists "Student group read" on profiles;
create policy "Student group read" on profiles for select
  using (id in (select public.my_student_device_ids()));
drop policy if exists "Student group read" on game_sessions;
create policy "Student group read" on game_sessions for select
  using (profile_id in (select public.my_student_device_ids()));
drop policy if exists "Student group read" on class_roster;
create policy "Student group read" on class_roster for select
  using (profile_id in (select public.my_student_device_ids()));

-- Make (or replace) the caller's link code. Returns the plain code once.
create or replace function public.create_link_code()
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  raw bytea := gen_random_bytes(12);
  code text := '';
  owner uuid := public.my_student_id();
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from profiles where id = owner) then
    raise exception 'save progress before linking' using errcode = 'P0002';
  end if;
  for i in 0..11 loop
    -- 256 is a multiple of 32, so every character is equally likely.
    code := code || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
  end loop;
  insert into student_link_codes (owner_id, code_hash, expires_at)
    values (owner, encode(digest(code, 'sha256'), 'hex'), now() + interval '14 days')
    on conflict (owner_id) do update
      set code_hash = excluded.code_hash, expires_at = excluded.expires_at;
  return code;
end;
$$;
revoke all on function public.create_link_code() from public, anon;
grant execute on function public.create_link_code() to authenticated;

-- Join the caller's device to the student who made the code. Returns that
-- student's id, or null for a wrong or expired code.
create or replace function public.link_device(p_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  target uuid;
  clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if length(clean) <> 12 then
    return null;
  end if;
  select owner_id into target from student_link_codes
    where code_hash = encode(digest(clean, 'sha256'), 'hex')
      and expires_at > now();
  -- A code made before its owner was itself linked points at that owner's
  -- student, so every device joins the same one-level group.
  target := coalesce((select student_id from linked_devices where device_id = target), target);
  if target is null or target = uid then
    return target;
  end if;
  -- Keep groups one level deep: a device other devices joined cannot move.
  if exists (select 1 from linked_devices where student_id = uid) then
    raise exception 'this device already has linked devices' using errcode = '22023';
  end if;
  insert into profiles (id) values (uid) on conflict (id) do nothing;
  -- This device now belongs to another student: its own code stops working.
  delete from student_link_codes where owner_id = uid;
  insert into linked_devices (device_id, student_id) values (uid, target)
    on conflict (device_id) do update
      set student_id = excluded.student_id, linked_at = now();
  return target;
end;
$$;
revoke all on function public.link_device(text) from public, anon;
grant execute on function public.link_device(text) to authenticated;

-- Every profile row of the caller's student (all of their linked devices),
-- so each device can merge the child's progress made elsewhere.
create or replace function public.student_profiles()
returns setof profiles
language sql
stable
security definer
set search_path = public
as $$
  select p.* from profiles p
  where auth.uid() is not null
    and (
      p.id = public.my_student_id()
      or p.id in (
        select device_id from linked_devices
        where student_id = public.my_student_id()
      )
    );
$$;
revoke all on function public.student_profiles() from public, anon;
grant execute on function public.student_profiles() to authenticated;

-- A device cannot claim to be another child: whatever a client sends, the
-- roster row's student_id is always the caller's own student.
create or replace function public.set_roster_student_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.student_id := public.my_student_id();
  return new;
end;
$$;
revoke all on function public.set_roster_student_id() from public, anon, authenticated;
drop trigger if exists roster_student_id on class_roster;
create trigger roster_student_id
  before insert or update on class_roster
  for each row execute function public.set_roster_student_id();

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
      class_code, profile_id, student_id, name, avatar, total_words, total_stars,
      high_score, completed_levels, updated_at
    ) values (
      p_class_code, auth.uid(), public.my_student_id(), left(p_name, 40), left(p_avatar, 16),
      greatest(p_total_words, 0), greatest(p_total_stars, 0),
      greatest(p_high_score, 0), coalesce(p_completed_levels, '{}'), now()
    )
    on conflict (class_code, profile_id) do update set
      student_id = excluded.student_id,
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

-- Delete the caller's student: the learning data AND sign-in accounts of the
-- caller and every device linked to the same child. Sessions, roster rows and
-- links cascade from profiles. Only ever acts on auth.uid()'s own student.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  ids uuid[];
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select array_agg(id) into ids from public.my_student_device_ids() as id;
  ids := array_append(coalesce(ids, '{}'), uid);
  delete from public.profiles where id = any(ids);
  delete from auth.users where id = any(ids);
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
