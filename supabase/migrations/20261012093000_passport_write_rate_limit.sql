-- STAGED ONLY: atomic, shared rate limits for passport writes.
-- Execute only from verified Next.js server with service_role.
begin;
create table if not exists public.passport_write_rate_buckets (
  actor_id uuid not null,
  operation text not null,
  window_start timestamptz not null,
  hits integer not null check (hits >= 0),
  primary key (actor_id, operation, window_start),
  constraint passport_write_operation_check
    check (operation in ('submit','review','resubmit'))
);
alter table public.passport_write_rate_buckets enable row level security;
revoke all on public.passport_write_rate_buckets from public,anon,authenticated;
grant select,insert,update,delete on public.passport_write_rate_buckets to service_role;

create or replace function public.passport_server_rate_limit(
  p_actor uuid, p_operation text
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_start timestamptz := pg_catalog.date_trunc('minute', pg_catalog.clock_timestamp());
  v_hits integer;
begin
  if p_actor is null or p_operation not in ('submit','review','resubmit') then
    raise exception 'Invalid rate-limit parameters';
  end if;
  insert into public.passport_write_rate_buckets(actor_id,operation,window_start,hits)
  values (p_actor,p_operation,v_start,1)
  on conflict (actor_id,operation,window_start)
  do update set hits = public.passport_write_rate_buckets.hits + 1
  returning hits into v_hits;
  return v_hits <= 10;
end;
$$;
revoke all on function public.passport_server_rate_limit(uuid,text)
  from public,anon,authenticated;
grant execute on function public.passport_server_rate_limit(uuid,text)
  to service_role;
commit;
