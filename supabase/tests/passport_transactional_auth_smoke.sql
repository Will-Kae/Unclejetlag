-- Disposable database integration smoke test.
-- Execute manually in an isolated Supabase development database only.
-- Rolls back all test rows. Requires an already applied transactional workflow migration.
begin;

do $$
declare
  v_author uuid := gen_random_uuid();
  v_reviewer uuid := gen_random_uuid();
  v_submission uuid;
  v_failed boolean;
begin
  -- auth.users is intentionally not seeded here: creating real auth users
  -- requires the supported Supabase Auth admin API. This smoke test checks
  -- that unauthenticated callers cannot invoke either workflow.
  begin
    perform public.passport_submit_evidence(
      'AUS-GBR', 'AUS', 'GBR', 'visa_free', 'official-1',
      'https://example.gov/visas', now(),
      'Official source evidence requiring independent verification.', false
    );
    raise exception 'SECURITY FAILURE: unauthenticated submission accepted';
  exception
    when others then
      if sqlerrm like 'SECURITY FAILURE:%' then raise; end if;
      if sqlerrm not like '%Authentication required%' then raise; end if;
  end;

  begin
    perform public.passport_review_evidence(
      gen_random_uuid(), 1, 'approve',
      'Independent verification requires an authenticated reviewer.'
    );
    raise exception 'SECURITY FAILURE: unauthenticated review accepted';
  exception
    when others then
      if sqlerrm like 'SECURITY FAILURE:%' then raise; end if;
      if sqlerrm not like '%Authentication required%'
         and sqlerrm not like '%Stale or unavailable submission%'
      then raise; end if;
  end;
end $$;

rollback;
