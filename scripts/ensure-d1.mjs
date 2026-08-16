// Ensures the D1 database exists (creating it if needed) and injects its
// database_id into wrangler.json, which `wrangler d1 migrations apply --remote`
// requires. Run only in CI (requires CLOUDFLARE_* env vars).
import { readFile, writeFile } from "node:fs/promises";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!accountId || !apiToken) {
  console.error("CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required");
  process.exit(1);
}

const wranglerPath = new URL("../wrangler.json", import.meta.url);
const wrangler = JSON.parse(await readFile(wranglerPath, "utf8"));
const binding = (wrangler.d1_databases ?? []).find((d) => d.database_name);
if (!binding) {
  console.error("No d1_databases entry with a database_name found in wrangler.json");
  process.exit(1);
}
const dbName = binding.database_name;

const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database`;
const headers = { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" };

// 1. Find the existing database by name (walk a few pages).
let id;
for (let page = 1; page <= 5; page++) {
  const res = await fetch(`${base}?per_page=100&page=${page}`, { headers });
  const body = await res.json();
  if (!res.ok) {
    console.error("Failed to list D1 databases:", JSON.stringify(body));
    process.exit(1);
  }
  const rows = body.result ?? [];
  id = rows.find((db) => db.name === dbName)?.uuid;
  if (id) break;
  if (rows.length < 100) break;
}

// 2. Create it if missing.
if (!id) {
  const res = await fetch(base, { method: "POST", headers, body: JSON.stringify({ name: dbName }) });
  const created = await res.json();
  if (!res.ok || !created.result?.uuid) {
    console.error("Failed to create D1 database:", JSON.stringify(created));
    process.exit(1);
  }
  id = created.result.uuid;
}

// 3. Inject the id into wrangler.json (CI ephemeral; not committed).
binding.database_id = id;
await writeFile(wranglerPath, JSON.stringify(wrangler, null, 2));
console.log(`D1 database "${dbName}" -> ${id}`);
