-- Read-only verification of the private passport database perimeter.
-- Expected result: eight rows, all rls_enabled=true and both select columns=false.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
  has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname like 'passport_%'
  and c.relkind = 'r'
order by c.relname;

-- Expected: no rows; any result means an unsafe grant or RLS setting.
select c.relname as unsafe_table
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname like 'passport_%'
  and c.relkind = 'r'
  and (
    not c.relrowsecurity
    or has_table_privilege('anon', c.oid, 'SELECT')
    or has_table_privilege('authenticated', c.oid, 'SELECT')
  );
