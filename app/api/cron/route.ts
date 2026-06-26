import { NextResponse } from "next/server";
import { generateDailyMessage } from "@/lib/ai";
import {
  DELIVERY_TIMEZONE,
  isSameCalendarDayInTimezone,
  isTexasMorningDeliveryWindow,
} from "@/lib/delivery-time";
import { getSettings, markSent } from "@/lib/settings";
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
    const settings = await getSettings();

    if (!settings.phoneNumber) {
      return NextResponse.json({ skipped: true, reason: "No phone number" });
    }

    if (!isTexasMorningDeliveryWindow()) {
      return NextResponse.json({ skipped: true, reason: "Outside delivery window" });
    }

    if (alreadySentToday(settings.lastSentAt)) {
      return NextResponse.json({ skipped: true, reason: "Already sent today" });
    }

    const message = await generateDailyMessage(settings.interests);
    const sid = await sendSms(settings.phoneNumber, message);
    await markSent();

    return NextResponse.json({ success: true, sid });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
