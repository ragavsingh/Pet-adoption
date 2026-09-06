-- ==============================================================================
-- PET ADOPTION PLATFORM — ROW LEVEL SECURITY (RLS) & AUTHORIZATION
-- Migration: 20260904130000_enable_row_level_security.sql
-- Description: Enables RLS on all 14 application tables, establishes non-recursive
--              database-level role validation, prevents privilege escalation,
--              and secures public/private boundaries.
-- ==============================================================================

-- ==============================================================================
-- 0. SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

-- Non-recursive admin check function with fixed search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to fetch current caller's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to prevent non-admins from changing their role (Privilege Escalation Guard)
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can modify account roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to prevent providers from self-verifying (Provider Verification Guard)
CREATE OR REPLACE FUNCTION public.prevent_provider_self_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only platform administrators can change verification status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to guard adoption request status updates from client manipulation
CREATE OR REPLACE FUNCTION public.check_adoption_request_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Participants cannot be swapped
  IF NEW.pet_id != OLD.pet_id OR NEW.adopter_id != OLD.adopter_id OR NEW.provider_id != OLD.provider_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot change adoption request participants or pet.';
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
    -- Official approval/completion requires the formal transactional workflow
    IF NEW.status IN ('approved', 'Approved', 'completed', 'Completed') AND OLD.status NOT IN ('approved', 'Approved', 'completed', 'Completed') AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Privileged transition: Official adoption approvals must execute through the secure adoption workflow transaction.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to guard trial dates and participant immutability
CREATE OR REPLACE FUNCTION public.check_trial_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.pet_id != OLD.pet_id OR NEW.adopter_id != OLD.adopter_id OR NEW.provider_id != OLD.provider_id THEN
      RAISE EXCEPTION 'Unauthorized: Cannot change foster trial participants or pet.';
    END IF;
    IF NEW.start_date != OLD.start_date OR NEW.end_date != OLD.end_date THEN
      RAISE EXCEPTION 'Unauthorized: Trial dates cannot be modified directly; must use approved extension requests.';
    END IF;
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
      RAISE EXCEPTION 'Unauthorized: Final trial completion must execute through the official adoption finalization workflow.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to validate extension request reviewer ownership
CREATE OR REPLACE FUNCTION public.check_extension_request_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.foster_trials ft
      WHERE ft.id = NEW.trial_id AND ft.provider_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Unauthorized: Only the assigned pet provider can review this extension request.';
    END IF;
  END IF;
  NEW.reviewed_by := auth.uid();
  NEW.reviewed_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach triggers
DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

DROP TRIGGER IF EXISTS trg_prevent_provider_self_verification ON public.provider_profiles;
CREATE TRIGGER trg_prevent_provider_self_verification
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_provider_self_verification();

DROP TRIGGER IF EXISTS trg_check_adoption_request_update ON public.adoption_requests;
CREATE TRIGGER trg_check_adoption_request_update
  BEFORE UPDATE ON public.adoption_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_adoption_request_update();

DROP TRIGGER IF EXISTS trg_check_trial_update ON public.foster_trials;
CREATE TRIGGER trg_check_trial_update
  BEFORE UPDATE ON public.foster_trials
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trial_update();

DROP TRIGGER IF EXISTS trg_check_extension_request_review ON public.trial_extension_requests;
CREATE TRIGGER trg_check_extension_request_review
  BEFORE UPDATE ON public.trial_extension_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_extension_request_review();


-- ==============================================================================
-- 1. PROFILES (auth.users -> profiles)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by self, public providers, or admins" ON public.profiles;
CREATE POLICY "Profiles are viewable by self, public providers, or admins"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR role = 'provider'
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    id = auth.uid()
    AND role IN ('adopter', 'provider')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());


-- ==============================================================================
-- 2. ADOPTER PROFILES
-- ==============================================================================
ALTER TABLE public.adopter_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adopter profiles viewable by self, active pet providers, or admins" ON public.adopter_profiles;
CREATE POLICY "Adopter profiles viewable by self, active pet providers, or admins"
  ON public.adopter_profiles FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.adoption_requests ar
      JOIN public.pets p ON p.id = ar.pet_id
      WHERE ar.adopter_id = public.adopter_profiles.id
        AND p.provider_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Adopters can insert own adopter profile" ON public.adopter_profiles;
CREATE POLICY "Adopters can insert own adopter profile"
  ON public.adopter_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Adopters can update own adopter profile" ON public.adopter_profiles;
CREATE POLICY "Adopters can update own adopter profile"
  ON public.adopter_profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Adopters can delete own adopter profile" ON public.adopter_profiles;
CREATE POLICY "Adopters can delete own adopter profile"
  ON public.adopter_profiles FOR DELETE
  USING (id = auth.uid() OR public.is_admin());


-- ==============================================================================
-- 3. PROVIDER PROFILES
-- ==============================================================================
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Provider profiles are viewable by everyone" ON public.provider_profiles;
CREATE POLICY "Provider profiles are viewable by everyone"
  ON public.provider_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Providers can insert own profile" ON public.provider_profiles;
CREATE POLICY "Providers can insert own profile"
  ON public.provider_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Providers can update own profile" ON public.provider_profiles;
CREATE POLICY "Providers can update own profile"
  ON public.provider_profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());


-- ==============================================================================
-- 4. PETS
-- ==============================================================================
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pets viewable by public if available, or by owner provider, or admin" ON public.pets;
CREATE POLICY "Pets viewable by public if available, or by owner provider, or admin"
  ON public.pets FOR SELECT
  USING (
    adoption_status NOT IN ('draft', 'Draft', 'archived', 'Unavailable')
    OR provider_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Providers can insert their own pets" ON public.pets;
CREATE POLICY "Providers can insert their own pets"
  ON public.pets FOR INSERT
  WITH CHECK (
    provider_id = auth.uid()
  );

DROP POLICY IF EXISTS "Providers can update their own pets" ON public.pets;
CREATE POLICY "Providers can update their own pets"
  ON public.pets FOR UPDATE
  USING (provider_id = auth.uid() OR public.is_admin())
  WITH CHECK (provider_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Providers can delete their own pets" ON public.pets;
CREATE POLICY "Providers can delete their own pets"
  ON public.pets FOR DELETE
  USING (provider_id = auth.uid() OR public.is_admin());


-- ==============================================================================
-- 5. PET IMAGES
-- ==============================================================================
ALTER TABLE public.pet_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pet images viewable by everyone who can view pet" ON public.pet_images;
CREATE POLICY "Pet images viewable by everyone who can view pet"
  ON public.pet_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_images.pet_id
        AND (
          pets.adoption_status NOT IN ('draft', 'Draft', 'archived', 'Unavailable')
          OR pets.provider_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS "Providers can insert images for their own pets" ON public.pet_images;
CREATE POLICY "Providers can insert images for their own pets"
  ON public.pet_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_images.pet_id
        AND (pets.provider_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Providers can update images for their own pets" ON public.pet_images;
CREATE POLICY "Providers can update images for their own pets"
  ON public.pet_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_images.pet_id
        AND (pets.provider_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Providers can delete images for their own pets" ON public.pet_images;
CREATE POLICY "Providers can delete images for their own pets"
  ON public.pet_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = pet_images.pet_id
        AND (pets.provider_id = auth.uid() OR public.is_admin())
    )
  );


-- ==============================================================================
-- 6. FAVORITES
-- ==============================================================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adopters can view own favorites" ON public.favorites;
CREATE POLICY "Adopters can view own favorites"
  ON public.favorites FOR SELECT
  USING (adopter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Adopters can insert own favorites" ON public.favorites;
CREATE POLICY "Adopters can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (adopter_id = auth.uid());

DROP POLICY IF EXISTS "Adopters can delete own favorites" ON public.favorites;
CREATE POLICY "Adopters can delete own favorites"
  ON public.favorites FOR DELETE
  USING (adopter_id = auth.uid() OR public.is_admin());


-- ==============================================================================
-- 7. ADOPTION REQUESTS
-- ==============================================================================
ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requests viewable by applicant adopter, pet provider, or admin" ON public.adoption_requests;
CREATE POLICY "Requests viewable by applicant adopter, pet provider, or admin"
  ON public.adoption_requests FOR SELECT
  USING (
    adopter_id = auth.uid()
    OR provider_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Adopters can submit adoption requests" ON public.adoption_requests;
CREATE POLICY "Adopters can submit adoption requests"
  ON public.adoption_requests FOR INSERT
  WITH CHECK (
    adopter_id = auth.uid()
    AND status IN ('pending', 'Pending')
  );

DROP POLICY IF EXISTS "Participants can update adoption requests" ON public.adoption_requests;
CREATE POLICY "Participants can update adoption requests"
  ON public.adoption_requests FOR UPDATE
  USING (
    adopter_id = auth.uid()
    OR provider_id = auth.uid()
    OR public.is_admin()
  );


-- ==============================================================================
-- 8. ADOPTIONS
-- ==============================================================================
ALTER TABLE public.adoptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Adoptions viewable by adopter, provider, or admin" ON public.adoptions;
CREATE POLICY "Adoptions viewable by adopter, provider, or admin"
  ON public.adoptions FOR SELECT
  USING (
    adopter_id = auth.uid()
    OR provider_id = auth.uid()
    OR public.is_admin()
  );

-- Direct client inserts/updates/deletes are strictly restricted to admin or backend service role
DROP POLICY IF EXISTS "Only admins or secure backend can insert adoptions" ON public.adoptions;
CREATE POLICY "Only admins or secure backend can insert adoptions"
  ON public.adoptions FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins or secure backend can update adoptions" ON public.adoptions;
CREATE POLICY "Only admins or secure backend can update adoptions"
  ON public.adoptions FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins or secure backend can delete adoptions" ON public.adoptions;
CREATE POLICY "Only admins or secure backend can delete adoptions"
  ON public.adoptions FOR DELETE
  USING (public.is_admin());


-- ==============================================================================
-- 9. FOSTER-TO-OWN / TRIAL PERIODS
-- ==============================================================================
ALTER TABLE public.foster_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trials viewable by participant adopter, provider, or admin" ON public.foster_trials;
CREATE POLICY "Trials viewable by participant adopter, provider, or admin"
  ON public.foster_trials FOR SELECT
  USING (
    adopter_id = auth.uid()
    OR provider_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Only admins or secure backend can insert trials" ON public.foster_trials;
CREATE POLICY "Only admins or secure backend can insert trials"
  ON public.foster_trials FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Trial participants can update journal or notes" ON public.foster_trials;
CREATE POLICY "Trial participants can update journal or notes"
  ON public.foster_trials FOR UPDATE
  USING (
    adopter_id = auth.uid()
    OR provider_id = auth.uid()
    OR public.is_admin()
  );


-- ==============================================================================
-- 10. TRIAL EXTENSION REQUESTS
-- ==============================================================================
ALTER TABLE public.trial_extension_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Extension requests viewable by adopter, trial provider, or admin" ON public.trial_extension_requests;
CREATE POLICY "Extension requests viewable by adopter, trial provider, or admin"
  ON public.trial_extension_requests FOR SELECT
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.foster_trials ft
      WHERE ft.id = trial_extension_requests.trial_id
        AND ft.provider_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Adopters can request extension for their active trial" ON public.trial_extension_requests;
CREATE POLICY "Adopters can request extension for their active trial"
  ON public.trial_extension_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.foster_trials ft
      WHERE ft.id = trial_extension_requests.trial_id
        AND ft.adopter_id = auth.uid()
        AND ft.status IN ('active', 'ending_soon', 'Trial Active', 'Ending Soon')
    )
  );

DROP POLICY IF EXISTS "Trial providers can review extension requests" ON public.trial_extension_requests;
CREATE POLICY "Trial providers can review extension requests"
  ON public.trial_extension_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.foster_trials ft
      WHERE ft.id = trial_extension_requests.trial_id
        AND ft.provider_id = auth.uid()
    )
    OR public.is_admin()
  );


-- ==============================================================================
-- 11. NOTIFICATIONS
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can mark own notifications as read" ON public.notifications;
CREATE POLICY "Users can mark own notifications as read"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Only system or admin can create notifications" ON public.notifications;
CREATE POLICY "Only system or admin can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());


-- ==============================================================================
-- 12. REPORTS
-- ==============================================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports or admins can view all" ON public.reports;
CREATE POLICY "Users can view own reports or admins can view all"
  ON public.reports FOR SELECT
  USING (reporter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.reports;
CREATE POLICY "Authenticated users can submit reports"
  ON public.reports FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid()
    AND status IN ('open', 'Pending')
    AND resolved_by IS NULL
    AND resolved_at IS NULL
  );

DROP POLICY IF EXISTS "Only admins can update or resolve reports" ON public.reports;
CREATE POLICY "Only admins can update or resolve reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 13. PROVIDER VERIFICATIONS
-- ==============================================================================
ALTER TABLE public.provider_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own verifications or admin" ON public.provider_verifications;
CREATE POLICY "Providers can view own verifications or admin"
  ON public.provider_verifications FOR SELECT
  USING (
    provider_id = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "Providers can submit own verification" ON public.provider_verifications;
CREATE POLICY "Providers can submit own verification"
  ON public.provider_verifications FOR INSERT
  WITH CHECK (
    provider_id = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

DROP POLICY IF EXISTS "Only admins can review provider verifications" ON public.provider_verifications;
CREATE POLICY "Only admins can review provider verifications"
  ON public.provider_verifications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ==============================================================================
-- 14. AUDIT LOGS
-- ==============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can record their own audit action" ON public.audit_logs;
CREATE POLICY "Users can record their own audit action"
  ON public.audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Immutable: No UPDATE or DELETE policies are granted on audit_logs.
