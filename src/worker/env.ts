import type { ScanQueueJob } from "./domain/scan";

/**
 * Worker bindings and secrets.
 *
 * `DB`, `SCAN_QUEUE`, and `ASSETS` are declared in `wrangler.json`. Secrets are
 * set with `wrangler secret put` and are never committed.
 */
export type Env = Omit<Cloudflare.Env, "SCAN_QUEUE" | "ASSETS"> & {
  SCAN_QUEUE: Queue<ScanQueueJob>;
  ASSETS: Fetcher;
  GITHUB_TOKEN: string;
  INTERNAL_API_SECRET: string;
  AUTO_FEATURE_MIN_STARS: string;
};
