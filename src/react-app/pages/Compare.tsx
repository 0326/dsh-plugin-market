import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { getPlugin, type PluginDetail } from "../lib/api";
import { useI18n } from "../lib/i18n";

function parsePluginNames(query: string): string[] {
	const values = (new URLSearchParams(query).get("plugins") ?? "").split(",");
	return [...new Set(values.filter((value) => /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)))].slice(0, 3);
}

function metadataValues(detail: PluginDetail): { capabilities: string; types: string } {
	if (!detail.metadataJson) return { capabilities: "—", types: "—" };
	try {
		const metadata = JSON.parse(detail.metadataJson) as { capabilities?: string[]; pluginTypes?: string[] };
		return { capabilities: metadata.capabilities?.join(", ") ?? "—", types: metadata.pluginTypes?.join(", ") ?? "—" };
	} catch {
		return { capabilities: "—", types: "—" };
	}
}

export default function Compare({ query }: { query: string }) {
	const { lang, t } = useI18n();
	const names = useMemo(() => parsePluginNames(query), [query]);
	const [items, setItems] = useState<PluginDetail[] | null>(null);

	useEffect(() => {
		let ignore = false;
		if (names.length < 2) return () => { ignore = true; };
		Promise.all(names.map((name) => {
			const [owner, repo] = name.split("/");
			return getPlugin(owner, repo);
		}))
			.then((result) => { if (!ignore) setItems(result); })
			.catch(() => { if (!ignore) setItems([]); });
		return () => { ignore = true; };
	}, [names]);

	if (names.length < 2) return <p className="text-base-content/60">{t("compare.needTwo")}</p>;
	if (items === null) return <p className="text-base-content/60">{t("common.loading")}</p>;
	if (items.length < 2) return <p className="text-base-content/60">{t("compare.needTwo")}</p>;

	const rows = [
		{ label: t("compare.format"), value: (item: PluginDetail) => <Badge value={item.verificationStatus} /> },
		{ label: t("compare.compatibility"), value: (item: PluginDetail) => <Badge value={item.compatibilityStatus} /> },
		{ label: t("compare.security"), value: (item: PluginDetail) => <Badge value={item.securityStatus} /> },
		{ label: t("compare.risk"), value: (item: PluginDetail) => <Badge value={item.riskLevel} /> },
		{ label: t("compare.maintenance"), value: (item: PluginDetail) => <Badge value={item.maintenanceStatus} /> },
		{ label: t("compare.capabilities"), value: (item: PluginDetail) => metadataValues(item).capabilities },
		{ label: t("compare.types"), value: (item: PluginDetail) => metadataValues(item).types },
		{ label: t("compare.stars"), value: (item: PluginDetail) => item.stars.toLocaleString() },
		{ label: t("compare.scannedCommit"), value: (item: PluginDetail) => item.latestCommitSha?.slice(0, 12) ?? "—" },
	];

	return (
		<section className="mx-auto max-w-6xl">
			<div className="mb-8 max-w-3xl">
				<p className="content-kicker">DECISION SUPPORT</p>
				<h1 className="mb-3 text-3xl font-extrabold tracking-tight">{t("compare.title")}</h1>
				<p className="opacity-70">{t("compare.subtitle")}</p>
			</div>
			<div className="overflow-x-auto border border-base-300">
				<table className="table table-sm min-w-[720px]">
					<thead><tr><th>{t("compare.signal")}</th>{items.map((item) => <th key={item.fullName}><a className="link font-bold" href={`/plugin/${item.owner}/${item.repo}`}>{item.fullName}</a></th>)}</tr></thead>
					<tbody>{rows.map((row) => <tr key={row.label}><th>{row.label}</th>{items.map((item) => <td key={item.fullName}>{row.value(item)}</td>)}</tr>)}</tbody>
				</table>
			</div>
			<p className="mt-4 text-sm opacity-60">{lang === "zh" ? "这是基于当前扫描数据的决策辅助，不构成安全保证或官方认可。" : "This is decision support from current scan data, not a safety guarantee or official endorsement."}</p>
		</section>
	);
}
