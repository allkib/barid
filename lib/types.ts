export const INTEREST_OPTIONS = [
  {
    id: "news",
    label: "Middle East News",
    description:
      "Latest updates from reliable sources on what is happening across the Middle East.",
  },
  {
    id: "islamic",
    label: "Islamic Calendar & Traditions",
    description:
      "Hijri calendar, significant Islamic days, events, and traditions to be aware of.",
  },
] as const;

export type InterestId = (typeof INTEREST_OPTIONS)[number]["id"];

export interface UserSettings {
  phoneNumber: string;
  interests: InterestId[];
  deliveryTime: string;
  timezone: string;
  lastSentAt?: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  phoneNumber: "",
  interests: ["news", "islamic"],
  deliveryTime: "08:00",
  timezone: "America/Chicago",
};

/** GSM-7 single SMS segment limit */
export const SMS_MAX_CHARS = 160;
