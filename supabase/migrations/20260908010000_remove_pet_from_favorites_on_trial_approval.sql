-- ==============================================================================
-- Migration: 20260908010000_remove_pet_from_favorites_on_trial_approval.sql
-- Description: Automatically remove pet from adopter's favorites when adoption
--              request is approved, foster trial starts, or pet is adopted.
-- ==============================================================================

-- 1. Upgrade sync_foster_trial_on_approval to also remove pet from favorites
CREATE OR REPLACE FUNCTION public.sync_foster_trial_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When request becomes approved or trial, ensure foster trial, pet status, and favorites are synchronized
  IF NEW.status IN ('approved', 'Approved', 'trial', 'Trial', 'completed', 'Completed') THEN
    PERFORM set_config('pet_adoption.in_secure_workflow', 'true', true);

    -- 1. Create foster trial if not exists
    IF NOT EXISTS (
      SELECT 1 FROM public.foster_trials 
      WHERE adoption_request_id = NEW.id OR (pet_id = NEW.pet_id AND adopter_id = NEW.adopter_id AND status = 'active')
    ) THEN
      INSERT INTO public.foster_trials (
        pet_id,
        adopter_id,
        provider_id,
        adoption_request_id,
        start_date,
        end_date,
        status,
        created_at,
        updated_at
      ) VALUES (
        NEW.pet_id,
        NEW.adopter_id,
        NEW.provider_id,
        NEW.id,
        NOW(),
        NOW() + INTERVAL '14 days',
        'active',
        NOW(),
        NOW()
      );
    END IF;

    -- 2. Update pet listing to 'trial' (unless already adopted)
    UPDATE public.pets
    SET adoption_status = CASE WHEN NEW.status IN ('completed', 'Completed') THEN 'adopted' ELSE 'trial' END,
        updated_at = NOW()
    WHERE id = NEW.pet_id AND (adoption_status != 'adopted' OR NEW.status IN ('completed', 'Completed'));

    -- 3. Automatically remove pet from adopter's favorites
    DELETE FROM public.favorites
    WHERE adopter_id = NEW.adopter_id AND pet_id = NEW.pet_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. Trigger on foster_trials: automatically delete from favorites on trial insert/update
CREATE OR REPLACE FUNCTION public.sync_remove_favorite_on_foster_trial()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.favorites
  WHERE adopter_id = NEW.adopter_id AND pet_id = NEW.pet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_remove_favorite_on_foster_trial ON public.foster_trials;
CREATE TRIGGER trg_remove_favorite_on_foster_trial
AFTER INSERT OR UPDATE ON public.foster_trials
FOR EACH ROW EXECUTE FUNCTION public.sync_remove_favorite_on_foster_trial();

-- 3. Trigger on adoptions: automatically delete from favorites on final adoption
CREATE OR REPLACE FUNCTION public.sync_remove_favorite_on_adoption()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.favorites
  WHERE adopter_id = NEW.adopter_id AND pet_id = NEW.pet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_remove_favorite_on_adoption ON public.adoptions;
CREATE TRIGGER trg_remove_favorite_on_adoption
AFTER INSERT OR UPDATE ON public.adoptions
FOR EACH ROW EXECUTE FUNCTION public.sync_remove_favorite_on_adoption();

-- 4. Clean up any existing favorites where an active trial, approved request, or completed adoption already exists
DELETE FROM public.favorites f
WHERE EXISTS (
  SELECT 1 FROM public.adoption_requests ar
  WHERE ar.adopter_id = f.adopter_id
    AND ar.pet_id = f.pet_id
    AND ar.status IN ('approved', 'Approved', 'trial', 'Trial', 'completed', 'Completed')
)
OR EXISTS (
  SELECT 1 FROM public.foster_trials ft
  WHERE ft.adopter_id = f.adopter_id
    AND ft.pet_id = f.pet_id
    AND ft.status IN ('active', 'upcoming', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official', 'completed', 'completed_early')
)
OR EXISTS (
  SELECT 1 FROM public.adoptions a
  WHERE a.adopter_id = f.adopter_id
    AND a.pet_id = f.pet_id
);
