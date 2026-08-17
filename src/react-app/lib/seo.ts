import { useEffect, useRef } from "react";
import type { Route } from "./router";

const SITE_URL = "https://dsh-plugin.market";
const SITE_NAME = "DSH Plugin Market";
const DEFAULT_IMAGE = `${SITE_URL}/kun.png`;

interface SeoSpec {
	title: string;
	description: string;
	canonicalPath: string;
}

function upsertMeta(selector: string, attributes: Record<string, string>): void {
	let element = document.head.querySelector<HTMLMetaElement>(selector);
	if (!element) {
		element = document.createElement("meta");
		document.head.appendChild(element);
	}
	for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
}

function setCanonical(url: string): void {
	let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
	if (!link) {
		link = document.createElement("link");
		link.rel = "canonical";
		document.head.appendChild(link);
	}
	link.href = url;
}

function getSeo(route: Route, lang: string): SeoSpec {
	const zh = lang === "zh";
	switch (route.name) {
		case "home":
			return {
				title: "DSH Plugin Market — DeepSeek Harness Plugin Registry",
				description: zh
					? "DSH Plugin Market 是面向 DeepSeek Harness 生态的插件市场与可信注册表，用于发现、验证、评估和安装 DSH plugins。"
					: "Discover, verify and install DeepSeek Harness plugins with compatibility, security and maintenance signals.",
				canonicalPath: "/",
			};
		case "explore":
			return {
				title: `Explore DSH Plugins — ${SITE_NAME}`,
				description: zh
					? "浏览 DeepSeek Harness 插件，查看格式验证、兼容性、安全风险、维护状态与可追溯安装信息。"
					: "Explore DeepSeek Harness plugins with format verification, compatibility, security, maintenance and traceable install signals.",
				canonicalPath: "/plugins",
			};
		case "plugin":
			return {
				title: `${route.owner}/${route.repo} — ${SITE_NAME}`,
				description: zh
					? `查看 ${route.owner}/${route.repo} 的 DSH Plugin 格式验证、兼容性、安全与维护信号，以及绑定扫描 commit 的安装信息。`
					: `Review DSH plugin compatibility, security, maintenance and commit-bound install information for ${route.owner}/${route.repo}.`,
				canonicalPath: `/plugin/${encodeURIComponent(route.owner)}/${encodeURIComponent(route.repo)}`,
			};
		case "publisher":
			return {
				title: `${route.owner} DSH Plugins — ${SITE_NAME}`,
				description: zh
					? `浏览发布者 ${route.owner} 在 DSH Plugin Market 中的 DeepSeek Harness 插件与可信扫描信息。`
					: `Explore DeepSeek Harness plugins and trust signals from publisher ${route.owner}.`,
				canonicalPath: `/publisher/${encodeURIComponent(route.owner)}`,
			};
		case "submit":
			return {
				title: `Submit a DSH Plugin — ${SITE_NAME}`,
				description: zh
					? "向 DSH Plugin Market 提交 DeepSeek Harness 插件仓库，进入发现、验证和可信扫描流程。"
					: "Submit a DeepSeek Harness plugin repository to DSH Plugin Market for discovery, verification and trust scanning.",
				canonicalPath: "/submit",
			};
		case "about":
			return {
				title: `About ${SITE_NAME} — DeepSeek Harness Plugin Registry`,
				description: zh
					? "了解 DSH Plugin Market 如何发现、验证和评估 DeepSeek Harness 插件，以及 Format Verified 与安全信号的边界。"
					: "Learn how DSH Plugin Market discovers, verifies and assesses DeepSeek Harness plugins and how to interpret its trust signals.",
				canonicalPath: "/about",
			};
		case "trust":
			return {
				title: `How ${SITE_NAME} Verifies Plugins — Trust Model`,
				description: zh
					? "了解 DSH Plugin Market 如何进行格式验证、兼容性分析、安全信号扫描、维护状态判断，并将结果绑定到具体 commit。"
					: "Learn how DSH Plugin Market verifies plugin format, checks compatibility, surfaces security and maintenance signals, and binds evidence to a concrete commit.",
				canonicalPath: "/trust",
			};
	}
}

export function useSeo(route: Route, lang: string): void {
	const initialEdgeKeyRef = useRef<string | null | undefined>(undefined);
	const previousKeyRef = useRef<string | null>(null);

	useEffect(() => {
		const spec = getSeo(route, lang);
		const key = `${spec.canonicalPath}|${lang}`;
		document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";

		if (initialEdgeKeyRef.current === undefined) {
			const edgePath = document.head.querySelector<HTMLMetaElement>('meta[name="dsh-edge-seo"]')?.content;
			initialEdgeKeyRef.current = edgePath === spec.canonicalPath ? key : null;
		}

		if (previousKeyRef.current === null) previousKeyRef.current = key;
		if (initialEdgeKeyRef.current === key && previousKeyRef.current === key) return;

		initialEdgeKeyRef.current = null;
		previousKeyRef.current = key;
		const canonical = `${SITE_URL}${spec.canonicalPath}`;
		document.title = spec.title;
		setCanonical(canonical);
		upsertMeta('meta[name="description"]', { name: "description", content: spec.description });
		upsertMeta('meta[property="og:title"]', { property: "og:title", content: spec.title });
		upsertMeta('meta[property="og:description"]', { property: "og:description", content: spec.description });
		upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
		upsertMeta('meta[property="og:image"]', { property: "og:image", content: DEFAULT_IMAGE });
		upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: spec.title });
		upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: spec.description });
		upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: DEFAULT_IMAGE });
	}, [route, lang]);
}
