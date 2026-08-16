import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { InstallCard } from "../components/InstallCard";
import { useI18n } from "../lib/i18n";
import { getPlugin, getScans, type Finding, type PluginDetail as Detail, type ScanRow } from "../lib/api";

type Tab = "overview" | "compatibility" | "security" | "versions";

interface Metadata {
	packageName?: string;
	packageVersion?: string;
	license?: string;
	homepage?: string;
	repositoryUrl?: string;
	nodeRange?: string;
	cordisRange?: string;
	dshBundlePatch?: string;
	clientPlatform?: string;
	installScripts?: string[];
	capabilities?: string[];
	pluginTypes?: string[];
}

function parseMetadata(json: string | null): Metadata | null {
	if (!json) return null;
	try {
		return JSON.parse(json) as Metadata;
	} catch {
		return null;
	}
}

function FindingsList({ findings }: { findings: Finding[] }) {
	const { t } = useI18n();
	if (findings.length === 0) return <p className="empty">{t("detail.noFindings")}</p>;
	return (
		<ul className="findings">
			{findings.map((f, i) => (
				<li key={i} className="finding">
					<div className="finding-head">
						<Badge value={f.severity} />
						<strong>{f.title}</strong>
					</div>
					{f.detail && <p>{f.detail}</p>}
					{f.filePath && <code className="finding-file">{f.filePath}</code>}
				</li>
			))}
		</ul>
	);
}

function ScansList({ scans }: { scans: ScanRow[] }) {
	const { t } = useI18n();
	if (scans.length === 0) return <p className="empty">{t("detail.noScanHistory")}</p>;
	return (
		<ul className="findings">
			{scans.map((s) => {
				const kind = s.status === "completed" ? "PASSED" : s.status === "failed" ? "FAILED" : "UNKNOWN";
				const statusLabel =
					s.status === "completed"
						? t("detail.scanStatusPassed")
						: s.status === "failed"
							? t("detail.scanStatusFailed")
							: t("detail.scanStatusUnknown");
				return (
					<li key={s.id} className="finding">
						<div className="finding-head">
							<Badge value={kind} label={statusLabel} />
							<code>{s.commitSha.slice(0, 12)}</code>
						</div>
						<p>{t("detail.scanRow", { ver: s.scannerVersion, at: s.completedAt ?? s.startedAt })}</p>
						{s.errorCode && <p>{t("detail.scanError", { code: s.errorCode })}</p>}
					</li>
				);
			})}
		</ul>
	);
}

export default function PluginDetail({ owner, repo }: { owner: string; repo: string }) {
	const { t } = useI18n();
	const [detail, setDetail] = useState<Detail | null>(null);
	const [scans, setScans] = useState<ScanRow[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>("overview");

	useEffect(() => {
		let ignore = false;
		getPlugin(owner, repo)
			.then((d) => {
				if (!ignore) setDetail(d);
			})
			.catch((err) => {
				if (!ignore) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			ignore = true;
		};
	}, [owner, repo]);

	useEffect(() => {
		let ignore = false;
		getScans(owner, repo)
			.then((r) => {
				if (!ignore) setScans(r.scans);
			})
			.catch(() => {
				if (!ignore) setScans([]);
			});
		return () => {
			ignore = true;
		};
	}, [owner, repo]);

	if (error) return <p className="error">{t("detail.loadError", { msg: error })}</p>;
	if (!detail) return <p className="empty">{t("common.loading")}</p>;

	const metadata = parseMetadata(detail.metadataJson);

	return (
		<section className="detail-layout">
			<div className="detail-main">
				<div className="detail-header">
					<h1>{detail.fullName}</h1>
					<p className="plugin-desc">{detail.description ?? t("common.noDescription")}</p>
					<p className="plugin-publisher">
						{t("detail.by")}{" "}
						<a href={"#/publisher/" + detail.owner}>{detail.owner}</a>
					</p>
					<div className="detail-badges">
						<Badge value={detail.verificationStatus} />
						<Badge value={detail.compatibilityStatus} />
						<Badge value={detail.securityStatus} />
						<Badge value={detail.maintenanceStatus} />
					</div>
				</div>
				<div className="tabs">
					<button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>{t("detail.overview")}</button>
					<button className={tab === "compatibility" ? "active" : ""} onClick={() => setTab("compatibility")}>{t("detail.compatibility")}</button>
					<button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}>{t("detail.security")}</button>
					<button className={tab === "versions" ? "active" : ""} onClick={() => setTab("versions")}>{t("detail.versions")}</button>
				</div>
				{tab === "overview" && (
					<div className="overview">
						{metadata && (
							<dl className="meta-rows">
								{metadata.packageName && <><dt>{t("detail.package")}</dt><dd>{metadata.packageName}{metadata.packageVersion ? " @" + metadata.packageVersion : ""}</dd></>}
								{metadata.cordisRange && <><dt>{t("detail.cordis")}</dt><dd>{metadata.cordisRange}</dd></>}
								{metadata.nodeRange && <><dt>{t("detail.node")}</dt><dd>{metadata.nodeRange}</dd></>}
								{metadata.dshBundlePatch && <><dt>{t("detail.bundlePatch")}</dt><dd><code>{metadata.dshBundlePatch}</code></dd></>}
								{(metadata.capabilities?.length ?? 0) > 0 && <><dt>{t("detail.capabilities")}</dt><dd>{metadata.capabilities?.join(", ")}</dd></>}
								{(metadata.pluginTypes?.length ?? 0) > 0 && <><dt>{t("detail.types")}</dt><dd>{metadata.pluginTypes?.join(", ")}</dd></>}
								{(metadata.installScripts?.length ?? 0) > 0 && <><dt>{t("detail.installScripts")}</dt><dd>{metadata.installScripts?.join(", ")}</dd></>}
							</dl>
						)}
						{detail.latestCommitSha && (
							<p className="hint">
								{t("detail.scannedAt", { sha: detail.latestCommitSha, ver: detail.scannerVersion ?? "", at: detail.scannedAt ?? "" })}
							</p>
						)}
					</div>
				)}
				{tab === "compatibility" && <FindingsList findings={detail.findings.filter((f) => f.category === "COMPATIBILITY")} />}
				{tab === "security" && <FindingsList findings={detail.findings.filter((f) => f.category === "SECURITY")} />}
				{tab === "versions" && <ScansList scans={scans} />}
			</div>
			<InstallCard plugin={detail} />
		</section>
	);
}
