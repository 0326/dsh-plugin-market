import type { Finding } from "../domain/finding";
import { SEVERITY_RANK } from "../domain/finding";
import type { RiskLevel } from "../domain/plugin";

/** Derive security risk only from SECURITY findings; format, compatibility and maintenance are separate dimensions. */
export function deriveRiskLevel(findings: Finding[]): RiskLevel {
	let max = 0;
	for (const f of findings) {
		if (f.category !== "SECURITY") continue;
		const r = SEVERITY_RANK[f.severity];
		if (r > max) max = r;
	}
	if (max >= 4) return "CRITICAL";
	if (max === 3) return "HIGH";
	if (max === 2) return "MEDIUM";
	return "LOW";
}
