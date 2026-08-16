import type { ScanJob } from "./domain/scan";

/**
 * Worker bindings and secrets.
 *
 * `DB` and `SCAN_QUEUE` are declared in `wrangler.json` and generated into
 * `worker-configuration.d.ts` by `npm run cf-typegen`. Secrets are set with
 * `wrangler secret put` (they are NOT part of wrangler.json) and are declared
	 * by Wrangler type generation; never commit real values.
 */
export type Env = Omit<Cloudflare.Env, "SCAN_QUEUE"> & {
	SCAN_QUEUE: Queue<ScanJob>;
	GITHUB_TOKEN: string;
	INTERNAL_API_SECRET: string;
};
