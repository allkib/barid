import { NextResponse } from "next/server";
import { generateDailyMessage } from "@/lib/ai";
import { isValidPhoneNumber } from "@/lib/phone";
import { getSettings, listSubscribers, markSent } from "@/lib/settings";
import { sendSms } from "@/lib/sms";

function verifySecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const phoneParam = url.searchParams.get("phone")?.trim();
    const targets = phoneParam
      ? [await getSettings(phoneParam)].filter(Boolean)
      : await listSubscribers();

    if (!targets.length) {
      return NextResponse.json({ error: "No subscribers found" }, { status: 400 });
    }

    const results = [];

    for (const settings of targets) {
      if (!settings?.phoneNumber || !isValidPhoneNumber(settings.phoneNumber)) {
        continue;
      }

      if (settings.interests.length === 0) {
        results.push({ phoneNumber: settings.phoneNumber, error: "No interests" });
        continue;
      }

      const message = await generateDailyMessage(settings.interests);
      const sid = await sendSms(settings.phoneNumber, message);
      await markSent(settings.phoneNumber);
      results.push({ phoneNumber: settings.phoneNumber, success: true, message, sid });
    }

    if (!results.length) {
      return NextResponse.json({ error: "No messages sent" }, { status: 400 });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
