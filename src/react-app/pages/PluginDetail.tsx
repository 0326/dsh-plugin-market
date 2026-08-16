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
	if (findings.length === 0) return <p className="text-base-content/60">{t("detail.noFindings")}</p>;
	return (
		<ul className="space-y-3">
			{findings.map((f, i) => (
				<li key={i} className="card border border-base-300 border-l-4 border-l-primary bg-base-100">
					<div className="card-body gap-1 py-4">
						<div className="flex items-center gap-2">
							<Badge value={f.severity} />
							<strong className="text-sm">{f.title}</strong>
						</div>
						{f.detail && <p className="text-sm opacity-70">{f.detail}</p>}
						{f.filePath && <code className="text-xs opacity-50">{f.filePath}</code>}
					</div>
				</li>
			))}
		</ul>
	);
}

function ScansList({ scans }: { scans: ScanRow[] }) {
	const { t } = useI18n();
	if (scans.length === 0) return <p className="text-base-content/60">{t("detail.noScanHistory")}</p>;
	return (
		<ul className="space-y-3">
			{scans.map((s) => {
				const kind = s.status === "completed" ? "PASSED" : s.status === "failed" ? "FAILED" : "UNKNOWN";
				const statusLabel =
					s.status === "completed"
						? t("detail.scanStatusPassed")
						: s.status === "failed"
							? t("detail.scanStatusFailed")
							: t("detail.scanStatusUnknown");
				return (
					<li key={s.id} className="card border border-base-300 bg-base-100">
						<div className="card-body gap-1 py-4">
							<div className="flex items-center gap-2">
								<Badge value={kind} label={statusLabel} />
								<code className="text-xs opacity-70">{s.commitSha.slice(0, 12)}</code>
							</div>
							<p className="text-sm opacity-70">{t("detail.scanRow", { ver: s.scannerVersion, at: s.completedAt ?? s.startedAt })}</p>
							{s.errorCode && <p className="text-sm text-error">{t("detail.scanError", { code: s.errorCode })}</p>}
						</div>
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

	if (error) return <p className="text-error">{t("detail.loadError", { msg: error })}</p>;
	if (!detail) return <p className="text-base-content/60">{t("common.loading")}</p>;

	const metadata = parseMetadata(detail.metadataJson);
	const tabs: { key: Tab; label: string }[] = [
		{ key: "overview", label: t("detail.overview") },
		{ key: "compatibility", label: t("detail.compatibility") },
		{ key: "security", label: t("detail.security") },
		{ key: "versions", label: t("detail.versions") },
	];

	return (
		<section className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
			<div className="min-w-0">
				<div className="mb-6 border-b border-base-300 pb-6">
					<h1 className="mb-2 text-3xl font-extrabold tracking-tight break-words md:text-4xl">{detail.fullName}</h1>
					<p className="mb-2 opacity-70">{detail.description ?? t("common.noDescription")}</p>
					<p className="mb-4 text-sm opacity-60">
						{t("detail.by")}{" "}
						<a className="link font-semibold" href={"#/publisher/" + detail.owner}>{detail.owner}</a>
					</p>
					<div className="flex flex-wrap gap-2">
						<Badge value={detail.verificationStatus} />
						<Badge value={detail.compatibilityStatus} />
						<Badge value={detail.securityStatus} />
						<Badge value={detail.maintenanceStatus} />
					</div>
				</div>

				<div role="tablist" className="tabs tabs-border mb-6">
					{tabs.map((tb) => (
						<button
							key={tb.key}
							role="tab"
							className={"tab" + (tab === tb.key ? " tab-active" : "")}
							onClick={() => setTab(tb.key)}
						>
							{tb.label}
						</button>
					))}
				</div>

				{tab === "overview" && (
					<div>
						{metadata && (
							<dl className="mb-4 divide-y divide-base-300 rounded-box border border-base-300">
								{metadata.packageName && (
									<div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3">
										<dt className="text-sm opacity-60">{t("detail.package")}</dt>
										<dd className="text-sm">{metadata.packageName}{metadata.packageVersion ? " @" + metadata.packageVersion : ""}</dd>
									</div>
								)}
								{metadata.cordisRange && (
									<div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3">
										<dt className="text-sm opacity-60">{t("detail.cordis")}</dt>
										<dd className="text-sm">{metadata.cordisRange}</dd>
									</div>
								)}
								{metadata.nodeRange && (
									<div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3">
										<dt className="text-sm opacity-60">{t("detail.node")}</dt>
										<dd className="text-sm">{metadata.nodeRange}</dd>
									</div>
								)}
								{metadata.dshBundlePatch && (
									<div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3">
										<dt className="text-sm opacity-60">{t("detail.bundlePatch")}</dt>
										<dd className="text-sm"><code>{metadata.dshBundlePatch}</code></dd>
									</div>
								)}
								{(metadata.capabilities?.length ?? 0) > 0 && (
									<div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3">
										<dt className="text-sm opacity-60">{t("detail.capabilities")}</dt>
										<dd className="text-sm">{metadata.capabilities?.join(", ")}</dd>
									</div>
								)}
								{(metadata.pluginTypes?.length ?? 0) > 0 && (
									<div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3">
										<dt className="text-sm opacity-60">{t("detail.types")}</dt>
										<dd className="text-sm">{metadata.pluginTypes?.join(", ")}</dd>
									</div>
								)}
								{(metadata.installScripts?.length ?? 0) > 0 && (
									<div className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3">
										<dt className="text-sm opacity-60">{t("detail.installScripts")}</dt>
										<dd className="text-sm">{metadata.installScripts?.join(", ")}</dd>
									</div>
								)}
							</dl>
						)}
						{detail.latestCommitSha && (
							<p className="text-xs opacity-60">
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
