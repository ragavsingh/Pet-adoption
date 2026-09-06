-- ==============================================================================
-- PHASE 14: NOTIFICATIONS SYSTEM ENHANCEMENTS & WORKFLOW TRIGGERS
-- Migration: 20260904180000_notifications_system.sql
-- Description: Enforces duplicate prevention, authoritative server-side triggers
--              for application submission, provider verification, and report creation,
--              plus secure RPCs for marking notifications as read.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DUPLICATE NOTIFICATION PREVENTION (Idempotency & Concurrency)
-- ------------------------------------------------------------------------------

-- Deduplicate any existing duplicate notification rows prior to index creation
DELETE FROM public.notifications a
USING public.notifications b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.type = b.type
  AND a.related_entity_type IS NOT DISTINCT FROM b.related_entity_type
  AND a.related_entity_id IS NOT DISTINCT FROM b.related_entity_id
  AND a.related_entity_id IS NOT NULL;

-- Authoritative partial unique index: guarantees exactly one notification per user,
-- type, and related entity event (e.g. single 'request_received' per adoption request).
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_event_notification
  ON public.notifications (user_id, type, related_entity_type, related_entity_id)
  WHERE related_entity_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. ADOPTION APPLICATION CREATED TRIGGER (Notifies Provider)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_adoption_request_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pet_name TEXT;
  v_adopter_name TEXT;
BEGIN
  -- Fetch pet name
  SELECT name INTO v_pet_name
  FROM public.pets
  WHERE id = NEW.pet_id;

  -- Fetch applicant name
  SELECT full_name INTO v_adopter_name
  FROM public.profiles
  WHERE id = NEW.adopter_id;

  -- Insert notification for provider (idempotent via unique index & IF NOT EXISTS)
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = NEW.provider_id
      AND type = 'request_received'
      AND related_entity_type = 'adoption_request'
      AND related_entity_id = NEW.id
  ) THEN
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
      NEW.provider_id,
      'request_received',
      'New Adoption Application',
      COALESCE(v_adopter_name, 'An applicant') || ' submitted an adoption application for ' || COALESCE(v_pet_name, 'your companion') || '.',
      'adoption_request',
      NEW.id,
      '/provider/requests/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_provider_on_new_adoption_request ON public.adoption_requests;
CREATE TRIGGER trg_notify_provider_on_new_adoption_request
  AFTER INSERT ON public.adoption_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_adoption_request_notification();

-- ------------------------------------------------------------------------------
-- 3. PROVIDER VERIFICATION TRIGGER (Notifies Provider on Safety Approval)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_provider_verification_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Triggered when a provider profile is verified by an administrator
  IF (OLD.verification_status IS DISTINCT FROM 'verified' AND NEW.verification_status = 'verified') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = NEW.id
        AND type = 'provider_verified'
        AND related_entity_type = 'provider_profile'
        AND related_entity_id = NEW.id
    ) THEN
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
        NEW.id,
        'provider_verified',
        'Profile Officially Verified! 🛡️',
        'Congratulations! Your provider profile and rescue credentials have been verified by the safety moderation team.',
        'provider_profile',
        NEW.id,
        '/provider/profile'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_provider_on_verification ON public.provider_profiles;
CREATE TRIGGER trg_notify_provider_on_verification
  AFTER UPDATE OF verification_status ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_provider_verification_notification();

-- ------------------------------------------------------------------------------
-- 4. SAFETY REPORT CREATED TRIGGER (Notifies Administrators)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_safety_report_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify active administrators when a safety or moderation report is filed
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    action_url
  )
  SELECT 
    p.id,
    'report_created',
    'Safety Report Submitted',
    'A new safety/moderation report was filed regarding ' || COALESCE(NEW.target_type, 'a pet listing') || '.',
    'report',
    NEW.id,
    '/admin/reports'
  FROM public.profiles p
  WHERE p.role = 'admin'
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_report ON public.reports;
CREATE TRIGGER trg_notify_admins_on_new_report
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_safety_report_notification();

-- ------------------------------------------------------------------------------
-- 5. SECURE MARK AS READ RPCs (Server-Side Authorization & Atomic Execution)
-- ------------------------------------------------------------------------------

-- Mark single notification as read (only caller's own record)
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_updated BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET 
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE id = p_notification_id 
    AND user_id = v_user_id;

  v_updated := FOUND;
  RETURN v_updated;
END;
$$;

-- Mark all notifications as read for current authenticated user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET 
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE user_id = v_user_id 
    AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Grant execution permissions on RPCs to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_as_read() TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. ENABLE REALTIME PUBLICATION (Broadcast Notifications)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
