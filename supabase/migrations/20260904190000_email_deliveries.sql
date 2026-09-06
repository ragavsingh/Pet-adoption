-- ==============================================================================
-- PHASE 15: TRANSACTIONAL EMAIL DELIVERIES & IDEMPOTENCY LOG
-- Migration: 20260904190000_email_deliveries.sql
-- Description: Creates the email_deliveries table for server-side transactional
--              email tracking, delivery status, and authoritative idempotency.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'adoption_request_created',
    'adoption_request_approved',
    'adoption_request_rejected',
    'more_information_requested',
    'trial_started',
    'trial_extension_requested',
    'trial_extension_approved',
    'trial_extension_rejected',
    'adoption_completed',
    'provider_verified',
    'system_alert'
  )),
  recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  idempotency_key TEXT UNIQUE NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped_development')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Authoritative Indexes for delivery queries and idempotency lookup
CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient ON public.email_deliveries (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_created_at ON public.email_deliveries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_event_type ON public.email_deliveries (event_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_deliveries_idempotency ON public.email_deliveries (idempotency_key);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.email_deliveries ENABLE ROW LEVEL SECURITY;

-- Users can only view their own email delivery history; admins can view all
DROP POLICY IF EXISTS "Users can view own email deliveries" ON public.email_deliveries;
CREATE POLICY "Users can view own email deliveries"
  ON public.email_deliveries FOR SELECT
  USING (recipient_user_id = auth.uid() OR public.is_admin());

-- Only server-side functions (service role) or administrators can insert/update delivery records
-- Clients/browsers CANNOT insert or manipulate delivery audit logs directly
DROP POLICY IF EXISTS "Only admin or service role can insert email deliveries" ON public.email_deliveries;
CREATE POLICY "Only admin or service role can insert email deliveries"
  ON public.email_deliveries FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin or service role can update email deliveries" ON public.email_deliveries;
CREATE POLICY "Only admin or service role can update email deliveries"
  ON public.email_deliveries FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
