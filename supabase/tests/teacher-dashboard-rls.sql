-- BloomType: teacher accounts, classes and school admin RLS scenario.
--
-- Proves, on a local PostgreSQL with a Supabase auth stub, that:
--   * teacher A cannot see (or change) teacher B's class, roster or sessions;
--   * a school admin sees only aggregates for their own school;
--   * a student (anonymous account) cannot read the classes table or
--     become a teacher;
--   * archived classes accept no new students, legacy class codes still do;
--   * imported rosters refuse emails.
--
-- Run it against a scratch database that has the stub and the schema:
--   psql -d scratch -f stub.sql          (anon/authenticated roles, auth.users, auth.uid())
--   psql -d scratch -f supabase/schema.sql
--   psql -d scratch -v ON_ERROR_STOP=1 -f supabase/tests/teacher-dashboard-rls.sql
-- Every check prints "PASS: ..." and any failure stops the script with an
-- error. NEVER run this against a real project: it deletes every account.
--
-- The stub's auth.uid() reads request.jwt.claim.sub; Supabase also exposes
-- the full claims (email, is_anonymous) as request.jwt.claims, which the
-- teacher RPCs read. login() below sets both.

\set ON_ERROR_STOP 1
reset role;
set client_min_messages = notice;

truncate auth.users cascade;
truncate profiles cascade;
delete from teacher_codes;
delete from schools;
delete from teacher_invites;

insert into auth.users (id) select ('00000000-0000-0000-0000-0000000000' || x)::uuid
  from unnest(array['a1', 'b1', 'ad', 'ee', 'cc', '51', '52', '53', '54']) x;

create or replace function pg_temp.login(p_id text, p_email text, p_anonymous boolean default false)
returns void language sql as $$
  select set_config('request.jwt.claim.sub', p_id, false),
         set_config('request.jwt.claims', json_build_object(
           'sub', p_id, 'email', coalesce(p_email, ''), 'is_anonymous', p_anonymous)::text, false);
$$;

-- Owner provisioning (service role): two schools and one admin each.
insert into schools (id, name) values
  ('00000000-0000-0000-0000-00000000aaaa', 'North School'),
  ('00000000-0000-0000-0000-00000000bbbb', 'South School');
insert into teachers (id, school_id, role, display_name) values
  ('00000000-0000-0000-0000-0000000000ad', '00000000-0000-0000-0000-00000000aaaa', 'admin', 'North Admin'),
  ('00000000-0000-0000-0000-0000000000ee', '00000000-0000-0000-0000-00000000bbbb', 'admin', 'South Admin');
-- A class code provisioned before classes existed (the old way).
insert into teacher_codes (class_code, teacher_id) values ('LEGACY1', '00000000-0000-0000-0000-0000000000ad');

set role authenticated;

-- ===== Admin invites two teachers =====
select pg_temp.login('00000000-0000-0000-0000-0000000000ad', 'admin@north.example');
do $$ begin
  if not public.admin_invite_teacher('Teacher.A@North.example') then raise exception 'FAIL: invite A'; end if;
  if not public.admin_invite_teacher('teacher.b@north.example') then raise exception 'FAIL: invite B'; end if;
  raise notice 'PASS: a school admin invites teachers to their school';
end $$;
-- The other school's admin cannot take over North's invite.
select pg_temp.login('00000000-0000-0000-0000-0000000000ee', 'admin@south.example');
do $$ begin
  if public.admin_invite_teacher('teacher.b@north.example', 'admin') then
    raise exception 'FAIL: another school''s admin rewrote an invite';
  end if;
  raise notice 'PASS: an admin cannot change another school''s invite';
end $$;

-- ===== Teachers claim their invites and create classes =====
select pg_temp.login('00000000-0000-0000-0000-0000000000a1', 'teacher.a@north.example');
do $$ begin
  if public.claim_teacher_invite('Ms A') is distinct from 'teacher' then raise exception 'FAIL: A claim'; end if;
  perform public.create_class('  Room   1 ');
  if (select name from classes) <> 'Room 1' then raise exception 'FAIL: class name not cleaned'; end if;
  raise notice 'PASS: teacher A signs in, claims the invite and creates a class';
end $$;
select pg_temp.login('00000000-0000-0000-0000-0000000000b1', 'teacher.b@north.example');
do $$ begin
  if public.claim_teacher_invite('Mr B') is distinct from 'teacher' then raise exception 'FAIL: B claim'; end if;
  perform public.create_class('Room 2');
  raise notice 'PASS: teacher B signs in and creates a class';
end $$;

reset role;
select set_config('bt.class_a', id::text, false), set_config('bt.code_a', class_code, false)
  from classes where name = 'Room 1';
select set_config('bt.class_b', id::text, false), set_config('bt.code_b', class_code, false)
  from classes where name = 'Room 2';
do $$ begin
  if current_setting('bt.code_a') !~ '^[2-9A-HJKMNP-Z]{8}$' then raise exception 'FAIL: class code shape'; end if;
  if (select count(*) from teacher_codes where class_code in (current_setting('bt.code_a'), current_setting('bt.code_b'))) <> 2 then
    raise exception 'FAIL: class codes not registered in teacher_codes';
  end if;
  raise notice 'PASS: each class gets a server-made 8-character code in teacher_codes';
end $$;
set role authenticated;

-- ===== Uninvited and anonymous accounts never become teachers =====
select pg_temp.login('00000000-0000-0000-0000-0000000000cc', 'stranger@gmail.example');
do $$ begin
  if public.claim_teacher_invite('Stranger') is not null then raise exception 'FAIL: uninvited claim'; end if;
  begin
    perform public.create_class('Sneaky');
    raise exception 'FAIL: uninvited account created a class';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: an uninvited Google account cannot open a class';
end $$;
select pg_temp.login('00000000-0000-0000-0000-000000000051', null, true);
do $$ begin
  begin
    perform public.claim_teacher_invite('Kid');
    raise exception 'FAIL: anonymous account claimed a teacher role';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.create_class('Kid class');
    raise exception 'FAIL: anonymous account created a class';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: an anonymous (student) account cannot become a teacher';
end $$;

-- ===== Students join: S1 in A's class, S2 in B's class, S4 by legacy code =====
select pg_temp.login('00000000-0000-0000-0000-000000000051', null, true);
insert into profiles (id, name) values (auth.uid(), 'Sam');
select public.sync_class_membership(current_setting('bt.code_a'), 'Sam', '🌸', 10, 2, 50, '{1}');
insert into game_sessions (profile_id, level, duration_seconds) values (auth.uid(), 1, 600), (auth.uid(), 2, 300);
select pg_temp.login('00000000-0000-0000-0000-000000000052', null, true);
insert into profiles (id, name) values (auth.uid(), 'Bea');
select public.sync_class_membership(current_setting('bt.code_b'), 'Bea', '🌼', 5, 1, 20, '{}');
insert into game_sessions (profile_id, level, duration_seconds) values (auth.uid(), 1, 120);
select pg_temp.login('00000000-0000-0000-0000-000000000054', null, true);
insert into profiles (id, name) values (auth.uid(), 'Lee');
select public.sync_class_membership('LEGACY1', 'Lee', '🌷', 1, 0, 5, '{}');
do $$ begin
  raise notice 'PASS: students join open classes, including a legacy class code';
end $$;

-- ===== Teacher A cannot see teacher B's class =====
select pg_temp.login('00000000-0000-0000-0000-0000000000a1', 'teacher.a@north.example');
do $$ begin
  if (select count(*) from classes) <> 1 then raise exception 'FAIL: A sees % classes', (select count(*) from classes); end if;
  if exists (select 1 from classes where id = current_setting('bt.class_b')::uuid) then
    raise exception 'FAIL: A can read B''s class';
  end if;
  raise notice 'PASS: teacher A sees only their own class';

  if (select count(*) from class_roster where class_code = current_setting('bt.code_b')) <> 0 then
    raise exception 'FAIL: A can read B''s roster';
  end if;
  if (select count(*) from class_roster) <> 1 or (select name from class_roster) <> 'Sam' then
    raise exception 'FAIL: A should read exactly Sam';
  end if;
  raise notice 'PASS: teacher A reads only their own class roster';

  if exists (select 1 from game_sessions where profile_id = '00000000-0000-0000-0000-000000000052') then
    raise exception 'FAIL: A can read B''s student sessions';
  end if;
  if (select count(*) from game_sessions) <> 2 then raise exception 'FAIL: A should read Sam''s 2 sessions'; end if;
  if exists (select 1 from profiles) then raise exception 'FAIL: A can read whole student profiles'; end if;
  raise notice 'PASS: teacher A reads only their students'' sessions and no whole profiles';

  begin
    perform public.rename_class(current_setting('bt.class_b')::uuid, 'Mine now');
    raise exception 'FAIL: A renamed B''s class';
  exception when no_data_found then null;
  end;
  begin
    perform public.set_class_archived(current_setting('bt.class_b')::uuid, true);
    raise exception 'FAIL: A archived B''s class';
  exception when no_data_found then null;
  end;
  begin
    perform public.import_roster(current_setting('bt.class_b')::uuid, 'csv', null, '[{"externalId":"x","displayName":"X"}]');
    raise exception 'FAIL: A imported into B''s class';
  exception when no_data_found then null;
  end;
  begin
    update classes set owner_id = auth.uid() where id = current_setting('bt.class_b')::uuid;
    raise exception 'FAIL: A could update classes directly';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into teachers (id, role) values (auth.uid(), 'admin');
    raise exception 'FAIL: A could write the teachers table';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: teacher A cannot rename, archive, import into or take over B''s class, or self-promote';

  begin
    perform * from public.school_class_summary();
    raise exception 'FAIL: a plain teacher ran the admin summary';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: a plain teacher cannot open the school admin view';
end $$;

-- ===== Roster import (teacher A) =====
do $$ begin
  if public.import_roster(current_setting('bt.class_a')::uuid, 'google', 'course-1',
       '[{"externalId":"g1","displayName":"Sam T."},{"externalId":"g2","displayName":"Ana R."},{"externalId":"g2","displayName":"Ana R."}]') <> 2 then
    raise exception 'FAIL: first import count';
  end if;
  -- A re-sync replaces that provider's list: g2 left the course, g3 joined.
  perform public.import_roster(current_setting('bt.class_a')::uuid, 'google', 'course-1',
       '[{"externalId":"g1","displayName":"Sam T."},{"externalId":"g3","displayName":"Max P."}]');
  if (select string_agg(external_id, ',' order by external_id) from roster_students) <> 'g1,g3' then
    raise exception 'FAIL: re-sync did not replace the roster';
  end if;
  if (select roster_provider from classes) <> 'google' then raise exception 'FAIL: provider not recorded'; end if;
  begin
    perform public.import_roster(current_setting('bt.class_a')::uuid, 'csv', null,
       '[{"externalId":"c1","displayName":"kid@school.example"}]');
    raise exception 'FAIL: an email was stored as a display name';
  exception when check_violation then null;
  end;
  begin
    perform public.import_roster(current_setting('bt.class_a')::uuid, 'csv', null,
       '[{"externalId":"kid@school.example","displayName":"Kid"}]');
    raise exception 'FAIL: an email was stored as an external id';
  exception when check_violation then null;
  end;
  raise notice 'PASS: roster import saves names and ids, re-syncs, and refuses emails';
end $$;
select pg_temp.login('00000000-0000-0000-0000-0000000000b1', 'teacher.b@north.example');
do $$ begin
  if exists (select 1 from roster_students) then raise exception 'FAIL: B can read A''s imported roster'; end if;
  delete from roster_students;
  raise notice 'PASS: teacher B cannot read A''s imported roster';
end $$;
reset role;
do $$ begin
  if (select count(*) from roster_students) <> 2 then raise exception 'FAIL: B deleted A''s imported roster'; end if;
  raise notice 'PASS: teacher B cannot delete A''s imported roster';
end $$;
set role authenticated;

-- ===== Rename and archive (teacher A) =====
select pg_temp.login('00000000-0000-0000-0000-0000000000a1', 'teacher.a@north.example');
do $$ begin
  perform public.rename_class(current_setting('bt.class_a')::uuid, 'Room 1A');
  perform public.set_class_archived(current_setting('bt.class_a')::uuid, true);
  if (select archived_at is null from classes) then raise exception 'FAIL: not archived'; end if;
  raise notice 'PASS: teacher A renames and archives their class';
end $$;
select pg_temp.login('00000000-0000-0000-0000-000000000053', null, true);
insert into profiles (id, name) values (auth.uid(), 'Kim');
do $$ begin
  if public.class_code_exists(current_setting('bt.code_a')) then raise exception 'FAIL: archived class still open'; end if;
  begin
    perform public.sync_class_membership(current_setting('bt.code_a'), 'Kim', '🌻', 0, 0, 0, '{}');
    raise exception 'FAIL: a student joined an archived class';
  exception when insufficient_privilege then null;
  end;
  if not public.class_code_exists('LEGACY1') then raise exception 'FAIL: legacy code closed'; end if;
  raise notice 'PASS: an archived class accepts no new students; legacy codes stay open';
end $$;
select pg_temp.login('00000000-0000-0000-0000-0000000000a1', 'teacher.a@north.example');
do $$ begin
  if (select count(*) from class_roster) <> 1 then raise exception 'FAIL: archived roster lost'; end if;
  perform public.set_class_archived(current_setting('bt.class_a')::uuid, false);
  raise notice 'PASS: an archived class keeps its roster and can be reopened';
end $$;

-- ===== A student cannot read the classes table =====
select pg_temp.login('00000000-0000-0000-0000-000000000051', null, true);
do $$ begin
  if exists (select 1 from classes) then raise exception 'FAIL: student reads classes'; end if;
  if exists (select 1 from teachers) then raise exception 'FAIL: student reads teachers'; end if;
  if exists (select 1 from schools) then raise exception 'FAIL: student reads schools'; end if;
  if exists (select 1 from roster_students) then raise exception 'FAIL: student reads imported rosters'; end if;
  if exists (select 1 from teacher_invites) then raise exception 'FAIL: student reads invites'; end if;
  begin
    insert into classes (owner_id, class_code, name) values (auth.uid(), 'HACK', 'x');
    raise exception 'FAIL: student inserted a class';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.school_class_summary();
    raise exception 'FAIL: student ran the admin summary';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: a student cannot read classes, teachers, schools, imported rosters or invites';
end $$;
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);
do $$
declare
  t text;
begin
  foreach t in array array['classes', 'roster_students', 'teachers', 'schools', 'teacher_invites'] loop
    begin
      execute format('select 1 from %I limit 1', t);
      raise exception 'FAIL: signed-out visitor can query %', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  raise notice 'PASS: a signed-out visitor has no access to the teacher tables';
end $$;
reset role;
set role authenticated;

-- ===== The admin sees only aggregates for their school =====
select pg_temp.login('00000000-0000-0000-0000-0000000000ad', 'admin@north.example');
do $$
declare
  r record;
  columns text;
begin
  if exists (select 1 from classes) then raise exception 'FAIL: admin reads class rows directly'; end if;
  if exists (select 1 from class_roster where class_code <> 'LEGACY1') then
    raise exception 'FAIL: admin reads another teacher''s roster';
  end if;
  if exists (select 1 from roster_students) then raise exception 'FAIL: admin reads imported names'; end if;
  if exists (select 1 from game_sessions) or exists (select 1 from profiles) then
    raise exception 'FAIL: admin reads student sessions or profiles';
  end if;
  raise notice 'PASS: the admin cannot read student rows of other teachers'' classes';

  if (select count(*) from public.school_class_summary()) <> 2 then
    raise exception 'FAIL: admin should see the 2 North classes';
  end if;
  select * into r from public.school_class_summary() where class_name = 'Room 1A';
  if r.student_count <> 1 or r.imported_count <> 2 or r.active_students_7d <> 1 or r.weekly_minutes <> 15.0 then
    raise exception 'FAIL: Room 1A aggregates wrong: %', r;
  end if;
  select * into r from public.school_class_summary() where class_name = 'Room 2';
  if r.student_count <> 1 or r.weekly_minutes <> 2.0 then raise exception 'FAIL: Room 2 aggregates wrong: %', r; end if;
  if exists (
    select 1 from public.school_class_summary() s
    where s::text ~ '(Sam|Bea|Ana|Max|00000000-0000-0000-0000-00000000005)'
  ) then raise exception 'FAIL: the admin summary leaks a student name or id'; end if;
  select string_agg(n, ',' order by o) into columns
    from pg_proc p, unnest(p.proargnames, p.proargmodes) with ordinality as a(n, m, o)
    where p.proname = 'school_class_summary' and a.m = 't';
  if columns <> 'class_id,class_name,teacher_name,archived,student_count,imported_count,active_students_7d,weekly_minutes' then
    raise exception 'FAIL: the admin summary returns unexpected columns: %', columns;
  end if;
  raise notice 'PASS: the admin sees class counts and weekly minutes for their school, no student names';

  if (select count(*) from teachers) <> 3 then raise exception 'FAIL: admin should see the 3 North staff'; end if;
  raise notice 'PASS: the admin sees their school''s staff only';
end $$;
select pg_temp.login('00000000-0000-0000-0000-0000000000ee', 'admin@south.example');
do $$ begin
  if (select count(*) from public.school_class_summary()) <> 0 then
    raise exception 'FAIL: South admin sees North classes';
  end if;
  if (select count(*) from teachers) <> 1 then raise exception 'FAIL: South admin sees North staff'; end if;
  raise notice 'PASS: another school''s admin sees none of these classes';
end $$;

reset role;
do $$ begin raise notice 'ALL TEACHER DASHBOARD RLS CHECKS PASSED'; end $$;
