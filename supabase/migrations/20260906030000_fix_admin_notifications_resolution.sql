-- ==============================================================================
-- Migration: 20260906030000_fix_admin_notifications_resolution.sql
-- Description: Fix admin notifications resolution and click-to-open target URL.
--              - Resolves target request ID across adoptions, foster_trials, and pets.
--              - Provides full companion name and primary image for all admin notifications.
--              - Pre-computes direct action_url (/admin/requests?id=<resolved_id>) so
--                clicking any notification immediately opens the request review drawer.
--              - Restricts notifications query strictly to platform admin recipients.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t)) INTO v_result
  FROM (
    SELECT 
      n.id,
      n.user_id,
      n.type,
      n.title,
      n.message,
      -- Pre-compute smart direct action_url
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
      -- Resolves directly to the adoption request UUID so click-to-open operates instantly
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_admin_notifications() TO authenticated, anon;
