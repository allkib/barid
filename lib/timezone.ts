const FALLBACK_TIMEZONE = "America/New_York";

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
];

export function buildTimezoneOptions(browserTz: string): string[] {
  if (COMMON_TIMEZONES.includes(browserTz)) {
    return COMMON_TIMEZONES;
  }
  return [browserTz, ...COMMON_TIMEZONES];
}

export function resolveTimezone(saved: UserSettingsLike): string {
  if (saved.phoneNumber) {
    return saved.timezone;
  }
  return getBrowserTimezone();
}

interface UserSettingsLike {
  phoneNumber: string;
  timezone: string;
}
