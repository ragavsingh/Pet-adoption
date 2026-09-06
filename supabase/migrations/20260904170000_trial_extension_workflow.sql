-- ==============================================================================
-- Migration: 20260904170000_trial_extension_workflow.sql
-- Description: Provider review, approval, and rejection workflow for Foster-to-Own
--              trial extensions, atomic date calculation, and idempotency guarantees.
-- ==============================================================================

-- 1. Secure RPC: Provider Approve Trial Extension
CREATE OR REPLACE FUNCTION public.provider_approve_trial_extension(
  p_identifier UUID,
  p_response_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_ext RECORD;
  v_trial RECORD;
  v_pet RECORD;
  v_adopter_name TEXT;
  v_provider_name TEXT;
  v_new_end_date TIMESTAMPTZ;
BEGIN
  -- 1. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  -- 2. Locate the extension request record
  -- Check direct extension_requests.id
  SELECT * INTO v_ext
  FROM public.trial_extension_requests
  WHERE id = p_identifier
  LIMIT 1;

  -- If not found by extension_requests.id, look up by trial_id
  IF v_ext IS NULL THEN
    SELECT * INTO v_ext
    FROM public.trial_extension_requests
    WHERE trial_id = p_identifier
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- If not found by trial_id, look up by adoption_requests.id
  IF v_ext IS NULL THEN
    SELECT ter.* INTO v_ext
    FROM public.trial_extension_requests ter
    JOIN public.foster_trials ft ON ft.id = ter.trial_id
    WHERE ft.adoption_request_id = p_identifier
    ORDER BY ter.created_at DESC
    LIMIT 1;
  END IF;

  IF v_ext IS NULL THEN
    RAISE EXCEPTION 'Trial extension request not found for the provided identifier.';
  END IF;

  -- 3. Lock and retrieve the associated foster trial
  SELECT * INTO v_trial
  FROM public.foster_trials
  WHERE id = v_ext.trial_id
  FOR UPDATE;

  IF v_trial IS NULL THEN
    RAISE EXCEPTION 'Associated foster trial record not found.';
  END IF;

  -- 4. Verify caller authorization: caller MUST be the pet provider (or admin)
  IF v_trial.provider_id != v_user_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You can only approve extension requests for your own foster pets.';
    END IF;
  END IF;

  -- 5. Idempotency Check: if already approved, return existing state
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

  -- 6. Validate trial status: must not be completed, cancelled, or adopted
  IF v_trial.status IN ('completed', 'cancelled', 'Adoption Completed') THEN
    RAISE EXCEPTION 'Cannot extend a foster trial in status "%".', v_trial.status;
  END IF;

  -- 7. Validate requested duration
  IF v_ext.requested_days NOT IN (3, 7, 14) THEN
    RAISE EXCEPTION 'Invalid extension duration: % days. Only 3, 7, or 14 days allowed.', v_ext.requested_days;
  END IF;

  -- 8. Calculate new trial end date:
  -- Authoritative database date addition: existing end_date + requested_days
  -- Original start_date remains completely unchanged!
  v_new_end_date := v_trial.end_date + (v_ext.requested_days || ' days')::INTERVAL;

  -- 9. Atomically update trial_extension_requests record
  UPDATE public.trial_extension_requests
  SET
    status = 'approved',
    reviewed_by = v_user_id,
    reviewed_at = now(),
    provider_response = btrim(COALESCE(p_response_note, 'Approved +' || v_ext.requested_days || ' days extension for continued bonding.')),
    updated_at = now()
  WHERE id = v_ext.id;

  -- 10. Atomically update foster_trials record
  UPDATE public.foster_trials
  SET
    end_date = v_new_end_date,
    status = 'trial_extended',
    journal_entries = COALESCE(journal_entries, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'day', (EXTRACT(EPOCH FROM (now() - v_trial.start_date)) / 86400)::integer + 1,
        'note', 'Provider approved +' || v_ext.requested_days || ' days extension. New trial end date: ' || to_char(v_new_end_date, 'Mon DD, YYYY') || '.',
        'timestamp', now()
      )
    ),
    updated_at = now()
  WHERE id = v_trial.id;

  -- 11. Retrieve pet and participant names for notification
  SELECT name INTO v_pet FROM public.pets WHERE id = v_trial.pet_id;
  SELECT full_name INTO v_provider_name FROM public.profiles WHERE id = v_trial.provider_id;

  -- 12. Dispatch notification to adopter
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
    'request_approved',
    'Trial Extension Approved! 🎉',
    COALESCE(v_provider_name, 'Provider') || ' approved your +' || v_ext.requested_days || ' days trial extension for ' || COALESCE(v_pet.name, 'your pet') || '!',
    'foster_trial',
    v_trial.id,
    '/adopter/dashboard'
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Secure RPC: Provider Reject/Decline Trial Extension
CREATE OR REPLACE FUNCTION public.provider_reject_trial_extension(
  p_identifier UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_ext RECORD;
  v_trial RECORD;
  v_pet RECORD;
  v_provider_name TEXT;
  v_status_after TEXT;
BEGIN
  -- 1. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  -- 2. Locate extension request
  SELECT * INTO v_ext
  FROM public.trial_extension_requests
  WHERE id = p_identifier
  LIMIT 1;

  IF v_ext IS NULL THEN
    SELECT * INTO v_ext
    FROM public.trial_extension_requests
    WHERE trial_id = p_identifier
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF v_ext IS NULL THEN
    SELECT ter.* INTO v_ext
    FROM public.trial_extension_requests ter
    JOIN public.foster_trials ft ON ft.id = ter.trial_id
    WHERE ft.adoption_request_id = p_identifier
    ORDER BY ter.created_at DESC
    LIMIT 1;
  END IF;

  IF v_ext IS NULL THEN
    RAISE EXCEPTION 'Trial extension request not found for the provided identifier.';
  END IF;

  -- 3. Lock and retrieve associated trial
  SELECT * INTO v_trial
  FROM public.foster_trials
  WHERE id = v_ext.trial_id
  FOR UPDATE;

  IF v_trial IS NULL THEN
    RAISE EXCEPTION 'Associated foster trial record not found.';
  END IF;

  -- 4. Verify caller authorization: caller MUST be pet provider (or admin)
  IF v_trial.provider_id != v_user_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: You can only decline extension requests for your own foster pets.';
    END IF;
  END IF;

  -- 5. Idempotency Check: if already declined, return existing state
  IF v_ext.status = 'declined' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_declined', true,
      'extension_id', v_ext.id,
      'trial_id', v_trial.id,
      'status', 'declined'
    );
  END IF;

  -- 6. Atomically update trial_extension_requests record
  UPDATE public.trial_extension_requests
  SET
    status = 'declined',
    reviewed_by = v_user_id,
    reviewed_at = now(),
    provider_response = btrim(COALESCE(p_reason, 'Extension request declined. Please continue bonding and prepare for the final decision.')),
    updated_at = now()
  WHERE id = v_ext.id;

  -- 7. Determine appropriate trial status to restore:
  -- If trial end date is within 3 days, set to 'ending_soon', otherwise 'active'
  IF v_trial.end_date <= now() + INTERVAL '3 days' AND v_trial.end_date > now() THEN
    v_status_after := 'ending_soon';
  ELSIF v_trial.end_date <= now() THEN
    v_status_after := 'expired';
  ELSE
    v_status_after := 'active';
  END IF;

  -- 8. Update trial status (end_date remains strictly UNCHANGED!)
  UPDATE public.foster_trials
  SET
    status = v_status_after,
    journal_entries = COALESCE(journal_entries, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'day', (EXTRACT(EPOCH FROM (now() - v_trial.start_date)) / 86400)::integer + 1,
        'note', 'Provider declined extension request. Original end date maintained.',
        'timestamp', now()
      )
    ),
    updated_at = now()
  WHERE id = v_trial.id;

  -- 9. Retrieve pet name
  SELECT name INTO v_pet FROM public.pets WHERE id = v_trial.pet_id;

  -- 10. Dispatch notification to adopter
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
    'request_rejected',
    'Trial Extension Declined',
    'Your extension request for ' || COALESCE(v_pet.name, 'your foster pet') || ' was declined. Please continue bonding and prepare for your decision.',
    'foster_trial',
    v_trial.id,
    '/adopter/dashboard'
  );

  -- 11. Return decline payload
  RETURN jsonb_build_object(
    'success', true,
    'already_declined', false,
    'extension_id', v_ext.id,
    'trial_id', v_trial.id,
    'status', 'declined'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution permissions on both RPCs to authenticated users
GRANT EXECUTE ON FUNCTION public.provider_approve_trial_extension(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provider_reject_trial_extension(UUID, TEXT) TO authenticated;
