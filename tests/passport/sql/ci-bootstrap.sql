-- CI-only PostgreSQL compatibility bootstrap. NEVER apply to hosted Supabase.
-- The hosted project already supplies these roles and auth.users.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to service_role;
grant select on auth.users to service_role;
