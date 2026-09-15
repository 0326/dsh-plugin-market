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

const target = `https://${whitepaperDomain.hostname}/whitepaper/${encodeURIComponent(versions.latestPublished)}/overview`;
const attempts = 12;
const delayMs = 5_000;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const response = await fetch(target, { redirect: "manual" });
    if (response.status === 200) {
      console.log(`Whitepaper custom domain smoke check passed: ${target}`);
      process.exit(0);
    }
    console.warn(`Smoke check ${attempt}/${attempts}: ${target} returned ${response.status}`);
  } catch (error) {
    console.warn(`Smoke check ${attempt}/${attempts}: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (attempt < attempts) await new Promise((resolvePromise) => setTimeout(resolvePromise, delayMs));
}

throw new Error(`Whitepaper custom domain did not become reachable: ${target}`);
