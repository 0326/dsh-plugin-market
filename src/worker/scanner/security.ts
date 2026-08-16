import type { Finding } from "../domain/finding";
import type { ParsedPackageJson, SecurityStatus } from "../domain/plugin";
import type { RepoFile } from "./snapshot";

const INSTALL_SCRIPTS = ["preinstall", "install", "postinstall", "prepare"] as const;

export interface SecurityAnalysis {
	status: SecurityStatus;
	installScripts: string[];
	findings: Finding[];
}

export function detectInstallScripts(manifest: ParsedPackageJson): string[] {
	const scripts = manifest.scripts ?? {};
	return INSTALL_SCRIPTS.filter((s) => typeof scripts[s] === "string");
}

function isSourceFile(path: string): boolean {
	return /\.(?:[cm]?[jt]s|jsx|tsx|mjs|cjs)$/.test(path);
}

const SOURCE_PATTERNS: { code: string; title: string; re: RegExp; severity: "LOW" | "MEDIUM" | "HIGH" }[] = [
	{ code: "SHELL_EXECUTION", title: "Shell / child process execution", re: /child_process|execSync|spawnSync|\bspawn\(|\bexec\(/, severity: "MEDIUM" },
	{ code: "DYNAMIC_CODE_EVAL", title: "Dynamic code evaluation", re: /\beval\(|new\s+Function\s*\(/, severity: "HIGH" },
	{ code: "REMOTE_EXEC_DOWNLOAD", title: "Download and execute remote content", re: /curl\s|wget\s|node\s+-e/, severity: "HIGH" },
	{ code: "CREDENTIAL_ACCESS", title: "Credential / token access", re: /process\.env\.(?:TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL)/i, severity: "MEDIUM" },
	{ code: "FILESYSTEM_ACCESS", title: "Broad filesystem access", re: /readFileSync|writeFileSync|\bfs\./, severity: "LOW" },
];

/** Static security signals. NEVER executes plugin code; flags patterns conservatively. */
export function analyzeSecurity(manifest: ParsedPackageJson, files: RepoFile[]): SecurityAnalysis {
	const findings: Finding[] = [];
	const installScripts = detectInstallScripts(manifest);

	for (const script of installScripts) {
		findings.push({
			category: "SECURITY",
			code: "INSTALL_SCRIPT",
			severity: "MEDIUM",
			title: script + " script detected",
			detail:
				script === "prepare"
					? "GitHub installs may run this build script; third-party code can execute during installation."
					: "This lifecycle script runs during dependency installation.",
			filePath: "package.json",
			evidence: { [script]: manifest.scripts?.[script] ?? "" },
		});
	}

	const deps = { ...(manifest.dependencies ?? {}), ...(manifest.optionalDependencies ?? {}) };
	const depEntries = Object.entries(deps);
	if (depEntries.length > 50) {
		findings.push({
			category: "SECURITY",
			code: "MANY_DEPENDENCIES",
			severity: "LOW",
			title: "Large dependency footprint (" + depEntries.length + ")",
			filePath: "package.json",
		});
	}
	for (const [name, spec] of depEntries) {
		if (spec.startsWith("git") || spec.includes("://")) {
			findings.push({ category: "SECURITY", code: "GIT_OR_REMOTE_DEP", severity: "MEDIUM", title: "Remote dependency: " + name, detail: spec, filePath: "package.json" });
		} else if (/^(file:|link:|\.{1,2}\/)/.test(spec)) {
			findings.push({ category: "SECURITY", code: "LOCAL_PATH_DEP", severity: "LOW", title: "Local path dependency: " + name, detail: spec, filePath: "package.json" });
		}
	}

	const hasLockfile = files.some((f) => /^(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(f.path));
	if (!hasLockfile) {
		findings.push({ category: "SECURITY", code: "NO_LOCKFILE", severity: "LOW", title: "No lockfile detected", detail: "Dependency resolution is not pinned.", filePath: "package.json" });
	}

	for (const file of files) {
		if (file.content === undefined || !isSourceFile(file.path)) continue;
		for (const p of SOURCE_PATTERNS) {
			if (p.re.test(file.content)) {
				findings.push({ category: "SECURITY", code: p.code, severity: p.severity, title: p.title, filePath: file.path });
			}
		}
	}

	let status: SecurityStatus = "PASSED";
	const worst = findings.reduce<number>((acc, f) => {
		const rank = f.severity === "CRITICAL" ? 4 : f.severity === "HIGH" ? 3 : f.severity === "MEDIUM" ? 2 : f.severity === "LOW" ? 1 : 0;
		return rank > acc ? rank : acc;
	}, 0);
	if (worst >= 4) status = "FAILED";
	else if (worst >= 2) status = "REVIEW";

	return { status, installScripts, findings };
}
