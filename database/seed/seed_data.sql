-- ============================================================
-- CyberTrace - sample data for local development / UI testing
--
-- 1. Sign up in the app (or Supabase dashboard -> Authentication -> Add user)
--    with a TEST account.
-- 2. Change the email below to that test account's email.
-- 3. Run this file in the Supabase SQL Editor.
--
-- Adds two completed scans with findings and recommendations, so the
-- Dashboard, Scan History and Results screens have something to show.
-- Scores follow the report's rules (HIGH 25, MEDIUM 10, LOW 5).
-- ============================================================
do $$
declare
  seed_email  text := 'test@example.com';   -- <-- change me
  uid         uuid;
  scan_a      uuid;
  scan_b      uuid;
begin
  select user_id into uid from public.users where email = seed_email;
  if uid is null then
    raise exception 'No CyberTrace user with email %. Sign up first, then re-run.', seed_email;
  end if;

  -- Older scan: HIGH risk (25 + 25 + 10 = 60)
  insert into public.scans
    (user_id, identifier, identifier_type, status, risk_score, risk_level, created_at, completed_at)
  values
    (uid, seed_email, 'EMAIL', 'COMPLETED', 60, 'HIGH', now() - interval '14 days', now() - interval '14 days')
  returning scan_id into scan_a;

  insert into public.scan_results (scan_id, source, category, description, severity) values
    (scan_a, 'XposedOrNot', 'DATA_BREACH',  'Email found in the 2019 Canva breach (email, name, hashed password).', 'HIGH'),
    (scan_a, 'XposedOrNot', 'DATA_BREACH',  'Email found in the 2021 LinkedIn scrape (email, job title).',          'HIGH'),
    (scan_a, 'Gravatar',    'SOCIAL_MEDIA', 'Public Gravatar profile shows full name and location.',                'MEDIUM');

  insert into public.recommendations (scan_id, message) values
    (scan_a, 'Change your password immediately and enable two-factor authentication where available.'),
    (scan_a, 'Review your social media privacy settings and limit public visibility of personal details.'),
    (scan_a, 'Conduct a full review of your online accounts and remove any that are no longer in use.');

  -- Recent scan: MEDIUM risk after fixes (25 + 5 = 30)
  insert into public.scans
    (user_id, identifier, identifier_type, status, risk_score, risk_level, created_at, completed_at)
  values
    (uid, 'janedoe', 'USERNAME', 'COMPLETED', 30, 'MEDIUM', now() - interval '1 day', now() - interval '1 day')
  returning scan_id into scan_b;

  insert into public.scan_results (scan_id, source, category, description, severity) values
    (scan_b, 'GitHub', 'SOCIAL_MEDIA', 'Public GitHub profile lists real name, employer and personal website.', 'HIGH'),
    (scan_b, 'Reddit', 'SOCIAL_MEDIA', 'Reddit account with the same username is publicly visible.',             'LOW');

  insert into public.recommendations (scan_id, message) values
    (scan_b, 'Review your social media privacy settings and limit public visibility of personal details.');

  insert into public.audit_logs (user_id, action, details) values
    (uid, 'SCAN_COMPLETED', jsonb_build_object('scan_id', scan_a, 'seed', true)),
    (uid, 'SCAN_COMPLETED', jsonb_build_object('scan_id', scan_b, 'seed', true));

  raise notice 'Seeded 2 scans for %', seed_email;
end;
$$;
