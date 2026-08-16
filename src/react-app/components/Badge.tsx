import { useI18n } from "../lib/i18n";

const KIND: Record<string, string> = {
	FORMAT_VERIFIED: "ok",
	FEATURED: "featured",
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
	const { t } = useI18n();
	const kind = KIND[value] ?? "muted";
	const text = label ?? t("badge." + value, undefined, value.replace(/_/g, " ").toLowerCase());
	return <span className={"badge badge-" + kind}>{text}</span>;
}
