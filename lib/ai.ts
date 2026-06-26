import OpenAI from "openai";
import type { InterestId } from "./types";
import { getIslamicCalendarContext } from "./islamic-calendar";
import { formatHeadlinesForPrompt, fetchHeadlines } from "./news";

const DUKE_BASE_URL = "https://litellm.oit.duke.edu/v1";
const DEFAULT_MODEL = "gpt-5-mini";

/** GSM-7 single SMS segment — keeps Twilio cost to 1 message per day */
const SMS_MAX_CHARS = 160;

const SMS_CONFIG = {
  maxTokens: 120,
  headlineCap: 3,
};

function getClient(): OpenAI {
  const apiKey = process.env.DUKE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("DUKE_AI_API_KEY is not set");
  }
  return new OpenAI({ apiKey, baseURL: DUKE_BASE_URL });
}

function enforceSingleSms(text: string): string {
  if (text.length <= SMS_MAX_CHARS) return text;
  const cut = text.slice(0, SMS_MAX_CHARS - 1).trimEnd();
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > SMS_MAX_CHARS * 0.6) {
    return cut.slice(0, lastSpace) + "…";
  }
  return cut + "…";
}

export async function generateDailyMessage(
  interests: InterestId[]
): Promise<string> {
  const headlines = await fetchHeadlines(interests, SMS_CONFIG.headlineCap);
  const headlineText = formatHeadlinesForPrompt(headlines);

  const islamicContext = interests.includes("islamic")
    ? await getIslamicCalendarContext()
    : "";

  const topicInstructions: string[] = [];
  if (interests.includes("news")) {
    topicInstructions.push(
      "NEWS: One Middle East headline from the sources below — name the source (e.g. Al Jazeera). No invented stories."
    );
  }
  if (interests.includes("islamic")) {
    topicInstructions.push(
      "ISLAMIC: Hijri date plus one upcoming day or tradition from the calendar data. No invented dates."
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const client = getClient();
  const model = process.env.DUKE_AI_MODEL ?? DEFAULT_MODEL;

  const userParts = [`Today is ${today}. Write ONE daily SMS.`];

  if (topicInstructions.length > 0) {
    userParts.push("Include:\n" + topicInstructions.join("\n"));
  }

  if (interests.includes("news")) {
    userParts.push(`Headlines:\n${headlineText}`);
  }

  if (interests.includes("islamic")) {
    userParts.push(`Calendar:\n${islamicContext}`);
  }

  const response = await client.chat.completions.create({
    model,
    max_tokens: SMS_CONFIG.maxTokens,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: `You write daily SMS digests. CRITICAL COST RULE:
- The entire message MUST be ≤${SMS_MAX_CHARS} characters (exactly ONE SMS segment). Count carefully.
- Use plain ASCII only (no emoji, no Arabic script) so the message stays one segment.
- Short greeting + weave requested topics in 2–3 tight sentences max.
- No markdown, bullets, or line breaks.
- Name one news source if covering news.
- Never fabricate facts.`,
      },
      {
        role: "user",
        content: userParts.join("\n\n"),
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("AI returned empty message");
  }

  return enforceSingleSms(text.replace(/\s+/g, " "));
}
