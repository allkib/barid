import { Redis } from "@upstash/redis";
import {
  DEFAULT_SETTINGS,
  type InterestId,
  type UserSettings,
} from "./types";

const SETTINGS_KEY = "barid:settings";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function settingsFromEnv(): UserSettings | null {
  const phone = process.env.PHONE_NUMBER;
  if (!phone) return null;

  const interests = (process.env.INTERESTS?.split(",") ?? ["news", "islamic"])
    .filter((i): i is InterestId => i === "news" || i === "islamic");

  return {
    phoneNumber: phone,
    interests: interests.length > 0 ? interests : ["news", "islamic"],
    deliveryTime: process.env.DELIVERY_TIME ?? "07:00",
    timezone: process.env.TIMEZONE ?? "America/New_York",
  };
}

export async function getSettings(): Promise<UserSettings> {
  const redis = getRedis();
  if (redis) {
    const stored = await redis.get<UserSettings>(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...stored };
  }

  const fromEnv = settingsFromEnv();
  if (fromEnv) return fromEnv;

  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const redis = getRedis();
  if (!redis) {
    throw new Error(
      "Storage not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or use PHONE_NUMBER env vars."
    );
  }

  const current = await getSettings();
  const merged: UserSettings = {
    ...current,
    ...settings,
    interests: settings.interests ?? current.interests,
  };

  await redis.set(SETTINGS_KEY, merged);
  return merged;
}

export async function markSent(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const current = await getSettings();
  await redis.set(SETTINGS_KEY, {
    ...current,
    lastSentAt: new Date().toISOString(),
  });
}

export function isStorageConfigured(): boolean {
  return getRedis() !== null || settingsFromEnv() !== null;
}
