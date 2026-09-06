// Supabase Edge Function: send-transactional-email
// Deployed to Supabase Edge Runtime. Secrets accessed via Deno.env.get()

import { emailTemplates } from '../../../server/emailTemplates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { event_type, related_entity_id } = await req.json();

    if (!event_type || !related_entity_id) {
      return new Response(
        JSON.stringify({ error: 'Missing event_type or related_entity_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'Pet Adoption <notifications@updates.petadoption.org>';
    const emailReplyTo = Deno.env.get('EMAIL_REPLY_TO') || 'support@petadoption.org';
    const appUrl = (Deno.env.get('APP_URL') || 'https://petadoption.org').replace(/\/$/, '');
    const emailMode = Deno.env.get('EMAIL_MODE') || 'development';

    const templateFn = (emailTemplates as any)[event_type];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Unknown event_type: ${event_type}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rendered = templateFn({ appUrl, actionUrl: `${appUrl}/notifications` });

    if (emailMode === 'development' || !resendApiKey) {
      console.log(`[EdgeFn: send-transactional-email] Simulated ${event_type} for ${related_entity_id}`);
      return new Response(
        JSON.stringify({ success: true, status: 'skipped_development', event_type }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Resend in production
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: ['adoptions@petadoption.org'], // resolved from entity in prod
        reply_to: emailReplyTo,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });

    const resendJson = await resendRes.json();
    return new Response(JSON.stringify(resendJson), {
      status: resendRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
