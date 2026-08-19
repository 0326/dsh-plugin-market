import type { Finding } from "../domain/finding";
import type { CompatibilityStatus, ParsedPackageJson } from "../domain/plugin";
import { compareSemver, isPrerelease, parseSemver, satisfiesRange } from "./semver";

export interface CompatibilityBaseline {
	dshVersion: string;
	cordisVersion: string;
	checkedAt: string;
}

/**
 * Fallback baseline used when D1 has no synced baseline yet.
 *
 * Versions reflect the latest published packages at calibration time:
 *   @deepseek-ai/dsh     -> 0.1.0-rc.7
 *   @deepseek-ai/cordis  -> 4.0.1
 * The authoritative values are synced from npm (src/worker/npm/baseline.ts).
 */
export const DEFAULT_BASELINE: CompatibilityBaseline = {
	dshVersion: "0.1.0-rc.7",
	cordisVersion: "4.0.1",
	checkedAt: "2026-08-19T00:00:00.000Z",
};

export interface DshConstraint {
	packageName: string;
	constraint: string;
	source: "dependencies" | "peerDependencies";
}

export type ConstraintStatus = "COMPATIBLE" | "LIKELY_COMPATIBLE" | "OUTDATED" | "INCOMPATIBLE" | "UNKNOWN";

export interface ConstraintVerdict {
	packageName: string;
	constraint: string;
	source: DshConstraint["source"];
	status: ConstraintStatus;
	reason: string;
}

export interface CompatibilityAnalysis {
	status: CompatibilityStatus;
	verdicts: ConstraintVerdict[];
	findings: Finding[];
}

/** Only compare packages whose published version is represented by our baseline. */
const BASELINE_TARGETS = new Map<string, keyof Pick<CompatibilityBaseline, "dshVersion" | "cordisVersion">>([
	["@deepseek-ai/dsh", "dshVersion"],
	["@deepseek-ai/cordis", "cordisVersion"],
	["cordis", "cordisVersion"],
]);

function isDshPackage(name: string): boolean {
	return BASELINE_TARGETS.has(name);
}

export function extractDshConstraints(manifest: ParsedPackageJson): DshConstraint[] {
	const out: DshConstraint[] = [];
	const sources: [DshConstraint["source"], Record<string, string> | undefined][] = [
		["peerDependencies", manifest.peerDependencies],
		["dependencies", manifest.dependencies],
	];
	for (const [source, deps] of sources) {
		if (!deps) continue;
		for (const [name, constraint] of Object.entries(deps)) {
			if (isDshPackage(name)) out.push({ packageName: name, constraint, source });
		}
	}
	return out;
}

function baselineFor(packageName: string, baseline: CompatibilityBaseline): string | null {
	const target = BASELINE_TARGETS.get(packageName);
	return target ? baseline[target] : null;
}

function extractTargetVersion(constraint: string): string | null {
	const t = constraint.trim().replace(/^[~^<>= ]+/, "");
	return /^\d+\.\d+\.\d+/.test(t) ? t : null;
}

export function classifyConstraint(packageName: string, constraint: string, baseline: CompatibilityBaseline): Omit<ConstraintVerdict, "source"> {
	const baseVersion = baselineFor(packageName, baseline);
	if (!baseVersion) {
		return { packageName, constraint, status: "UNKNOWN", reason: "no baseline configured for " + packageName };
	}
	const base = parseSemver(baseVersion);
	const target = extractTargetVersion(constraint) ? parseSemver(extractTargetVersion(constraint) as string) : null;

	if (
		base &&
		target &&
		isPrerelease(target) &&
		isPrerelease(base) &&
		target.major === base.major &&
		target.minor === base.minor &&
		target.patch === base.patch &&
		compareSemver(target, base) < 0
	) {
		return { packageName, constraint, status: "OUTDATED", reason: "plugin targets " + constraint + ", current baseline is " + baseVersion };
	}

	const res = satisfiesRange(baseVersion, constraint);
	if (res.satisfied === false) {
		return { packageName, constraint, status: "INCOMPATIBLE", reason: constraint + " does not satisfy baseline " + baseVersion };
	}
	if (res.satisfied === null) {
		return { packageName, constraint, status: "UNKNOWN", reason: "could not interpret range " + constraint };
	}
	if (/[*xX]|latest|>=0/.test(constraint)) {
		return { packageName, constraint, status: "LIKELY_COMPATIBLE", reason: "loose range " + constraint + " satisfied by " + baseVersion };
	}
	return { packageName, constraint, status: "COMPATIBLE", reason: constraint + " satisfied by " + baseVersion };
}

const PRIORITY: Record<ConstraintStatus, number> = {
	INCOMPATIBLE: 4,
	OUTDATED: 3,
	UNKNOWN: 2,
	LIKELY_COMPATIBLE: 1,
	COMPATIBLE: 0,
};

export function analyzeCompatibility(manifest: ParsedPackageJson, baseline: CompatibilityBaseline = DEFAULT_BASELINE): CompatibilityAnalysis {
	const constraints = extractDshConstraints(manifest);
	if (constraints.length === 0) {
		return {
			status: "UNKNOWN",
			verdicts: [],
			findings: [
				{
					category: "COMPATIBILITY",
					code: "NO_DSH_CONSTRAINT",
					severity: "UNKNOWN",
					title: "No DSH/Cordis dependency declared",
					detail: "Compatibility cannot be assessed without a versioned DSH or Cordis compatibility target.",
					filePath: "package.json",
				},
			],
		};
	}
	const verdicts = constraints.map((c) => ({ ...classifyConstraint(c.packageName, c.constraint, baseline), source: c.source }));
	const worst = verdicts.reduce<ConstraintStatus>((acc, v) => (PRIORITY[v.status] > PRIORITY[acc] ? v.status : acc), "COMPATIBLE");
	const findings: Finding[] = verdicts.map((v) => ({
		category: "COMPATIBILITY",
		code: "COMPAT_" + v.status,
		severity: v.status === "INCOMPATIBLE" ? "HIGH" : v.status === "OUTDATED" ? "MEDIUM" : v.status === "UNKNOWN" ? "UNKNOWN" : "INFO",
		title: v.packageName + ": " + v.status,
		detail: v.reason,
		filePath: "package.json",
	}));
	return { status: worst, verdicts, findings };
}
