-- ==============================================================================
-- Migration: 20260924180000_authorize_admin_email.sql
-- Description: Updates public.is_admin() to designate raghavsingh6204@gmail.com
--              as the authoritative platform administrator in PostgreSQL RLS.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR LOWER(email) = 'raghavsingh6204@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.is_admin() IS 'Validates whether the active authenticated session possesses platform administrator privileges.';
