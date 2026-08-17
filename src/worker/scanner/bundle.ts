import type { Finding } from "../domain/finding";
import type { ParsedPackageJson } from "../domain/plugin";
import type { RepoSnapshot } from "./snapshot";
import { parseDocument } from "yaml";

export interface BundleAnalysis {
	hasDshBundle: boolean;
	hasCordisDependency: boolean;
	patchPath?: string;
	patchExists: boolean;
	patchParseable: boolean;
	findings: Finding[];
}

function hasCordis(manifest: ParsedPackageJson): boolean {
	const all = { ...(manifest.dependencies ?? {}), ...(manifest.peerDependencies ?? {}), ...(manifest.devDependencies ?? {}) };
	return Object.keys(all).some((name) => name === "cordis" || name === "@deepseek-ai/cordis");
}

function resolvePatchPath(patchPath: string): string {
	return patchPath.replace(/^\.\//, "");
}

function isNonEmptyMapping(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

/**
 * Conservative Cordis patch structure check. DSH bundles in the wild use both
 * the legacy mapping form and Cordis' operation-sequence form, for example:
 *
 *   - insert:
 *       - id: my-plugin
 *         name: '@scope/my-plugin'
 *
 * We intentionally validate only YAML shape here, not the semantics of each
 * Cordis operation. Scanner format verification remains static and does not
 * execute third-party configuration or code.
 */
function isPlausiblePatchYaml(content: string | undefined): boolean {
	if (!content || !content.trim()) return false;
	try {
		const document = parseDocument(content, { strict: true });
		if (document.errors.length > 0) return false;
		const value = document.toJS() as unknown;

		if (Array.isArray(value)) {
			return value.length > 0 && value.every(isNonEmptyMapping);
		}
		if (!isNonEmptyMapping(value)) return false;
		return Object.prototype.hasOwnProperty.call(value, "plugins") || Object.prototype.hasOwnProperty.call(value, "patch");
	} catch {
		return false;
	}
}

/** Detect DSH signals and validate bundle structure (does NOT validate code safety). */
export function analyzeBundle(manifest: ParsedPackageJson, snapshot: RepoSnapshot): BundleAnalysis {
	const findings: Finding[] = [];
	const declared = manifest.dsh?.bundle?.patch;
	const hasDshBundle = typeof declared === "string" && declared.length > 0;
	const patchPath = hasDshBundle ? resolvePatchPath(declared) : undefined;
	const hasCordisDependency = hasCordis(manifest);

	if (!hasDshBundle) {
		findings.push({
			category: "FORMAT",
			code: "NO_DSH_BUNDLE",
			severity: "INFO",
			title: "No dsh.bundle.patch declaration",
			detail: "package.json does not declare dsh.bundle.patch; this repository may not be a distributable DSH Bundle.",
			filePath: "package.json",
		});
	}
	if (!hasCordisDependency) {
		findings.push({
			category: "FORMAT",
			code: "NO_CORDIS_DEPENDENCY",
			severity: "INFO",
			title: "No @deepseek-ai/cordis dependency",
			detail: "A DSH Plugin typically depends on @deepseek-ai/cordis.",
			filePath: "package.json",
		});
	}

	let patchExists = false;
	let patchParseable = false;
	if (patchPath) {
		const file = snapshot.files.find((f) => f.path === patchPath);
		if (!file) {
			findings.push({
				category: "FORMAT",
				code: "PATCH_MISSING",
				severity: "MEDIUM",
				title: "Patch file not found: " + patchPath,
				detail: "dsh.bundle.patch references a file that is not present in the repository.",
				filePath: patchPath,
			});
		} else {
			patchExists = true;
			patchParseable = isPlausiblePatchYaml(file.content);
			if (!patchParseable) {
				findings.push({
					category: "FORMAT",
					code: "PATCH_INVALID",
					severity: "MEDIUM",
					title: "Patch file does not look like valid Cordis patch YAML",
					detail: "The referenced patch file could not be recognized as a non-empty Cordis mapping or operation sequence.",
					filePath: patchPath,
				});
			}
		}
	}

	return { hasDshBundle, hasCordisDependency, patchPath, patchExists, patchParseable, findings };
}
