-- ==============================================================================
-- Migration: 20260904150000_foster_trials_workflow.sql
-- Description: Foster-to-Own bonding trial workflow, authoritative date math,
--              extension requests, and atomic trial creation upon approval.
-- ==============================================================================

-- 1. Unique index: only ONE active foster trial can exist per pet
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_foster_trial_per_pet
  ON public.foster_trials (pet_id)
  WHERE status IN (
    'upcoming', 'active', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official',
    'Trial Starting', 'Trial Active', 'Ending Soon', 'Extension Requested', 'Trial Extended', 'Ready to Make Official'
  );

-- 2. Upgrade provider_approve_adoption_request to atomically create foster_trials row
CREATE OR REPLACE FUNCTION public.provider_approve_adoption_request(
  p_request_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_cancel_competing BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_req RECORD;
  v_competing_count INTEGER := 0;
  v_trial_id UUID;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- 1. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  -- 2. Verify caller role (provider or admin)
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  IF v_user_role NOT IN ('provider', 'shelter', 'rescue', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only registered pet providers or administrators can review adoption requests.';
  END IF;

  -- 3. Lock and retrieve request + pet data
  SELECT 
    ar.id, 
    ar.status, 
    ar.adopter_id, 
    ar.provider_id, 
    ar.pet_id,
    p.id AS p_pet_id, 
    p.adoption_status AS pet_status, 
    p.provider_id AS pet_provider_id, 
    p.name AS pet_name
  INTO v_req
  FROM public.adoption_requests ar
  JOIN public.pets p ON p.id = ar.pet_id
  WHERE ar.id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Adoption request % not found.', p_request_id;
  END IF;

  -- 4. Verify Provider ownership of pet
  IF v_req.pet_provider_id != v_user_id AND v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: You can only review adoption requests for your own pet listings.';
  END IF;

  -- 5. Verify Request status eligibility
  IF v_req.status NOT IN ('pending', 'under_review', 'more_information_required', 'Pending', 'Under Review') THEN
    RAISE EXCEPTION 'Request cannot be approved from current status: %', v_req.status;
  END IF;

  -- 6. Verify Pet status eligibility
  IF v_req.pet_status NOT IN ('available', 'pending', 'trial', 'Available', 'Adoption Requested', 'Adoption Pending') THEN
    RAISE EXCEPTION 'Pet "%" is currently not eligible for adoption approval (status: %)', v_req.pet_name, v_req.pet_status;
  END IF;

  -- 7. Check for conflicting active approved request or active trial for the same pet
  IF EXISTS (
    SELECT 1 FROM public.adoption_requests
    WHERE pet_id = v_req.pet_id 
      AND status IN ('approved', 'Approved') 
      AND id != p_request_id
  ) THEN
    RAISE EXCEPTION 'Another adoption application is already approved and active for %.', v_req.pet_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.foster_trials
    WHERE pet_id = v_req.pet_id
      AND status IN (
        'upcoming', 'active', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official',
        'Trial Starting', 'Trial Active', 'Ending Soon', 'Extension Requested', 'Trial Extended', 'Ready to Make Official'
      )
  ) THEN
    RAISE EXCEPTION 'Pet "%" is already in an active Foster-to-Own trial.', v_req.pet_name;
  END IF;

  -- 8. Enable secure workflow flag for transaction
  PERFORM set_config('pet_adoption.in_secure_workflow', 'true', true);

  -- 9. Update the approved adoption request
  UPDATE public.adoption_requests
  SET 
    status = 'approved',
    provider_notes = COALESCE(p_notes, provider_notes, 'Application approved. Starting 14-day Foster-to-Own bonding trial.'),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- 10. Update the pet's adoption_status to 'trial' (NOT 'adopted')
  UPDATE public.pets
  SET 
    adoption_status = 'trial',
    updated_at = now()
  WHERE id = v_req.pet_id;

  -- 11. Create the official Foster-to-Own trial (14-day bonding window)
  v_start_date := now();
  v_end_date := v_start_date + INTERVAL '14 days';

  INSERT INTO public.foster_trials (
    pet_id,
    adopter_id,
    provider_id,
    adoption_request_id,
    start_date,
    end_date,
    status,
    journal_entries
  )
  VALUES (
    v_req.pet_id,
    v_req.adopter_id,
    v_req.provider_id,
    p_request_id,
    v_start_date,
    v_end_date,
    'active',
    jsonb_build_array(
      jsonb_build_object(
        'date', to_char(v_start_date, 'YYYY-MM-DD'),
        'day', 1,
        'entry', 'Foster-to-Own bonding trial initiated. Welcome home ' || v_req.pet_name || '!'
      )
    )
  )
  RETURNING id INTO v_trial_id;

  -- 12. Handle competing active requests
  IF p_cancel_competing THEN
    WITH closed AS (
      UPDATE public.adoption_requests
      SET 
        status = 'cancelled',
        provider_notes = 'Another applicant was approved for a trial with this pet. Application closed for this listing.',
        reviewed_at = now(),
        updated_at = now()
      WHERE pet_id = v_req.pet_id 
        AND id != p_request_id 
        AND status IN ('pending', 'under_review', 'more_information_required', 'Pending', 'Under Review')
      RETURNING adopter_id
    )
    SELECT count(*) INTO v_competing_count FROM closed;

    -- Send notifications to competing applicants
    INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
    SELECT 
      ar.adopter_id,
      'request_rejected',
      'Adoption Application Update',
      'Another applicant was approved for ' || v_req.pet_name || '. Your application has been closed for this listing.',
      'adoption_request',
      ar.id,
      '/adopter/requests/' || ar.id
    FROM public.adoption_requests ar
    WHERE ar.pet_id = v_req.pet_id 
      AND ar.id != p_request_id 
      AND ar.status = 'cancelled'
      AND ar.updated_at >= now() - INTERVAL '5 seconds';
  END IF;

  -- 13. Create notification for approved adopter
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
  VALUES (
    v_req.adopter_id,
    'request_approved',
    'Adoption Request Approved ❤️',
    'Congratulations! Your adoption request for ' || v_req.pet_name || ' was approved. Your 14-day Foster-to-Own bonding trial is now active!',
    'adoption_request',
    p_request_id,
    '/adopter/dashboard'
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'trial_id', v_trial_id,
    'pet_id', v_req.pet_id,
    'pet_name', v_req.pet_name,
    'status', 'approved',
    'pet_status', 'trial',
    'start_date', v_start_date,
    'end_date', v_end_date,
    'competing_requests_cancelled', v_competing_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 3. RPC: adopter_request_trial_extension
-- Allows an adopter to request a 3, 7, or 14-day trial extension:
-- - Validates auth.uid() identity
-- - Validates trial ownership (adopter_id = auth.uid())
-- - Validates trial is in an active/eligible state
-- - Enforces requested_days IN (3, 7, 14)
-- - Blocks duplicate pending extension requests
-- - Transitions trial status to 'extension_requested'
-- - Inserts trial_extension_requests record
-- - Notifies pet provider
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.adopter_request_trial_extension(
  p_trial_id UUID,
  p_requested_days INT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_trial RECORD;
  v_ext_id UUID;
BEGIN
  -- 1. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  -- 2. Validate requested duration
  IF p_requested_days NOT IN (3, 7, 14) THEN
    RAISE EXCEPTION 'Invalid extension duration: %. Supported periods are 3, 7, or 14 days.', p_requested_days;
  END IF;

  -- 3. Lock and retrieve trial + pet details
  SELECT 
    ft.id,
    ft.status,
    ft.adopter_id,
    ft.provider_id,
    ft.pet_id,
    ft.end_date,
    p.name AS pet_name,
    prof.full_name AS adopter_name
  INTO v_trial
  FROM public.foster_trials ft
  JOIN public.pets p ON p.id = ft.pet_id
  LEFT JOIN public.profiles prof ON prof.id = ft.adopter_id
  WHERE ft.id = p_trial_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foster trial % not found.', p_trial_id;
  END IF;

  -- 4. Verify adopter ownership
  IF v_trial.adopter_id != v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: You can only request extensions for your own active trial.';
  END IF;

  -- 5. Verify trial is currently active and eligible
  IF v_trial.status NOT IN ('active', 'ending_soon', 'Trial Active', 'Ending Soon') THEN
    RAISE EXCEPTION 'Cannot request extension for trial in status "%".', v_trial.status;
  END IF;

  -- 6. Check for existing pending extension request
  IF EXISTS (
    SELECT 1 FROM public.trial_extension_requests
    WHERE trial_id = p_trial_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A trial extension request is already pending review from the provider.';
  END IF;

  -- 7. Insert the extension request record
  INSERT INTO public.trial_extension_requests (
    trial_id,
    requested_by,
    requested_days,
    reason,
    status
  )
  VALUES (
    p_trial_id,
    v_user_id,
    p_requested_days,
    btrim(COALESCE(p_reason, 'Continuing gradual bonding and routine integration.')),
    'pending'
  )
  RETURNING id INTO v_ext_id;

  -- 8. Update trial status to 'extension_requested'
  UPDATE public.foster_trials
  SET 
    status = 'extension_requested',
    updated_at = now()
  WHERE id = p_trial_id;

  -- 9. Insert notification for provider
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    action_url
  )
  VALUES (
    v_trial.provider_id,
    'trial_extension_requested',
    'Trial Extension Requested',
    COALESCE(v_trial.adopter_name, 'Adopter') || ' requested a +' || p_requested_days || ' day extension for ' || v_trial.pet_name || '.',
    'foster_trial',
    p_trial_id,
    '/provider/requests'
  );

  RETURN jsonb_build_object(
    'success', true,
    'extension_id', v_ext_id,
    'trial_id', p_trial_id,
    'requested_days', p_requested_days,
    'status', 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 4. RPC: add_trial_journal_entry
-- Allows participants (adopter or provider) to append journal observations
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.add_trial_journal_entry(
  p_trial_id UUID,
  p_entry TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_trial RECORD;
  v_trimmed TEXT;
BEGIN
  v_trimmed := btrim(COALESCE(p_entry, ''));
  IF v_trimmed = '' THEN
    RAISE EXCEPTION 'Journal entry text cannot be empty.';
  END IF;

  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  SELECT id, adopter_id, provider_id, journal_entries, start_date
  INTO v_trial
  FROM public.foster_trials
  WHERE id = p_trial_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foster trial % not found.', p_trial_id;
  END IF;

  IF v_trial.adopter_id != v_user_id AND v_trial.provider_id != v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only trial participants can record journal entries.';
  END IF;

  UPDATE public.foster_trials
  SET 
    journal_entries = COALESCE(journal_entries, '[]'::jsonb) || jsonb_build_object(
      'date', to_char(now(), 'YYYY-MM-DD'),
      'timestamp', now(),
      'author_id', v_user_id,
      'entry', v_trimmed
    ),
    updated_at = now()
  WHERE id = p_trial_id;

  RETURN jsonb_build_object('success', true, 'trial_id', p_trial_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 5. Grant Permissions
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.provider_approve_adoption_request(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adopter_request_trial_extension(UUID, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_trial_journal_entry(UUID, TEXT) TO authenticated;
