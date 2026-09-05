import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { listPlugins, type PluginListItem } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { isBasicIndexablePlugin } from "../../shared/seo-policy";
import { CAPABILITY_LANDINGS, DISCOVERY_LANDINGS } from "../../shared/seo-landings";

const CAPABILITIES = Object.fromEntries(CAPABILITY_LANDINGS.map((landing) => [landing.slug, { ...landing, en: landing.title, zh: landing.titleZh }])) as Record<string, { capability: string; en: string; zh: string; definition: string }>;
const DISCOVERY = Object.fromEntries(DISCOVERY_LANDINGS.map((landing) => [landing.slug, { ...landing, zh: landing.titleZh }])) as Record<string, { title: string; zh: string; definition: string; sort: "stars" | "new" | "updated"; verified?: boolean }>;

function isIndexableItem(item: PluginListItem): boolean {
	return isBasicIndexablePlugin(item);
}

export default function Landing({ slug }: { slug: string }) {
	const { lang } = useI18n();
	const capability = CAPABILITIES[slug];
	const discovery = DISCOVERY[slug];
	const [items, setItems] = useState<PluginListItem[] | null>(null);

	useEffect(() => {
		let ignore = false;
		const request = capability
			? listPlugins({ capability: capability.capability, sort: "stars", limit: 50, includeTotal: false })
			: discovery
				? listPlugins({ sort: discovery.sort, verified: discovery.verified, limit: 50, includeTotal: false })
				: Promise.resolve({ items: [], total: 0, limit: 50, offset: 0, hasMore: false });
		request.then((result) => { if (!ignore) setItems(result.items.filter(isIndexableItem)); }).catch(() => { if (!ignore) setItems([]); });
		return () => { ignore = true; };
	}, [capability, discovery]);

	if (!capability && !discovery) return <p className="text-base-content/60">This landing page does not exist.</p>;
	const title = capability ? (lang === "zh" ? capability.zh : capability.en) : (lang === "zh" ? discovery!.zh : discovery!.title);
	const definition = capability?.definition ?? discovery!.definition;
	return (
		<section>
			<div className="mb-8 max-w-3xl">
				<p className="content-kicker">{capability ? "CAPABILITY" : "DISCOVERY"}</p>
				<h1 className="mb-3 text-3xl font-extrabold tracking-tight">{title} DSH Plugins</h1>
				<p className="opacity-70">{definition}</p>
				<p className="mt-3 text-sm opacity-60">{lang === "zh" ? "列表来自当前 Registry，插件页面会分别展示格式、兼容性、安全、维护和 commit 证据。" : "This list comes from the current registry. Each plugin page separates format, compatibility, security, maintenance, and commit evidence."}</p>
			</div>
			{items === null ? <p className="text-base-content/60">{lang === "zh" ? "加载中…" : "Loading…"}</p> : items.length === 0 ? <p className="text-base-content/60">{lang === "zh" ? "当前没有满足条件的插件。" : "No plugins currently meet this landing page policy."}</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <PluginCard key={item.fullName} p={item} />)}</div>}
		</section>
	);
}

export { CAPABILITIES, DISCOVERY };
