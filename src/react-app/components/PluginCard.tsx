import type { PluginListItem } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Badge } from "./Badge";

function formatDate(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString();
}

export function PluginCard({
	p,
	featured = false,
	large = false,
}: {
	p: PluginListItem;
	featured?: boolean;
	large?: boolean;
}) {
	const { t } = useI18n();
	const classes = ["plugin-card"];
	if (featured) classes.push("plugin-card-featured");
	if (large) classes.push("plugin-card-large");
	const initial = (p.repo || p.fullName || "?").charAt(0).toUpperCase();

	return (
		<a className={classes.join(" ")} href={"#/plugin/" + p.owner + "/" + p.repo}>
			<div className="plugin-card-top">
				<span className="plugin-avatar" aria-hidden="true">
					{initial}
				</span>
				<div className="plugin-card-head">
					<span className="plugin-name">{p.fullName}</span>
				</div>
				<div className="plugin-card-badges">
					{featured && <Badge value="FEATURED" />}
					<Badge value={p.verificationStatus} />
					{!featured && <Badge value={p.compatibilityStatus} />}
				</div>
			</div>
			<p className="plugin-desc">{p.description ?? t("common.noDescription")}</p>
			<div className="plugin-card-meta">
				{!featured && (
					<span className="plugin-meta-item">
						<Badge value={p.riskLevel} label={t("riskLabel", { level: p.riskLevel.toLowerCase() })} />
					</span>
				)}
				<span className="plugin-meta-item">{t("card.publisher", { owner: p.owner })}</span>
				<span className="plugin-meta-item">
					<span className="star" aria-hidden="true">★</span>
					{p.stars}
				</span>
				{formatDate(p.updatedAt) && (
					<span className="plugin-meta-item">{t("card.updated", { time: formatDate(p.updatedAt) })}</span>
				)}
			</div>
		</a>
	);
}
