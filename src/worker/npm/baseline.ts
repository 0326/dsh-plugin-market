import { upsertBaseline } from "../db/repository";
import type { Env } from "../env";
import { DEFAULT_BASELINE, type CompatibilityBaseline } from "../scanner/compatibility";

/**
 * Packages whose `latest` dist-tag defines the compatibility baseline.
 * Best-effort: a package that does not exist (or 404s) falls back to the
 * built-in default instead of failing the whole sync.
 */
export const BASELINE_PACKAGES = ["@deepseek-ai/cordis", "@deepseek-ai/dsh"] as const;

export async function fetchNpmLatest(packageName: string): Promise<string | null> {
	const res = await fetch("https://registry.npmjs.org/" + encodeURIComponent(packageName) + "/latest");
	if (!res.ok) return null;
	const data = (await res.json()) as { version?: string };
	return data.version ?? null;
}

/** Pure: resolve a baseline from a version fetcher (unit-testable without network). */
export async function computeBaseline(fetcher: (pkg: string) => Promise<string | null>): Promise<CompatibilityBaseline> {
	const [cordis, dsh] = await Promise.all([
		fetcher("@deepseek-ai/cordis"),
		fetcher("@deepseek-ai/dsh"),
	]);
	return {
		dshVersion: dsh ?? DEFAULT_BASELINE.dshVersion,
		cordisVersion: cordis ?? DEFAULT_BASELINE.cordisVersion,
		checkedAt: new Date().toISOString(),
	};
}

/** Fetch the current baseline from npm and persist it to D1. */
export async function syncBaseline(env: Env): Promise<CompatibilityBaseline> {
	const baseline = await computeBaseline(fetchNpmLatest);
	await upsertBaseline(env.DB, baseline);
	return baseline;
}
