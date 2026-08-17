import { setFeatured } from "../db/repository";
import type { RepositoryRow } from "../db/repository";
import type { Finding } from "../domain/finding";
import type { Env } from "../env";
import type { ScanResult } from "../scanner";

/**
 * Star threshold for auto-featuring. Override per environment with the
 * `AUTO_FEATURE_MIN_STARS` var (declared in wrangler.json). Set it to 0 to
 * drop the star gate entirely and feature every qualifying plugin.
 */
export const AUTO_FEATURE_DEFAULT_MIN_STARS = 100;

export function parseAutoFeatureMinStars(raw: string | undefined): number {
  const trimmed = raw?.trim();
  if (!trimmed) return AUTO_FEATURE_DEFAULT_MIN_STARS;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0
    ? Math.floor(n)
    : AUTO_FEATURE_DEFAULT_MIN_STARS;
}

function hasBlockingSecurityFinding(findings: Finding[]): boolean {
  return findings.some(
    (f) =>
      f.category === "SECURITY" &&
      (f.severity === "HIGH" || f.severity === "CRITICAL"),
  );
}

function hasFeatureEligibleVerification(status: string): boolean {
  return status === "FORMAT_VERIFIED" || status === "DETECTED";
}

/**
 * Auto-feature gate. A plugin is promoted automatically when it is at least
 * detected as a DSH plugin, clears the star bar, and carries no blocking
 * (HIGH/CRITICAL) security finding. CANDIDATE repositories remain excluded.
 */
export function shouldAutoFeature(opts: {
  stars: number;
  verificationStatus: string;
  findings: Finding[];
  minStars: number;
}): boolean {
  if (opts.stars < opts.minStars) return false;
  if (!hasFeatureEligibleVerification(opts.verificationStatus)) return false;
  if (hasBlockingSecurityFinding(opts.findings)) return false;
  return true;
}

/** Promote a freshly scanned repo to featured when it clears the auto-feature gate. */
export async function maybeAutoFeatureScan(
  env: Env,
  repo: RepositoryRow,
  result: ScanResult,
): Promise<boolean> {
  // A repository that is reclassified as a non-plugin candidate must not keep
  // a stale featured flag from an earlier/manual classification.
  if (result.verificationStatus === "CANDIDATE") {
    await setFeatured(env.DB, repo.owner, repo.name, false);
    return false;
  }

  const minStars = parseAutoFeatureMinStars(env.AUTO_FEATURE_MIN_STARS);
  if (
    !shouldAutoFeature({
      stars: repo.stars,
      verificationStatus: result.verificationStatus,
      findings: result.findings,
      minStars,
    })
  ) {
    return false;
  }
  return setFeatured(env.DB, repo.owner, repo.name, true);
}

interface FeaturedCandidate {
  owner: string;
  name: string;
  stars: number;
  verificationStatus: string;
  featured: number;
  blockingSecurityCount: number;
}

/**
 * Backfill pass that promotes every existing, already-scanned plugin clearing
 * the auto-feature gate. It never demotes an already-featured plugin, so any
 * manual curation is preserved. Used by the hourly cron and the internal
 * `POST /featured/recompute` endpoint.
 */
export async function recomputeFeatured(
  env: Env,
): Promise<{ promoted: number }> {
  const minStars = parseAutoFeatureMinStars(env.AUTO_FEATURE_MIN_STARS);
  const rows = await env.DB.prepare(
    `SELECT
				r.owner AS owner,
				r.name AS name,
				r.stars AS stars,
				p.verification_status AS verificationStatus,
				p.featured AS featured,
				(SELECT COUNT(*) FROM scan_findings f
				 WHERE f.scan_id = p.latest_scan_id
				   AND f.category = 'SECURITY'
				   AND f.severity IN ('HIGH', 'CRITICAL')) AS blockingSecurityCount
			FROM plugins p
			JOIN repositories r ON r.id = p.repository_id
			WHERE p.latest_scan_id IS NOT NULL`,
  ).all<FeaturedCandidate>();

  let promoted = 0;
  for (const row of rows.results ?? []) {
    if (row.featured === 1) continue;
    if (row.stars < minStars) continue;
    if (!hasFeatureEligibleVerification(row.verificationStatus)) continue;
    if (row.blockingSecurityCount > 0) continue;
    const ok = await setFeatured(env.DB, row.owner, row.name, true);
    if (ok) promoted++;
  }
  return { promoted };
}
