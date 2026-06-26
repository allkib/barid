import twilio from "twilio";
import { normalizePhoneNumber } from "./phone";

function formatTwilioError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    if (message.includes("cannot be the same")) {
      return (
        "Your Twilio sender number cannot be the same as your personal phone. " +
        "In Twilio Console, buy a separate number for TWILIO_PHONE_NUMBER, then use your cell here to receive texts."
      );
    }
    return message;
  }
  return "SMS send failed";
}

export async function sendSms(to: string, body: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER."
    );
  }

  const toNormalized = normalizePhoneNumber(to);
  const fromNormalized = normalizePhoneNumber(from);

  if (toNormalized === fromNormalized) {
    throw new Error(
      "Your Twilio sender number cannot be the same as your personal phone. " +
        "TWILIO_PHONE_NUMBER must be a separate number from your Twilio account."
    );
  }

  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body,
      from,
      to: toNormalized,
    });

    return message.sid;
  } catch (error) {
    throw new Error(formatTwilioError(error));
  }
}
