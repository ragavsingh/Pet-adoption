-- ==============================================================================
-- PET ADOPTION PLATFORM — SECURE ADMIN PORTAL WORKFLOW & STORED PROCEDURES
-- Migration: 20260904200000_admin_portal_workflow_rpc.sql
-- Description: Production-ready PostgreSQL RPCs for platform administration:
--              1. admin_get_dashboard_stats()
--              2. admin_verify_provider()
--              3. admin_reject_provider()
--              4. admin_moderate_pet_status()
--              5. admin_resolve_report()
--              6. admin_change_user_role()
--              Enforces zero-trust database-level authorization (is_admin),
--              atomicity, idempotency, audit trail recording, and notifications.
-- ==============================================================================

-- ==============================================================================
-- 1. ADMIN DASHBOARD AGGREGATED METRICS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_stats JSONB;
  v_total_users INT;
  v_adopters INT;
  v_providers INT;
  v_verified_providers INT;
  v_pending_verifications INT;
  v_total_pets INT;
  v_available_pets INT;
  v_trial_pets INT;
  v_adopted_pets INT;
  v_total_requests INT;
  v_pending_requests INT;
  v_active_trials INT;
  v_total_adoptions INT;
  v_pending_reports INT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a platform administrator.';
  END IF;

  -- Users count
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_adopters FROM public.profiles WHERE role = 'adopter';
  SELECT COUNT(*) INTO v_providers FROM public.profiles WHERE role = 'provider';

  -- Provider status counts
  SELECT COUNT(*) INTO v_verified_providers 
    FROM public.provider_profiles WHERE verification_status = 'verified';
  SELECT COUNT(*) INTO v_pending_verifications 
    FROM public.provider_profiles WHERE verification_status = 'pending';

  -- Pet metrics
  SELECT COUNT(*) INTO v_total_pets FROM public.pets;
  SELECT COUNT(*) INTO v_available_pets 
    FROM public.pets WHERE adoption_status IN ('available', 'Available');
  SELECT COUNT(*) INTO v_trial_pets 
    FROM public.pets WHERE adoption_status IN ('trial', 'Adoption Pending');
  SELECT COUNT(*) INTO v_adopted_pets 
    FROM public.pets WHERE adoption_status IN ('adopted', 'Adopted');

  -- Request metrics
  SELECT COUNT(*) INTO v_total_requests FROM public.adoption_requests;
  SELECT COUNT(*) INTO v_pending_requests 
    FROM public.adoption_requests WHERE status IN ('pending', 'under_review', 'more_information_required', 'Pending', 'Under Review');

  -- Trial & Adoption metrics
  SELECT COUNT(*) INTO v_active_trials 
    FROM public.foster_trials WHERE status IN ('active', 'upcoming', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official', 'Trial Active', 'Ending Soon');
  SELECT COUNT(*) INTO v_total_adoptions 
    FROM public.adoptions WHERE status = 'completed';

  -- Reports metrics
  SELECT COUNT(*) INTO v_pending_reports 
    FROM public.reports WHERE status IN ('open', 'reviewing', 'Pending');

  v_stats := jsonb_build_object(
    'total_users', v_total_users,
    'total_adopters', v_adopters,
    'total_providers', v_providers,
    'verified_providers', v_verified_providers,
    'pending_provider_verifications', v_pending_verifications,
    'total_pets', v_total_pets,
    'available_pets', v_available_pets,
    'trial_pets', v_trial_pets,
    'adopted_pets', v_adopted_pets,
    'total_requests', v_total_requests,
    'pending_requests', v_pending_requests,
    'active_trials', v_active_trials,
    'total_adoptions', v_total_adoptions,
    'pending_reports', v_pending_reports
  );

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;


-- ==============================================================================
-- 2. ADMIN VERIFY PROVIDER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_verify_provider(
  p_provider_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_prov RECORD;
  v_prev_status TEXT;
  v_res JSONB;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a platform administrator.';
  END IF;

  -- Row lock on provider profile
  SELECT * INTO v_prov
  FROM public.provider_profiles
  WHERE id = p_provider_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider profile not found for ID: %', p_provider_id;
  END IF;

  v_prev_status := v_prov.verification_status;

  -- Idempotency check: if already verified, return existing state safely
  IF v_prev_status = 'verified' THEN
    RETURN jsonb_build_object(
      'success', true,
      'provider_id', p_provider_id,
      'status', 'verified',
      'already_verified', true
    );
  END IF;

  -- Update provider_profiles
  UPDATE public.provider_profiles
  SET
    verification_status = 'verified',
    verification_notes = COALESCE(p_notes, v_prov.verification_notes),
    updated_at = now()
  WHERE id = p_provider_id;

  -- Update provider_verifications record if exists
  UPDATE public.provider_verifications
  SET
    status = 'verified',
    reviewed_by = v_caller_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE provider_id = p_provider_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    metadata
  ) VALUES (
    v_caller_id,
    'provider_verified',
    'provider_profile',
    p_provider_id,
    jsonb_build_object('verification_status', v_prev_status),
    jsonb_build_object('verification_status', 'verified'),
    jsonb_build_object('notes', p_notes, 'admin_id', v_caller_id)
  );

  -- Dispatch in-app notification to provider
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    action_url
  ) VALUES (
    p_provider_id,
    'provider_verified',
    'Provider Verification Approved 🎉',
    'Congratulations! Your rescue organization has been formally verified by our Trust & Safety team.',
    'provider_profile',
    p_provider_id,
    '/provider/profile'
  );

  RETURN jsonb_build_object(
    'success', true,
    'provider_id', p_provider_id,
    'status', 'verified',
    'already_verified', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_verify_provider(UUID, TEXT) TO authenticated;


-- ==============================================================================
-- 3. ADMIN REJECT PROVIDER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_reject_provider(
  p_provider_id UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_prov RECORD;
  v_prev_status TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a platform administrator.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'A non-empty rejection reason must be provided.';
  END IF;

  SELECT * INTO v_prov
  FROM public.provider_profiles
  WHERE id = p_provider_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provider profile not found for ID: %', p_provider_id;
  END IF;

  v_prev_status := v_prov.verification_status;

  -- Update provider_profiles
  UPDATE public.provider_profiles
  SET
    verification_status = 'rejected',
    verification_notes = p_reason,
    updated_at = now()
  WHERE id = p_provider_id;

  -- Update provider_verifications table if present
  UPDATE public.provider_verifications
  SET
    status = 'rejected',
    rejection_reason = p_reason,
    reviewed_by = v_caller_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE provider_id = p_provider_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    metadata
  ) VALUES (
    v_caller_id,
    'provider_rejected',
    'provider_profile',
    p_provider_id,
    jsonb_build_object('verification_status', v_prev_status),
    jsonb_build_object('verification_status', 'rejected'),
    jsonb_build_object('reason', p_reason, 'admin_id', v_caller_id)
  );

  -- Notify provider
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    action_url
  ) VALUES (
    p_provider_id,
    'system',
    'Provider Verification Status Update',
    'Your rescue organization verification could not be approved at this time. Reason: ' || p_reason,
    'provider_profile',
    p_provider_id,
    '/provider/profile'
  );

  RETURN jsonb_build_object(
    'success', true,
    'provider_id', p_provider_id,
    'status', 'rejected'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_reject_provider(UUID, TEXT) TO authenticated;


-- ==============================================================================
-- 4. ADMIN MODERATE PET STATUS (Pause, Resume, Archive)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_moderate_pet_status(
  p_pet_id UUID,
  p_new_status TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_pet RECORD;
  v_prev_status TEXT;
  v_normalized_status TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a platform administrator.';
  END IF;

  v_normalized_status := lower(trim(p_new_status));
  IF v_normalized_status NOT IN ('available', 'paused', 'archived') THEN
    RAISE EXCEPTION 'Invalid moderation status: %. Allowed: available, paused, archived.', p_new_status;
  END IF;

  SELECT * INTO v_pet
  FROM public.pets
  WHERE id = p_pet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pet not found for ID: %', p_pet_id;
  END IF;

  v_prev_status := lower(v_pet.adoption_status);

  -- Lifecycle Safety Guards:
  -- 1. If pet is permanently adopted, cannot arbitrarily un-adopt to available or paused
  IF v_prev_status IN ('adopted') AND v_normalized_status != 'archived' THEN
    RAISE EXCEPTION 'Business lifecycle violation: Adopted companion cannot be modified to %.', p_new_status;
  END IF;

  -- 2. If pet is in an active Foster-to-Own bonding trial, cannot be switched to available without resolving the trial
  IF v_prev_status IN ('trial', 'adoption pending') AND v_normalized_status = 'available' THEN
    RAISE EXCEPTION 'Business lifecycle violation: Companion is currently in a Foster-to-Own bonding trial and cannot be marked available without terminating the trial.';
  END IF;

  UPDATE public.pets
  SET
    adoption_status = v_normalized_status,
    updated_at = now()
  WHERE id = p_pet_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    metadata
  ) VALUES (
    v_caller_id,
    'pet_moderated',
    'pet',
    p_pet_id,
    jsonb_build_object('adoption_status', v_prev_status),
    jsonb_build_object('adoption_status', v_normalized_status),
    jsonb_build_object('reason', p_reason, 'admin_id', v_caller_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'pet_id', p_pet_id,
    'previous_status', v_prev_status,
    'new_status', v_normalized_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_moderate_pet_status(UUID, TEXT, TEXT) TO authenticated;


-- ==============================================================================
-- 5. ADMIN RESOLVE REPORT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_resolve_report(
  p_report_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_rep RECORD;
  v_prev_status TEXT;
  v_normalized_status TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a platform administrator.';
  END IF;

  v_normalized_status := lower(trim(p_status));
  IF v_normalized_status NOT IN ('resolved', 'dismissed', 'reviewing') THEN
    RAISE EXCEPTION 'Invalid resolution status: %. Allowed: resolved, dismissed, reviewing.', p_status;
  END IF;

  SELECT * INTO v_rep
  FROM public.reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found for ID: %', p_report_id;
  END IF;

  v_prev_status := v_rep.status;

  UPDATE public.reports
  SET
    status = v_normalized_status,
    admin_notes = COALESCE(p_notes, v_rep.admin_notes),
    resolved_by = v_caller_id,
    resolved_at = now(),
    updated_at = now()
  WHERE id = p_report_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    metadata
  ) VALUES (
    v_caller_id,
    'report_resolved',
    'report',
    p_report_id,
    jsonb_build_object('status', v_prev_status),
    jsonb_build_object('status', v_normalized_status),
    jsonb_build_object('notes', p_notes, 'admin_id', v_caller_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'status', v_normalized_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_resolve_report(UUID, TEXT, TEXT) TO authenticated;


-- ==============================================================================
-- 6. ADMIN CHANGE USER ROLE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID;
  v_target RECORD;
  v_prev_role TEXT;
  v_normalized_role TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a platform administrator.';
  END IF;

  v_normalized_role := lower(trim(p_new_role));
  IF v_normalized_role NOT IN ('adopter', 'provider', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %. Allowed: adopter, provider, admin.', p_new_role;
  END IF;

  -- Prevent admin from accidentally demoting themselves to avoid platform lockout
  IF v_caller_id = p_target_user_id AND v_normalized_role != 'admin' THEN
    RAISE EXCEPTION 'Safety constraint: Administrators cannot demote their own account.';
  END IF;

  SELECT * INTO v_target
  FROM public.profiles
  WHERE id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found for ID: %', p_target_user_id;
  END IF;

  v_prev_role := v_target.role;

  IF v_prev_role = v_normalized_role THEN
    RETURN jsonb_build_object(
      'success', true,
      'user_id', p_target_user_id,
      'role', v_normalized_role,
      'unchanged', true
    );
  END IF;

  -- Update profiles table
  UPDATE public.profiles
  SET
    role = v_normalized_role,
    updated_at = now()
  WHERE id = p_target_user_id;

  -- Ensure specialized role profile row exists
  IF v_normalized_role = 'adopter' THEN
    INSERT INTO public.adopter_profiles (id, profile_completion)
    VALUES (p_target_user_id, 20)
    ON CONFLICT (id) DO NOTHING;
  ELSIF v_normalized_role = 'provider' THEN
    INSERT INTO public.provider_profiles (id, organization_name, provider_type, verification_status)
    VALUES (p_target_user_id, v_target.full_name, 'Individual Pet Owner', 'pending')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    previous_state,
    new_state,
    metadata
  ) VALUES (
    v_caller_id,
    'user_role_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object('role', v_prev_role),
    jsonb_build_object('role', v_normalized_role),
    jsonb_build_object('admin_id', v_caller_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'previous_role', v_prev_role,
    'new_role', v_normalized_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_change_user_role(UUID, TEXT) TO authenticated;
