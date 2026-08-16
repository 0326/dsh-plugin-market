import type { PluginListItem } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Badge } from "./Badge";
import { Icon } from "./Icon";
import { PluginPreview } from "./PluginPreview";

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
	const initial = (p.repo || p.fullName || "?").charAt(0).toUpperCase();
	const dateStr = formatDate(p.updatedAt);

	return (
		<a
			className={
				"plugin-card card w-full transition-all duration-200 " +
				(featured
					? "border-none bg-neutral text-neutral-content "
					: "border border-base-300 bg-base-100 ") +
				(large ? "md:row-span-2 " : "")
			}
			href={"/plugin/" + p.owner + "/" + p.repo}
		>
			<PluginPreview src={p.previewImageUrl} alt={p.fullName} />
			<div className={"card-body " + (large ? "gap-5 " : "gap-3")}>
				<div className="flex items-start gap-3">
					<span className="plugin-icon shrink-0 uppercase">{initial}</span>
					<div className="min-w-0 flex-1">
						<p className={"truncate font-bold leading-tight " + (large ? "text-2xl" : "text-base")}>{p.fullName}</p>
						<p className="mt-0.5 text-xs opacity-60">{t("card.publisher", { owner: p.owner })}</p>
					</div>
				</div>

				<div className="flex flex-wrap gap-1.5">
					{featured && <Badge value="FEATURED" />}
					<Badge value={p.verificationStatus} />
					<Badge value={p.compatibilityStatus} />
					<Badge value={p.riskLevel} label={t("riskLabel", { level: t("badge." + p.riskLevel) })} />
				</div>

				<p className={"line-clamp-2 text-sm " + (featured ? "opacity-80" : "opacity-70")}>
					{p.description ?? t("common.noDescription")}
				</p>

				<div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs opacity-60">
					<span className="flex items-center gap-1">
						<Icon name="star-filled" size={13} stroke={1.5} className="text-warning" />
						{p.stars}
					</span>
					{dateStr && (
						<span className="flex items-center gap-1">
							<Icon name="clock" size={13} stroke={1.75} />
							{t("card.updated", { time: dateStr })}
						</span>
					)}
				</div>
			</div>
		</a>
	);
}
