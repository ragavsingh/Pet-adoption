-- ==============================================================================
-- Migration: 20260904140000_provider_adoption_workflow_rpc.sql
-- Description: Secure Provider Review, Approval, Rejection, and More-Information RPCs
-- ==============================================================================

-- 1. Ensure unique approved request per pet to prevent concurrent conflicting approvals
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_approved_request_per_pet 
  ON public.adoption_requests (pet_id) 
  WHERE status IN ('approved', 'Approved');

-- 2. Update trigger check_adoption_request_update to allow updates performed by secure workflow RPC
CREATE OR REPLACE FUNCTION public.check_adoption_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent modifying critical immutable participants
  IF NEW.pet_id != OLD.pet_id OR NEW.adopter_id != OLD.adopter_id OR NEW.provider_id != OLD.provider_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot alter adoption request participants or pet reference.';
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
       AND OLD.status NOT IN ('approved', 'Approved', 'completed', 'Completed') 
       AND NOT public.is_admin() 
       AND current_setting('pet_adoption.in_secure_workflow', true) IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Privileged transition: Official adoption approvals must execute through the secure adoption workflow transaction.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 3. RPC: provider_approve_adoption_request
-- Transactional approval of an adoption request:
-- - Validates auth.uid() identity
-- - Validates caller owns the pet (or is admin)
-- - Validates request status and pet status
-- - Prevents duplicate approved requests
-- - Transitions request to 'approved'
-- - Transitions pet to 'trial' (NOT 'adopted' - Foster-to-Own model)
-- - Safely closes competing requests with 'cancelled' status and historical note
-- - Inserts notification for applicant and competing applicants
-- ==============================================================================
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

  -- 7. Check for conflicting active approved request for the same pet
  IF EXISTS (
    SELECT 1 FROM public.adoption_requests
    WHERE pet_id = v_req.pet_id 
      AND status IN ('approved', 'Approved') 
      AND id != p_request_id
  ) THEN
    RAISE EXCEPTION 'Another adoption application is already approved and active for %.', v_req.pet_name;
  END IF;

  -- 8. Enable secure workflow flag for transaction
  PERFORM set_config('pet_adoption.in_secure_workflow', 'true', true);

  -- 9. Update the approved adoption request
  UPDATE public.adoption_requests
  SET 
    status = 'approved',
    provider_notes = COALESCE(p_notes, provider_notes, 'Application approved. Starting Foster-to-Own bonding trial.'),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- 10. Update the pet's adoption_status to 'trial' (NOT 'adopted')
  UPDATE public.pets
  SET 
    adoption_status = 'trial',
    updated_at = now()
  WHERE id = v_req.pet_id;

  -- 11. Handle competing active requests
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

  -- 12. Create notification for approved adopter
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
  VALUES (
    v_req.adopter_id,
    'request_approved',
    'Adoption Request Approved ❤️',
    'Congratulations! Your adoption request for ' || v_req.pet_name || ' was approved. Next step: 14-day Foster-to-Own bonding trial.',
    'adoption_request',
    p_request_id,
    '/adopter/requests/' || p_request_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'pet_id', v_req.pet_id,
    'pet_name', v_req.pet_name,
    'status', 'approved',
    'pet_status', 'trial',
    'competing_requests_cancelled', v_competing_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 4. RPC: provider_reject_adoption_request
-- Transactional rejection of an adoption request:
-- - Validates auth.uid() identity
-- - Validates caller owns the pet (or is admin)
-- - Validates request status eligibility
-- - Transitions request to 'rejected'
-- - Preserves complete history and records reason
-- - Inserts notification for applicant
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.provider_reject_adoption_request(
  p_request_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_req RECORD;
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

  -- 5. Verify Request status eligibility (cannot reject an already completed or approved request)
  IF v_req.status IN ('completed', 'Completed', 'approved', 'Approved', 'rejected', 'Rejected') THEN
    RAISE EXCEPTION 'Request cannot be rejected from current status: %', v_req.status;
  END IF;

  -- 6. Update request status to 'rejected'
  UPDATE public.adoption_requests
  SET 
    status = 'rejected',
    provider_notes = COALESCE(p_reason, provider_notes, 'Application was not approved at this time.'),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- 7. Insert notification for applicant
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
  VALUES (
    v_req.adopter_id,
    'request_rejected',
    'Adoption Application Update',
    'Your adoption application for ' || v_req.pet_name || ' was not approved at this time.',
    'adoption_request',
    p_request_id,
    '/adopter/requests/' || p_request_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'pet_id', v_req.pet_id,
    'status', 'rejected'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 5. RPC: provider_request_more_information
-- Transactional request for clarification / additional questions from adopter:
-- - Validates auth.uid() identity
-- - Validates caller owns the pet (or is admin)
-- - Validates request status eligibility
-- - Validates non-empty question
-- - Transitions request to 'more_information_required'
-- - Records question in provider_notes
-- - Inserts notification for applicant
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.provider_request_more_information(
  p_request_id UUID,
  p_question TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_req RECORD;
  v_trimmed_question TEXT;
BEGIN
  -- 1. Validate question text
  v_trimmed_question := btrim(COALESCE(p_question, ''));
  IF v_trimmed_question = '' THEN
    RAISE EXCEPTION 'A question or clarification message is required.';
  END IF;

  -- 2. Verify caller authentication
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  -- 3. Verify caller role (provider or admin)
  SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
  IF v_user_role NOT IN ('provider', 'shelter', 'rescue', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only registered pet providers or administrators can review adoption requests.';
  END IF;

  -- 4. Lock and retrieve request + pet data
  SELECT 
    ar.id, 
    ar.status, 
    ar.adopter_id, 
    ar.provider_id, 
    ar.pet_id,
    p.id AS p_pet_id, 
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

  -- 5. Verify Provider ownership of pet
  IF v_req.pet_provider_id != v_user_id AND v_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: You can only review adoption requests for your own pet listings.';
  END IF;

  -- 6. Verify Request status eligibility
  IF v_req.status NOT IN ('pending', 'under_review', 'more_information_required', 'Pending', 'Under Review') THEN
    RAISE EXCEPTION 'Cannot request more information from current request status: %', v_req.status;
  END IF;

  -- 7. Update request status to 'more_information_required'
  UPDATE public.adoption_requests
  SET 
    status = 'more_information_required',
    provider_notes = v_trimmed_question,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  -- 8. Insert notification for applicant
  INSERT INTO public.notifications (user_id, type, title, message, related_entity_type, related_entity_id, action_url)
  VALUES (
    v_req.adopter_id,
    'more_info_requested',
    'Information Requested for ' || v_req.pet_name,
    'The provider has requested additional information: "' || LEFT(v_trimmed_question, 80) || (CASE WHEN length(v_trimmed_question) > 80 THEN '...' ELSE '' END) || '"',
    'adoption_request',
    p_request_id,
    '/adopter/requests/' || p_request_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'pet_id', v_req.pet_id,
    'status', 'more_information_required'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 6. Grant Permissions to Authenticated Users
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.provider_approve_adoption_request(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provider_reject_adoption_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.provider_request_more_information(UUID, TEXT) TO authenticated;
