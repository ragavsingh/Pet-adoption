-- ==============================================================================
-- Migration: 20260907213000_auto_sync_foster_trials_and_resilient_make_official.sql
-- Description: Auto-sync foster trials when adoption requests are approved,
--              and enhance adopter_complete_adoption RPC with self-healing fallback
--              so "Make It Official" works seamlessly even if a trial row was missing.
-- ==============================================================================

-- 1. Trigger function: sync foster trial and pet status on approval
CREATE OR REPLACE FUNCTION public.sync_foster_trial_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When request becomes approved or trial, ensure foster trial and pet status are synchronized
  IF NEW.status IN ('approved', 'Approved', 'trial', 'Trial') THEN
    PERFORM set_config('pet_adoption.in_secure_workflow', 'true', true);

    -- 1. Create foster trial if not exists
    IF NOT EXISTS (
      SELECT 1 FROM public.foster_trials 
      WHERE adoption_request_id = NEW.id OR (pet_id = NEW.pet_id AND adopter_id = NEW.adopter_id AND status = 'active')
    ) THEN
      INSERT INTO public.foster_trials (
        pet_id,
        adopter_id,
        provider_id,
        adoption_request_id,
        start_date,
        end_date,
        status,
        created_at,
        updated_at
      ) VALUES (
        NEW.pet_id,
        NEW.adopter_id,
        NEW.provider_id,
        NEW.id,
        NOW(),
        NOW() + INTERVAL '14 days',
        'active',
        NOW(),
        NOW()
      );
    END IF;

    -- 2. Update pet listing to 'trial'
    UPDATE public.pets
    SET adoption_status = 'trial',
        updated_at = NOW()
    WHERE id = NEW.pet_id AND adoption_status != 'adopted';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Attach trigger to adoption_requests
DROP TRIGGER IF EXISTS trg_sync_foster_trial_on_approval ON public.adoption_requests;
CREATE TRIGGER trg_sync_foster_trial_on_approval
AFTER INSERT OR UPDATE OF status ON public.adoption_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_foster_trial_on_approval();

-- 3. Enhance adopter_complete_adoption with self-healing trial creation
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
  v_admin_id UUID;
BEGIN
  -- 1. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  -- 2. Mark this transaction as authorized internal secure workflow
  PERFORM set_config('pet_adoption.in_secure_workflow', 'true', true);

  -- 3. Locate foster trial by trial.id OR adoption_request_id OR pet_id
  SELECT * INTO v_trial
  FROM public.foster_trials
  WHERE id = p_identifier OR adoption_request_id = p_identifier
  LIMIT 1;

  IF v_trial IS NULL THEN
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
    SELECT * INTO v_trial
    FROM public.foster_trials
    WHERE pet_id = p_identifier AND adopter_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Self-Healing: If trial record was not created during approval, find the approved request and auto-create trial
  IF v_trial IS NULL THEN
    IF v_req IS NULL THEN
      SELECT * INTO v_req
      FROM public.adoption_requests
      WHERE (id = p_identifier OR pet_id = p_identifier)
        AND (adopter_id = v_user_id OR public.is_admin())
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;

    IF v_req IS NOT NULL THEN
      INSERT INTO public.foster_trials (
        pet_id,
        adopter_id,
        provider_id,
        adoption_request_id,
        start_date,
        end_date,
        status,
        created_at,
        updated_at
      ) VALUES (
        v_req.pet_id,
        v_req.adopter_id,
        v_req.provider_id,
        v_req.id,
        NOW(),
        NOW() + INTERVAL '14 days',
        'active',
        NOW(),
        NOW()
      )
      RETURNING * INTO v_trial;
    END IF;
  END IF;

  IF v_trial IS NULL THEN
    RAISE EXCEPTION 'Foster trial record not found for the provided identifier.';
  END IF;

  -- 4. Verify trial ownership: caller MUST be the adopter (or admin)
  IF v_trial.adopter_id != v_user_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You can only finalize an adoption for your own foster trial.';
    END IF;
  END IF;

  -- 5. Idempotency Check: if trial is ALREADY completed, return existing adoption
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

  -- 6. Validate trial status (cannot adopt if already cancelled)
  IF v_trial.status IN ('cancelled') THEN
    RAISE EXCEPTION 'This foster trial is currently cancelled and cannot be converted to a permanent adoption.';
  END IF;

  -- 7. Lock and verify pet
  SELECT * INTO v_pet
  FROM public.pets
  WHERE id = v_trial.pet_id
  FOR UPDATE;

  IF v_pet IS NULL THEN
    RAISE EXCEPTION 'Pet profile not found.';
  END IF;

  IF v_pet.adoption_status = 'adopted' THEN
    SELECT * INTO v_adoption
    FROM public.adoptions
    WHERE pet_id = v_pet.id
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
    END IF;
  END IF;

  -- 8. Generate certificate number
  v_cert_num := 'PA-' || to_char(now(), 'YYYY') || '-' || upper(substring(gen_random_uuid()::text, 1, 8));

  -- 9. Insert official adoption record
  INSERT INTO public.adoptions (
    pet_id,
    adopter_id,
    provider_id,
    foster_trial_id,
    adoption_request_id,
    adoption_date,
    status,
    certificate_number,
    fee_amount,
    notes,
    created_at,
    updated_at
  ) VALUES (
    v_pet.id,
    v_trial.adopter_id,
    v_pet.provider_id,
    v_trial.id,
    v_trial.adoption_request_id,
    now(),
    'completed',
    v_cert_num,
    coalesce(v_pet.adoption_fee, 0),
    p_notes,
    now(),
    now()
  )
  RETURNING id INTO v_adoption_id;

  -- 10. Update foster trial to 'completed'
  UPDATE public.foster_trials
  SET
    status = 'completed',
    adoption_id = v_adoption_id,
    updated_at = now()
  WHERE id = v_trial.id;

  -- 11. Update pet status to 'adopted'
  UPDATE public.pets
  SET
    adoption_status = 'adopted',
    is_active = false,
    updated_at = now()
  WHERE id = v_pet.id;

  -- 12. Resolve any pending extension requests for this trial
  UPDATE public.trial_extension_requests
  SET
    status = 'rejected',
    provider_notes = 'Adoption completed early by foster parent.',
    resolved_at = now()
  WHERE trial_id = v_trial.id AND status = 'pending';

  -- 13. Resolve any unresolved milestone checks
  UPDATE public.trial_milestones
  SET
    is_completed = true,
    completed_at = coalesce(completed_at, now())
  WHERE trial_id = v_trial.id AND is_completed = false;

  -- 14. Update linked adoption request to 'completed'
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

  -- 15. Automatically cancel any remaining competing requests for this pet
  UPDATE public.adoption_requests
  SET
    status = 'cancelled',
    provider_notes = coalesce(provider_notes, '') || ' [System: Pet was officially adopted by foster parent.]',
    updated_at = now()
  WHERE pet_id = v_pet.id
    AND id != coalesce(v_trial.adoption_request_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status IN ('pending', 'under_review', 'more_information_required');

  -- 16. Increment provider stats (successful_adoptions_count)
  UPDATE public.provider_profiles
  SET
    successful_adoptions_count = successful_adoptions_count + 1,
    updated_at = now()
  WHERE id = v_pet.provider_id;

  -- 17. Dispatch In-App Notifications
  SELECT full_name INTO v_adopter_name FROM public.profiles WHERE id = v_trial.adopter_id;
  SELECT full_name INTO v_provider_name FROM public.profiles WHERE id = v_pet.provider_id;
  v_pet_name := v_pet.name;

  -- Notification to Adopter
  INSERT INTO public.notifications (
    user_id, type, title, message, related_entity_type, related_entity_id, action_url
  ) VALUES (
    v_trial.adopter_id,
    'adoption_completed',
    'IT''S OFFICIAL ❤️',
    'Congratulations! Your adoption of ' || v_pet_name || ' is officially finalized. Welcome to the family!',
    'adoption',
    v_adoption_id,
    '/adoption-success/' || v_pet.id
  )
  ON CONFLICT DO NOTHING;

  -- Notification to Provider
  INSERT INTO public.notifications (
    user_id, type, title, message, related_entity_type, related_entity_id, action_url
  ) VALUES (
    v_pet.provider_id,
    'adoption_completed',
    'Adoption Finalized 🎉',
    coalesce(v_adopter_name, 'Adopter') || ' officially adopted ' || v_pet_name || '! Another wonderful forever match.',
    'adoption',
    v_adoption_id,
    '/provider/adoptions'
  )
  ON CONFLICT DO NOTHING;

  -- Notification to Admin
  FOR v_admin_id IN (SELECT id FROM public.profiles WHERE role = 'admin') LOOP
    INSERT INTO public.notifications (
      user_id, type, title, message, related_entity_type, related_entity_id, action_url
    ) VALUES (
      v_admin_id,
      'adoption_completed',
      'Official Adoption Completed: ' || v_pet_name,
      coalesce(v_adopter_name, 'Adopter') || ' has officially finalized adoption for ' || v_pet_name || '! Certificate ' || v_cert_num || ' issued.',
      'adoption',
      v_adoption_id,
      '/admin/requests'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- 18. Return complete adoption metadata
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.adopter_complete_adoption(UUID, TEXT) TO authenticated;
NOTIFY pgrst, 'reload schema';
