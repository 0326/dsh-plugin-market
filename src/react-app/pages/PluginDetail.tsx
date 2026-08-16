import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { InstallCard } from "../components/InstallCard";
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
	if (findings.length === 0) return <p className="empty">No findings for this category.</p>;
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
	if (scans.length === 0) return <p className="empty">No scan history.</p>;
	return (
		<ul className="findings">
			{scans.map((s) => {
				const kind = s.status === "completed" ? "PASSED" : s.status === "failed" ? "FAILED" : "UNKNOWN";
				return (
					<li key={s.id} className="finding">
						<div className="finding-head">
							<Badge value={kind} label={s.status} />
							<code>{s.commitSha.slice(0, 12)}</code>
						</div>
						<p>scanner {s.scannerVersion} · {s.completedAt ?? s.startedAt}</p>
						{s.errorCode && <p>error: {s.errorCode}</p>}
					</li>
				);
			})}
		</ul>
	);
}

export default function PluginDetail({ owner, repo }: { owner: string; repo: string }) {
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

	if (error) return <p className="error">Failed to load plugin: {error}</p>;
	if (!detail) return <p className="empty">Loading…</p>;

	const metadata = parseMetadata(detail.metadataJson);

	return (
		<section className="detail-layout">
			<div className="detail-main">
				<h1>{detail.fullName}</h1>
				<p className="plugin-desc">{detail.description ?? "No description."}</p>
				<p className="hint">
					by <a href={"#/publisher/" + detail.owner}>{detail.owner}</a>
				</p>
				<div className="detail-badges">
					<Badge value={detail.verificationStatus} />
					<Badge value={detail.compatibilityStatus} />
					<Badge value={detail.securityStatus} />
					<Badge value={detail.maintenanceStatus} />
				</div>
				<div className="tabs">
					<button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview</button>
					<button className={tab === "compatibility" ? "active" : ""} onClick={() => setTab("compatibility")}>Compatibility</button>
					<button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}>Security</button>
					<button className={tab === "versions" ? "active" : ""} onClick={() => setTab("versions")}>Versions</button>
				</div>
				{tab === "overview" && (
					<div className="overview">
						{metadata && (
							<dl className="meta-rows">
								{metadata.packageName && <><dt>Package</dt><dd>{metadata.packageName}{metadata.packageVersion ? " @" + metadata.packageVersion : ""}</dd></>}
								{metadata.cordisRange && <><dt>Cordis</dt><dd>{metadata.cordisRange}</dd></>}
								{metadata.nodeRange && <><dt>Node</dt><dd>{metadata.nodeRange}</dd></>}
								{metadata.dshBundlePatch && <><dt>Bundle patch</dt><dd><code>{metadata.dshBundlePatch}</code></dd></>}
								{(metadata.capabilities?.length ?? 0) > 0 && <><dt>Capabilities</dt><dd>{metadata.capabilities?.join(", ")}</dd></>}
								{(metadata.pluginTypes?.length ?? 0) > 0 && <><dt>Types</dt><dd>{metadata.pluginTypes?.join(", ")}</dd></>}
								{(metadata.installScripts?.length ?? 0) > 0 && <><dt>Install scripts</dt><dd>{metadata.installScripts?.join(", ")}</dd></>}
							</dl>
						)}
						{detail.latestCommitSha && (
							<p className="hint">
								Scanned commit <code>{detail.latestCommitSha}</code> · scanner {detail.scannerVersion} · {detail.scannedAt}
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
