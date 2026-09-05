import type { PluginListItem } from "./db/repository";
import { INDEXABLE_VERIFICATION_STATUSES, isBasicIndexablePlugin } from "../shared/seo-policy";

export { INDEXABLE_VERIFICATION_STATUSES } from "../shared/seo-policy";

export interface PluginIndexabilityInput {
	verificationStatus: string;
	pluginTypes?: readonly string[] | null;
	pluginTypesJson?: string | null;
	metadataJson?: string | null;
	description?: string | null;
	packageName?: string | null;
	latestCommitSha?: string | null;
}

function parseStringArray(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const value = JSON.parse(raw) as unknown;
		return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
	} catch {
		return [];
	}
}

function parseMetadataPluginTypes(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const value = JSON.parse(raw) as { pluginTypes?: unknown };
		return Array.isArray(value.pluginTypes)
			? value.pluginTypes.filter((item): item is string => typeof item === "string")
			: [];
	} catch {
		return [];
	}
}

function hasMinimumDetectedEvidence(plugin: PluginIndexabilityInput): boolean {
	return Boolean(plugin.description?.trim()) && Boolean(plugin.packageName || plugin.latestCommitSha);
}

function hasMinimumIndexableEvidence(plugin: PluginIndexabilityInput): boolean {
	return isBasicIndexablePlugin(plugin);
}

export function isPluginIndexable(plugin: PluginIndexabilityInput): boolean {
	if (!(INDEXABLE_VERIFICATION_STATUSES as readonly string[]).includes(plugin.verificationStatus)) return false;
	if (!hasMinimumIndexableEvidence(plugin)) return false;
	if (plugin.verificationStatus === "DETECTED" && !hasMinimumDetectedEvidence(plugin)) return false;
	const pluginTypes =
		plugin.pluginTypes ??
		(plugin.pluginTypesJson ? parseStringArray(plugin.pluginTypesJson) : parseMetadataPluginTypes(plugin.metadataJson));
	return !pluginTypes.includes("NON_PLUGIN");
}

export function isRegistryPluginLinkable(item: PluginListItem): boolean {
	return isPluginIndexable({
		...item,
		pluginTypesJson: item.pluginTypesJson,
		metadataJson: item.metadataJson,
	});
}

export function isPublisherIndexable(publisher: PluginListItem[] | { repos: PluginListItem[] }): boolean {
	const repos = Array.isArray(publisher) ? publisher : publisher.repos;
	return repos.filter(isRegistryPluginLinkable).length >= 2;
}
