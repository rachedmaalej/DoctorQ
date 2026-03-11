import posthog from 'posthog-js';

export const EVENTS = {
  ONBOARDING_STARTED: 'onboarding_started',
  SPECIALTY_SELECTED: 'specialty_selected',
  SIGNUP_SUBMITTED: 'signup_submitted',
  SIGNUP_FAILED: 'signup_failed',
  QR_VIEWED: 'qr_viewed',
  QR_SHARED_WHATSAPP: 'qr_shared_whatsapp',
  QR_DOWNLOADED_PDF: 'qr_downloaded_pdf',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  CHECKLIST_ITEM_DONE: 'checklist_item_done',
  CHECKLIST_COMPLETED: 'checklist_completed',
} as const;

function isPostHogReady(): boolean {
  try {
    return typeof posthog?.capture === 'function';
  } catch {
    return false;
  }
}

export function trackOnboarding(
  event: (typeof EVENTS)[keyof typeof EVENTS],
  properties?: Record<string, unknown>,
) {
  if (isPostHogReady()) {
    posthog.capture(event, properties);
  }
}
