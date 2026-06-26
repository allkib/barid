import { NextResponse } from "next/server";
import { generateDailyMessage } from "@/lib/ai";
import { isDeliveryDue } from "@/lib/delivery-time";
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

function alreadySentToday(lastSentAt: string | undefined, timezone: string): boolean {
  if (!lastSentAt) return false;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const today = formatter.format(new Date());
  const lastDay = formatter.format(new Date(lastSentAt));
  return today === lastDay;
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

    if (!isDeliveryDue(settings.deliveryTime, settings.timezone)) {
      return NextResponse.json({ skipped: true, reason: "Not delivery time" });
    }

    if (alreadySentToday(settings.lastSentAt, settings.timezone)) {
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
