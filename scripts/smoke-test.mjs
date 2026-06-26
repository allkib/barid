/** Smoke tests for local dev. Run: node scripts/smoke-test.mjs */

import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const text = fs.readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim();
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, msg });
    console.log(`✗ ${name}: ${msg}`);
  }
}

await check("GET /", async () => {
  const res = await fetch(`${BASE}/`);
  if (!res.ok) throw new Error(`status ${res.status}`);
});

await check("GET /setup", async () => {
  const res = await fetch(`${BASE}/setup`);
  if (!res.ok) throw new Error(`status ${res.status}`);
});

await check("GET /api/settings", async () => {
  const res = await fetch(`${BASE}/api/settings`);
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  if (!("phoneNumber" in data)) throw new Error("invalid body");
});

await check("POST /api/settings", async () => {
  const res = await fetch(`${BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber: "+18048036690",
      interests: ["news", "islamic"],
    }),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
});

await check("GET /api/cron rejects missing auth", async () => {
  const res = await fetch(`${BASE}/api/cron`);
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
});

await check("GET /api/settings by phone", async () => {
  const res = await fetch(`${BASE}/api/settings?phone=${encodeURIComponent("+18048036690")}`);
  if (!res.ok) throw new Error(`status ${res.status}`);
  const data = await res.json();
  if (data.phoneNumber !== "+18048036690") throw new Error("phone not loaded");
});

await check("POST second subscriber", async () => {
  const res = await fetch(`${BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumber: "+15551234567",
      interests: ["news"],
    }),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
});

await check("GET /api/cron accepts secret", async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET not set");
  const res = await fetch(`${BASE}/api/cron?secret=${encodeURIComponent(secret)}`);
  if (res.status === 401) throw new Error("unauthorized");
  const data = await res.json();
  if (
    !("skipped" in data) &&
    !("success" in data) &&
    !("error" in data) &&
    !("sent" in data)
  ) {
    throw new Error("unexpected response");
  }
});

await check("rate limit blocks excessive settings writes", async () => {
  let saw429 = false;
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "+18048036690",
        interests: ["news"],
      }),
    });
    if (res.status === 429) {
      saw429 = true;
      const data = await res.json();
      if (!data.error?.includes("Too many")) throw new Error("bad 429 body");
      break;
    }
  }
  if (!saw429) throw new Error("no 429 after 20 writes");
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length > 0 ? 1 : 0);
