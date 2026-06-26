/** Normalize to E.164-style +digits for consistent storage keys. */
export function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Invalid phone number");
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function isValidPhoneNumber(phone: string): boolean {
  try {
    const normalized = normalizePhoneNumber(phone);
    const digits = normalized.slice(1);
    return digits.length >= 10 && digits.length <= 15;
  } catch {
    return false;
  }
}
