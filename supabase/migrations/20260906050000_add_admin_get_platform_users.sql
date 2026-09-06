-- Migration: 20260906050000_add_admin_get_platform_users.sql
-- Description: Provide get_platform_users SECURITY DEFINER RPC to allow the Admin Console to view all registered users (adopters, providers, admins) bypassing RLS restrictions.

CREATE OR REPLACE FUNCTION public.get_platform_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
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

REVOKE EXECUTE ON FUNCTION public.get_platform_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_users() TO anon, authenticated;
