import { useEffect, useState } from "react";
import { Badge } from "../components/Badge";
import { Icon, type IconName } from "../components/Icon";
import { InstallCard } from "../components/InstallCard";
import { ReadmeContent } from "../components/ReadmeContent";
import { PluginDetailSkeleton } from "../components/Skeletons";
import { formatDateTime, useI18n } from "../lib/i18n";
import { getPlugin, getPluginReadme, getScans, type Finding, type PluginDetail as Detail, type PluginReadme, type ScanRow } from "../lib/api";

type Tab = "readme" | "overview" | "compatibility" | "security" | "versions";
type ReadmeState = "available" | "missing" | "error";

interface ReadmeResult {
	key: string;
	state: ReadmeState;
	readme: PluginReadme | null;
}

interface CompatibilityVerdict {
	packageName: string;
	constraint: string;
	source: string;
	status: string;
	reason: string;
}

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
	compatibilityBaseline?: {
		dshVersion: string;
		cordisVersion: string;
		checkedAt: string;
	};
	compatibilityVerdicts?: CompatibilityVerdict[];
}

function parseMetadata(json: string | null): Metadata | null {
	if (!json) return null;
	try {
		return JSON.parse(json) as Metadata;
	} catch {
		return null;
	}
}

function EvidenceBlock({ evidence }: { evidence?: Record<string, unknown> }) {
	const { t } = useI18n();
	const entries = evidence ? Object.entries(evidence).filter(([, v]) => v !== undefined && v !== null && String(v) !== "") : [];
	if (entries.length === 0) return null;
	return (
		<div className="mt-1">
			<p className="mb-1 text-xs font-bold uppercase tracking-wide opacity-50">{t("detail.evidence")}</p>
			{entries.map(([k, v]) => (
				<div key={k} className="mb-1">
					{k !== "match" && <span className="mr-2 font-mono text-xs opacity-50">{k}:</span>}
					<pre className="overflow-x-auto whitespace-pre-wrap break-all border border-base-300 bg-base-200 px-3 py-2 text-xs"><code>{typeof v === "string" ? v : JSON.stringify(v)}</code></pre>
				</div>
			))}
		</div>
	);
}

function FindingsList({ findings }: { findings: Finding[] }) {
	const { t } = useI18n();
	if (findings.length === 0) return <p className="text-base-content/60">{t("detail.noFindings")}</p>;
	return (
		<ul className="space-y-3">
			{findings.map((f, i) => (
				<li key={i} className="card border border-base-300 border-l-4 border-l-primary bg-base-100">
					<div className="card-body gap-2 py-4">
						<div className="flex flex-wrap items-center gap-2">
							<Badge value={f.severity} />
							<strong className="text-sm">{f.title}</strong>
						</div>
						{f.detail && <p className="text-sm opacity-70">{f.detail}</p>}
						{f.filePath && <code className="text-xs opacity-50">{f.filePath}</code>}
						<EvidenceBlock evidence={f.evidence} />
					</div>
				</li>
			))}
		</ul>
	);
}

function CompatibilityInfo({ metadata }: { metadata: Metadata | null }) {
	const { t, lang } = useI18n();
	const baseline = metadata?.compatibilityBaseline;
	const verdicts = metadata?.compatibilityVerdicts ?? [];
	return (
		<div>
			{baseline ? (
				<div className="mb-4 border border-base-300 bg-base-100 p-4">
					<h3 className="mb-3 text-sm font-extrabold uppercase tracking-widest">{t("detail.baselineTitle")}</h3>
					<div className="grid gap-3 sm:grid-cols-3">
						<div>
							<span className="text-xs opacity-60">DSH</span>
							<p className="font-mono font-bold">{baseline.dshVersion}</p>
						</div>
						<div>
							<span className="text-xs opacity-60">Cordis</span>
							<p className="font-mono font-bold">{baseline.cordisVersion}</p>
						</div>
						<div>
							<span className="text-xs opacity-60">{t("detail.baselineCheckedAt")}</span>
							<p className="text-sm">{formatDateTime(baseline.checkedAt, lang)}</p>
						</div>
					</div>
				</div>
			) : (
				<p className="mb-4 text-base-content/60">{t("detail.noBaseline")}</p>
			)}

			{verdicts.length > 0 && (
				<div className="mb-4">
					<h3 className="mb-2 text-sm font-extrabold uppercase tracking-widest">{t("detail.compatVerdicts")}</h3>
					<ul className="divide-y divide-base-300 border border-base-300">
						{verdicts.map((v, i) => (
							<li key={i} className="grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
								<div className="min-w-0">
									<p className="font-mono text-sm font-bold">
										{v.packageName} <span className="font-normal text-xs opacity-60">{t("detail.range")}: {v.constraint}</span>
									</p>
									<p className="text-xs opacity-70">{v.reason}</p>
									<p className="mt-0.5 text-xs opacity-50">{v.source}</p>
								</div>
								<Badge value={v.status} />
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
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
	const { t, lang } = useI18n();
	const [detail, setDetail] = useState<Detail | null>(null);
	const [scans, setScans] = useState<ScanRow[]>([]);
	const [readmeResult, setReadmeResult] = useState<ReadmeResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>("readme");

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

	const readmeKey = `${owner}/${repo}:${lang}`;

	useEffect(() => {
		let ignore = false;
		const requestKey = `${owner}/${repo}:${lang}`;
		getPluginReadme(owner, repo, lang)
			.then((result) => {
				if (ignore) return;
				if (!result) {
					setReadmeResult({ key: requestKey, state: "missing", readme: null });
					setTab((current) => (current === "readme" ? "overview" : current));
					return;
				}
				setReadmeResult({ key: requestKey, state: "available", readme: result });
			})
			.catch(() => {
				if (!ignore) setReadmeResult({ key: requestKey, state: "error", readme: null });
			});
		return () => {
			ignore = true;
		};
	}, [owner, repo, lang]);

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
	if (!detail) return <PluginDetailSkeleton />;

	const metadata = parseMetadata(detail.metadataJson);
	const activeReadmeResult = readmeResult?.key === readmeKey ? readmeResult : null;
	const readmeState = activeReadmeResult?.state ?? "loading";
	const readme = activeReadmeResult?.readme ?? null;
	const tabs: { key: Tab; label: string; icon: IconName }[] = [
		...(readmeState === "missing" ? [] : [{ key: "readme" as const, label: "README", icon: "github" as const }]),
		{ key: "overview", label: t("detail.overview"), icon: "layout" },
		{ key: "compatibility", label: t("detail.compatibility"), icon: "exchange" },
		{ key: "security", label: t("detail.security"), icon: "shield" },
		{ key: "versions", label: t("detail.versions"), icon: "history" },
	];

	return (
		<section className="mx-auto max-w-5xl">
			<div className="min-w-0">
				<div className="mb-6 border-b border-base-300 pb-6">
					<h1 className="mb-2 text-3xl font-extrabold tracking-tight break-words md:text-4xl">{detail.fullName}</h1>
					<p className="mb-2 opacity-70">{detail.description ?? t("common.noDescription")}</p>
					<p className="mb-4 text-sm opacity-60">
						{t("detail.by")}{" "}
						<a className="link font-semibold" href={"/publisher/" + detail.owner}>{detail.owner}</a>
					</p>
					<div className="flex flex-wrap gap-2">
						<Badge value={detail.verificationStatus} />
						<Badge value={detail.compatibilityStatus} />
						<Badge value={detail.securityStatus} />
						<Badge value={detail.maintenanceStatus} />
					</div>
					{metadata?.compatibilityBaseline && (
						<p className="mt-3 text-sm opacity-70">
							{t("detail.baselineTitle")}:{" "}
							<span className="font-mono font-semibold">DSH {metadata.compatibilityBaseline.dshVersion}</span>
							{" · "}
							<span className="font-mono font-semibold">Cordis {metadata.compatibilityBaseline.cordisVersion}</span>
						</p>
					)}
				</div>
				<InstallCard plugin={detail} />

				<div role="tablist" className="tabs tabs-border sticky top-[78px] z-20 mb-6 mt-8 overflow-x-auto bg-base-100">
					{tabs.map((tb) => (
						<button
							key={tb.key}
							role="tab"
							className={"tab gap-1.5" + (tab === tb.key ? " tab-active" : "")}
							onClick={() => setTab(tb.key)}
						>
							<Icon name={tb.icon} size={16} stroke={2} />
							{tb.label}
						</button>
					))}
				</div>

				{tab === "readme" && readmeState === "loading" && <div className="py-12 text-center text-sm opacity-60">{t("common.loading")}</div>}
				{tab === "readme" && readmeState === "error" && (
					<div className="border border-error/30 bg-error/5 p-4 text-sm text-error">
						{lang === "zh" ? "README 暂时加载失败，请稍后重试。" : "README could not be loaded. Please try again later."}
					</div>
				)}
				{tab === "readme" && readmeState === "available" && readme && <ReadmeContent readme={readme} />}

				{tab === "overview" && (
					<div>
						{metadata && (
							<dl className="mb-4 divide-y divide-base-300 border border-base-300">
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
				{tab === "compatibility" && (
					<div>
						<CompatibilityInfo metadata={metadata} />
						<FindingsList findings={detail.findings.filter((f) => f.category === "COMPATIBILITY")} />
					</div>
				)}
				{tab === "security" && (
					<div>
						<p className="mb-4 text-sm text-base-content/60">{t("detail.riskNote")}</p>
						<FindingsList findings={detail.findings.filter((f) => f.category === "SECURITY")} />
					</div>
				)}
				{tab === "versions" && <ScansList scans={scans} />}
			</div>
		</section>
	);
}
