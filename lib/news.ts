interface FeedConfig {
  name: string;
  url: string;
  category: "news" | "islamic";
}

const FEEDS: FeedConfig[] = [
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "news",
  },
  {
    name: "BBC Middle East",
    url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    category: "news",
  },
  {
    name: "Middle East Eye",
    url: "https://www.middleeasteye.net/rss",
    category: "news",
  },
  {
    name: "Reuters World",
    url: "https://feeds.reuters.com/Reuters/worldNews",
    category: "news",
  },
  {
    name: "Islamicity",
    url: "https://www.islamicity.org/rss/",
    category: "islamic",
  },
];

export interface Headline {
  title: string;
  source: string;
  category: "news" | "islamic";
}

function parseRssItems(
  xml: string,
  source: string,
  category: "news" | "islamic",
  limit = 5
): Headline[] {
  const headlines: Headline[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && headlines.length < limit) {
    const item = match[1];
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1]
        .trim()
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      if (title) {
        headlines.push({ title, source, category });
      }
    }
  }

  return headlines;
}

async function fetchFeed(feed: FeedConfig, perFeed = 5): Promise<Headline[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "BaridDailySMS/1.0" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssItems(xml, feed.name, feed.category, perFeed);
  } catch {
    return [];
  }
}

export async function fetchHeadlines(
  interests: ("news" | "islamic")[],
  maxTotal = 12
): Promise<Headline[]> {
  const relevantFeeds = FEEDS.filter((f) => interests.includes(f.category));
  const perFeed = Math.max(3, Math.ceil(maxTotal / relevantFeeds.length));
  const results = await Promise.all(relevantFeeds.map((f) => fetchFeed(f, perFeed)));
  return results.flat().slice(0, maxTotal);
}

export function formatHeadlinesForPrompt(headlines: Headline[]): string {
  if (headlines.length === 0) {
    return "No headlines available today.";
  }

  return headlines
    .map((h) => `[${h.category.toUpperCase()} | ${h.source}] ${h.title}`)
    .join("\n");
}
