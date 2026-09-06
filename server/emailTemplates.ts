/**
 * ==============================================================================
 * PET ADOPTION TRANSACTIONAL EMAIL TEMPLATES
 * Branded transactional email templates adhering to the Pet Adoption design system:
 * Warm beige, cream, dark brown, clean typography, and trustworthy tone.
 * ==============================================================================
 */

export interface EmailRenderResult {
  subject: string;
  html: string;
  text: string;
}

export interface EmailContextData {
  recipientName?: string;
  petName?: string;
  providerName?: string;
  adopterName?: string;
  homeType?: string;
  message?: string;
  question?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  requestedDays?: number;
  certificateNumber?: string;
  actionUrl?: string;
  appUrl?: string;
}

/**
 * Base email layout wrapper providing unified Pet Adoption branding.
 */
function renderBaseLayout(title: string, contentHtml: string, ctaHtml: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FAF7F2;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #2C1810;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FAF7F2;
      padding: 36px 12px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 20px;
      border: 1px solid #EBDBC9;
      box-shadow: 0 4px 20px rgba(44, 24, 16, 0.04);
      overflow: hidden;
    }
    .header {
      padding: 32px 36px 20px 36px;
      border-bottom: 1px solid #F5EBE1;
      text-align: left;
    }
    .brand-pill {
      display: inline-block;
      background-color: #F5EBE1;
      color: #78350F;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .brand-title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #2C1810;
      letter-spacing: -0.02em;
    }
    .body {
      padding: 32px 36px;
      font-size: 14px;
      line-height: 1.65;
      color: #44352D;
    }
    .card {
      background-color: #FAF7F2;
      border: 1px solid #EBDBC9;
      border-radius: 14px;
      padding: 20px;
      margin: 24px 0;
    }
    .card-row {
      margin-bottom: 10px;
      font-size: 13px;
    }
    .card-row:last-child {
      margin-bottom: 0;
    }
    .card-label {
      color: #8C7667;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 2px;
    }
    .card-value {
      color: #2C1810;
      font-weight: 700;
      font-size: 14px;
    }
    .btn-container {
      margin: 32px 0 16px 0;
      text-align: left;
    }
    .btn {
      display: inline-block;
      background-color: #92400E;
      color: #FFFFFF !important;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      text-align: center;
    }
    .footer {
      padding: 24px 36px 32px 36px;
      background-color: #FAF7F2;
      border-top: 1px solid #EBDBC9;
      font-size: 11px;
      color: #8C7667;
      line-height: 1.5;
    }
    .footer a {
      color: #92400E;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="brand-pill">Pet Adoption Platform</span>
        <h1 class="brand-title">${title}</h1>
      </div>
      <div class="body">
        ${contentHtml}
        ${ctaHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">This is a transactional update regarding your account on Pet Adoption.</p>
        <p style="margin: 0;">Manage your notifications in your <a href="${appUrl}/adopter/notifications">Account Settings</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export const emailTemplates = {
  /**
   * 1. Adoption Request Created (Sent to Provider)
   */
  adoption_request_created(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'your companion';
    const applicant = data.adopterName || 'An applicant';
    const link = data.actionUrl || `${data.appUrl}/provider/requests`;
    const subject = `New adoption application for ${pet}`;

    const html = renderBaseLayout(
      'New Adoption Application',
      `<p>Hello ${data.recipientName || 'Provider'},</p>
       <p>Great news! <strong>${applicant}</strong> has submitted an adoption application for <strong>${pet}</strong>.</p>
       <div class="card">
         <div class="card-row">
           <span class="card-label">Companion</span>
           <span class="card-value">${pet}</span>
         </div>
         <div class="card-row">
           <span class="card-label">Applicant</span>
           <span class="card-value">${applicant}</span>
         </div>
         ${data.homeType ? `
         <div class="card-row">
           <span class="card-label">Home Setting</span>
           <span class="card-value">${data.homeType}</span>
         </div>` : ''}
         ${data.message ? `
         <div class="card-row">
           <span class="card-label">Applicant Note</span>
           <span class="card-value" style="font-weight: 500; font-style: italic;">"${data.message}"</span>
         </div>` : ''}
       </div>
       <p>Please review their lifestyle fit and home environment to decide on the next steps.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">Review Adoption Application</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `New adoption application for ${pet}\n\nHello ${data.recipientName || 'Provider'},\n\n${applicant} has submitted an adoption application for ${pet}.\n\nReview the application: ${link}`;

    return { subject, html, text };
  },

  /**
   * 2. Adoption Request Approved (Sent to Adopter)
   */
  adoption_request_approved(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'the companion';
    const provider = data.providerName || 'The provider';
    const link = data.actionUrl || `${data.appUrl}/adopter/dashboard`;
    const subject = `Adoption Application Approved for ${pet} ❤️`;

    const html = renderBaseLayout(
      'Application Approved!',
      `<p>Hello ${data.recipientName || 'Adopter'},</p>
       <p>Wonderful news! <strong>${provider}</strong> has reviewed and approved your adoption application for <strong>${pet}</strong>.</p>
       <div class="card">
         <div class="card-row">
           <span class="card-label">Companion</span>
           <span class="card-value">${pet}</span>
         </div>
         <div class="card-row">
           <span class="card-label">Next Step</span>
           <span class="card-value">14-Day Foster-to-Own Bonding Trial</span>
         </div>
       </div>
       <p><strong>What is Foster-to-Own?</strong></p>
       <p>PET ADOPTION uses a trial-before-forever model. Your companion will join your home for a 14-day bonding period to ensure an ideal fit for both your household and the pet before finalizing official adoption papers.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">View Trial Dashboard</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Adoption Application Approved for ${pet} ❤️\n\nHello ${data.recipientName || 'Adopter'},\n\n${provider} has approved your application for ${pet}. The next step is your 14-day Foster-to-Own bonding trial.\n\nView details: ${link}`;

    return { subject, html, text };
  },

  /**
   * 3. Adoption Request Rejected (Sent to Adopter)
   */
  adoption_request_rejected(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'the companion';
    const link = `${data.appUrl}/pets`;
    const subject = `Update regarding your adoption application for ${pet}`;

    const html = renderBaseLayout(
      'Application Status Update',
      `<p>Hello ${data.recipientName || 'Adopter'},</p>
       <p>Thank you for taking the time to apply for <strong>${pet}</strong>.</p>
       <p>After reviewing all incoming applications and considering the specific lifestyle and behavioral needs of ${pet}, the provider has chosen to move forward with another placement at this time.</p>
       <p>We know how much heart goes into choosing a rescue companion. There are many loving pets on the platform still looking for their forever homes.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">Discover Other Companions</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Update regarding your adoption application for ${pet}\n\nHello ${data.recipientName || 'Adopter'},\n\nThe provider has decided to move forward with another placement for ${pet}. We encourage you to explore other wonderful companions waiting for a home: ${link}`;

    return { subject, html, text };
  },

  /**
   * 4. More Information Requested (Sent to Adopter)
   */
  more_information_requested(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'the companion';
    const link = data.actionUrl || `${data.appUrl}/adopter/requests`;
    const subject = `More information requested for ${pet}`;

    const html = renderBaseLayout(
      'More Information Needed',
      `<p>Hello ${data.recipientName || 'Adopter'},</p>
       <p>The provider reviewing your application for <strong>${pet}</strong> has requested some additional information to help with their assessment.</p>
       ${data.question ? `
       <div class="card">
         <span class="card-label">Provider Inquiry</span>
         <span class="card-value" style="font-weight: 500; font-style: italic;">"${data.question}"</span>
       </div>` : ''}
       <p>Please log in to your application details to reply and keep your request active.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">Reply to Provider</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `More information requested for ${pet}\n\nHello ${data.recipientName || 'Adopter'},\n\nThe provider reviewing your application for ${pet} has requested additional details.\n\nReply here: ${link}`;

    return { subject, html, text };
  },

  /**
   * 5. Foster Trial Started (Sent to Adopter)
   */
  trial_started(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'your companion';
    const link = data.actionUrl || `${data.appUrl}/adopter/dashboard`;
    const subject = `Your Foster-to-Own trial with ${pet} has begun! 🐾`;

    const html = renderBaseLayout(
      'Trial Period Active',
      `<p>Hello ${data.recipientName || 'Adopter'},</p>
       <p>Your official Foster-to-Own bonding trial with <strong>${pet}</strong> is now live!</p>
       <div class="card">
         <div class="card-row">
           <span class="card-label">Companion</span>
           <span class="card-value">${pet}</span>
         </div>
         ${data.trialStartDate ? `
         <div class="card-row">
           <span class="card-label">Trial Start</span>
           <span class="card-value">${data.trialStartDate}</span>
         </div>` : ''}
         ${data.trialEndDate ? `
         <div class="card-row">
           <span class="card-label">Trial Scheduled End</span>
           <span class="card-value">${data.trialEndDate}</span>
         </div>` : ''}
       </div>
       <p>During this period, focus on building daily routines, recording check-in notes, and letting ${pet} settle comfortably into your environment.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">Open Foster Dashboard</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Your Foster-to-Own trial with ${pet} has begun!\n\nTrial start: ${data.trialStartDate || 'Today'}\nTrial end: ${data.trialEndDate || '14 days'}\n\nAccess dashboard: ${link}`;

    return { subject, html, text };
  },

  /**
   * 6. Trial Extension Requested (Sent to Provider)
   */
  trial_extension_requested(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'the companion';
    const applicant = data.adopterName || 'The adopter';
    const days = data.requestedDays || 7;
    const link = data.actionUrl || `${data.appUrl}/provider/requests`;
    const subject = `Trial extension requested for ${pet}`;

    const html = renderBaseLayout(
      'Trial Extension Request',
      `<p>Hello ${data.recipientName || 'Provider'},</p>
       <p><strong>${applicant}</strong> has requested a <strong>+${days} day extension</strong> on their Foster-to-Own trial for <strong>${pet}</strong>.</p>
       <div class="card">
         <div class="card-row">
           <span class="card-label">Companion</span>
           <span class="card-value">${pet}</span>
         </div>
         <div class="card-row">
           <span class="card-label">Requested Additional Time</span>
           <span class="card-value">+${days} Days</span>
         </div>
         ${data.message ? `
         <div class="card-row">
           <span class="card-label">Adopter's Reason</span>
           <span class="card-value" style="font-weight: 500; font-style: italic;">"${data.message}"</span>
         </div>` : ''}
       </div>
       <p>Please review and approve or decline this extension in your provider dashboard.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">Review Extension Request</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Trial extension requested for ${pet}\n\n${applicant} requested a +${days} day extension for ${pet}.\n\nReview request: ${link}`;

    return { subject, html, text };
  },

  /**
   * 7. Trial Extension Approved (Sent to Adopter)
   */
  trial_extension_approved(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'your companion';
    const link = data.actionUrl || `${data.appUrl}/adopter/dashboard`;
    const subject = `Trial extension approved for ${pet} 🎉`;

    const html = renderBaseLayout(
      'Trial Extended!',
      `<p>Hello ${data.recipientName || 'Adopter'},</p>
       <p>Great news! The provider has approved your trial extension request for <strong>${pet}</strong>.</p>
       <div class="card">
         <div class="card-row">
           <span class="card-label">Companion</span>
           <span class="card-value">${pet}</span>
         </div>
         ${data.trialEndDate ? `
         <div class="card-row">
           <span class="card-label">New Trial End Date</span>
           <span class="card-value">${data.trialEndDate}</span>
         </div>` : ''}
       </div>
       <p>Take this extra time to continue gradual bonding and positive integration.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">View Trial Dashboard</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Trial extension approved for ${pet} 🎉\n\nYour new trial end date is ${data.trialEndDate || 'extended'}.\n\nView details: ${link}`;

    return { subject, html, text };
  },

  /**
   * 8. Trial Extension Rejected (Sent to Adopter)
   */
  trial_extension_rejected(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'your companion';
    const link = data.actionUrl || `${data.appUrl}/adopter/dashboard`;
    const subject = `Update on trial extension for ${pet}`;

    const html = renderBaseLayout(
      'Trial Extension Update',
      `<p>Hello ${data.recipientName || 'Adopter'},</p>
       <p>The provider was unable to grant the additional trial extension for <strong>${pet}</strong> at this time.</p>
       <p>Your current trial end date remains unchanged. Please prepare for the final adoption decision as your trial concludes.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">View Trial Status</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Update on trial extension for ${pet}\n\nYour trial extension was not approved. The current trial end date remains in effect.\n\nView status: ${link}`;

    return { subject, html, text };
  },

  /**
   * 9. Adoption Completed ("Make It Official ❤️") (Sent to Adopter & Provider)
   */
  adoption_completed(data: EmailContextData): EmailRenderResult {
    const pet = data.petName || 'your companion';
    const cert = data.certificateNumber || 'PA-2026-OFFICIAL';
    const link = data.actionUrl || `${data.appUrl}/adopter/adoptions`;
    const subject = `Congratulations! Your adoption of ${pet} is official ❤️`;

    const html = renderBaseLayout(
      'Forever Home Found ❤️',
      `<p>Hello ${data.recipientName || 'Adopter'},</p>
       <p>Congratulations! You have completed the Foster-to-Own journey and officially adopted <strong>${pet}</strong>!</p>
       <div class="card">
         <div class="card-row">
           <span class="card-label">Official Companion</span>
           <span class="card-value">${pet}</span>
         </div>
         <div class="card-row">
           <span class="card-label">Certificate Registration</span>
           <span class="card-value" style="font-family: monospace; color: #92400E;">${cert}</span>
         </div>
       </div>
       <p>Thank you for choosing rescue and opening your home to give ${pet} a loving forever family.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">View Official Certificate</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Congratulations! Your adoption of ${pet} is official ❤️\n\nRegistration: ${cert}\n\nView your certificate: ${link}`;

    return { subject, html, text };
  },

  /**
   * 10. Provider Verified (Sent to Provider)
   */
  provider_verified(data: EmailContextData): EmailRenderResult {
    const link = `${data.appUrl}/provider/dashboard`;
    const subject = `Your Pet Adoption provider profile is officially verified! 🛡️`;

    const html = renderBaseLayout(
      'Provider Profile Verified',
      `<p>Hello ${data.recipientName || 'Provider'},</p>
       <p>Congratulations! Your rescue organization and provider credentials have been reviewed and verified by our safety moderation team.</p>
       <p>Your listings will now display the verified provider badge, offering adopters added confidence in your care standards.</p>`,
      `<div class="btn-container"><a href="${link}" class="btn">Go to Provider Dashboard</a></div>`,
      data.appUrl || 'http://localhost:5173'
    );

    const text = `Your Pet Adoption provider profile is officially verified! 🛡️\n\nYour profile has passed all safety checks.\n\nDashboard: ${link}`;

    return { subject, html, text };
  },
};
