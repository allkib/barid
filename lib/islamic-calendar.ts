interface HijriDate {
  day: string;
  month: { number: number; en: string };
  year: string;
}

interface AladhanResponse {
  data?: {
    hijri?: HijriDate;
  };
}

const SIGNIFICANT_DAYS: Record<number, Record<number, string>> = {
  1: {
    1: "Islamic New Year (1 Muharram)",
    10: "Day of Ashura (10 Muharram)",
  },
  3: { 12: "Mawlid al-Nabi — birth of the Prophet (12 Rabi al-Awwal, observed by many)" },
  7: { 27: "Isra and Mi'raj (27 Rajab, observed by many)" },
  8: { 15: "Laylat al-Bara'ah (15 Sha'ban, observed by many)" },
  9: {
    1: "Start of Ramadan (1 Ramadan)",
    27: "Laylat al-Qadr — Night of Power (often observed 27 Ramadan)",
  },
  10: { 1: "Eid al-Fitr (1 Shawwal)" },
  12: {
    9: "Day of Arafah (9 Dhul Hijjah)",
    10: "Eid al-Adha (10 Dhul Hijjah)",
  },
};

function getUpcomingEvents(hijri: HijriDate, daysAhead = 14): string[] {
  const events: string[] = [];
  const month = hijri.month.number;
  const day = parseInt(hijri.day, 10);

  for (let offset = 0; offset <= daysAhead; offset++) {
    let m = month;
    let d = day + offset;
    // Approximate month lengths for event scanning
    const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    while (d > monthLengths[m - 1]) {
      d -= monthLengths[m - 1];
      m = m === 12 ? 1 : m + 1;
    }
    const label = SIGNIFICANT_DAYS[m]?.[d];
    if (label) {
      const when = offset === 0 ? "today" : offset === 1 ? "tomorrow" : `in ${offset} days`;
      events.push(`${label} (${when})`);
    }
  }

  return events;
}

export async function getIslamicCalendarContext(): Promise<string> {
  try {
    const now = new Date();
    const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;

    const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${dateStr}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return "Islamic calendar data unavailable today.";

    const json: AladhanResponse = await res.json();
    const hijri = json.data?.hijri;
    if (!hijri) return "Islamic calendar data unavailable today.";

    const hijriLabel = `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
    const upcoming = getUpcomingEvents(hijri);

    const lines = [
      `Today's Hijri date: ${hijriLabel}`,
      `Gregorian: ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`,
    ];

    if (upcoming.length > 0) {
      lines.push("Upcoming significant Islamic days:", upcoming.join("; "));
    } else {
      lines.push(
        "No major Islamic holidays in the next two weeks, but mention relevant weekly traditions (e.g. Friday Jumu'ah) and any observances tied to the current Hijri month."
      );
    }

    return lines.join("\n");
  } catch {
    return "Islamic calendar data unavailable today.";
  }
}
