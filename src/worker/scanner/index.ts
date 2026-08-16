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
import { analyzeCompatibility } from "./compatibility";
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
	const compatibility = analyzeCompatibility(manifest);
	const security = analyzeSecurity(manifest, snapshot.files);
	const maintenance = analyzeMaintenance(input.maintenance);

	const verificationStatus = deriveVerification(bundle);
	const metadata = buildMetadata(manifest, security, bundle, getFileContent(snapshot, "README.md"));
	const findings = [...bundle.findings, ...compatibility.findings, ...security.findings, ...maintenance.findings];

	return {
		scannerVersion: SCANNER_VERSION,
		commitSha: snapshot.commitSha,
		verificationStatus,
		compatibilityStatus: compatibility.status,
		securityStatus: security.status,
		maintenanceStatus: maintenance.status,
		riskLevel: deriveRiskLevel(findings),
		findings,
		metadata,
	};
}

function deriveVerification(bundle: BundleAnalysis): VerificationStatus {
	if (bundle.hasDshBundle && bundle.patchExists && bundle.patchParseable) return "FORMAT_VERIFIED";
	if (bundle.hasDshBundle || bundle.hasCordisDependency) return "DETECTED";
	return "CANDIDATE";
}

function buildMetadata(manifest: ParsedPackageJson, security: SecurityAnalysis, bundle: BundleAnalysis, readme?: string): PluginMetadata {
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
		capabilities: detectCapabilities(manifest, readme),
		pluginTypes: detectPluginTypes(manifest),
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
		riskLevel: "LOW",
		findings: [...findings, ...maintenanceAnalysis.findings],
		metadata: {
			dshDependencyRanges: {},
			installScripts: [],
			capabilities: [],
			pluginTypes: ["UNKNOWN"],
		},
	};
}
