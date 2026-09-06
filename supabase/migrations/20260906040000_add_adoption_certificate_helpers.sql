-- Migration: 20260906040000_add_adoption_certificate_helpers.sql
-- Description: Join official adoption record & certificate to get_platform_adoption_requests and provide get_adoption_record_by_pet_id RPC

-- 1. Update get_platform_adoption_requests to include adoption record (certificate_number, adoption_date, etc.)
CREATE OR REPLACE FUNCTION public.get_platform_adoption_requests()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
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
$function$;

-- 2. Provide get_adoption_record_by_pet_id for reliable cross-role certificate retrieval
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
