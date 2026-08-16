import type { Finding } from "../domain/finding";
import { SCANNER_VERSION, type ScanJobError } from "../domain/scan";
import type { GithubRepo } from "../github/client";
import type { ScanResult } from "../scanner";

export interface RepositoryRow {
	id: number;
	owner: string;
	name: string;
	full_name: string;
	html_url: string;
	description: string | null;
	default_branch: string | null;
	default_branch_sha: string | null;
	stars: number;
	forks: number;
	license_spdx: string | null;
	archived: number;
	github_created_at: string | null;
	github_updated_at: string | null;
	github_pushed_at: string | null;
	discovered_at: string;
	last_checked_at: string | null;
}

export interface PluginListItem {
	owner: string;
	repo: string;
	fullName: string;
	description: string | null;
	stars: number;
	verificationStatus: string;
	compatibilityStatus: string;
	securityStatus: string;
	maintenanceStatus: string;
	riskLevel: string;
	packageName: string | null;
	latestCommitSha: string | null;
	updatedAt: string | null;
}

export interface PluginDetail extends PluginListItem {
	htmlUrl: string;
	forks: number;
	licenseSpdx: string | null;
	featured: number;
	metadataJson: string | null;
	scannerVersion: string | null;
	scannedAt: string | null;
	findings: Finding[];
}

export interface ListPluginsOptions {
	q?: string;
	status?: string;
	verifiedOnly?: boolean;
	sort?: "updated" | "stars" | "new";
	limit?: number;
	offset?: number;
}

export async function upsertRepository(db: D1Database, repo: GithubRepo): Promise<{ id: number; changed: boolean }> {
	const now = new Date().toISOString();
	const existing = await db
		.prepare("SELECT id, github_pushed_at FROM repositories WHERE github_id = ?")
		.bind(repo.id)
		.first<{ id: number; github_pushed_at: string | null }>();

	if (existing) {
		const changed = existing.github_pushed_at !== repo.pushed_at;
		await db
			.prepare(
				`UPDATE repositories SET
					name = ?, full_name = ?, html_url = ?, description = ?, default_branch = ?,
					stars = ?, forks = ?, license_spdx = ?, archived = ?, github_updated_at = ?,
					github_pushed_at = ?, last_checked_at = ?, updated_at = ?
				WHERE id = ?`,
			)
			.bind(
				repo.name,
				repo.full_name,
				repo.html_url,
				repo.description,
				repo.default_branch,
				repo.stargazers_count,
				repo.forks_count,
				repo.license?.spdx_id ?? null,
				repo.archived ? 1 : 0,
				repo.updated_at,
				repo.pushed_at,
				now,
				now,
				existing.id,
			)
			.run();
		return { id: existing.id, changed };
	}

	const res = await db
		.prepare(
			`INSERT INTO repositories (
				github_id, owner, name, full_name, html_url, description, default_branch, stars, forks,
				license_spdx, archived, github_created_at, github_updated_at, github_pushed_at,
				discovered_at, last_checked_at, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.bind(
			repo.id,
			repo.owner.login,
			repo.name,
			repo.full_name,
			repo.html_url,
			repo.description,
			repo.default_branch,
			repo.stargazers_count,
			repo.forks_count,
			repo.license?.spdx_id ?? null,
			repo.archived ? 1 : 0,
			repo.created_at,
			repo.updated_at,
			repo.pushed_at,
			now,
			now,
			now,
			now,
		)
		.run();
	return { id: res.meta.last_row_id, changed: true };
}

export async function getRepositoryByFullName(db: D1Database, fullName: string): Promise<RepositoryRow | null> {
	return db
		.prepare("SELECT * FROM repositories WHERE full_name = ?")
		.bind(fullName)
		.first<RepositoryRow>();
}

export async function updateRepositorySha(db: D1Database, id: number, sha: string): Promise<void> {
	await db.prepare("UPDATE repositories SET default_branch_sha = ?, updated_at = ? WHERE id = ?").bind(sha, new Date().toISOString(), id).run();
}

export async function listPlugins(db: D1Database, opts: ListPluginsOptions = {}): Promise<PluginListItem[]> {
	const limit = opts.limit ?? 50;
	const offset = opts.offset ?? 0;
	const where: string[] = [];
	const params: unknown[] = [];
	if (opts.verifiedOnly) where.push("p.verification_status = 'FORMAT_VERIFIED'");
	if (opts.status) {
		where.push("p.verification_status = ?");
		params.push(opts.status);
	}
	if (opts.q) {
		where.push("(r.full_name LIKE ? OR r.description LIKE ? OR p.package_name LIKE ?)");
		const like = "%" + opts.q + "%";
		params.push(like, like, like);
	}
	const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
	const orderBy = opts.sort === "stars" ? "r.stars DESC" : opts.sort === "new" ? "r.discovered_at DESC" : "r.updated_at DESC";
	const sql =
		`SELECT r.owner, r.name AS repo, r.full_name AS fullName, r.description, r.stars,
			p.verification_status AS verificationStatus, p.compatibility_status AS compatibilityStatus,
			p.security_status AS securityStatus, p.maintenance_status AS maintenanceStatus,
			p.risk_level AS riskLevel, p.package_name AS packageName,
			s.commit_sha AS latestCommitSha, p.updated_at AS updatedAt
		FROM plugins p
		JOIN repositories r ON r.id = p.repository_id
		LEFT JOIN scans s ON s.id = p.latest_scan_id
		${whereSql}
		ORDER BY ${orderBy}
		LIMIT ? OFFSET ?`;
	const res = await db.prepare(sql).bind(...params, limit, offset).all<PluginListItem>();
	return res.results ?? [];
}

export async function getPlugin(db: D1Database, owner: string, repo: string): Promise<PluginDetail | null> {
	const row = await db
		.prepare(
			`SELECT r.owner, r.name AS repo, r.full_name AS fullName, r.html_url AS htmlUrl, r.description, r.stars, r.forks,
				r.license_spdx AS licenseSpdx,
				p.verification_status AS verificationStatus, p.compatibility_status AS compatibilityStatus,
				p.security_status AS securityStatus, p.maintenance_status AS maintenanceStatus, p.risk_level AS riskLevel,
				p.featured, p.metadata_json AS metadataJson,
				s.commit_sha AS latestCommitSha, s.scanner_version AS scannerVersion, s.completed_at AS scannedAt, s.id AS scanId
			FROM plugins p
			JOIN repositories r ON r.id = p.repository_id
			LEFT JOIN scans s ON s.id = p.latest_scan_id
			WHERE r.owner = ? AND r.name = ?`,
		)
		.bind(owner, repo)
		.first<PluginDetail & { scanId: number | null }>();

	if (!row) return null;
	const findings = row.scanId === null ? [] : await listFindings(db, row.scanId);
	return {
		owner: row.owner,
		repo: row.repo,
		fullName: row.fullName,
		htmlUrl: row.htmlUrl,
		description: row.description,
		stars: row.stars,
		forks: row.forks,
		licenseSpdx: row.licenseSpdx,
		verificationStatus: row.verificationStatus,
		compatibilityStatus: row.compatibilityStatus,
		securityStatus: row.securityStatus,
		maintenanceStatus: row.maintenanceStatus,
		riskLevel: row.riskLevel,
		featured: row.featured,
		metadataJson: row.metadataJson,
		latestCommitSha: row.latestCommitSha,
		scannerVersion: row.scannerVersion,
		scannedAt: row.scannedAt,
		packageName: row.packageName,
		updatedAt: row.updatedAt,
		findings,
	};
}

export async function createScan(db: D1Database, repositoryId: number, commitSha: string): Promise<number> {
	const now = new Date().toISOString();
	await db
		.prepare("INSERT OR IGNORE INTO scans (repository_id, commit_sha, scanner_version, status, started_at) VALUES (?, ?, ?, 'running', ?)")
		.bind(repositoryId, commitSha, SCANNER_VERSION, now)
		.run();
	const row = await db
		.prepare("SELECT id FROM scans WHERE repository_id = ? AND commit_sha = ? AND scanner_version = ?")
		.bind(repositoryId, commitSha, SCANNER_VERSION)
		.first<{ id: number }>();
	return row ? row.id : 0;
}

export async function completeScan(db: D1Database, scanId: number, result: ScanResult): Promise<void> {
	const now = new Date().toISOString();
	await db.prepare("UPDATE scans SET status = 'completed', completed_at = ? WHERE id = ?").bind(now, scanId).run();
	await addFindings(db, scanId, result.findings);

	const metadataJson = JSON.stringify(result.metadata);
	const existing = await db.prepare("SELECT id FROM plugins WHERE repository_id = (SELECT repository_id FROM scans WHERE id = ?)").bind(scanId).first<{ id: number }>();
	if (existing) {
		await db
			.prepare(
				`UPDATE plugins SET package_name = ?, package_version = ?, plugin_name = ?, description = ?,
					verification_status = ?, compatibility_status = ?, security_status = ?, maintenance_status = ?,
					risk_level = ?, latest_scan_id = ?, metadata_json = ?, updated_at = ? WHERE id = ?`,
			)
			.bind(
				result.metadata.packageName ?? null,
				result.metadata.packageVersion ?? null,
				result.metadata.pluginName ?? null,
				result.metadata.description ?? null,
				result.verificationStatus,
				result.compatibilityStatus,
				result.securityStatus,
				result.maintenanceStatus,
				result.riskLevel,
				scanId,
				metadataJson,
				now,
				existing.id,
			)
			.run();
	} else {
		await db
			.prepare(
				`INSERT INTO plugins (repository_id, package_name, package_version, plugin_name, description,
					verification_status, compatibility_status, security_status, maintenance_status, risk_level,
					latest_scan_id, metadata_json, created_at, updated_at)
				SELECT repository_id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM scans WHERE id = ?`,
			)
			.bind(
				result.metadata.packageName ?? null,
				result.metadata.packageVersion ?? null,
				result.metadata.pluginName ?? null,
				result.metadata.description ?? null,
				result.verificationStatus,
				result.compatibilityStatus,
				result.securityStatus,
				result.maintenanceStatus,
				result.riskLevel,
				scanId,
				metadataJson,
				now,
				now,
				scanId,
			)
			.run();
	}
}

export async function failScan(db: D1Database, scanId: number, error: ScanJobError): Promise<void> {
	await db
		.prepare("UPDATE scans SET status = 'failed', error_code = ?, error_message = ?, completed_at = ? WHERE id = ?")
		.bind(error.code, error.message, new Date().toISOString(), scanId)
		.run();
}

export async function addFindings(db: D1Database, scanId: number, findings: Finding[]): Promise<void> {
	const now = new Date().toISOString();
	const stmt = db.prepare(
		"INSERT INTO scan_findings (scan_id, category, code, severity, title, detail, file_path, evidence_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
	);
	for (const f of findings) {
		await stmt.bind(scanId, f.category, f.code, f.severity, f.title, f.detail ?? null, f.filePath ?? null, JSON.stringify(f.evidence ?? {}), now).run();
	}
}

export async function listFindings(db: D1Database, scanId: number): Promise<Finding[]> {
	const res = await db
		.prepare("SELECT category, code, severity, title, detail, file_path AS filePath, evidence_json AS evidenceJson FROM scan_findings WHERE scan_id = ? ORDER BY id")
		.bind(scanId)
		.all<{ category: Finding["category"]; code: string; severity: Finding["severity"]; title: string; detail: string | null; filePath: string | null; evidenceJson: string | null }>();
	return (res.results ?? []).map((r) => ({
		category: r.category,
		code: r.code,
		severity: r.severity,
		title: r.title,
		detail: r.detail ?? undefined,
		filePath: r.filePath ?? undefined,
		evidence: r.evidenceJson ? (JSON.parse(r.evidenceJson) as Record<string, unknown>) : undefined,
	}));
}
