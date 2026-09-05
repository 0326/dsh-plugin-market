import { getBaseline, listPlugins, type PluginListItem } from "./db/repository";
import { getRegistryStats, type RegistryStats } from "./db/registry";
import { CAPABILITY } from "./domain/plugin";
import { SCANNER_VERSION } from "./domain/scan";

export interface HomePayload {
	context: {
		stats: RegistryStats;
		scannerVersion: string;
		baseline: Awaited<ReturnType<typeof getBaseline>>;
	};
	featured: PluginListItem[];
	latest: PluginListItem[];
	popular: PluginListItem[];
	capabilities: string[];
}

/**
 * One small, cacheable read model for the SPA home page and its Edge HTML.
 * It deliberately avoids COUNT queries and candidate repositories.
 */
export async function getHomePayload(db: D1Database): Promise<HomePayload> {
	const [stats, baseline, featured, latest, popular] = await Promise.all([
		getRegistryStats(db),
		getBaseline(db),
		listPlugins(db, { featured: true, installableOnly: true, limit: 3 }),
		listPlugins(db, { sort: "new", installableOnly: true, limit: 6 }),
		listPlugins(db, { sort: "stars", installableOnly: true, limit: 6 }),
	]);
	return {
		context: { stats, scannerVersion: SCANNER_VERSION, baseline },
		featured,
		latest,
		popular,
		capabilities: [...CAPABILITY],
	};
}
