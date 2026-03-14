import twilio from "twilio";

/**
 * Lazily create the Twilio client — only initialised when first accessed.
 * Avoids throwing at module-level during build when env vars are absent.
 */
let _twilioClient: ReturnType<typeof twilio> | null = null;

export function getTwilioClient(): ReturnType<typeof twilio> {
  if (_twilioClient) return _twilioClient;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables");
  }

  _twilioClient = twilio(sid, token);
  return _twilioClient;
}

export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER ?? "";

/**
 * Normalize a phone number to E.164 format for Twilio (+1XXXXXXXXXX).
 */
export function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/**
 * Format a phone number for display: (XXX) XXX-XXXX
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);

  if (last10.length !== 10) {
    return phone; // Return original if can't format
  }

  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}
