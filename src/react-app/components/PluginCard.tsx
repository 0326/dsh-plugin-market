import type { PluginListItem } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Badge } from "./Badge";
import { Icon } from "./Icon";
import { PluginPreview } from "./PluginPreview";
import "./plugin-card.css";

function formatDate(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString();
}

function formatStars(stars: number): string {
	if (stars < 1_000) return String(stars);
	if (stars < 1_000_000) {
		const value = stars / 1_000;
		return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, "")}k`;
	}
	const value = stars / 1_000_000;
	return `${value >= 10 ? Math.round(value) : value.toFixed(1).replace(/\.0$/, "")}m`;
}

export function PluginCard({
	p,
	featured = false,
}: {
	p: PluginListItem;
	featured?: boolean;
}) {
	const { t } = useI18n();
	const dateStr = formatDate(p.updatedAt);

	return (
		<a
			className={
				"plugin-card card w-full transition-all duration-200 " +
				(featured ? "featured border-none bg-neutral text-neutral-content " : "border border-base-300 bg-base-100 ")
			}
			href={"/plugin/" + p.owner + "/" + p.repo}
		>
			<div className="plugin-preview-shell">
				<PluginPreview src={p.previewImageUrl} alt={p.fullName} />
				<div className="plugin-preview-badges">
					{featured && <Badge value="FEATURED" />}
					<Badge value={p.verificationStatus} />
					<Badge value={p.compatibilityStatus} />
					<Badge value={p.riskLevel} label={t("riskLabel", { level: t("badge." + p.riskLevel) })} />
				</div>
				<span className="github-star-chip" aria-label={`GitHub stars: ${p.stars}`}>
					<Icon name="star" size={14} stroke={1.8} />
					<span>Star</span>
					<strong>{formatStars(p.stars)}</strong>
				</span>
			</div>

			<div className="card-body gap-3">
				<p className="plugin-card-title truncate font-bold leading-tight text-base">{p.fullName}</p>

				<p className={"line-clamp-2 text-sm " + (featured ? "opacity-80" : "opacity-70")}>
					{p.description ?? t("common.noDescription")}
				</p>

				<div className="plugin-card-meta mt-auto flex items-center justify-between gap-3 pt-3 text-xs opacity-60">
					<span className="min-w-0 truncate">{t("card.publisher", { owner: p.owner })}</span>
					{dateStr && (
						<span className="flex shrink-0 items-center gap-1">
							<Icon name="clock" size={13} stroke={1.75} />
							{t("card.updated", { time: dateStr })}
						</span>
					)}
				</div>
			</div>
		</a>
	);
}
