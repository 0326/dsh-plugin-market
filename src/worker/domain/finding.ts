/** Evidence-first findings produced by the static scanner. */

export const FINDING_CATEGORY = ["FORMAT", "COMPATIBILITY", "SECURITY", "MAINTENANCE"] as const;
export type FindingCategory = (typeof FINDING_CATEGORY)[number];

export const SEVERITY = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"] as const;
export type Severity = (typeof SEVERITY)[number];

export interface Finding {
	category: FindingCategory;
	code: string;
	severity: Severity;
	title: string;
	detail?: string;
	filePath?: string;
	evidence?: Record<string, unknown>;
}

/** Ordering used to derive a plugin-wide risk level from findings. */
export const SEVERITY_RANK: Record<Severity, number> = {
	INFO: 0,
	LOW: 1,
	MEDIUM: 2,
	HIGH: 3,
	CRITICAL: 4,
	UNKNOWN: 0,
};
