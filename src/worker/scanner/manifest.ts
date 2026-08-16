import type { ParsedPackageJson } from "../domain/plugin";

export interface ManifestParseResult {
	ok: boolean;
	manifest?: ParsedPackageJson;
	error?: string;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function stringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.filter((item): item is string => typeof item === "string");
}

function stringRecord(value: unknown): Record<string, string> | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	const out: Record<string, string> = {};
	for (const [key, item] of Object.entries(value)) {
		if (typeof item === "string") out[key] = item;
	}
	return out;
}

function normalizeManifest(value: Record<string, unknown>): ParsedPackageJson {
	const repository =
		typeof value.repository === "string"
			? value.repository
			: value.repository && typeof value.repository === "object" && !Array.isArray(value.repository)
				? { url: stringValue((value.repository as Record<string, unknown>).url) }
				: undefined;
	const dshValue = value.dsh;
	const dsh = dshValue && typeof dshValue === "object" && !Array.isArray(dshValue) ? (dshValue as Record<string, unknown>) : undefined;
	const bundleValue = dsh?.bundle;
	const clientValue = dsh?.client;
	const bundle = bundleValue && typeof bundleValue === "object" && !Array.isArray(bundleValue) ? { patch: stringValue((bundleValue as Record<string, unknown>).patch) } : undefined;
	const client = clientValue && typeof clientValue === "object" && !Array.isArray(clientValue) ? { platform: stringValue((clientValue as Record<string, unknown>).platform) } : undefined;

	return {
		name: stringValue(value.name),
		version: stringValue(value.version),
		description: stringValue(value.description),
		keywords: stringArray(value.keywords),
		license: stringValue(value.license),
		repository,
		homepage: stringValue(value.homepage),
		engines: stringRecord(value.engines),
		scripts: stringRecord(value.scripts),
		main: stringValue(value.main),
		exports: value.exports,
		files: stringArray(value.files),
		dependencies: stringRecord(value.dependencies),
		devDependencies: stringRecord(value.devDependencies),
		peerDependencies: stringRecord(value.peerDependencies),
		optionalDependencies: stringRecord(value.optionalDependencies),
		dsh: dsh ? { bundle, client } : undefined,
	};
}

/** Parse a raw `package.json` string into a lenient, typed manifest. */
export function parsePackageJson(raw: string | undefined): ManifestParseResult {
	if (!raw || !raw.trim()) {
		return { ok: false, error: "package.json is missing or empty" };
	}
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== "object" || value === null || Array.isArray(value)) {
			return { ok: false, error: "package.json root must be an object" };
		}
			return { ok: true, manifest: normalizeManifest(value as Record<string, unknown>) };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return { ok: false, error: "package.json is not valid JSON: " + msg };
	}
}
