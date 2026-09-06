-- ==============================================================================
-- Migration: 20260906010000_fix_make_official_early_completion.sql
-- Description: Fix "Make It Official" early adoption completion workflow.
--              Coordinates security guard triggers (check_trial_update, check_pet_update,
--              check_adoption_request_update) with adopter_complete_adoption RPC using
--              transaction-scoped session configuration 'pet_adoption.in_secure_workflow'.
--              Enables adopters to make adoptions official at any point during active trial.
-- ==============================================================================

-- 1. check_trial_update trigger function
CREATE OR REPLACE FUNCTION public.check_trial_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If authorized in secure workflow transaction or admin, allow transition
  IF public.is_admin() OR current_setting('pet_adoption.in_secure_workflow', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    IF NEW.pet_id != OLD.pet_id OR NEW.adopter_id != OLD.adopter_id OR NEW.provider_id != OLD.provider_id THEN
      RAISE EXCEPTION 'Unauthorized: Cannot change foster trial participants or pet.';
    END IF;
    IF NEW.start_date != OLD.start_date OR NEW.end_date != OLD.end_date THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.trial_extension_requests ter
        WHERE ter.trial_id = NEW.id AND ter.status = 'approved'
      ) THEN
        RAISE EXCEPTION 'Unauthorized: Trial dates cannot be modified directly; must use approved extension requests.';
      END IF;
    END IF;
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
      RAISE EXCEPTION 'Unauthorized: Final trial completion must execute through the official adoption finalization workflow.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. check_pet_update trigger function
CREATE OR REPLACE FUNCTION public.check_pet_update()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := public.is_admin();

  -- If authorized in secure workflow transaction or admin, allow transition
  IF v_is_admin OR current_setting('pet_adoption.in_secure_workflow', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- 1. Ownership cannot be transferred directly by client
  IF NEW.provider_id != OLD.provider_id THEN
    RAISE EXCEPTION 'Unauthorized: Pet ownership cannot be reassigned.';
  END IF;

  -- 2. State transition guards:
  -- Cannot directly set status to 'adopted' (must use adopter_complete_adoption RPC or admin moderation)
  IF NEW.adoption_status IN ('adopted', 'Adopted') AND OLD.adoption_status NOT IN ('adopted', 'Adopted') THEN
    RAISE EXCEPTION 'Privileged transition: Official pet adoptions must execute through the secure Foster-to-Own completion transaction.';
  END IF;

  -- Cannot directly set status to 'trial' (must use provider_approve_adoption_request RPC)
  IF NEW.adoption_status IN ('trial', 'Trial', 'adoption requested') AND OLD.adoption_status NOT IN ('trial', 'Trial', 'adoption requested') THEN
    RAISE EXCEPTION 'Privileged transition: Placing a pet into Foster-to-Own trial must execute through the provider application approval workflow.';
  END IF;

  -- 3. Immutability guard for pets currently active in a trial or adopted
  IF OLD.adoption_status IN ('adopted', 'Adopted') THEN
    RAISE EXCEPTION 'Locked entity: Adopted pet records cannot be modified directly.';
  END IF;

  IF OLD.adoption_status IN ('trial', 'Trial') AND NEW.adoption_status NOT IN ('trial', 'Trial', 'available', 'Available') THEN
    RAISE EXCEPTION 'Locked entity: Pets currently in an active Foster-to-Own trial cannot have core listing details modified.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. check_adoption_request_update trigger function
CREATE OR REPLACE FUNCTION public.check_adoption_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent modifying critical immutable participants
  IF NEW.pet_id != OLD.pet_id OR NEW.adopter_id != OLD.adopter_id OR NEW.provider_id != OLD.provider_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot alter adoption request participants or pet reference.';
  END IF;

  -- If authorized in secure workflow transaction or admin, allow transition
  IF public.is_admin() OR current_setting('pet_adoption.in_secure_workflow', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Adopter updating:
  IF auth.uid() = OLD.adopter_id THEN
    -- Adopters can only withdraw/cancel a pending request
    IF NEW.status IN ('approved', 'Approved', 'completed', 'Completed') AND OLD.status NOT IN ('approved', 'Approved', 'completed', 'Completed') THEN
      RAISE EXCEPTION 'Unauthorized: Adopters cannot approve or complete their own adoption requests.';
    END IF;
  END IF;

  -- Provider updating:
  IF auth.uid() = OLD.provider_id THEN
    -- Official approval/completion requires the formal transactional workflow or admin privileges
    IF NEW.status IN ('approved', 'Approved', 'completed', 'Completed') 
       AND OLD.status NOT IN ('approved', 'Approved', 'completed', 'Completed') THEN
      RAISE EXCEPTION 'Privileged transition: Official adoption approvals must execute through the secure adoption workflow transaction.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 4. Secure Adoption Completion RPC
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

  -- 8. Check if pet already adopted
  IF v_pet.adoption_status = 'adopted' THEN
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

  -- 9. Verify provider relationship
  IF v_pet.provider_id != v_trial.provider_id THEN
    RAISE EXCEPTION 'Data integrity error: pet provider does not match trial provider.';
  END IF;

  -- 10. Generate Certificate Number
  v_cert_num := 'PA-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  -- 11. Atomically insert into public.adoptions
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

  -- 12. Update public.foster_trials to completed
  UPDATE public.foster_trials
  SET
    status = 'completed',
    adoption_id = v_adoption_id,
    journal_entries = coalesce(journal_entries, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'day', GREATEST(1, (EXTRACT(EPOCH FROM (now() - v_trial.start_date)) / 86400)::integer + 1),
        'note', 'Official adoption finalized! Forever family united ❤️',
        'timestamp', now()
      )
    ),
    updated_at = now()
  WHERE id = v_trial.id;

  -- 13. Update public.pets to adopted
  UPDATE public.pets
  SET
    adoption_status = 'adopted',
    updated_at = now()
  WHERE id = v_pet.id;

  -- 14. Update associated adoption request to completed & append timeline
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
