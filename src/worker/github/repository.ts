import type { ScanJobError } from "../domain/scan";
import { parsePackageJson } from "../scanner/manifest";
import type { RepoFile, RepoSnapshot } from "../scanner/snapshot";
import { GithubError, type GithubClient } from "./client";

const KEY_FILES = [
	"package.json",
	"cordis.patch.yml",
	"cordis.patch.yaml",
	"README.md",
	"LICENSE",
	"LICENSE.md",
	"pnpm-lock.yaml",
	"package-lock.json",
	"yarn.lock",
];

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
 * any code. Only a small set of manifest/source files is read. A missing
 * package.json yields an empty snapshot (recorded as CANDIDATE) rather than an
 * error.
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

	const wanted = new Set<string>(KEY_FILES);
	let pkgContent: string | undefined;
	try {
		pkgContent = await client.getFile(owner, repo, "package.json", sha);
	} catch (err) {
		return { error: mapGithubError(err) };
	}

	if (pkgContent !== undefined) {
		const parsed = parsePackageJson(pkgContent);
		if (parsed.ok && parsed.manifest) {
			const patch = parsed.manifest.dsh?.bundle?.patch;
			if (typeof patch === "string" && patch) wanted.add(normalize(patch));
			if (typeof parsed.manifest.main === "string" && parsed.manifest.main) wanted.add(normalize(parsed.manifest.main));
		}
	}

	const files: RepoFile[] = [];
	for (const path of wanted) {
		if (path === "package.json" && pkgContent !== undefined) {
			files.push({ path, content: pkgContent });
			continue;
		}
		const content = await client.getFile(owner, repo, path, sha);
		if (content !== undefined) files.push({ path, content });
	}

	return { snapshot: { owner, repo, defaultBranch, commitSha: sha, files } };
}
