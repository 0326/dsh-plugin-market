import type { Finding } from "../domain/finding";
import { SCANNER_VERSION, type ScanJobError } from "../domain/scan";
import type { GithubRepo } from "../github/client";
import type { ScanResult } from "../scanner";
import type { CompatibilityBaseline } from "../scanner/compatibility";

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
	preview_image_url: string | null;
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
	previewImageUrl: string | null;
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
	featured?: boolean;
	capability?: string;
	pluginType?: string;
	compatibility?: string;
	risk?: string;
	owner?: string;
	sort?: "updated" | "stars" | "new" | "trending";
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
						owner = ?, name = ?, full_name = ?, html_url = ?, description = ?, default_branch = ?,
					stars = ?, forks = ?, license_spdx = ?, archived = ?, github_updated_at = ?,
					github_pushed_at = ?, last_checked_at = ?, updated_at = ?
				WHERE id = ?`,
			)
			.bind(
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

export async function getRepositoryById(db: D1Database, id: number): Promise<RepositoryRow | null> {
	return db.prepare("SELECT * FROM repositories WHERE id = ?").bind(id).first<RepositoryRow>();
}

export async function updateRepositorySha(db: D1Database, id: number, sha: string): Promise<void> {
	await db.prepare("UPDATE repositories SET default_branch_sha = ?, updated_at = ? WHERE id = ?").bind(sha, new Date().toISOString(), id).run();
}

/** Store the social preview image URL for a repository (best-effort, idempotent). */
export async function updateRepositoryPreviewImage(db: D1Database, fullName: string, previewImageUrl: string): Promise<void> {
	await db
		.prepare("UPDATE repositories SET preview_image_url = ?, updated_at = ? WHERE full_name = ?")
		.bind(previewImageUrl, new Date().toISOString(), fullName)
		.run();
}

function splitFacetFilter(raw: string | undefined): string[] {
	if (!raw) return [];
	return [...new Set(raw.split(",").map((value) => value.trim()).filter(Boolean))].slice(0, 32);
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
	if (opts.featured) where.push("p.featured = 1");
	if (opts.compatibility) {
		where.push("p.compatibility_status = ?");
		params.push(opts.compatibility);
	}
	if (opts.risk) {
		where.push("p.risk_level = ?");
		params.push(opts.risk);
	}
	const capabilityFilters = splitFacetFilter(opts.capability);
	if (capabilityFilters.length > 0) {
		where.push("(" + capabilityFilters.map(() => "p.capabilities_json LIKE ?").join(" OR ") + ")");
		params.push(...capabilityFilters.map((value) => '%"' + value + '"%'));
	}
	const pluginTypeFilters = splitFacetFilter(opts.pluginType);
	if (pluginTypeFilters.length > 0) {
		where.push("(" + pluginTypeFilters.map(() => "p.plugin_types_json LIKE ?").join(" OR ") + ")");
		params.push(...pluginTypeFilters.map((value) => '%"' + value + '"%'));
	}
	if (opts.owner) {
		where.push("r.owner = ?");
		params.push(opts.owner);
	}
	if (opts.q) {
		where.push("(r.full_name LIKE ? OR r.description LIKE ? OR p.package_name LIKE ?)");
		const like = "%" + opts.q + "%";
		params.push(like, like, like);
	}

	let orderBy = "r.updated_at DESC";
	if (opts.sort === "stars") orderBy = "r.stars DESC";
	else if (opts.sort === "new") orderBy = "r.discovered_at DESC";
	else if (opts.sort === "trending") {
		where.push("r.github_pushed_at >= ?");
		params.push(new Date(Date.now() - 90 * 86_400_000).toISOString());
		orderBy = "r.stars DESC";
	}

	const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
	const sql =
		`SELECT r.owner, r.name AS repo, r.full_name AS fullName, r.description, r.stars,
			p.verification_status AS verificationStatus, p.compatibility_status AS compatibilityStatus,
			p.security_status AS securityStatus, p.maintenance_status AS maintenanceStatus,
			p.risk_level AS riskLevel, p.package_name AS packageName,
			s.commit_sha AS latestCommitSha, p.updated_at AS updatedAt, r.preview_image_url AS previewImageUrl
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
				r.license_spdx AS licenseSpdx, r.preview_image_url AS previewImageUrl,
				p.verification_status AS verificationStatus, p.compatibility_status AS compatibilityStatus,
				p.security_status AS securityStatus, p.maintenance_status AS maintenanceStatus, p.risk_level AS riskLevel,
					p.featured, p.metadata_json AS metadataJson, p.package_name AS packageName, p.updated_at AS updatedAt,
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
		previewImageUrl: row.previewImageUrl,
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

export async function createScan(db: D1Database, repositoryId: number, commitSha: string): Promise<{ id: number; created: boolean }> {
	const existing = await db
		.prepare("SELECT id, status FROM scans WHERE repository_id = ? AND commit_sha = ? AND scanner_version = ?")
		.bind(repositoryId, commitSha, SCANNER_VERSION)
		.first<{ id: number; status: string }>();
	if (existing?.status === "completed") return { id: existing.id, created: false };
	if (existing) return { id: existing.id, created: true };
	const now = new Date().toISOString();
	const res = await db
		.prepare("INSERT OR IGNORE INTO scans (repository_id, commit_sha, scanner_version, status, started_at) VALUES (?, ?, ?, 'running', ?)")
		.bind(repositoryId, commitSha, SCANNER_VERSION, now)
		.run();
	if (res.meta.changes === 0) {
		const row = await db
			.prepare("SELECT id FROM scans WHERE repository_id = ? AND commit_sha = ? AND scanner_version = ?")
			.bind(repositoryId, commitSha, SCANNER_VERSION)
			.first<{ id: number }>();
		if (!row) throw new Error("scan insert did not return an id");
		return { id: row.id, created: true };
	}
	return { id: res.meta.last_row_id, created: true };
}

export async function completeScan(db: D1Database, scanId: number, result: ScanResult): Promise<void> {
	const now = new Date().toISOString();
	const metadataJson = JSON.stringify(result.metadata);
	const capabilitiesJson = JSON.stringify(result.metadata.capabilities ?? []);
	const pluginTypesJson = JSON.stringify(result.metadata.pluginTypes ?? []);
	const existing = await db.prepare("SELECT id FROM plugins WHERE repository_id = (SELECT repository_id FROM scans WHERE id = ?)").bind(scanId).first<{ id: number }>();
	const statements = [
		db.prepare("UPDATE scans SET status = 'completed', completed_at = ?, error_code = NULL, error_message = NULL WHERE id = ?").bind(now, scanId),
		db.prepare("DELETE FROM scan_findings WHERE scan_id = ?").bind(scanId),
	];
	for (const f of result.findings) {
		statements.push(
			db.prepare("INSERT INTO scan_findings (scan_id, category, code, severity, title, detail, file_path, evidence_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(scanId, f.category, f.code, f.severity, f.title, f.detail ?? null, f.filePath ?? null, JSON.stringify(f.evidence ?? {}), now),
		);
	}
	if (existing) {
		statements.push(
			db.prepare(
				`UPDATE plugins SET package_name = ?, package_version = ?, plugin_name = ?, description = ?,
					verification_status = ?, compatibility_status = ?, security_status = ?, maintenance_status = ?,
					risk_level = ?, latest_scan_id = ?, metadata_json = ?, capabilities_json = ?, plugin_types_json = ?, updated_at = ? WHERE id = ?`,
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
				capabilitiesJson,
				pluginTypesJson,
				now,
				existing.id,
				),
			);
	} else {
		statements.push(
			db.prepare(
				`INSERT INTO plugins (repository_id, package_name, package_version, plugin_name, description,
					verification_status, compatibility_status, security_status, maintenance_status, risk_level,
					latest_scan_id, metadata_json, capabilities_json, plugin_types_json, created_at, updated_at)
				SELECT repository_id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM scans WHERE id = ?`,
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
				capabilitiesJson,
				pluginTypesJson,
				now,
				now,
				scanId,
				),
			);
	}
	await db.batch(statements);
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

// --- Compatibility baseline ---

export async function getBaseline(db: D1Database): Promise<CompatibilityBaseline | null> {
	return db
		.prepare("SELECT dsh_version AS dshVersion, cordis_version AS cordisVersion, checked_at AS checkedAt FROM baseline WHERE id = 1")
		.first<CompatibilityBaseline>();
}

export async function upsertBaseline(db: D1Database, baseline: CompatibilityBaseline): Promise<void> {
	await db
		.prepare("INSERT OR REPLACE INTO baseline (id, dsh_version, cordis_version, checked_at, updated_at) VALUES (1, ?, ?, ?, ?)")
		.bind(baseline.dshVersion, baseline.cordisVersion, baseline.checkedAt, baseline.checkedAt)
		.run();
}

// --- Registry stats ---

export interface RegistryStats {
	total: number;
	verified: number;
	featured: number;
	updatedThisWeek: number;
	lastScanAt: string | null;
}

export async function getStats(db: D1Database): Promise<RegistryStats> {
	const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
	const row = await db
		.prepare(
			`SELECT
				(SELECT COUNT(*) FROM repositories) AS total,
				(SELECT COUNT(*) FROM plugins WHERE verification_status = 'FORMAT_VERIFIED') AS verified,
				(SELECT COUNT(*) FROM plugins WHERE featured = 1) AS featured,
				(SELECT COUNT(*) FROM repositories WHERE github_pushed_at >= ?) AS updatedThisWeek,
				(SELECT MAX(completed_at) FROM scans) AS lastScanAt`,
		)
		.bind(weekAgo)
		.first<RegistryStats>();
	return row ?? { total: 0, verified: 0, featured: 0, updatedThisWeek: 0, lastScanAt: null };
}

// --- Scan history ---

export interface ScanRow {
	id: number;
	commitSha: string;
	scannerVersion: string;
	status: string;
	startedAt: string;
	completedAt: string | null;
	errorCode: string | null;
}

export async function listPluginScans(db: D1Database, owner: string, repo: string): Promise<ScanRow[]> {
	const res = await db
		.prepare(
			`SELECT s.id, s.commit_sha AS commitSha, s.scanner_version AS scannerVersion, s.status,
				s.started_at AS startedAt, s.completed_at AS completedAt, s.error_code AS errorCode
			FROM scans s JOIN repositories r ON r.id = s.repository_id
			WHERE r.owner = ? AND r.name = ? ORDER BY s.id DESC LIMIT 50`,
		)
		.bind(owner, repo)
		.all<ScanRow>();
	return res.results ?? [];
}

// --- Featured curation ---

export async function setFeatured(db: D1Database, owner: string, repo: string, featured: boolean): Promise<boolean> {
	const res = await db
		.prepare("UPDATE plugins SET featured = ?, updated_at = ? WHERE repository_id = (SELECT id FROM repositories WHERE owner = ? AND name = ?)")
		.bind(featured ? 1 : 0, new Date().toISOString(), owner, repo)
		.run();
	return res.meta.changes > 0;
}

// --- Publisher ---

export interface PublisherInfo {
	owner: string;
	repos: PluginListItem[];
	totalStars: number;
	verifiedCount: number;
}

export async function getPublisher(db: D1Database, owner: string): Promise<PublisherInfo | null> {
	const repos = await listPlugins(db, { owner, limit: 100 });
	if (repos.length === 0) return null;
	const totalStars = repos.reduce((sum, p) => sum + p.stars, 0);
	const verifiedCount = repos.filter((p) => p.verificationStatus === "FORMAT_VERIFIED").length;
	return { owner, repos, totalStars, verifiedCount };
}

// --- Discovery state (checkpointing) ---

export interface DiscoveryShard {
	id: number;
	windowStart: string;
	windowEnd: string;
	page: number;
}

export async function listPendingDiscoveryShards(db: D1Database, source: string, query: string): Promise<DiscoveryShard[]> {
	const res = await db
		.prepare(
			"SELECT id, window_start AS windowStart, window_end AS windowEnd, page FROM discovery_state WHERE source = ? AND query = ? AND status = 'pending' ORDER BY id",
		)
		.bind(source, query)
		.all<DiscoveryShard>();
	return res.results ?? [];
}

export async function insertDiscoveryShards(db: D1Database, source: string, query: string, windows: { start: string; end: string }[]): Promise<void> {
	if (windows.length === 0) return;
	const now = new Date().toISOString();
	const stmt = db.prepare(
		"INSERT INTO discovery_state (source, query, window_start, window_end, page, status, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 'pending', ?, ?)",
	);
	await db.batch(windows.map((w) => stmt.bind(source, query, w.start, w.end, now, now)));
}

export async function clearDiscoveryShards(db: D1Database, source: string, query: string): Promise<void> {
	await db.prepare("DELETE FROM discovery_state WHERE source = ? AND query = ?").bind(source, query).run();
}

export async function updateDiscoveryShard(db: D1Database, id: number, page: number, status: "pending" | "done"): Promise<void> {
	const now = new Date().toISOString();
	await db.prepare("UPDATE discovery_state SET page = ?, status = ?, updated_at = ?, last_run_at = ? WHERE id = ?").bind(page, status, now, now, id).run();
}
