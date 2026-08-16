import { useI18n } from "../lib/i18n";

const KIND: Record<string, string> = {
	FORMAT_VERIFIED: "badge-success",
	FEATURED: "badge-warning",
	DETECTED: "badge-info",
	CANDIDATE: "badge-ghost",
	REJECTED: "badge-error",
	COMPATIBLE: "badge-success",
	LIKELY_COMPATIBLE: "badge-success",
	OUTDATED: "badge-warning",
	INCOMPATIBLE: "badge-error",
	UNKNOWN: "badge-ghost",
	PASSED: "badge-success",
	REVIEW: "badge-warning",
	FAILED: "badge-error",
	ACTIVE: "badge-success",
	INACTIVE: "badge-warning",
	ARCHIVED: "badge-error",
	LOW: "badge-success",
	MEDIUM: "badge-warning",
	HIGH: "badge-error",
	CRITICAL: "badge-error",
};

export function Badge({ value, label }: { value: string; label?: string }) {
	const { t } = useI18n();
	const kind = KIND[value] ?? "badge-ghost";
	const text = label ?? t("badge." + value, undefined, value.replace(/_/g, " ").toLowerCase());
	return <span className={"badge badge-sm " + kind}>{text}</span>;
}
