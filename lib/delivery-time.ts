/** Fixed daily delivery — all users, 8 AM Texas (Central) time. */
export const DELIVERY_TIMEZONE = "America/Chicago";

export const DELIVERY_WINDOW_LABEL = "8 AM Texas time";

/** Cron runs at 13:00 UTC = 8:00 AM CDT (most of the year). */
export const DELIVERY_CRON_UTC = "0 13 * * *";

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

/** True at 8:00 AM Central (Texas) when the daily cron fires. */
export function isTexasMorningDeliveryWindow(now = new Date()): boolean {
  const { hour, minute } = getLocalTimeParts(now, DELIVERY_TIMEZONE);
  return hour === 8 && minute < 15;
}

export function isSameCalendarDayInTimezone(
  a: Date,
  b: Date,
  timezone: string
): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(a) === formatter.format(b);
}
