import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const domainConfig = JSON.parse(readFileSync(resolve(root, "config/cloudflare-domains.json"), "utf8"));
const versions = JSON.parse(readFileSync(resolve(root, "src/react-app/content/whitepaper/versions.json"), "utf8"));

const whitepaperDomain = domainConfig.domains.find((item) => item.hostname.startsWith("whitepaper."));
if (!whitepaperDomain) throw new Error("No whitepaper custom domain configured");
if (!versions.latestPublished) throw new Error("versions.json does not define latestPublished");

const whitepaperOrigin = `https://${whitepaperDomain.hostname}`;
const marketOrigin = "https://dsh-plugin.market";
const concretePath = `/${encodeURIComponent(versions.latestPublished)}/overview`;
const concreteUrl = `${whitepaperOrigin}${concretePath}`;
const attempts = 12;
const delayMs = 5_000;

async function checkMigration() {
  const page = await fetch(concreteUrl, { redirect: "manual" });
  if (page.status !== 200) throw new Error(`${concreteUrl} returned ${page.status}`);

  const rootResponse = await fetch(`${whitepaperOrigin}/`, { redirect: "manual" });
  if (rootResponse.status !== 302 || rootResponse.headers.get("location") !== concreteUrl) {
    throw new Error(`whitepaper root redirect mismatch: ${rootResponse.status} ${rootResponse.headers.get("location")}`);
  }

  const latestResponse = await fetch(`${whitepaperOrigin}/latest/overview`, { redirect: "manual" });
  if (latestResponse.status !== 302 || latestResponse.headers.get("location") !== concreteUrl) {
    throw new Error(`latest redirect mismatch: ${latestResponse.status} ${latestResponse.headers.get("location")}`);
  }

  const legacyUrl = `${marketOrigin}/whitepaper/${encodeURIComponent(versions.latestPublished)}/overview`;
  const legacyResponse = await fetch(legacyUrl, { redirect: "manual" });
  if (legacyResponse.status !== 301 || legacyResponse.headers.get("location") !== concreteUrl) {
    throw new Error(`legacy redirect mismatch: ${legacyResponse.status} ${legacyResponse.headers.get("location")}`);
  }

  const robotsResponse = await fetch(`${whitepaperOrigin}/robots.txt`);
  const robots = await robotsResponse.text();
  if (robotsResponse.status !== 200 || !robots.includes(`Sitemap: ${whitepaperOrigin}/sitemap.xml`)) {
    throw new Error(`whitepaper robots.txt is invalid (${robotsResponse.status})`);
  }

  const sitemapResponse = await fetch(`${whitepaperOrigin}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  if (sitemapResponse.status !== 200 || !sitemap.includes(`<loc>${concreteUrl}</loc>`)) {
    throw new Error(`whitepaper sitemap.xml is invalid (${sitemapResponse.status})`);
  }
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    await checkMigration();
    console.log(`Whitepaper subdomain migration smoke check passed: ${concreteUrl}`);
    process.exit(0);
  } catch (error) {
    console.warn(`Smoke check ${attempt}/${attempts}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (attempt < attempts) await new Promise((resolvePromise) => setTimeout(resolvePromise, delayMs));
}

throw new Error(`Whitepaper subdomain migration did not become healthy: ${concreteUrl}`);
