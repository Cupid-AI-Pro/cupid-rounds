/**
 * notificationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends email notifications via EmailJS (free, no backend needed).
 *
 * SETUP (one-time, takes 5 minutes):
 * 1. Go to https://www.emailjs.com → Sign Up (free)
 * 2. Add an Email Service: Connect your Gmail (cupidround@upi / any Gmail)
 *    → Service ID: note it down (e.g. "service_cupid")
 * 3. Create an Email Template → Use template variables:
 *       Subject: New Payment from {{user_name}} — {{plan}} Plan (₹{{amount}})
 *       Body:
 *         Name: {{user_name}}
 *         Email: {{user_email}}
 *         Phone: {{user_phone}}
 *         Plan: {{plan}} — ₹{{amount}}
 *         UTR Reference: {{utr_number}}
 *         State: {{user_state}}
 *         Time: {{timestamp}}
 *         → Verify & Approve at: https://cupid-rounds.vercel.app/?view=admin
 *    → Template ID: note it down (e.g. "template_payment")
 * 4. Go to Account → API Keys → copy your Public Key
 * 5. Paste all 3 values below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── PASTE YOUR EMAILJS CREDENTIALS HERE ──────────────────────────────────────
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || 'YOUR_PUBLIC_KEY';
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a payment notification email to the admin.
 * @param {Object} params
 */
export async function sendPaymentNotification({
  userName,
  userEmail,
  userPhone,
  plan,
  amount,
  utrNumber,
  userState,
}) {
  // If credentials not configured, log and skip gracefully
  if (
    EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' ||
    EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID' ||
    EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY'
  ) {
    console.warn('[notificationService] EmailJS not configured. Skipping email notification.');
    console.log('[notificationService] Payment data:', { userName, userEmail, userPhone, plan, amount, utrNumber });
    return { success: false, reason: 'not_configured' };
  }

  try {
    // Dynamically import EmailJS to keep bundle lean
    const emailjs = await import('@emailjs/browser');

    const templateParams = {
      user_name: userName || 'Unknown',
      user_email: userEmail || 'Not provided',
      user_phone: userPhone || 'Not provided',
      plan: plan?.toUpperCase() || 'UNKNOWN',
      amount: amount?.toString() || '0',
      utr_number: utrNumber || 'Not provided',
      user_state: userState || 'Unknown',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    const response = await emailjs.default.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('[notificationService] Email sent successfully:', response.status);
    return { success: true };
  } catch (err) {
    console.error('[notificationService] Email send failed:', err);
    return { success: false, error: err };
  }
}

/**
 * Also saves payment record to Supabase for admin dashboard tracking.
 * Returns the saved record or null on failure.
 */
export async function savePaymentRecord({
  userId,
  userName,
  userEmail,
  userPhone,
  plan,
  amount,
  utrNumber,
  userState,
}) {
  try {
    const { supabase } = await import('./supabaseClient');
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('payments')
      .upsert({
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        plan,
        amount,
        utr_number: utrNumber,
        user_state: userState,
        status: 'pending_verification',
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[notificationService] Supabase payment save failed (non-critical):', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[notificationService] Supabase not available (non-critical):', err.message);
    return null;
  }
}
