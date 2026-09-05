import { useEffect, useState } from "react";
import { getPluginEvents, type PluginEvent } from "../lib/api";
import { formatDateTime, useI18n } from "../lib/i18n";

function eventLabel(event: PluginEvent, lang: "zh" | "en"): string {
	const labels: Record<string, { zh: string; en: string }> = {
		first_scanned: { zh: "首次扫描", en: "First scanned" },
		verification_status_changed: { zh: "格式状态变化", en: "Format status changed" },
		compatibility_status_changed: { zh: "兼容性状态变化", en: "Compatibility status changed" },
		security_status_changed: { zh: "安全状态变化", en: "Security status changed" },
		maintenance_status_changed: { zh: "维护状态变化", en: "Maintenance status changed" },
		risk_level_changed: { zh: "风险等级变化", en: "Risk level changed" },
	};
	return labels[event.eventType]?.[lang] ?? event.eventType.replace(/_/g, " ");
}

export default function Changes() {
	const { lang, t } = useI18n();
	const [items, setItems] = useState<PluginEvent[] | null>(null);

	useEffect(() => {
		let ignore = false;
		getPluginEvents().then((result) => { if (!ignore) setItems(result.items); }).catch(() => { if (!ignore) setItems([]); });
		return () => { ignore = true; };
	}, []);

	return (
		<section className="mx-auto max-w-4xl">
			<div className="mb-8">
				<p className="content-kicker">REGISTRY HISTORY</p>
				<h1 className="mb-3 text-3xl font-extrabold tracking-tight">{t("changes.title")}</h1>
				<p className="opacity-70">{t("changes.subtitle")}</p>
			</div>
			{items === null ? <p className="text-base-content/60">{t("common.loading")}</p> : items.length === 0 ? <p className="text-base-content/60">{t("changes.empty")}</p> : (
				<ul className="divide-y divide-base-300 border border-base-300">
					{items.map((event, index) => <li key={`${event.fullName}-${event.createdAt}-${index}`} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
						<div><a className="link font-bold" href={`/plugin/${event.owner}/${event.repo}`}>{event.fullName}</a><p className="text-sm opacity-70">{eventLabel(event, lang)}{event.previousValue || event.nextValue ? ` · ${event.previousValue ?? "—"} → ${event.nextValue ?? "—"}` : ""}</p></div>
						<time className="text-xs opacity-60" dateTime={event.createdAt}>{formatDateTime(event.createdAt, lang)}</time>
					</li>)}
				</ul>
			)}
		</section>
	);
}
