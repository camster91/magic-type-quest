-- LOCAL TESTING ONLY. Never run this on a real Supabase project.
--
-- A tiny stand-in for the objects Supabase provides, so supabase/schema.sql
-- and the backup/restore scripts can run on a plain PostgreSQL 15+ server
-- (see scripts/restore-drill.sh). auth.uid() reads the user id from the
-- request.jwt.claim.sub setting, like PostgREST does.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;

create schema if not exists auth;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema auth, extensions, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
