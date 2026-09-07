-- Migration: Fix notification action URLs for trial extensions and adoption requests
-- Ensures that when an adopter or provider clicks a notification, it opens the exact application/trial details page logically.

-- 1. Backfill existing notifications with accurate deep links
UPDATE public.notifications
SET action_url = '/adopter/requests/' || related_entity_id
WHERE related_entity_type IN ('foster_trial', 'adoption_request')
  AND (action_url IS NULL OR action_url = '/adopter/dashboard' OR action_url = '' OR action_url = '/');

-- 2. Update provider_approve_trial_extension to link directly to request details
CREATE OR REPLACE FUNCTION public.provider_approve_trial_extension(
  p_identifier UUID,
  p_response_note TEXT DEFAULT NULL,
  p_passkey TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_ext RECORD;
  v_trial RECORD;
  v_new_end_date TIMESTAMPTZ;
  v_pet_name TEXT;
  v_provider_name TEXT;
  v_target_request_id UUID;
BEGIN
  -- 1. Identify caller
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    IF p_passkey IS NOT NULL AND public.verify_admin_session_passkey(p_passkey) THEN
      SELECT id INTO v_user_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
    END IF;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Find extension request
  SELECT * INTO v_ext
  FROM public.trial_extension_requests
  WHERE id = p_identifier OR trial_id = p_identifier
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_ext IS NULL THEN
    RAISE EXCEPTION 'Trial extension request not found for the provided identifier.';
  END IF;

  -- 3. Lock and retrieve associated foster trial
  SELECT * INTO v_trial
  FROM public.foster_trials
  WHERE id = v_ext.trial_id
  FOR UPDATE;

  IF v_trial IS NULL THEN
    RAISE EXCEPTION 'Associated foster trial record not found.';
  END IF;

  -- 4. Authorization check
  IF v_trial.provider_id != v_user_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You can only approve extension requests for your own foster pets.';
    END IF;
  END IF;

  -- 5. Idempotency Check
  IF v_ext.status = 'approved' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_approved', true,
      'extension_id', v_ext.id,
      'trial_id', v_trial.id,
      'requested_days', v_ext.requested_days,
      'new_end_date', v_trial.end_date,
      'status', 'approved'
    );
  END IF;

  -- 6. Compute new trial end date
  v_new_end_date := v_trial.end_date + (v_ext.requested_days || ' days')::INTERVAL;

  -- 7. Update extension request record
  UPDATE public.trial_extension_requests
  SET
    status = 'approved',
    provider_response = COALESCE(p_response_note, 'Trial extension approved.'),
    reviewed_by = v_user_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_ext.id;

  -- 8. Update foster trial record
  UPDATE public.foster_trials
  SET
    end_date = v_new_end_date,
    status = 'trial_extended',
    updated_at = NOW(),
    journal_entries = COALESCE(journal_entries, '[]'::JSONB) || jsonb_build_object(
      'day', 1,
      'note', 'Provider approved +' || v_ext.requested_days || ' days extension. New trial end date: ' || to_char(v_new_end_date, 'Mon DD, YYYY') || '.',
      'timestamp', NOW()
    )
  WHERE id = v_trial.id;

  -- 9. Synchronize adoption request
  IF v_trial.adoption_request_id IS NOT NULL THEN
    UPDATE public.adoption_requests
    SET
      trial_days = COALESCE(trial_days, 14) + v_ext.requested_days,
      updated_at = NOW()
    WHERE id = v_trial.adoption_request_id;
  END IF;

  -- 10. Audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    v_user_id,
    'approve_trial_extension',
    'foster_trials',
    v_trial.id,
    jsonb_build_object(
      'extension_id', v_ext.id,
      'requested_days', v_ext.requested_days,
      'previous_end_date', v_trial.end_date,
      'new_end_date', v_new_end_date
    )
  );

  -- 11. Retrieve pet & provider info
  SELECT name INTO v_pet_name FROM public.pets WHERE id = v_trial.pet_id;
  SELECT full_name INTO v_provider_name FROM public.profiles WHERE id = v_trial.provider_id;
  v_target_request_id := COALESCE(v_trial.adoption_request_id, v_trial.id);

  -- 12. Dispatch notification directly to application details page
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
    v_trial.adopter_id,
    'trial_extension_approved',
    'Trial Extension Approved! 🎉',
    COALESCE(v_provider_name, 'Provider') || ' approved your +' || v_ext.requested_days || ' days trial extension for ' || COALESCE(v_pet_name, 'your pet') || '!',
    'foster_trial',
    v_target_request_id,
    '/adopter/requests/' || v_target_request_id
  );

  -- 13. Return success payload
  RETURN jsonb_build_object(
    'success', true,
    'already_approved', false,
    'extension_id', v_ext.id,
    'trial_id', v_trial.id,
    'requested_days', v_ext.requested_days,
    'new_end_date', v_new_end_date,
    'status', 'approved'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
