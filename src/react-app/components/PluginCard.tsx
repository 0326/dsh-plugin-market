import type { PluginListItem } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Badge } from "./Badge";

export function PluginCard({ p }: { p: PluginListItem }) {
	const { t } = useI18n();
	return (
		<a className="plugin-card" href={"#/plugin/" + p.owner + "/" + p.repo}>
			<div className="plugin-card-title">
				<span className="plugin-name">{p.fullName}</span>
				<Badge value={p.verificationStatus} />
			</div>
			<p className="plugin-desc">{p.description ?? t("common.noDescription")}</p>
			<div className="plugin-meta">
				<span>★ {p.stars}</span>
				<Badge value={p.riskLevel} label={t("riskLabel", { level: p.riskLevel.toLowerCase() })} />
			</div>
		</a>
	);
}
