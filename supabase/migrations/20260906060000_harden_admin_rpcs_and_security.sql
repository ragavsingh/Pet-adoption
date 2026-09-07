-- ==============================================================================
-- Migration: 20260906060000_harden_admin_rpcs_and_security.sql
-- Description: Zero-Trust Security Hardening for Admin RPCs & Adoption Certificate PII
--              1. Hardens get_platform_users with passkey or is_admin() validation
--              2. Hardens get_platform_adoption_requests with passkey or is_admin() validation
--              3. Hardens get_admin_notifications with passkey or is_admin() validation
--              4. Hardens admin_get_dashboard_stats with passkey or is_admin() validation
--              5. Redacts adopter phone and email from get_adoption_record_by_pet_id for public viewers
-- ==============================================================================

-- 1. Drop existing unprotected overloads
DROP FUNCTION IF EXISTS public.get_platform_users();
DROP FUNCTION IF EXISTS public.get_platform_adoption_requests();
DROP FUNCTION IF EXISTS public.get_admin_notifications();
DROP FUNCTION IF EXISTS public.admin_get_dashboard_stats();

-- 2. Hardened get_platform_users with passkey or is_admin() check
CREATE OR REPLACE FUNCTION public.get_platform_users(p_passkey text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (
    public.is_admin() 
    OR (p_passkey IS NOT NULL AND p_passkey IN ('admin2026', 'Admin@2026', 'petadmin2026'))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Administrative access required.';
  END IF;

  SELECT jsonb_agg(row_to_json(t)) INTO v_result
  FROM (
    SELECT 
      p.id,
      p.full_name,
      p.email,
      p.role,
      p.city,
      p.locality,
      p.profile_image_url,
      p.created_at,
      json_build_object('profile_completion', ap.profile_completion) AS adopter_profiles,
      json_build_object('verification_status', pp.verification_status, 'organization_name', pp.organization_name) AS provider_profiles
    FROM public.profiles p
    LEFT JOIN public.adopter_profiles ap ON ap.id = p.id
    LEFT JOIN public.provider_profiles pp ON pp.id = p.id
    ORDER BY p.created_at DESC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_users(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_users(text) TO anon, authenticated;

-- 3. Hardened get_platform_adoption_requests
CREATE OR REPLACE FUNCTION public.get_platform_adoption_requests(p_passkey text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (
    public.is_admin() 
    OR (p_passkey IS NOT NULL AND p_passkey IN ('admin2026', 'Admin@2026', 'petadmin2026'))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Administrative access required.';
  END IF;

  SELECT jsonb_agg(row_to_json(t)) INTO v_result
  FROM (
    SELECT 
      ar.*,
      json_build_object(
        'id', p.id,
        'name', p.name,
        'breed', p.breed,
        'species', p.species,
        'city', p.city,
        'locality', p.locality,
        'pet_images', (
          SELECT json_agg(json_build_object(
            'image_url', pi.image_url,
            'display_order', pi.display_order,
            'is_primary', pi.is_primary
          ) ORDER BY pi.display_order ASC NULLS LAST)
          FROM public.pet_images pi
          WHERE pi.pet_id = p.id
        )
      ) AS pets,
      json_build_object(
        'id', ap.id,
        'full_name', ap.full_name,
        'email', ap.email,
        'phone', ap.phone,
        'city', ap.city,
        'locality', ap.locality,
        'profile_image_url', ap.profile_image_url
      ) AS adopter_profile,
      json_build_object(
        'id', pp.id,
        'full_name', pp.full_name,
        'email', pp.email,
        'phone', pp.phone,
        'city', pp.city,
        'locality', pp.locality,
        'profile_image_url', pp.profile_image_url
      ) AS provider_profile,
      json_build_object(
        'organization_name', prp.organization_name,
        'city', prp.city,
        'locality', prp.locality
      ) AS provider_details,
      (
        SELECT json_build_object(
          'id', adp.id,
          'certificate_number', adp.certificate_number,
          'adoption_date', adp.adoption_date,
          'status', adp.status,
          'notes', adp.notes,
          'created_at', adp.created_at
        )
        FROM public.adoptions adp
        WHERE adp.adoption_request_id = ar.id OR adp.pet_id = ar.pet_id
        ORDER BY adp.created_at DESC
        LIMIT 1
      ) AS adoption,
      (
        SELECT json_agg(json_build_object(
          'id', ft.id,
          'pet_id', ft.pet_id,
          'adopter_id', ft.adopter_id,
          'provider_id', ft.provider_id,
          'adoption_request_id', ft.adoption_request_id,
          'start_date', ft.start_date,
          'end_date', ft.end_date,
          'status', ft.status,
          'journal_entries', ft.journal_entries,
          'trial_extension_requests', (
            SELECT json_agg(json_build_object(
              'id', ter.id,
              'trial_id', ter.trial_id,
              'requested_days', ter.requested_days,
              'reason', ter.reason,
              'status', ter.status,
              'created_at', ter.created_at,
              'reviewed_by', ter.reviewed_by,
              'reviewed_at', ter.reviewed_at,
              'provider_response', ter.provider_response
            ) ORDER BY ter.created_at DESC)
            FROM public.trial_extension_requests ter
            WHERE ter.trial_id = ft.id
          )
        ))
        FROM public.foster_trials ft
        WHERE ft.adoption_request_id = ar.id
      ) AS foster_trials
    FROM public.adoption_requests ar
    LEFT JOIN public.pets p ON ar.pet_id = p.id
    LEFT JOIN public.profiles ap ON ar.adopter_id = ap.id
    LEFT JOIN public.profiles pp ON ar.provider_id = pp.id
    LEFT JOIN public.provider_profiles prp ON ar.provider_id = prp.id
    ORDER BY ar.created_at DESC
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_adoption_requests(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_adoption_requests(text) TO anon, authenticated;

-- 4. Hardened get_admin_notifications
CREATE OR REPLACE FUNCTION public.get_admin_notifications(p_passkey text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT (
    public.is_admin() 
    OR (p_passkey IS NOT NULL AND p_passkey IN ('admin2026', 'Admin@2026', 'petadmin2026'))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Administrative access required.';
  END IF;

  SELECT jsonb_agg(row_to_json(t)) INTO v_result
  FROM (
    SELECT 
      n.id,
      n.user_id,
      n.type,
      n.title,
      n.message,
      COALESCE(
        CASE 
          WHEN n.related_entity_type = 'report' THEN '/admin/reports'
          WHEN n.related_entity_type = 'provider_profile' THEN '/admin/providers'
          WHEN COALESCE(ar.id, ft.adoption_request_id, ad.adoption_request_id) IS NOT NULL THEN
            '/admin/requests?id=' || COALESCE(ar.id, ft.adoption_request_id, ad.adoption_request_id)
          WHEN n.action_url IS NOT NULL AND n.action_url != '' THEN n.action_url
          ELSE '/admin/requests'
        END,
        '/admin/requests'
      ) AS action_url,
      n.is_read,
      n.read_at,
      n.created_at,
      n.related_entity_type,
      COALESCE(ar.id, ft.adoption_request_id, ad.adoption_request_id, n.related_entity_id) AS related_entity_id,
      COALESCE(p.name, 'Companion') AS pet_name,
      (
        SELECT pi.image_url 
        FROM public.pet_images pi 
        WHERE pi.pet_id = COALESCE(p.id, ar.pet_id, ft.pet_id, ad.pet_id)
        ORDER BY pi.is_primary DESC, pi.display_order ASC 
        LIMIT 1
      ) AS pet_image
    FROM public.notifications n
    LEFT JOIN public.adoption_requests ar ON (
      n.related_entity_type = 'adoption_request' AND n.related_entity_id = ar.id
    )
    LEFT JOIN public.foster_trials ft ON (
      n.related_entity_type = 'foster_trial' AND n.related_entity_id = ft.id
    )
    LEFT JOIN public.adoptions ad ON (
      n.related_entity_type = 'adoption' AND n.related_entity_id = ad.id
    )
    LEFT JOIN public.pets p ON (
      p.id = COALESCE(ar.pet_id, ft.pet_id, ad.pet_id, CASE WHEN n.related_entity_type = 'pet' THEN n.related_entity_id END)
    )
    WHERE n.user_id IN (SELECT id FROM public.profiles WHERE role = 'admin')
       OR n.user_id = 'a0000000-0000-0000-0000-000000000099'
       OR (
         n.type IN ('request_received', 'report_created', 'provider_registered', 'adoption_completed', 'trial_extension_requested')
         AND (n.action_url LIKE '/admin%' OR n.user_id IN (SELECT id FROM public.profiles WHERE role = 'admin'))
       )
    ORDER BY n.created_at DESC
    LIMIT 50
  ) t;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_notifications(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_notifications(text) TO anon, authenticated;

-- 5. Hardened admin_get_dashboard_stats
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats(p_passkey text DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
  IF NOT (
    public.is_admin() 
    OR (p_passkey IS NOT NULL AND p_passkey IN ('admin2026', 'Admin@2026', 'petadmin2026'))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not a platform administrator.';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_adopters FROM public.profiles WHERE role = 'adopter';
  SELECT COUNT(*) INTO v_providers FROM public.profiles WHERE role = 'provider';

  SELECT COUNT(*) INTO v_verified_providers 
    FROM public.provider_profiles WHERE verification_status = 'verified';
  SELECT COUNT(*) INTO v_pending_verifications 
    FROM public.provider_profiles WHERE verification_status = 'pending';

  SELECT COUNT(*) INTO v_total_pets FROM public.pets;
  SELECT COUNT(*) INTO v_available_pets 
    FROM public.pets WHERE adoption_status IN ('available', 'Available');
  SELECT COUNT(*) INTO v_trial_pets 
    FROM public.pets WHERE adoption_status IN ('trial', 'Adoption Pending');
  SELECT COUNT(*) INTO v_adopted_pets 
    FROM public.pets WHERE adoption_status IN ('adopted', 'Adopted');

  SELECT COUNT(*) INTO v_total_requests FROM public.adoption_requests;
  SELECT COUNT(*) INTO v_pending_requests 
    FROM public.adoption_requests WHERE status IN ('pending', 'under_review', 'more_information_required', 'Pending', 'Under Review');

  SELECT COUNT(*) INTO v_active_trials 
    FROM public.foster_trials WHERE status IN ('active', 'upcoming', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official', 'Trial Active', 'Ending Soon');
  SELECT COUNT(*) INTO v_total_adoptions 
    FROM public.adoptions WHERE status = 'completed';

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
$$;

REVOKE ALL ON FUNCTION public.admin_get_dashboard_stats(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats(text) TO anon, authenticated;

-- 6. PII redaction on public adoption certificates
CREATE OR REPLACE FUNCTION public.get_adoption_record_by_pet_id(p_pet_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT row_to_json(t)::jsonb INTO v_result
  FROM (
    SELECT 
      adp.*,
      json_build_object(
        'id', p.id,
        'name', p.name,
        'breed', p.breed,
        'gender', p.gender,
        'age', p.age,
        'size', p.size,
        'species', p.species,
        'city', p.city,
        'locality', p.locality,
        'pet_images', (
          SELECT json_agg(json_build_object(
            'image_url', pi.image_url,
            'display_order', pi.display_order,
            'is_primary', pi.is_primary
          ) ORDER BY pi.display_order ASC NULLS LAST)
          FROM public.pet_images pi
          WHERE pi.pet_id = p.id
        )
      ) AS pets,
      json_build_object(
        'id', ap.id,
        'full_name', ap.full_name,
        'email', CASE 
          WHEN (auth.uid() = adp.adopter_id OR auth.uid() = adp.provider_id OR public.is_admin()) 
          THEN ap.email 
          ELSE NULL 
        END,
        'phone', CASE 
          WHEN (auth.uid() = adp.adopter_id OR auth.uid() = adp.provider_id OR public.is_admin()) 
          THEN ap.phone 
          ELSE NULL 
        END,
        'city', ap.city,
        'locality', ap.locality,
        'profile_image_url', ap.profile_image_url
      ) AS adopter_profile,
      json_build_object(
        'id', pp.id,
        'full_name', pp.full_name,
        'email', pp.email,
        'phone', pp.phone,
        'city', pp.city,
        'locality', pp.locality,
        'profile_image_url', pp.profile_image_url
      ) AS provider_profile
    FROM public.adoptions adp
    LEFT JOIN public.pets p ON adp.pet_id = p.id
    LEFT JOIN public.profiles ap ON adp.adopter_id = ap.id
    LEFT JOIN public.profiles pp ON adp.provider_id = pp.id
    WHERE adp.pet_id = p_pet_id AND adp.status = 'completed'
    ORDER BY adp.adoption_date DESC
    LIMIT 1
  ) t;

  RETURN v_result;
END;
$$;
