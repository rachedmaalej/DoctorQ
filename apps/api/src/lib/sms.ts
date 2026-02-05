/**
 * SMS Service
 * Handles SMS sending via Twilio for patient notifications
 * Graceful no-op if TWILIO_* env vars are not set
 */

// ─── Configuration ───────────────────────────────────────────

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const isConfigured = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);

// ─── Types ───────────────────────────────────────────────────

export type SmsTemplate = 'QUEUE_JOINED' | 'ALMOST_TURN' | 'YOUR_TURN';

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SmsTemplateData {
  clinicName: string;
  position?: number;
  waitTime?: number;
  remaining?: number;
  statusLink?: string;
}

// ─── Templates ───────────────────────────────────────────────

const templates: Record<SmsTemplate, Record<'fr' | 'ar', (data: SmsTemplateData) => string>> = {
  QUEUE_JOINED: {
    fr: (d) => `${d.clinicName} - Vous êtes #${d.position} dans la file. Attente: ~${d.waitTime}min. Statut: ${d.statusLink}`,
    ar: (d) => `${d.clinicName} - أنت رقم ${d.position} في الطابور. الانتظار: ~${d.waitTime} دقيقة. الحالة: ${d.statusLink}`,
  },
  ALMOST_TURN: {
    fr: (d) => `${d.clinicName} - Plus que ${d.remaining} patient(s) avant vous! Merci de vous rapprocher.`,
    ar: (d) => `${d.clinicName} - باقي ${d.remaining} مريض قبلك! يرجى الاقتراب من العيادة.`,
  },
  YOUR_TURN: {
    fr: (d) => `${d.clinicName} - C'EST VOTRE TOUR! Présentez-vous à l'accueil.`,
    ar: (d) => `${d.clinicName} - جاء دورك! تفضل للاستقبال.`,
  },
};

// ─── SMS Sending ─────────────────────────────────────────────

export function isSmsConfigured(): boolean {
  return isConfigured;
}

export function buildSmsBody(
  template: SmsTemplate,
  data: SmsTemplateData,
  language: 'fr' | 'ar' = 'fr'
): string {
  return templates[template][language](data);
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!isConfigured) {
    console.log(`[SMS] Not configured. Would send to ${to}: ${body}`);
    return { success: true, messageId: 'dev-mode-skipped' };
  }

  try {
    const authString = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER!,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json() as { message?: string };
      console.error('[SMS] Failed to send:', error);
      return { success: false, error: error.message || 'Send failed' };
    }

    const result = await response.json() as { sid?: string };
    console.log(`[SMS] Sent to ${to}: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error('[SMS] Error:', error);
    return { success: false, error: (error as Error).message };
  }
}
