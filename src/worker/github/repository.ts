import type { ScanJobError } from "../domain/scan";
import { parsePackageJson } from "../scanner/manifest";
import type { RepoFile, RepoSnapshot } from "../scanner/snapshot";
import { GithubError, type GithubClient } from "./client";

/** Lockfiles are only checked for presence, never parsed — no content fetch. */
const LOCKFILES = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock"];

export interface FetchSnapshotResult {
	snapshot?: RepoSnapshot;
	error?: ScanJobError;
}

function normalize(path: string): string {
	return path.replace(/^\.\//, "");
}

function mapGithubError(err: unknown): ScanJobError {
	if (err instanceof GithubError) {
		if (err.rateLimited) return { code: "GITHUB_RATE_LIMITED", message: "GitHub API rate limited" };
		if (err.status === 404) return { code: "REPO_NOT_FOUND", message: "repository not found" };
		if (err.status === 403) return { code: "REPO_PRIVATE", message: "repository is private or inaccessible" };
	}
	return { code: "INTERNAL_ERROR", message: err instanceof Error ? err.message : String(err) };
}

/**
 * Fetch a repository snapshot at a specific commit without cloning or executing
 * any code.
 *
 * Uses the recursive Git Trees API (one request) to learn which files exist,
 * then fetches only the files the scanner actually needs: package.json, the
 * declared bundle patch, the entry module, and README. Lockfiles are recorded
 * by presence only. This keeps the per-repo request count low (~5-6 instead of
 * ~13) so scanning throughput is not dominated by probing absent files.
 */
export async function fetchSnapshot(
	client: GithubClient,
	owner: string,
	repo: string,
	defaultBranch: string,
	expectedSha?: string,
): Promise<FetchSnapshotResult> {
	let sha = expectedSha;
	if (!sha) {
		try {
			sha = await client.getBranchSha(owner, repo, defaultBranch);
		} catch (err) {
			return { error: mapGithubError(err) };
		}
	}

	let treePaths: Set<string>;
	try {
		const tree = await client.getTree(owner, repo, sha);
		treePaths = new Set(tree.filter((t) => t.type === "blob").map((t) => t.path));
	} catch (err) {
		return { error: mapGithubError(err) };
	}

	let pkgContent: string | undefined;
	try {
		pkgContent = treePaths.has("package.json") ? await client.getFile(owner, repo, "package.json", sha) : undefined;
	} catch (err) {
		return { error: mapGithubError(err) };
	}

	const toFetch = new Set<string>(["README.md"]);
	if (pkgContent !== undefined) {
		const parsed = parsePackageJson(pkgContent);
		if (parsed.ok && parsed.manifest) {
			const patch = parsed.manifest.dsh?.bundle?.patch;
			if (typeof patch === "string" && patch) toFetch.add(normalize(patch));
			if (typeof parsed.manifest.main === "string" && parsed.manifest.main) toFetch.add(normalize(parsed.manifest.main));
		}
	}

	const files: RepoFile[] = [];
	if (pkgContent !== undefined) files.push({ path: "package.json", content: pkgContent });

	for (const path of toFetch) {
		if (path === "package.json" || !treePaths.has(path)) continue;
		const content = await client.getFile(owner, repo, path, sha);
		if (content !== undefined) files.push({ path, content });
	}

	for (const lf of LOCKFILES) {
		if (treePaths.has(lf)) files.push({ path: lf });
	}

	return { snapshot: { owner, repo, defaultBranch, commitSha: sha, files } };
}
