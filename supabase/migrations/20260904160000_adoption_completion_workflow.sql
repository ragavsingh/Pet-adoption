-- ==============================================================================
-- Migration: 20260904160000_adoption_completion_workflow.sql
-- Description: Real Adoption-Completion workflow ("Make It Official ❤️"),
--              atomic transaction RPC, idempotency, certificate number generation,
--              status synchronization across adoptions, trials, pets, and requests.
-- ==============================================================================

-- 1. Ensure public.adoptions has unique constraint on (pet_id, adopter_id) for completed state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_adoptions_pet_adopter_completed'
  ) THEN
    ALTER TABLE public.adoptions
      ADD CONSTRAINT uq_adoptions_pet_adopter_completed
      UNIQUE (pet_id, adopter_id);
  END IF;
EXCEPTION
  WHEN duplicate_table OR duplicate_object THEN
    NULL;
END $$;

-- 2. Secure Adoption Completion RPC
CREATE OR REPLACE FUNCTION public.adopter_complete_adoption(
  p_identifier UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_trial RECORD;
  v_pet RECORD;
  v_req RECORD;
  v_adoption RECORD;
  v_adoption_id UUID;
  v_cert_num TEXT;
  v_adopter_name TEXT;
  v_provider_name TEXT;
  v_pet_name TEXT;
BEGIN
  -- 1. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  -- 2. Locate foster trial by trial.id OR adoption_request_id
  SELECT * INTO v_trial
  FROM public.foster_trials
  WHERE id = p_identifier OR adoption_request_id = p_identifier
  LIMIT 1;

  IF v_trial IS NULL THEN
    -- Fallback: try finding via adoption_requests.id where request is approved
    SELECT * INTO v_req
    FROM public.adoption_requests
    WHERE id = p_identifier;

    IF v_req IS NOT NULL THEN
      SELECT * INTO v_trial
      FROM public.foster_trials
      WHERE pet_id = v_req.pet_id AND adopter_id = v_req.adopter_id
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
  END IF;

  IF v_trial IS NULL THEN
    RAISE EXCEPTION 'Foster trial record not found for the provided identifier.';
  END IF;

  -- 3. Verify trial ownership: caller MUST be the adopter (or admin)
  IF v_trial.adopter_id != v_user_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You can only finalize an adoption for your own foster trial.';
    END IF;
  END IF;

  -- 4. Idempotency Check: if trial is ALREADY completed, return existing adoption
  IF v_trial.status = 'completed' THEN
    SELECT * INTO v_adoption
    FROM public.adoptions
    WHERE (id = v_trial.adoption_id)
       OR (pet_id = v_trial.pet_id AND adopter_id = v_trial.adopter_id)
       OR (adoption_request_id = v_trial.adoption_request_id)
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_adoption IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'already_completed', true,
        'adoption_id', v_adoption.id,
        'pet_id', v_trial.pet_id,
        'certificate_number', v_adoption.certificate_number,
        'adoption_date', v_adoption.adoption_date,
        'status', v_adoption.status
      );
    END IF;
  END IF;

  -- 5. Validate trial status
  IF v_trial.status IN ('cancelled', 'expired') THEN
    RAISE EXCEPTION 'This foster trial is currently % and cannot be converted to a permanent adoption.', v_trial.status;
  END IF;

  -- 6. Lock and verify pet
  SELECT * INTO v_pet
  FROM public.pets
  WHERE id = v_trial.pet_id
  FOR UPDATE;

  IF v_pet IS NULL THEN
    RAISE EXCEPTION 'Pet profile not found.';
  END IF;

  -- 7. Check if pet already adopted by someone else
  IF v_pet.adoption_status = 'adopted' THEN
    -- Check if adopted by current user (idempotent case)
    SELECT * INTO v_adoption
    FROM public.adoptions
    WHERE pet_id = v_pet.id AND adopter_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_adoption IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'already_completed', true,
        'adoption_id', v_adoption.id,
        'pet_id', v_pet.id,
        'certificate_number', v_adoption.certificate_number,
        'adoption_date', v_adoption.adoption_date,
        'status', v_adoption.status
      );
    ELSE
      RAISE EXCEPTION 'This pet has already been adopted by another family.';
    END IF;
  END IF;

  -- 8. Verify provider relationship
  IF v_pet.provider_id != v_trial.provider_id THEN
    RAISE EXCEPTION 'Data integrity error: pet provider does not match trial provider.';
  END IF;

  -- 9. Generate Certificate Number
  v_cert_num := 'PA-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  -- 10. Atomically insert into public.adoptions
  INSERT INTO public.adoptions (
    pet_id,
    adopter_id,
    provider_id,
    adoption_request_id,
    adoption_date,
    status,
    certificate_number,
    notes
  ) VALUES (
    v_pet.id,
    v_trial.adopter_id,
    v_pet.provider_id,
    v_trial.adoption_request_id,
    now(),
    'completed',
    v_cert_num,
    coalesce(p_notes, 'Foster-to-Own bonding trial successfully completed. Official permanent adoption finalized.')
  )
  RETURNING id INTO v_adoption_id;

  -- 11. Update public.foster_trials to completed
  UPDATE public.foster_trials
  SET
    status = 'completed',
    adoption_id = v_adoption_id,
    journal_entries = coalesce(journal_entries, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'day', (EXTRACT(EPOCH FROM (now() - v_trial.start_date)) / 86400)::integer + 1,
        'note', 'Official adoption finalized! Forever family united ❤️',
        'timestamp', now()
      )
    ),
    updated_at = now()
  WHERE id = v_trial.id;

  -- 12. Update public.pets to adopted
  UPDATE public.pets
  SET
    adoption_status = 'adopted',
    updated_at = now()
  WHERE id = v_pet.id;

  -- 13. Update associated adoption request to completed & append timeline
  IF v_trial.adoption_request_id IS NOT NULL THEN
    SELECT * INTO v_req
    FROM public.adoption_requests
    WHERE id = v_trial.adoption_request_id;

    IF v_req IS NOT NULL THEN
      UPDATE public.adoption_requests
      SET
        status = 'completed',
        timeline = jsonb_build_array(
          jsonb_build_object(
            'step', 1, 'status', 'Pending', 'title', 'Request Sent',
            'date', to_char(v_req.created_at, 'Mon DD, YYYY'),
            'description', 'Adoption request submitted.', 'completed', true, 'current', false
          ),
          jsonb_build_object(
            'step', 2, 'status', 'Under Review', 'title', 'Under Review',
            'date', to_char(coalesce(v_req.reviewed_at, v_req.created_at), 'Mon DD, YYYY'),
            'description', 'Provider reviewed and approved application.', 'completed', true, 'current', false
          ),
          jsonb_build_object(
            'step', 3, 'status', 'Approved', 'title', 'Decision & Foster Trial',
            'date', to_char(v_trial.start_date, 'Mon DD, YYYY'),
            'description', 'Foster-to-Own trial period initiated.', 'completed', true, 'current', false
          ),
          jsonb_build_object(
            'step', 4, 'status', 'Completed', 'title', 'Adoption Completed',
            'date', to_char(now(), 'Mon DD, YYYY'),
            'description', 'Official adoption finalized and certificate issued.', 'completed', true, 'current', true
          )
        ),
        updated_at = now()
      WHERE id = v_req.id;
    END IF;
  END IF;

  -- 14. Automatically cancel any remaining competing requests for this pet
  UPDATE public.adoption_requests
  SET
    status = 'cancelled',
    provider_notes = coalesce(provider_notes, '') || ' [System: Pet was officially adopted by foster parent.]',
    updated_at = now()
  WHERE pet_id = v_pet.id
    AND id != coalesce(v_trial.adoption_request_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status IN ('pending', 'under_review', 'more_information_required');

  -- 15. Increment provider stats (successful_adoptions_count)
  UPDATE public.provider_profiles
  SET
    successful_adoptions_count = successful_adoptions_count + 1,
    updated_at = now()
  WHERE id = v_pet.provider_id;

  -- 16. Dispatch In-App Notifications
  SELECT full_name INTO v_adopter_name FROM public.profiles WHERE id = v_trial.adopter_id;
  SELECT full_name INTO v_provider_name FROM public.profiles WHERE id = v_pet.provider_id;
  v_pet_name := v_pet.name;

  -- Notification to Adopter
  INSERT INTO public.notifications (
    user_id, type, title, message, link, metadata
  ) VALUES (
    v_trial.adopter_id,
    'adoption_completed',
    'IT''S OFFICIAL ❤️',
    'Congratulations! Your adoption of ' || v_pet_name || ' is officially finalized. Welcome to the family!',
    '/adoption-success/' || v_pet.id,
    jsonb_build_object('pet_id', v_pet.id, 'adoption_id', v_adoption_id, 'certificate_number', v_cert_num)
  );

  -- Notification to Provider
  INSERT INTO public.notifications (
    user_id, type, title, message, link, metadata
  ) VALUES (
    v_pet.provider_id,
    'adoption_completed',
    'Adoption Finalized 🎉',
    coalesce(v_adopter_name, 'Adopter') || ' officially adopted ' || v_pet_name || '! Another wonderful forever match.',
    '/provider/adoptions',
    jsonb_build_object('pet_id', v_pet.id, 'adoption_id', v_adoption_id, 'certificate_number', v_cert_num)
  );

  -- 17. Return complete adoption metadata
  RETURN jsonb_build_object(
    'success', true,
    'already_completed', false,
    'adoption_id', v_adoption_id,
    'pet_id', v_pet.id,
    'certificate_number', v_cert_num,
    'adoption_date', now(),
    'status', 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.adopter_complete_adoption(UUID, TEXT) TO authenticated;
