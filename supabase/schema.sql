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


-- =====================================================================
-- ===== TEACHER ACCOUNTS, SCHOOLS AND CLASSES (pilot builds only) =====
-- =====================================================================
-- Everything below is additive: the tables, policies and RPCs above keep
-- working unchanged. Teachers sign in with Google (Supabase Auth); children
-- still sign in anonymously and never appear in these tables except as an
-- imported display name.
--
-- Who can do what:
--   * schools and the first admin of each school are provisioned by the
--     owner with the service role (see docs/CLOUD-CLASS-LOGIN.md);
--   * a school admin invites teachers by email; a teacher claims the invite
--     on first Google sign-in (claim_teacher_invite). Anonymous accounts can
--     never become teachers, so a child cannot open a class;
--   * a teacher sees only their own classes, imported rosters and the
--     joined students of those classes (via teacher_codes, as before);
--   * an admin sees their school's classes only as aggregates
--     (school_class_summary): counts and minutes, never student names.

-- Practice minutes for the weekly reports. A sitting counts for at most 30
-- minutes, matching the local practice log. Older rows stay null.
alter table game_sessions add column if not exists duration_seconds integer;
do $$ begin
  alter table game_sessions add constraint game_sessions_duration_range
    check (duration_seconds is null or duration_seconds between 0 and 1800);
exception when duplicate_object then null; end $$;
create index if not exists idx_sessions_created on game_sessions(created_at);

-- True when the caller signed in anonymously (every child does). Supabase
-- puts the flag in the JWT claims. A token with no email also counts as
-- anonymous, so only a real (Google) teacher account passes.
create or replace function public.caller_is_anonymous()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'is_anonymous')::boolean,
    false
  ) or coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', '') = '';
$$;
revoke all on function public.caller_is_anonymous() from public, anon;
grant execute on function public.caller_is_anonymous() to authenticated;

create or replace function public.caller_email()
returns text
language sql
stable
set search_path = public
as $$
  select lower(nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', ''));
$$;
revoke all on function public.caller_email() from public, anon;
grant execute on function public.caller_email() to authenticated;

-- ===== SCHOOLS =====
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  created_at timestamptz default now()
);
alter table schools enable row level security;
revoke all on schools from anon;
revoke insert, update, delete on schools from authenticated;

-- ===== TEACHERS =====
create table if not exists teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references schools(id) on delete set null,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  display_name text check (display_name is null or length(display_name) <= 80),
  created_at timestamptz default now()
);
create index if not exists idx_teachers_school on teachers(school_id);
alter table teachers enable row level security;
-- Roles and schools are never self-assigned: rows are written by the owner
-- (service role) or by the RPCs below.
revoke all on teachers from anon;
revoke insert, update, delete on teachers from authenticated;

-- Small security-definer helpers so policies never recurse through RLS.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from teachers where id = auth.uid()) and not public.caller_is_anonymous();
$$;
revoke all on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated;

create or replace function public.my_admin_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from teachers
  where id = auth.uid() and role = 'admin' and school_id is not null
    and not public.caller_is_anonymous();
$$;
revoke all on function public.my_admin_school_id() from public, anon;
grant execute on function public.my_admin_school_id() to authenticated;

drop policy if exists "Teacher self read" on teachers;
drop policy if exists "Admin school teachers read" on teachers;
create policy "Teacher self read" on teachers for select
  using (auth.uid() = id);
create policy "Admin school teachers read" on teachers for select
  using (school_id is not null and school_id = public.my_admin_school_id());

drop policy if exists "Member school read" on schools;
create policy "Member school read" on schools for select
  using (id in (select school_id from teachers where id = auth.uid()));

-- ===== TEACHER INVITES =====
-- An admin invites a teacher's school email. Only adult staff emails are
-- stored here; children never have invites.
create table if not exists teacher_invites (
  email text primary key check (email = lower(email) and email like '%_@_%'),
  school_id uuid not null references schools(id) on delete cascade,
  role text not null default 'teacher' check (role in ('teacher', 'admin')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
alter table teacher_invites enable row level security;
revoke all on teacher_invites from anon;
revoke insert, update, delete on teacher_invites from authenticated;
drop policy if exists "Admin invites read" on teacher_invites;
create policy "Admin invites read" on teacher_invites for select
  using (school_id = public.my_admin_school_id());

-- ===== CLASSES =====
-- A class owns one class code in teacher_codes, so the existing roster and
-- session policies (which check teacher_codes) cover it with no change.
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  school_id uuid references schools(id) on delete set null,
  class_code text not null unique references teacher_codes(class_code) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  archived_at timestamptz,
  roster_provider text check (roster_provider in ('google', 'classlink', 'clever', 'csv')),
  external_class_id text check (external_class_id is null or length(external_class_id) <= 128),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_classes_owner on classes(owner_id);
create index if not exists idx_classes_school on classes(school_id);
alter table classes enable row level security;
-- Writes go through the RPCs below, which check ownership.
revoke all on classes from anon;
revoke insert, update, delete on classes from authenticated;
drop policy if exists "Teacher own classes read" on classes;
create policy "Teacher own classes read" on classes for select
  using (owner_id = auth.uid() and public.is_teacher());

-- ===== IMPORTED ROSTERS =====
-- The names a teacher imported (Google Classroom, CSV, later ClassLink or
-- Clever). Only a display name and the provider's opaque id: no email, no
-- birth date, no photo. Children who join with the class code still appear
-- in class_roster as before; the dashboard matches the two by name.
create table if not exists roster_students (
  id bigserial primary key,
  class_id uuid not null references classes(id) on delete cascade,
  provider text not null check (provider in ('google', 'classlink', 'clever', 'csv')),
  external_id text not null check (length(external_id) between 1 and 128 and position('@' in external_id) = 0),
  display_name text not null check (length(display_name) between 1 and 40 and position('@' in display_name) = 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (class_id, provider, external_id)
);
alter table roster_students enable row level security;
revoke all on roster_students from anon;
revoke insert, update on roster_students from authenticated;
drop policy if exists "Teacher roster read" on roster_students;
drop policy if exists "Teacher roster delete" on roster_students;
create policy "Teacher roster read" on roster_students for select
  using (public.is_teacher() and exists (
    select 1 from classes c
    where c.id = roster_students.class_id and c.owner_id = auth.uid()
  ));
create policy "Teacher roster delete" on roster_students for delete
  using (public.is_teacher() and exists (
    select 1 from classes c
    where c.id = roster_students.class_id and c.owner_id = auth.uid()
  ));

-- Students may join a class only while it is open: an archived class keeps
-- its data for the teacher but accepts no new members. Codes made before
-- classes existed (no classes row) keep working.
create or replace function public.class_code_exists(code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from teacher_codes where class_code = code)
    and not exists (select 1 from classes where class_code = code and archived_at is not null);
$$;
revoke all on function public.class_code_exists(text) from public, anon;
grant execute on function public.class_code_exists(text) to authenticated;

-- ===== TEACHER RPCS =====
-- First Google sign-in: turn a pending invite for this email into a
-- teacher row. Returns the caller's role, or null without an invite.
create or replace function public.claim_teacher_invite(p_display_name text default null)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  invite teacher_invites%rowtype;
  existing text;
begin
  if uid is null or public.caller_is_anonymous() then
    raise exception 'teacher sign-in required' using errcode = '42501';
  end if;
  select role into existing from teachers where id = uid;
  if existing is not null then
    return existing;
  end if;
  select * into invite from teacher_invites where email = public.caller_email();
  if not found then
    return null;
  end if;
  insert into teachers (id, school_id, role, display_name)
    values (uid, invite.school_id, invite.role, left(nullif(trim(p_display_name), ''), 80));
  delete from teacher_invites where email = invite.email;
  return invite.role;
end;
$$;
revoke all on function public.claim_teacher_invite(text) from public, anon;
grant execute on function public.claim_teacher_invite(text) to authenticated;

-- An admin invites a teacher (or another admin) to their own school. An
-- invite already held by another school is left alone.
create or replace function public.admin_invite_teacher(p_email text, p_role text default 'teacher')
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  school uuid := public.my_admin_school_id();
  clean text := lower(trim(coalesce(p_email, '')));
begin
  if school is null then
    raise exception 'school admin only' using errcode = '42501';
  end if;
  if clean !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(clean) > 254 then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if coalesce(p_role, '') not in ('teacher', 'admin') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  insert into teacher_invites (email, school_id, role, invited_by)
    values (clean, school, p_role, auth.uid())
    on conflict (email) do update
      set role = excluded.role, invited_by = excluded.invited_by
      where teacher_invites.school_id = school;
  return found;
end;
$$;
revoke all on function public.admin_invite_teacher(text, text) from public, anon;
grant execute on function public.admin_invite_teacher(text, text) to authenticated;

-- Create a class with a fresh, unguessable 8-character code. The code is
-- generated here, so a teacher can never claim a code someone else uses.
create or replace function public.create_class(p_name text)
returns classes
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  clean_name text := left(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), 60);
  code text;
  raw bytea;
  created classes;
begin
  if not public.is_teacher() then
    raise exception 'teacher account required' using errcode = '42501';
  end if;
  if clean_name = '' then
    raise exception 'class name required' using errcode = '22023';
  end if;
  if (select count(*) from classes where owner_id = uid) >= 50 then
    raise exception 'class limit reached' using errcode = '54000';
  end if;
  loop
    raw := gen_random_bytes(8);
    code := '';
    for i in 0..7 loop
      code := code || substr(alphabet, (get_byte(raw, i) % 31) + 1, 1);
    end loop;
    exit when not exists (select 1 from teacher_codes where class_code = code);
  end loop;
  insert into teacher_codes (class_code, teacher_id) values (code, uid);
  insert into classes (owner_id, school_id, class_code, name)
    values (uid, (select school_id from teachers where id = uid), code, clean_name)
    returning * into created;
  return created;
end;
$$;
revoke all on function public.create_class(text) from public, anon;
grant execute on function public.create_class(text) to authenticated;

create or replace function public.rename_class(p_class_id uuid, p_name text)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  clean_name text := left(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), 60);
begin
  if not public.is_teacher() then
    raise exception 'teacher account required' using errcode = '42501';
  end if;
  if clean_name = '' then
    raise exception 'class name required' using errcode = '22023';
  end if;
  update classes set name = clean_name, updated_at = now()
    where id = p_class_id and owner_id = auth.uid();
  if not found then
    raise exception 'class not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.rename_class(uuid, text) from public, anon;
grant execute on function public.rename_class(uuid, text) to authenticated;

-- Archive (or reopen) a class. Archived classes keep their roster for the
-- teacher's records but accept no new students.
create or replace function public.set_class_archived(p_class_id uuid, p_archived boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.is_teacher() then
    raise exception 'teacher account required' using errcode = '42501';
  end if;
  update classes
    set archived_at = case when p_archived then coalesce(archived_at, now()) else null end,
        updated_at = now()
    where id = p_class_id and owner_id = auth.uid();
  if not found then
    raise exception 'class not found' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.set_class_archived(uuid, boolean) from public, anon;
grant execute on function public.set_class_archived(uuid, boolean) to authenticated;

-- Replace one provider's imported roster for a class in one transaction.
-- p_students is a JSON array of {"externalId": "...", "displayName": "..."};
-- the client has already minimised the names, and the table checks refuse
-- anything that looks like an email.
create or replace function public.import_roster(
  p_class_id uuid,
  p_provider text,
  p_external_class_id text,
  p_students jsonb
)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  saved integer;
begin
  if not public.is_teacher() then
    raise exception 'teacher account required' using errcode = '42501';
  end if;
  if not exists (select 1 from classes where id = p_class_id and owner_id = auth.uid()) then
    raise exception 'class not found' using errcode = 'P0002';
  end if;
  if coalesce(p_provider, '') not in ('google', 'classlink', 'clever', 'csv') then
    raise exception 'unknown roster provider' using errcode = '22023';
  end if;
  if jsonb_typeof(p_students) is distinct from 'array' or jsonb_array_length(p_students) > 200 then
    raise exception 'roster must be a list of at most 200 students' using errcode = '22023';
  end if;
  delete from roster_students
    where class_id = p_class_id and provider = p_provider
      and external_id not in (
        select s ->> 'externalId' from jsonb_array_elements(p_students) s
        where s ->> 'externalId' is not null
      );
  insert into roster_students (class_id, provider, external_id, display_name)
    select distinct on (s ->> 'externalId') p_class_id, p_provider, s ->> 'externalId', s ->> 'displayName'
    from jsonb_array_elements(p_students) s
    order by s ->> 'externalId'
    on conflict (class_id, provider, external_id) do update
      set display_name = excluded.display_name, updated_at = now();
  get diagnostics saved = row_count;
  update classes
    set roster_provider = p_provider,
        external_class_id = left(nullif(p_external_class_id, ''), 128),
        updated_at = now()
    where id = p_class_id;
  return saved;
end;
$$;
revoke all on function public.import_roster(uuid, text, text, jsonb) from public, anon;
grant execute on function public.import_roster(uuid, text, text, jsonb) to authenticated;

-- ===== SCHOOL ADMIN VIEW =====
-- One row per class in the admin's school: counts and minutes only. No
-- student names, ids or per-student numbers ever leave this function.
create or replace function public.school_class_summary()
returns table (
  class_id uuid,
  class_name text,
  teacher_name text,
  archived boolean,
  student_count integer,
  imported_count integer,
  active_students_7d integer,
  weekly_minutes numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  school uuid := public.my_admin_school_id();
begin
  if school is null then
    raise exception 'school admin only' using errcode = '42501';
  end if;
  return query
    select
      c.id,
      c.name,
      t.display_name,
      c.archived_at is not null,
      (select count(distinct coalesce(cr.student_id, cr.profile_id))::integer
         from class_roster cr where cr.class_code = c.class_code),
      (select count(*)::integer from roster_students rs where rs.class_id = c.id),
      (select count(distinct coalesce(cr.student_id, cr.profile_id))::integer
         from class_roster cr
         join game_sessions gs on gs.profile_id = cr.profile_id
         where cr.class_code = c.class_code and gs.created_at > now() - interval '7 days'),
      (select round(coalesce(sum(gs.duration_seconds), 0) / 60.0, 1)
         from class_roster cr
         join game_sessions gs on gs.profile_id = cr.profile_id
         where cr.class_code = c.class_code and gs.created_at > now() - interval '7 days')
    from classes c
    left join teachers t on t.id = c.owner_id
    where c.school_id = school
    order by c.archived_at is not null, c.name;
end;
$$;
revoke all on function public.school_class_summary() from public, anon;
grant execute on function public.school_class_summary() to authenticated;
