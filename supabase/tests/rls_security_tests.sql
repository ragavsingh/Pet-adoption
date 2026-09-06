-- ==============================================================================
-- PET ADOPTION PLATFORM — RLS SECURITY TEST SUITE
-- File: supabase/tests/rls_security_tests.sql
-- Description: Automated verification script testing all 15 authorization scenarios
-- ==============================================================================

BEGIN;

-- 1. Setup mock users in auth.users & profiles for testing
DO $$
DECLARE
  uid_adopter_a UUID := '11111111-1111-1111-1111-111111111111';
  uid_adopter_b UUID := '22222222-2222-2222-2222-222222222222';
  uid_provider_a UUID := '33333333-3333-3333-3333-333333333333';
  uid_provider_b UUID := '44444444-4444-4444-4444-444444444444';
  uid_admin UUID := '99999999-9999-9999-9999-999999999999';
  pet_a_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  pet_b_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  req_a_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  trial_a_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  ext_a_id UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  rep_a_id UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'RUNNING PET ADOPTION RLS SECURITY TESTS';
  RAISE NOTICE '==================================================';

  -- Ensure clean test slate
  DELETE FROM public.audit_logs;
  DELETE FROM public.reports;
  DELETE FROM public.trial_extension_requests;
  DELETE FROM public.foster_trials;
  DELETE FROM public.adoptions;
  DELETE FROM public.adoption_requests;
  DELETE FROM public.favorites;
  DELETE FROM public.pet_images;
  DELETE FROM public.pets;
  DELETE FROM public.provider_verifications;
  DELETE FROM public.provider_profiles;
  DELETE FROM public.adopter_profiles;
  DELETE FROM public.profiles;

  -- Seed test profiles directly as superuser
  INSERT INTO public.profiles (id, role, full_name, email, city)
  VALUES 
    (uid_adopter_a, 'adopter', 'Adopter A', 'adopter_a@test.com', 'Mumbai'),
    (uid_adopter_b, 'adopter', 'Adopter B', 'adopter_b@test.com', 'Delhi'),
    (uid_provider_a, 'provider', 'Provider A (Happy Paws)', 'provider_a@test.com', 'Bangalore'),
    (uid_provider_b, 'provider', 'Provider B (Second Chance)', 'provider_b@test.com', 'Pune'),
    (uid_admin, 'admin', 'System Admin', 'admin@test.com', 'Headquarters');

  INSERT INTO public.adopter_profiles (id, occupation, housing_type, profile_completion)
  VALUES 
    (uid_adopter_a, 'Designer', 'Apartment', 85),
    (uid_adopter_b, 'Engineer', 'Villa', 90);

  INSERT INTO public.provider_profiles (id, organization_name, provider_type, verification_status)
  VALUES 
    (uid_provider_a, 'Happy Paws Rescue', 'Rescue Organization', 'verified'),
    (uid_provider_b, 'Second Chance Shelter', 'Shelter', 'pending');

  -- Seed test pets
  INSERT INTO public.pets (id, provider_id, name, species, breed, age, gender, size, city, description, adoption_status)
  VALUES 
    (pet_a_id, uid_provider_a, 'Max', 'Dog', 'Indie', '2 years', 'Male', 'Medium', 'Bangalore', 'Friendly indie', 'available'),
    (pet_b_id, uid_provider_b, 'Luna', 'Cat', 'Domestic Shorthair', '1 year', 'Female', 'Small', 'Pune', 'Gentle cat', 'Draft');

  -- Seed test requests
  INSERT INTO public.adoption_requests (id, pet_id, adopter_id, provider_id, status, message)
  VALUES (req_a_id, pet_a_id, uid_adopter_a, uid_provider_a, 'pending', 'I would love to adopt Max!');

  -- Seed test trial
  INSERT INTO public.foster_trials (id, pet_id, adopter_id, provider_id, adoption_request_id, start_date, end_date, status)
  VALUES (trial_a_id, pet_a_id, uid_adopter_a, uid_provider_a, req_a_id, now() - INTERVAL '2 days', now() + INTERVAL '12 days', 'active');

  RAISE NOTICE 'Test fixtures initialized successfully.';
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 1: Anonymous user can see intended public pet data
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  count_public INT;
BEGIN
  -- Simulate anonymous user
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT COUNT(*) INTO count_public FROM public.pets WHERE adoption_status NOT IN ('draft', 'Draft', 'archived');
  IF count_public >= 1 THEN
    RAISE NOTICE 'TEST 1 PASSED: Anonymous user can see public available pets (Count: %)', count_public;
  ELSE
    RAISE EXCEPTION 'TEST 1 FAILED: Anonymous user cannot see public pets';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 2: Anonymous user cannot see private adopter profile data or draft pets
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  count_adopter_profiles INT;
  count_draft_pets INT;
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);

  SELECT COUNT(*) INTO count_adopter_profiles FROM public.adopter_profiles;
  SELECT COUNT(*) INTO count_draft_pets FROM public.pets WHERE adoption_status IN ('Draft', 'draft');

  IF count_adopter_profiles = 0 AND count_draft_pets = 0 THEN
    RAISE NOTICE 'TEST 2 PASSED: Anonymous user cannot read private adopter profiles or draft pets';
  ELSE
    RAISE EXCEPTION 'TEST 2 FAILED: Private data leaked to anonymous role';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 3: Adopter A cannot read Adopter B's private adopter profile
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  uid_adopter_b UUID := '22222222-2222-2222-2222-222222222222';
  found_b INT;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  SELECT COUNT(*) INTO found_b FROM public.adopter_profiles WHERE id = uid_adopter_b;
  IF found_b = 0 THEN
    RAISE NOTICE 'TEST 3 PASSED: Adopter A cannot read Adopter B''s private profile';
  ELSE
    RAISE EXCEPTION 'TEST 3 FAILED: Adopter A was able to read Adopter B''s profile';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 4: Adopter A cannot modify Adopter B's profile
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  uid_adopter_b UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  UPDATE public.profiles SET full_name = 'Hacked Name' WHERE id = uid_adopter_b;
  
  -- Verify Adopter B's name remains untouched
  PERFORM set_config('role', 'postgres', true);
  IF (SELECT full_name FROM public.profiles WHERE id = uid_adopter_b) = 'Adopter B' THEN
    RAISE NOTICE 'TEST 4 PASSED: Adopter A cannot modify Adopter B''s profile';
  ELSE
    RAISE EXCEPTION 'TEST 4 FAILED: Adopter A succeeded in updating Adopter B''s profile';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 5: Adopter A cannot read Adopter B's favorites
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  uid_adopter_b UUID := '22222222-2222-2222-2222-222222222222';
  pet_a_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  count_fav INT;
BEGIN
  -- Insert favorite for B as superuser
  PERFORM set_config('role', 'postgres', true);
  INSERT INTO public.favorites (adopter_id, pet_id) VALUES (uid_adopter_b, pet_a_id);

  -- Switch to Adopter A
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  SELECT COUNT(*) INTO count_fav FROM public.favorites WHERE adopter_id = uid_adopter_b;
  IF count_fav = 0 THEN
    RAISE NOTICE 'TEST 5 PASSED: Adopter A cannot read Adopter B''s favorites';
  ELSE
    RAISE EXCEPTION 'TEST 5 FAILED: Adopter A was able to read Adopter B''s favorites';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 6: Adopter A cannot modify Adopter B's adoption request
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  req_b_id UUID := 'c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2';
  pet_a_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  uid_adopter_b UUID := '22222222-2222-2222-2222-222222222222';
  uid_provider_a UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
  -- Insert request for B as superuser
  PERFORM set_config('role', 'postgres', true);
  INSERT INTO public.adoption_requests (id, pet_id, adopter_id, provider_id, status, message)
  VALUES (req_b_id, pet_a_id, uid_adopter_b, uid_provider_a, 'pending', 'B request');

  -- Adopter A tries to modify B request
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  UPDATE public.adoption_requests SET message = 'Malicious update' WHERE id = req_b_id;

  PERFORM set_config('role', 'postgres', true);
  IF (SELECT message FROM public.adoption_requests WHERE id = req_b_id) = 'B request' THEN
    RAISE NOTICE 'TEST 6 PASSED: Adopter A cannot modify Adopter B''s adoption request';
  ELSE
    RAISE EXCEPTION 'TEST 6 FAILED: Adopter A altered Adopter B''s request';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 7: Provider A cannot modify Provider B's pet
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_provider_a TEXT := '33333333-3333-3333-3333-333333333333';
  pet_b_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_provider_a, 'role', 'authenticated')::text, true);

  UPDATE public.pets SET name = 'Stolen Pet' WHERE id = pet_b_id;

  PERFORM set_config('role', 'postgres', true);
  IF (SELECT name FROM public.pets WHERE id = pet_b_id) = 'Luna' THEN
    RAISE NOTICE 'TEST 7 PASSED: Provider A cannot modify Provider B''s pet';
  ELSE
    RAISE EXCEPTION 'TEST 7 FAILED: Provider A modified Provider B''s pet';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 8: Provider A cannot access Provider B's private requests
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_provider_a TEXT := '33333333-3333-3333-3333-333333333333';
  uid_provider_b UUID := '44444444-4444-4444-4444-444444444444';
  uid_adopter_b UUID := '22222222-2222-2222-2222-222222222222';
  pet_b_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  req_b_id UUID := 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3';
  count_req INT;
BEGIN
  PERFORM set_config('role', 'postgres', true);
  INSERT INTO public.adoption_requests (id, pet_id, adopter_id, provider_id, status, message)
  VALUES (req_b_id, pet_b_id, uid_adopter_b, uid_provider_b, 'pending', 'B request for B pet');

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_provider_a, 'role', 'authenticated')::text, true);

  SELECT COUNT(*) INTO count_req FROM public.adoption_requests WHERE id = req_b_id;
  IF count_req = 0 THEN
    RAISE NOTICE 'TEST 8 PASSED: Provider A cannot access Provider B''s private requests';
  ELSE
    RAISE EXCEPTION 'TEST 8 FAILED: Provider A accessed Provider B''s private requests';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 9: Provider cannot make themselves admin (Privilege Escalation)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_provider_a TEXT := '33333333-3333-3333-3333-333333333333';
  error_caught BOOLEAN := false;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_provider_a, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = uid_provider_a::uuid;
  EXCEPTION WHEN OTHERS THEN
    error_caught := true;
  END;

  IF error_caught THEN
    RAISE NOTICE 'TEST 9 PASSED: Provider cannot make themselves admin (Trigger blocked escalation)';
  ELSE
    RAISE EXCEPTION 'TEST 9 FAILED: Provider escalated their role to admin!';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 10: Adopter cannot make themselves admin
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  error_caught BOOLEAN := false;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = uid_adopter_a::uuid;
  EXCEPTION WHEN OTHERS THEN
    error_caught := true;
  END;

  IF error_caught THEN
    RAISE NOTICE 'TEST 10 PASSED: Adopter cannot make themselves admin';
  ELSE
    RAISE EXCEPTION 'TEST 10 FAILED: Adopter escalated their role to admin!';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 11: Adopter cannot directly approve an adoption request
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  req_a_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  error_caught BOOLEAN := false;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.adoption_requests SET status = 'approved' WHERE id = req_a_id;
  EXCEPTION WHEN OTHERS THEN
    error_caught := true;
  END;

  IF error_caught THEN
    RAISE NOTICE 'TEST 11 PASSED: Adopter cannot directly approve their own adoption request';
  ELSE
    RAISE EXCEPTION 'TEST 11 FAILED: Adopter was able to set status to approved!';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 12: Provider cannot approve a request belonging to another provider's pet
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_provider_b TEXT := '44444444-4444-4444-4444-444444444444';
  req_a_id UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  error_caught BOOLEAN := false;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_provider_b, 'role', 'authenticated')::text, true);

  -- Provider B cannot see or update Provider A's request
  UPDATE public.adoption_requests SET status = 'approved' WHERE id = req_a_id;

  PERFORM set_config('role', 'postgres', true);
  IF (SELECT status FROM public.adoption_requests WHERE id = req_a_id) = 'pending' THEN
    RAISE NOTICE 'TEST 12 PASSED: Provider B cannot update or approve Provider A''s request';
  ELSE
    RAISE EXCEPTION 'TEST 12 FAILED: Provider B modified Provider A''s request';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 13: Users cannot manipulate trial ownership/dates/status directly
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  trial_a_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  error_caught BOOLEAN := false;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.foster_trials 
    SET end_date = now() + INTERVAL '90 days' 
    WHERE id = trial_a_id;
  EXCEPTION WHEN OTHERS THEN
    error_caught := true;
  END;

  IF error_caught THEN
    RAISE NOTICE 'TEST 13 PASSED: Users cannot arbitrarily change trial dates or parameters';
  ELSE
    RAISE EXCEPTION 'TEST 13 FAILED: Adopter was able to change trial end date directly!';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 14: Users cannot mark themselves as verified providers
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_provider_b TEXT := '44444444-4444-4444-4444-444444444444';
  error_caught BOOLEAN := false;
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_provider_b, 'role', 'authenticated')::text, true);

  BEGIN
    UPDATE public.provider_profiles 
    SET verification_status = 'verified' 
    WHERE id = uid_provider_b::uuid;
  EXCEPTION WHEN OTHERS THEN
    error_caught := true;
  END;

  IF error_caught THEN
    RAISE NOTICE 'TEST 14 PASSED: Provider cannot self-verify (Trigger blocked modification)';
  ELSE
    RAISE EXCEPTION 'TEST 14 FAILED: Provider was able to self-verify!';
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- TEST 15: Normal users cannot resolve reports as admins
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  uid_adopter_a TEXT := '11111111-1111-1111-1111-111111111111';
  rep_id UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  error_caught BOOLEAN := false;
BEGIN
  -- Insert report as superuser
  PERFORM set_config('role', 'postgres', true);
  INSERT INTO public.reports (id, reporter_id, target_type, target_id, reason, description, status)
  VALUES (rep_id, uid_adopter_a::uuid, 'pet', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Suspicious', 'Test description', 'open');

  -- Adopter attempts to resolve report
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', uid_adopter_a, 'role', 'authenticated')::text, true);

  UPDATE public.reports SET status = 'resolved' WHERE id = rep_id;

  PERFORM set_config('role', 'postgres', true);
  IF (SELECT status FROM public.reports WHERE id = rep_id) = 'open' THEN
    RAISE NOTICE 'TEST 15 PASSED: Normal users cannot resolve or modify reports';
  ELSE
    RAISE EXCEPTION 'TEST 15 FAILED: Normal user resolved report!';
  END IF;
END;
$$;

RAISE NOTICE '==================================================';
RAISE NOTICE 'ALL 15 RLS SECURITY TESTS PASSED PERFECTLY!';
RAISE NOTICE '==================================================';

ROLLBACK; -- Always rollback so test data leaves no trace
