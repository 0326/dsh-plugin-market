import type { ReactNode } from "react";
import type { Route } from "../lib/router";
import { useI18n } from "../lib/i18n";

interface DocsLayoutProps {
	route: Extract<Route, { name: "guide" | "trust" }>;
	children: ReactNode;
}

interface DocsNavItem {
	href: string;
	labelZh: string;
	labelEn: string;
	active: (route: DocsLayoutProps["route"]) => boolean;
}

const GUIDE_ITEMS: DocsNavItem[] = [
	{
		href: "/guide/what-is-dsh-plugin",
		labelZh: "什么是 DSH Plugin",
		labelEn: "What is a DSH Plugin?",
		active: (route) => route.name === "guide" && route.slug === "what-is-dsh-plugin",
	},
	{
		href: "/guide/install-dsh-plugin",
		labelZh: "安装 DSH Plugin",
		labelEn: "Install a DSH Plugin",
		active: (route) => route.name === "guide" && route.slug === "install-dsh-plugin",
	},
	{
		href: "/guide/choose-dsh-plugin",
		labelZh: "评估和选择插件",
		labelEn: "Evaluate and choose",
		active: (route) => route.name === "guide" && route.slug === "choose-dsh-plugin",
	},
];

const TRUST_ITEMS: DocsNavItem[] = [
	{
		href: "/trust",
		labelZh: "验证机制",
		labelEn: "Verification model",
		active: (route) => route.name === "trust",
	},
];

function DocsNavGroup({ title, items, route, lang }: { title: string; items: DocsNavItem[]; route: DocsLayoutProps["route"]; lang: string }) {
	return (
		<section className="docs-nav-group">
			<h2>{title}</h2>
			<nav aria-label={title}>
				{items.map((item) => {
					const active = item.active(route);
					return (
						<a key={item.href} className={active ? "docs-nav-link docs-nav-link-active" : "docs-nav-link"} href={item.href} aria-current={active ? "page" : undefined}>
							<span>{lang === "zh" ? item.labelZh : item.labelEn}</span>
							<span aria-hidden="true">{active ? "●" : "→"}</span>
						</a>
					);
				})}
			</nav>
		</section>
	);
}

export function DocsLayout({ route, children }: DocsLayoutProps) {
	const { lang } = useI18n();
	const docsLabel = lang === "zh" ? "文档" : "Docs";
	const guideLabel = lang === "zh" ? "指南" : "Guides";
	const trustLabel = lang === "zh" ? "机制" : "Trust";

	return (
		<div className="docs-shell">
			<aside className="docs-sidebar" aria-label={docsLabel}>
				<div className="docs-sidebar-heading">
					<p>DSH PLUGIN MARKET</p>
					<h1>{docsLabel}</h1>
				</div>
				<DocsNavGroup title={guideLabel} items={GUIDE_ITEMS} route={route} lang={lang} />
				<DocsNavGroup title={trustLabel} items={TRUST_ITEMS} route={route} lang={lang} />
			</aside>
			<div className="docs-content">{children}</div>
		</div>
	);
}
