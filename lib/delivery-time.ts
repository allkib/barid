/** Local hour/minute in the given IANA timezone. */
export function getLocalTimeParts(
  date: Date,
  timezone: string
): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  return { hour, minute };
}

export function parseDeliveryTime(deliveryTime: string): {
  hour: number;
  minute: number;
} {
  const [hour, minute] = deliveryTime.split(":").map(Number);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(`Invalid delivery time: ${deliveryTime}`);
  }
  return { hour, minute };
}

/**
 * True when local time is on or after the user's chosen delivery time.
 * Used with Vercel Hobby cron (once per day at 14:30 UTC).
 */
export function isDeliveryTimeReached(
  deliveryTime: string,
  timezone: string,
  now = new Date()
): boolean {
  const target = parseDeliveryTime(deliveryTime);
  const current = getLocalTimeParts(now, timezone);
  const targetMins = target.hour * 60 + target.minute;
  const currentMins = current.hour * 60 + current.minute;
  return currentMins >= targetMins;
}
