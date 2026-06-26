import { Redis } from "@upstash/redis";
import { DELIVERY_TIMEZONE } from "./delivery-time";
import { normalizePhoneNumber } from "./phone";
import {
  DEFAULT_SETTINGS,
  type InterestId,
  type UserSettings,
} from "./types";

const LEGACY_SETTINGS_KEY = "barid:settings";
const SUBSCRIBERS_SET = "barid:subscribers";

function subscriberKey(phoneNumber: string): string {
  return `barid:subscriber:${phoneNumber}`;
}

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
    phoneNumber: normalizePhoneNumber(phone),
    interests: interests.length > 0 ? interests : ["news", "islamic"],
    deliveryTime: process.env.DELIVERY_TIME ?? "08:00",
    timezone: process.env.TIMEZONE ?? DELIVERY_TIMEZONE,
  };
}

async function migrateLegacySettings(redis: Redis): Promise<void> {
  const legacy = await redis.get<UserSettings>(LEGACY_SETTINGS_KEY);
  if (!legacy?.phoneNumber) return;

  const phoneNumber = normalizePhoneNumber(legacy.phoneNumber);
  const migrated: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...legacy,
    phoneNumber,
    timezone: DELIVERY_TIMEZONE,
    deliveryTime: "08:00",
  };

  await redis.set(subscriberKey(phoneNumber), migrated);
  await redis.sadd(SUBSCRIBERS_SET, phoneNumber);
  await redis.del(LEGACY_SETTINGS_KEY);
}

export async function getSettings(phoneNumber: string): Promise<UserSettings | null> {
  const redis = getRedis();
  if (!redis) {
    const fromEnv = settingsFromEnv();
    if (!fromEnv) return null;
    if (normalizePhoneNumber(phoneNumber) === fromEnv.phoneNumber) {
      return fromEnv;
    }
    return null;
  }

  await migrateLegacySettings(redis);

  const normalized = normalizePhoneNumber(phoneNumber);
  const stored = await redis.get<UserSettings>(subscriberKey(normalized));
  if (!stored) return null;

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    phoneNumber: normalized,
  };
}

export async function saveSettings(
  settings: Partial<UserSettings> & { phoneNumber: string }
): Promise<UserSettings> {
  const redis = getRedis();
  if (!redis) {
    throw new Error(
      "Storage not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    );
  }

  await migrateLegacySettings(redis);

  const phoneNumber = normalizePhoneNumber(settings.phoneNumber);
  const current = (await getSettings(phoneNumber)) ?? {
    ...DEFAULT_SETTINGS,
    phoneNumber,
  };

  const merged: UserSettings = {
    ...current,
    ...settings,
    phoneNumber,
    interests: settings.interests ?? current.interests,
    deliveryTime: "08:00",
    timezone: DELIVERY_TIMEZONE,
  };

  await redis.set(subscriberKey(phoneNumber), merged);
  await redis.sadd(SUBSCRIBERS_SET, phoneNumber);
  return merged;
}

export async function listSubscribers(): Promise<UserSettings[]> {
  const redis = getRedis();
  if (!redis) {
    const fromEnv = settingsFromEnv();
    return fromEnv ? [fromEnv] : [];
  }

  await migrateLegacySettings(redis);

  const phones = (await redis.smembers(SUBSCRIBERS_SET)) as string[];
  if (!phones.length) return [];

  const subscribers: UserSettings[] = [];
  for (const phone of phones) {
    const settings = await getSettings(phone);
    if (settings?.phoneNumber) {
      subscribers.push(settings);
    }
  }

  return subscribers;
}

export async function markSent(phoneNumber: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const normalized = normalizePhoneNumber(phoneNumber);
  const current = await getSettings(normalized);
  if (!current) return;

  await redis.set(subscriberKey(normalized), {
    ...current,
    lastSentAt: new Date().toISOString(),
  });
}

export function isStorageConfigured(): boolean {
  return getRedis() !== null || settingsFromEnv() !== null;
}
