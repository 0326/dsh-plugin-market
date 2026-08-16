import type { Finding } from "../domain/finding";
import type { MaintenanceStatus } from "../domain/plugin";

export interface MaintenanceInput {
	archived: boolean;
	disabled: boolean;
	lastPushAt?: string;
	stars: number;
	forks: number;
}

export interface MaintenanceAnalysis {
	status: MaintenanceStatus;
	findings: Finding[];
}

const INACTIVE_DAYS = 180;

export function analyzeMaintenance(input: MaintenanceInput, now: number = Date.now()): MaintenanceAnalysis {
	const findings: Finding[] = [];
	if (input.archived) {
		findings.push({ category: "MAINTENANCE", code: "REPO_ARCHIVED", severity: "HIGH", title: "Repository is archived" });
	}
	if (input.disabled) {
		findings.push({ category: "MAINTENANCE", code: "REPO_DISABLED", severity: "HIGH", title: "Repository is disabled" });
	}

	let status: MaintenanceStatus;
	if (input.archived || input.disabled) {
		status = "ARCHIVED";
	} else if (input.lastPushAt) {
		const days = daysSince(input.lastPushAt, now);
		if (days === null) {
			status = "UNKNOWN";
		} else if (days > INACTIVE_DAYS) {
			status = "INACTIVE";
			findings.push({ category: "MAINTENANCE", code: "LAST_PUSH_OLD", severity: "MEDIUM", title: "Last push " + days + " days ago" });
		} else {
			status = "ACTIVE";
		}
	} else {
		status = "UNKNOWN";
	}
	return { status, findings };
}

function daysSince(iso: string, now: number): number | null {
	const t = Date.parse(iso);
	if (Number.isNaN(t)) return null;
	return Math.floor((now - t) / 86_400_000);
}
