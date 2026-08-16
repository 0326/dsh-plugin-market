import type { ParsedPackageJson } from "../domain/plugin";

export interface ManifestParseResult {
	ok: boolean;
	manifest?: ParsedPackageJson;
	error?: string;
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
		return { ok: true, manifest: value as ParsedPackageJson };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return { ok: false, error: "package.json is not valid JSON: " + msg };
	}
}
