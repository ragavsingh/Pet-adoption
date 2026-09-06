-- ==============================================================================
-- DATABASE SECURITY ADVISOR HARDENING MIGRATION
-- Migration: 20260905170000_security_advisor_hardening.sql
-- Description: Resolves Supabase Database Linter / Security Advisor warnings:
--              1. Sets immutable search_path on public.handle_updated_at
--              2. Removes broad public listing policy on storage.objects for pet-images
--              3. Revokes direct PostgREST RPC execution on all internal triggers
--              4. Restricts execution of all stored procedures to authenticated users
--              5. Switches notification read procedures to SECURITY INVOKER
-- ==============================================================================

-- 1. Fix mutable search_path on handle_updated_at
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 2. Fix public bucket listing on storage.objects
-- (Public buckets serve assets directly by public URL; broad SELECT on objects allows unauthorized enumeration)
DROP POLICY IF EXISTS "Public Access for Pet Images" ON storage.objects;

-- 3. Revoke EXECUTE on all internal trigger functions from PUBLIC, anon, and authenticated
-- Triggers run internally within PostgreSQL; exposing them as callable RPC endpoints is unnecessary
REVOKE EXECUTE ON FUNCTION public.check_adoption_request_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_extension_request_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_pet_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_trial_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_adoption_request_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_provider_verification_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_safety_report_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_provider_self_verification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon, authenticated;

-- 4. Revoke EXECUTE from anon and PUBLIC on all workflow RPC functions (strictly require authenticated)
REVOKE EXECUTE ON FUNCTION public.add_trial_journal_entry(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_trial_journal_entry(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_change_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_change_user_role(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_moderate_pet_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_moderate_pet_status(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_reject_provider(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_provider(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_verify_provider(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_provider(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.adopter_complete_adoption(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adopter_complete_adoption(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.adopter_request_trial_extension(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adopter_request_trial_extension(uuid, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.provider_approve_adoption_request(uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provider_approve_adoption_request(uuid, text, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.provider_approve_trial_extension(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provider_approve_trial_extension(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.provider_reject_adoption_request(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provider_reject_adoption_request(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.provider_reject_trial_extension(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provider_reject_trial_extension(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.provider_request_more_information(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.provider_request_more_information(uuid, text) TO authenticated;

-- 5. Switch notification functions to SECURITY INVOKER
ALTER FUNCTION public.mark_notification_as_read(UUID) SECURITY INVOKER;
ALTER FUNCTION public.mark_all_notifications_as_read() SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_as_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_as_read() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_notification_as_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(uuid) TO authenticated;
