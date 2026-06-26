import { NextResponse } from "next/server";
import { generateDailyMessage } from "@/lib/ai";
import { getSettings, markSent } from "@/lib/settings";
import { sendSms } from "@/lib/sms";

function verifySecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

export async function POST(request: Request) {
  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getSettings();

    if (!settings.phoneNumber) {
      return NextResponse.json(
        { error: "No phone number configured" },
        { status: 400 }
      );
    }

    if (settings.interests.length === 0) {
      return NextResponse.json(
        { error: "No interests configured" },
        { status: 400 }
      );
    }

    const message = await generateDailyMessage(settings.interests);
    const sid = await sendSms(settings.phoneNumber, message);
    await markSent();

    return NextResponse.json({ success: true, message, sid });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
