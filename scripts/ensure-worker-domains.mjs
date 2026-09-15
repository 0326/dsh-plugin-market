import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(here, "../config/cloudflare-domains.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const checkOnly = process.argv.includes("--check");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function validateConfig(value) {
  if (!value || typeof value !== "object") fail("cloudflare-domains.json must contain an object");
  if (!value.service || typeof value.service !== "string") fail("cloudflare-domains.json: service is required");
  if (!Array.isArray(value.domains) || value.domains.length === 0) fail("cloudflare-domains.json: domains must be a non-empty array");

  const seen = new Set();
  for (const domain of value.domains) {
    if (!domain || typeof domain !== "object") fail("cloudflare-domains.json: every domain must be an object");
    if (!domain.hostname || typeof domain.hostname !== "string") fail("cloudflare-domains.json: hostname is required");
    if (!domain.zone_name || typeof domain.zone_name !== "string") fail(`${domain.hostname}: zone_name is required`);
    if (seen.has(domain.hostname)) fail(`${domain.hostname}: duplicate hostname`);
    seen.add(domain.hostname);

    if (domain.hostname !== domain.hostname.toLowerCase()) fail(`${domain.hostname}: hostname must be lowercase`);
    if (domain.hostname === domain.zone_name) fail(`${domain.hostname}: apex-domain management is intentionally excluded from this migration phase`);
    if (!domain.hostname.endsWith(`.${domain.zone_name}`)) fail(`${domain.hostname}: hostname must belong to zone ${domain.zone_name}`);
  }
}

validateConfig(config);

if (checkOnly) {
  console.log(`Cloudflare domain config valid: ${config.domains.length} managed domain(s)`);
  process.exit(0);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!accountId) fail("CLOUDFLARE_ACCOUNT_ID is required");
if (!token) fail("CLOUDFLARE_API_TOKEN is required");

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/domains`;
const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
};

async function parseCloudflare(response, action) {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const details = payload?.errors?.map((error) => `${error.code ?? "?"}: ${error.message ?? "unknown error"}`).join("; ") ?? `${response.status} ${response.statusText}`;
    throw new Error(`${action} failed: ${details}`);
  }
  return payload;
}

async function findDomain(hostname) {
  const url = new URL(apiBase);
  url.searchParams.set("hostname", hostname);
  const response = await fetch(url, { headers });
  const payload = await parseCloudflare(response, `List Worker domains for ${hostname}`);
  return Array.isArray(payload.result) ? payload.result.find((item) => item.hostname === hostname) : undefined;
}

for (const domain of config.domains) {
  const current = await findDomain(domain.hostname);
  if (current) {
    if (current.service !== config.service) {
      throw new Error(`${domain.hostname} is already attached to Worker ${current.service}; refusing to reassign it to ${config.service}`);
    }
    console.log(`${domain.hostname}: already attached to ${config.service}`);
    continue;
  }

  const response = await fetch(apiBase, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      hostname: domain.hostname,
      service: config.service,
      zone_name: domain.zone_name,
    }),
  });
  const payload = await parseCloudflare(response, `Attach ${domain.hostname}`);
  console.log(`${domain.hostname}: attached to ${config.service} (domain id ${payload.result?.id ?? "unknown"})`);
}
