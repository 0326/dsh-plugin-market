const KIND: Record<string, string> = {
	FORMAT_VERIFIED: "ok",
	FEATURED: "accent",
	DETECTED: "info",
	CANDIDATE: "muted",
	REJECTED: "bad",
	COMPATIBLE: "ok",
	LIKELY_COMPATIBLE: "ok",
	OUTDATED: "warn",
	INCOMPATIBLE: "bad",
	UNKNOWN: "muted",
	PASSED: "ok",
	REVIEW: "warn",
	FAILED: "bad",
	ACTIVE: "ok",
	INACTIVE: "warn",
	ARCHIVED: "bad",
	LOW: "ok",
	MEDIUM: "warn",
	HIGH: "bad",
	CRITICAL: "bad",
};

export function Badge({ value, label }: { value: string; label?: string }) {
	const kind = KIND[value] ?? "muted";
	return <span className={"badge badge-" + kind}>{label ?? value.replace(/_/g, " ").toLowerCase()}</span>;
}
