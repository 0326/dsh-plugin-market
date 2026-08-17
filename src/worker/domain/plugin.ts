/** Plugin verification state machine, compatibility, and metadata types. */

export const VERIFICATION_STATUS = [
	"CANDIDATE",
	"DETECTED",
	"FORMAT_VERIFIED",
	"FEATURED",
	"REJECTED",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];

export const COMPATIBILITY_STATUS = [
	"COMPATIBLE",
	"LIKELY_COMPATIBLE",
	"OUTDATED",
	"INCOMPATIBLE",
	"UNKNOWN",
] as const;
export type CompatibilityStatus = (typeof COMPATIBILITY_STATUS)[number];

export const SECURITY_STATUS = ["PASSED", "REVIEW", "FAILED", "UNKNOWN"] as const;
export type SecurityStatus = (typeof SECURITY_STATUS)[number];

export const MAINTENANCE_STATUS = ["ACTIVE", "INACTIVE", "ARCHIVED", "UNKNOWN"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUS)[number];

export const RISK_LEVEL = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"] as const;
export type RiskLevel = (typeof RISK_LEVEL)[number];

export const PLUGIN_TYPE = [
	"TOOL",
	"SERVICE",
	"SURFACE",
	"CLIENT_UI",
	"AGENT",
	"WORKFLOW",
	"INTEGRATION",
	"THEME",
	"BUNDLE",
	"NON_PLUGIN",
	"UNKNOWN",
] as const;
export type PluginType = (typeof PLUGIN_TYPE)[number];

export const CAPABILITY = [
	"DEVELOPMENT",
	"GIT_GITHUB",
	"BROWSER_WEB",
	"DESIGN",
	"VISION",
	"SEARCH",
	"MEMORY",
	"MCP_INTEGRATION",
	"AUTOMATION",
	"DATA",
	"PRODUCTIVITY",
	"COMMUNICATION",
	"UI_THEMES",
	"AGENT_WORKFLOW",
	"SECURITY",
] as const;
export type Capability = (typeof CAPABILITY)[number];

export interface DshBundleManifest {
	patch?: string;
	[key: string]: unknown;
}

export interface DshClientManifest {
	platform?: string;
	[key: string]: unknown;
}

export interface DshManifest {
	bundle?: DshBundleManifest;
	client?: DshClientManifest;
	[key: string]: unknown;
}

/** Lenient parse result of a plugin's `package.json`. */
export interface ParsedPackageJson {
	name?: string;
	version?: string;
	description?: string;
	keywords?: string[];
	license?: string;
	repository?: string | { url?: string; [key: string]: unknown };
	homepage?: string;
	engines?: Record<string, string>;
	scripts?: Record<string, string>;
	main?: string;
	exports?: unknown;
	files?: string[];
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	dsh?: DshManifest;
	[key: string]: unknown;
}

/** Structured metadata derived from the manifest, persisted in D1. */
export interface PluginMetadata {
	packageName?: string;
	packageVersion?: string;
	pluginName?: string;
	description?: string;
	license?: string;
	homepage?: string;
	repositoryUrl?: string;
	nodeRange?: string;
	cordisRange?: string;
	dshDependencyRanges: Record<string, string>;
	dshBundlePatch?: string;
	clientPlatform?: string;
	installScripts: string[];
	capabilities: Capability[];
	pluginTypes: PluginType[];
	/** The DSH / Cordis versions this scan evaluated compatibility against. */
	compatibilityBaseline?: {
		dshVersion: string;
		cordisVersion: string;
		checkedAt: string;
	};
	/** Per-dependency compatibility verdicts (declared range vs baseline). */
	compatibilityVerdicts?: Array<{
		packageName: string;
		constraint: string;
		source: string;
		status: string;
		reason: string;
	}>;
}
