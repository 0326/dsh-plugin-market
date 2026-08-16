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
	const initial = (p.repo || p.fullName || "?").charAt(0).toUpperCase();
	const dateStr = formatDate(p.updatedAt);

	return (
		<a
			className={
				"card w-full transition-shadow hover:shadow-md " +
				(featured
					? "border-none bg-neutral text-neutral-content "
					: "border border-base-300 bg-base-100 ") +
				(large ? "md:row-span-2 " : "")
			}
			href={"#/plugin/" + p.owner + "/" + p.repo}
		>
			<div className={"card-body " + (large ? "gap-5 " : "")}>
				<div className="flex items-start gap-3">
					<span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary font-extrabold uppercase text-primary-content">
						{initial}
					</span>
					<div className="min-w-0 flex-1">
						<p className={"font-bold leading-tight " + (large ? "text-2xl" : "truncate")}>{p.fullName}</p>
						<p className="text-xs opacity-60">{t("card.publisher", { owner: p.owner })}</p>
					</div>
					<div className="flex max-w-[45%] flex-wrap justify-end gap-1">
						{featured && <Badge value="FEATURED" />}
						<Badge value={p.verificationStatus} />
						{!featured && <Badge value={p.compatibilityStatus} />}
					</div>
				</div>

				<p className={"line-clamp-2 text-sm " + (featured ? "opacity-80" : "opacity-70")}>
					{p.description ?? t("common.noDescription")}
				</p>

				<div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs opacity-60">
					{!featured && <Badge value={p.riskLevel} label={t("riskLabel", { level: p.riskLevel.toLowerCase() })} />}
					<span className="flex items-center gap-1">
						<span aria-hidden="true">★</span>
						{p.stars}
					</span>
					{dateStr && <span>{t("card.updated", { time: dateStr })}</span>}
				</div>
			</div>
		</a>
	);
}
