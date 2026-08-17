/** Scan job and scan-result summary types. */

export type ScanReason = "DISCOVERY" | "COMMIT_CHANGED" | "MANUAL" | "SCANNER_UPGRADE";

/** Current scanner version; every scan is bound to it. */
export const SCANNER_VERSION = "0.3.0";

/** Message body placed on the scan queue. */
export interface ScanJob {
	repositoryId: number;
	owner: string;
	repo: string;
	expectedSha?: string;
	reason: ScanReason;
}

export type ScanFailureCode =
	| "GITHUB_RATE_LIMITED"
	| "REPO_NOT_FOUND"
	| "REPO_PRIVATE"
	| "TREE_TOO_LARGE"
	| "MANIFEST_INVALID"
	| "PATCH_INVALID"
	| "SCAN_TIMEOUT"
	| "INTERNAL_ERROR";

export interface ScanJobError {
	code: ScanFailureCode;
	message: string;
}
