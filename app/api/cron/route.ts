import { NextResponse } from "next/server";
import { generateDailyMessage } from "@/lib/ai";
import {
  DELIVERY_TIMEZONE,
  isSameCalendarDayInTimezone,
  isTexasMorningDeliveryWindow,
} from "@/lib/delivery-time";
import { isValidPhoneNumber } from "@/lib/phone";
import { listSubscribers, markSent } from "@/lib/settings";
import { sendSms } from "@/lib/sms";

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

function alreadySentToday(lastSentAt: string | undefined): boolean {
  if (!lastSentAt) return false;
  return isSameCalendarDayInTimezone(
    new Date(),
    new Date(lastSentAt),
    DELIVERY_TIMEZONE
  );
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!isTexasMorningDeliveryWindow()) {
      return NextResponse.json({ skipped: true, reason: "Outside delivery window" });
    }

    const subscribers = await listSubscribers();
    if (!subscribers.length) {
      return NextResponse.json({ skipped: true, reason: "No subscribers" });
    }

    const results: Array<{
      phoneNumber: string;
      success?: boolean;
      sid?: string;
      skipped?: string;
      error?: string;
    }> = [];

    for (const settings of subscribers) {
      if (!settings.phoneNumber || !isValidPhoneNumber(settings.phoneNumber)) {
        results.push({ phoneNumber: settings.phoneNumber, skipped: "Invalid phone" });
        continue;
      }

      if (alreadySentToday(settings.lastSentAt)) {
        results.push({ phoneNumber: settings.phoneNumber, skipped: "Already sent today" });
        continue;
      }

      if (!settings.interests.length) {
        results.push({ phoneNumber: settings.phoneNumber, skipped: "No interests" });
        continue;
      }

      try {
        const message = await generateDailyMessage(settings.interests);
        const sid = await sendSms(settings.phoneNumber, message);
        await markSent(settings.phoneNumber);
        results.push({ phoneNumber: settings.phoneNumber, success: true, sid });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Send failed";
        results.push({ phoneNumber: settings.phoneNumber, error: msg });
      }
    }

    const sent = results.filter((r) => r.success).length;
    return NextResponse.json({ sent, total: subscribers.length, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
