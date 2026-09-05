export const INDEXABLE_VERIFICATION_STATUSES = ["DETECTED", "FORMAT_VERIFIED", "FEATURED"] as const;

export type BasicIndexablePlugin = {
	verificationStatus: string;
	pluginTypes?: readonly string[] | null;
	pluginTypesJson?: string | null;
	metadataJson?: string | null;
	description?: string | null;
	packageName?: string | null;
	latestCommitSha?: string | null;
};

function hasNonPluginType(plugin: BasicIndexablePlugin): boolean {
	if (plugin.pluginTypes?.includes("NON_PLUGIN")) return true;
	const raw = plugin.pluginTypesJson ?? plugin.metadataJson;
	if (!raw) return false;
	try {
		const value = JSON.parse(raw) as unknown;
		const types = Array.isArray(value) ? value : (value && typeof value === "object" && "pluginTypes" in value ? (value as { pluginTypes?: unknown }).pluginTypes : null);
		return Array.isArray(types) && types.includes("NON_PLUGIN");
	} catch {
		return false;
	}
}

export function isBasicIndexablePlugin(plugin: BasicIndexablePlugin): boolean {
	if (!(INDEXABLE_VERIFICATION_STATUSES as readonly string[]).includes(plugin.verificationStatus)) return false;
	if (hasNonPluginType(plugin)) return false;
	if (!plugin.description?.trim() && !plugin.packageName && !plugin.latestCommitSha) return false;
	if (plugin.verificationStatus === "DETECTED" && (!plugin.description?.trim() || (!plugin.packageName && !plugin.latestCommitSha))) return false;
	return true;
}
