import type { Finding } from "../domain/finding";
import type {
	CompatibilityStatus,
	MaintenanceStatus,
	ParsedPackageJson,
	PluginMetadata,
	RiskLevel,
	SecurityStatus,
	VerificationStatus,
} from "../domain/plugin";
import { SCANNER_VERSION } from "../domain/scan";
import type { BundleAnalysis } from "./bundle";
import { analyzeBundle } from "./bundle";
import { detectCapabilities, detectPluginTypes } from "./capabilities";
import { analyzeCompatibility, DEFAULT_BASELINE, type CompatibilityAnalysis, type CompatibilityBaseline } from "./compatibility";
import type { MaintenanceInput } from "./maintenance";
import { analyzeMaintenance } from "./maintenance";
import { parsePackageJson } from "./manifest";
import { deriveRiskLevel } from "./risk";
import type { SecurityAnalysis } from "./security";
import { analyzeSecurity } from "./security";
import type { RepoSnapshot } from "./snapshot";
import { getFileContent } from "./snapshot";

export interface ScanResult {
	scannerVersion: string;
	commitSha: string;
	verificationStatus: VerificationStatus;
	compatibilityStatus: CompatibilityStatus;
	securityStatus: SecurityStatus;
	maintenanceStatus: MaintenanceStatus;
	riskLevel: RiskLevel;
	findings: Finding[];
	metadata: PluginMetadata;
}

export interface ScanInput {
	snapshot: RepoSnapshot;
	maintenance: MaintenanceInput;
	baseline?: CompatibilityBaseline;
}

/** Pure entry point: snapshot in, structured scan result out. */
export function scanRepository(input: ScanInput): ScanResult {
	const { snapshot } = input;
	const raw = getFileContent(snapshot, "package.json");
	const parsed = parsePackageJson(raw);

	if (!parsed.ok || !parsed.manifest) {
		return buildFailure(snapshot, input.maintenance, parsed.error ?? "package.json could not be parsed");
	}

	const manifest = parsed.manifest;
	const bundle = analyzeBundle(manifest, snapshot);
	const compatibility = analyzeCompatibility(manifest, input.baseline ?? DEFAULT_BASELINE);
	const security = analyzeSecurity(manifest, snapshot.files);
	const maintenance = analyzeMaintenance(input.maintenance);

	const verificationStatus = deriveVerification(bundle);
	const isPlugin = verificationStatus !== "CANDIDATE";
	const metadata = buildMetadata(manifest, security, bundle, getFileContent(snapshot, "README.md"), compatibility, input.baseline ?? DEFAULT_BASELINE, isPlugin);
	const findings = [...bundle.findings, ...compatibility.findings, ...security.findings, ...maintenance.findings];

	return {
		scannerVersion: SCANNER_VERSION,
		commitSha: snapshot.commitSha,
		verificationStatus,
		compatibilityStatus: isPlugin ? compatibility.status : "UNKNOWN",
		securityStatus: isPlugin ? security.status : "UNKNOWN",
		maintenanceStatus: maintenance.status,
		riskLevel: isPlugin ? deriveRiskLevel(findings) : "UNKNOWN",
		findings,
		metadata,
	};
}

function deriveVerification(bundle: BundleAnalysis): VerificationStatus {
	if (bundle.hasDshBundle && bundle.patchExists && bundle.patchParseable) return "FORMAT_VERIFIED";
	if (bundle.hasDshBundle || bundle.hasCordisDependency) return "DETECTED";
	return "CANDIDATE";
}

function buildMetadata(
	manifest: ParsedPackageJson,
	security: SecurityAnalysis,
	bundle: BundleAnalysis,
	readme: string | undefined,
	compatibility: CompatibilityAnalysis,
	baseline: CompatibilityBaseline,
	isPlugin: boolean,
): PluginMetadata {
	const dshDependencyRanges: Record<string, string> = {};
	for (const [name, spec] of Object.entries({ ...(manifest.peerDependencies ?? {}), ...(manifest.dependencies ?? {}) })) {
		if (name === "cordis" || name.startsWith("@deepseek-ai/")) dshDependencyRanges[name] = spec;
	}
	return {
		packageName: manifest.name,
		packageVersion: manifest.version,
		pluginName: manifest.name,
		description: manifest.description,
		license: manifest.license,
		homepage: manifest.homepage,
		repositoryUrl: typeof manifest.repository === "string" ? manifest.repository : manifest.repository?.url,
		nodeRange: manifest.engines?.node,
		cordisRange: dshDependencyRanges["@deepseek-ai/cordis"] ?? dshDependencyRanges["cordis"],
		dshDependencyRanges,
		dshBundlePatch: bundle.patchPath,
		clientPlatform: manifest.dsh?.client?.platform,
		installScripts: security.installScripts,
		capabilities: isPlugin ? detectCapabilities(manifest, readme) : [],
		pluginTypes: detectPluginTypes(manifest, isPlugin),
		compatibilityBaseline: {
			dshVersion: baseline.dshVersion,
			cordisVersion: baseline.cordisVersion,
			checkedAt: baseline.checkedAt,
		},
		compatibilityVerdicts: compatibility.verdicts.map((v) => ({
			packageName: v.packageName,
			constraint: v.constraint,
			source: v.source,
			status: v.status,
			reason: v.reason,
		})),
	};
}

function buildFailure(snapshot: RepoSnapshot, maintenance: MaintenanceInput, error: string): ScanResult {
	const maintenanceAnalysis = analyzeMaintenance(maintenance);
	const findings: Finding[] = [
		{ category: "FORMAT", code: "MANIFEST_INVALID", severity: "HIGH", title: "package.json could not be parsed", detail: error, filePath: "package.json" },
	];
	return {
		scannerVersion: SCANNER_VERSION,
		commitSha: snapshot.commitSha,
		verificationStatus: "CANDIDATE",
		compatibilityStatus: "UNKNOWN",
		securityStatus: "UNKNOWN",
		maintenanceStatus: maintenanceAnalysis.status,
		riskLevel: "UNKNOWN",
		findings: [...findings, ...maintenanceAnalysis.findings],
		metadata: {
			dshDependencyRanges: {},
			installScripts: [],
			capabilities: [],
			pluginTypes: ["NON_PLUGIN"],
		},
	};
}
