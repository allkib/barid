import { NextResponse } from "next/server";
import { generateDailyMessage } from "@/lib/ai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendSms } from "@/lib/sms";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "test-sms");
  if (limited) return limited;

  try {
    const settings = await getSettings();

    if (!settings.phoneNumber) {
      return NextResponse.json(
        { error: "Save your phone number first" },
        { status: 400 }
      );
    }

    const message = await generateDailyMessage(settings.interests);
    const sid = await sendSms(settings.phoneNumber, message);

    return NextResponse.json({ success: true, message, sid });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Test failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
