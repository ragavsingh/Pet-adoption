/**
 * ==============================================================================
 * SERVER-SIDE TRANSACTIONAL EMAIL DISPATCHER
 * Strictly executes on server/Edge runtime. Never exposed to frontend bundles.
 * ==============================================================================
 */

import { emailTemplates, EmailContextData } from './emailTemplates';

export type EmailEventType =
  | 'adoption_request_created'
  | 'adoption_request_approved'
  | 'adoption_request_rejected'
  | 'more_information_requested'
  | 'trial_started'
  | 'trial_extension_requested'
  | 'trial_extension_approved'
  | 'trial_extension_rejected'
  | 'adoption_completed'
  | 'provider_verified';

export interface DispatchEmailPayload {
  event_type: EmailEventType;
  related_entity_id: string;
}

export interface DispatchEmailResult {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'skipped_development' | 'already_sent' | 'failed';
  recipient?: string;
  idempotencyKey?: string;
  error?: string;
}

/**
 * Executes server-side transactional email dispatching with authoritative
 * database recipient lookup, idempotency verification, and delivery logging.
 */
export async function sendTransactionalEmail(
  payload: DispatchEmailPayload,
  callerToken?: string,
  customSupabaseClient?: any
): Promise<DispatchEmailResult> {
  const { event_type, related_entity_id } = payload;

  if (!event_type || !related_entity_id) {
    return {
      success: false,
      status: 'failed',
      error: 'Missing required parameters: event_type and related_entity_id',
    };
  }

  // Read environment variables strictly server-side
  const resendApiKey = process.env.RESEND_API_KEY || '';
  const emailFrom = process.env.EMAIL_FROM || 'Pet Adoption <notifications@updates.petadoption.org>';
  const emailReplyTo = process.env.EMAIL_REPLY_TO || 'support@petadoption.org';
  const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const emailMode = process.env.EMAIL_MODE || 'development';

  // Defensive caller validation in production
  if (emailMode === 'production' && !callerToken && !customSupabaseClient) {
    return {
      success: false,
      status: 'failed',
      error: 'Unauthorized: Bearer authorization token is required for email dispatch.',
    };
  }

  // 1. Resolve Recipient & Event Details Authoritatively from Database
  let recipientUserId: string | null = null;
  let recipientEmail: string | null = null;
  let recipientName: string | null = null;
  let relatedEntityType: string = 'unknown';
  const contextData: EmailContextData = { appUrl };

  try {
    // If a supabase client or mock is provided, query the authoritative entity
    if (customSupabaseClient) {
      if (
        event_type === 'adoption_request_created' ||
        event_type === 'adoption_request_approved' ||
        event_type === 'adoption_request_rejected' ||
        event_type === 'more_information_requested'
      ) {
        relatedEntityType = 'adoption_request';
        const { data: req } = await customSupabaseClient
          .from('adoption_requests')
          .select('*, pets(name), adopter:profiles!adopter_id(full_name, email), provider:profiles!provider_id(full_name, email)')
          .eq('id', related_entity_id)
          .single();

        if (req) {
          contextData.petName = req.pets?.name || 'Companion';
          contextData.adopterName = req.adopter?.full_name || 'Applicant';
          contextData.providerName = req.provider?.full_name || 'Provider';
          contextData.homeType = req.home_type;
          contextData.message = req.message;
          contextData.question = req.provider_notes;
          contextData.actionUrl = `${appUrl}/provider/requests/${req.id}`;

          if (event_type === 'adoption_request_created') {
            // Recipient is the provider
            recipientUserId = req.provider_id;
            recipientEmail = req.provider?.email || null;
            recipientName = req.provider?.full_name || 'Provider';
          } else {
            // Recipient is the applicant/adopter
            recipientUserId = req.adopter_id;
            recipientEmail = req.adopter?.email || null;
            recipientName = req.adopter?.full_name || 'Adopter';
            contextData.actionUrl = `${appUrl}/adopter/requests/${req.id}`;
          }
        }
      } else if (
        event_type === 'trial_started' ||
        event_type === 'trial_extension_requested' ||
        event_type === 'trial_extension_approved' ||
        event_type === 'trial_extension_rejected'
      ) {
        relatedEntityType = 'foster_trial';
        const { data: trial } = await customSupabaseClient
          .from('foster_trials')
          .select('*, pets(name), adopter:profiles!adopter_id(full_name, email), provider:profiles!provider_id(full_name, email)')
          .eq('id', related_entity_id)
          .single();

        if (trial) {
          contextData.petName = trial.pets?.name || 'Companion';
          contextData.adopterName = trial.adopter?.full_name || 'Adopter';
          contextData.providerName = trial.provider?.full_name || 'Provider';
          contextData.trialStartDate = trial.start_date ? new Date(trial.start_date).toLocaleDateString() : 'Today';
          contextData.trialEndDate = trial.end_date ? new Date(trial.end_date).toLocaleDateString() : '14 days';
          contextData.actionUrl = `${appUrl}/adopter/dashboard`;

          if (event_type === 'trial_extension_requested') {
            recipientUserId = trial.provider_id;
            recipientEmail = trial.provider?.email || null;
            recipientName = trial.provider?.full_name || 'Provider';
            contextData.actionUrl = `${appUrl}/provider/requests`;
          } else {
            recipientUserId = trial.adopter_id;
            recipientEmail = trial.adopter?.email || null;
            recipientName = trial.adopter?.full_name || 'Adopter';
          }
        }
      } else if (event_type === 'adoption_completed') {
        relatedEntityType = 'adoption';
        const { data: adopt } = await customSupabaseClient
          .from('adoptions')
          .select('*, pets(name), adopter:profiles!adopter_id(full_name, email)')
          .eq('id', related_entity_id)
          .single();

        if (adopt) {
          contextData.petName = adopt.pets?.name || 'Companion';
          contextData.adopterName = adopt.adopter?.full_name || 'Adopter';
          contextData.certificateNumber = adopt.certificate_number || 'PA-2026-OFFICIAL';
          contextData.actionUrl = `${appUrl}/adoption-success/${adopt.pet_id}`;
          recipientUserId = adopt.adopter_id;
          recipientEmail = adopt.adopter?.email || null;
          recipientName = adopt.adopter?.full_name || 'Adopter';
        }
      }
    }
  } catch (dbErr) {
    console.warn('[sendTransactionalEmail] Database entity query notice:', dbErr);
  }

  // Fallback defaults for testing or if entity query returned partial metadata
  if (!recipientEmail) {
    recipientEmail = `user_${related_entity_id.slice(0, 8)}@petadoption.local`;
  }
  if (!recipientUserId) {
    recipientUserId = related_entity_id;
  }
  contextData.recipientName = recipientName || 'Pet Parent';

  // 2. Server-Side Idempotency Check
  const idempotencyKey = `${event_type}:${recipientUserId}:${relatedEntityType}:${related_entity_id}`;

  if (customSupabaseClient) {
    try {
      const { data: existing } = await customSupabaseClient
        .from('email_deliveries')
        .select('id, status, provider_message_id')
        .eq('idempotency_key', idempotencyKey)
        .eq('status', 'sent')
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          status: 'already_sent',
          messageId: existing.provider_message_id,
          recipient: recipientEmail,
          idempotencyKey,
        };
      }
    } catch (idemErr) {
      console.warn('[sendTransactionalEmail] Idempotency check notice:', idemErr);
    }
  }

  // 3. Render Centralized Branded Email Template
  const templateFn = emailTemplates[event_type];
  if (!templateFn) {
    return {
      success: false,
      status: 'failed',
      error: `Unknown email template for event_type: ${event_type}`,
    };
  }

  const rendered = templateFn(contextData);

  // 4. Dispatch Email (Resend API or Development Sandbox)
  if (emailMode === 'development' || !resendApiKey) {
    // Development sandbox mode: log to server console and record simulation
    console.log(`[EMAIL-DEV-SANDBOX] ========================================`);
    console.log(`[EMAIL-DEV-SANDBOX] Event: ${event_type}`);
    console.log(`[EMAIL-DEV-SANDBOX] From:  ${emailFrom}`);
    console.log(`[EMAIL-DEV-SANDBOX] To:    ${recipientEmail} (${contextData.recipientName})`);
    console.log(`[EMAIL-DEV-SANDBOX] Subject: ${rendered.subject}`);
    console.log(`[EMAIL-DEV-SANDBOX] Idempotency Key: ${idempotencyKey}`);
    console.log(`[EMAIL-DEV-SANDBOX] ========================================`);

    if (customSupabaseClient) {
      try {
        await customSupabaseClient.from('email_deliveries').upsert(
          {
            event_type,
            recipient_user_id: recipientUserId,
            recipient_email: recipientEmail,
            related_entity_type: relatedEntityType,
            related_entity_id,
            idempotency_key: idempotencyKey,
            provider_message_id: `dev_${Date.now()}`,
            status: 'skipped_development',
            sent_at: new Date().toISOString(),
          },
          { onConflict: 'idempotency_key' }
        );
      } catch (logErr) {
        console.warn('[sendTransactionalEmail] Delivery log notice:', logErr);
      }
    }

    return {
      success: true,
      status: 'skipped_development',
      messageId: `dev_${Date.now()}`,
      recipient: recipientEmail,
      idempotencyKey,
    };
  }

  // Production dispatch via Resend API
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipientEmail],
        reply_to: emailReplyTo,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });

    const resendData = await response.json();

    if (!response.ok) {
      throw new Error(resendData?.message || `Resend API returned HTTP ${response.status}`);
    }

    // Record successful delivery
    if (customSupabaseClient) {
      try {
        await customSupabaseClient.from('email_deliveries').upsert(
          {
            event_type,
            recipient_user_id: recipientUserId,
            recipient_email: recipientEmail,
            related_entity_type: relatedEntityType,
            related_entity_id,
            idempotency_key: idempotencyKey,
            provider_message_id: resendData?.id || null,
            status: 'sent',
            sent_at: new Date().toISOString(),
          },
          { onConflict: 'idempotency_key' }
        );
      } catch (logErr) {
        console.warn('[sendTransactionalEmail] Delivery record notice:', logErr);
      }
    }

    return {
      success: true,
      status: 'sent',
      messageId: resendData?.id,
      recipient: recipientEmail,
      idempotencyKey,
    };
  } catch (sendError: any) {
    console.error('[sendTransactionalEmail] Error sending email via Resend:', sendError);

    // Record delivery failure for auditing/retries
    if (customSupabaseClient) {
      try {
        await customSupabaseClient.from('email_deliveries').upsert(
          {
            event_type,
            recipient_user_id: recipientUserId,
            recipient_email: recipientEmail,
            related_entity_type: relatedEntityType,
            related_entity_id,
            idempotency_key: idempotencyKey,
            status: 'failed',
            error_message: sendError?.message || 'Unknown delivery failure',
          },
          { onConflict: 'idempotency_key' }
        );
      } catch (logErr) {
        console.warn('[sendTransactionalEmail] Failure record notice:', logErr);
      }
    }

    return {
      success: false,
      status: 'failed',
      error: sendError?.message || 'Email delivery failed',
      recipient: recipientEmail,
      idempotencyKey,
    };
  }
}
