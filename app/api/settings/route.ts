import { NextResponse } from "next/server";
import { DELIVERY_TIMEZONE } from "@/lib/delivery-time";
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSettings, saveSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS, type InterestId } from "@/lib/types";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "settings-read");
  if (limited) return limited;

  const phone = new URL(request.url).searchParams.get("phone")?.trim();
  if (!phone) {
    return NextResponse.json({ ...DEFAULT_SETTINGS });
  }

  if (!isValidPhoneNumber(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const settings = await getSettings(phone);
  if (!settings) {
    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      phoneNumber: normalizePhoneNumber(phone),
    });
  }

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "settings-write");
  if (limited) return limited;

  try {
    const body = await request.json();

    if (!body.phoneNumber || !isValidPhoneNumber(body.phoneNumber)) {
      return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });
    }

    const interests = (body.interests as string[] | undefined)?.filter(
      (i): i is InterestId => i === "news" || i === "islamic"
    );

    if (!interests?.length) {
      return NextResponse.json({ error: "Choose at least one topic" }, { status: 400 });
    }

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
