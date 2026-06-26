import { NextResponse } from "next/server";
import { DELIVERY_TIMEZONE } from "@/lib/delivery-time";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSettings, saveSettings } from "@/lib/settings";
import type { InterestId } from "@/lib/types";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "settings-read");
  if (limited) return limited;

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "settings-write");
  if (limited) return limited;

  try {
    const body = await request.json();
    const interests = (body.interests as string[] | undefined)?.filter(
      (i): i is InterestId => i === "news" || i === "islamic"
    );

    const settings = await saveSettings({
      phoneNumber: body.phoneNumber,
      interests,
      deliveryTime: "08:00",
      timezone: DELIVERY_TIMEZONE,
    });

    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
