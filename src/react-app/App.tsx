import { useSyncExternalStore } from "react";
import { Kun } from "./components/Kun";
import { useI18n } from "./lib/i18n";
import { useTheme } from "./lib/theme";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import PluginDetail from "./pages/PluginDetail";
import Publisher from "./pages/Publisher";
import Submit from "./pages/Submit";

type Route =
	| { name: "home" }
	| { name: "explore"; query: string }
	| { name: "plugin"; owner: string; repo: string }
	| { name: "publisher"; owner: string }
	| { name: "submit" };

function parseRoute(hash: string): Route {
	const [pathPart, queryPart] = hash.split("?");
	const path = pathPart.replace(/^#/, "") || "/";
	const segments = path.split("/").filter(Boolean);
	const query = queryPart ?? "";
	if (segments.length === 0) return { name: "home" };
	if (segments[0] === "plugins") return { name: "explore", query };
	if (segments[0] === "plugin" && segments[1] && segments[2]) return { name: "plugin", owner: segments[1], repo: segments[2] };
	if (segments[0] === "publisher" && segments[1]) return { name: "publisher", owner: segments[1] };
	if (segments[0] === "submit") return { name: "submit" };
	return { name: "home" };
}

function subscribe(callback: () => void): () => void {
	window.addEventListener("hashchange", callback);
	return () => window.removeEventListener("hashchange", callback);
}

function getSnapshot(): string {
	return window.location.hash || "#/";
}

function useHashRoute(): Route {
	const hash = useSyncExternalStore(subscribe, getSnapshot);
	return parseRoute(hash);
}

function App() {
	const route = useHashRoute();
	const { t, toggleLang, lang } = useI18n();
	const { theme, toggleTheme } = useTheme();
	return (
		<div className="app-frame flex min-h-screen flex-col bg-base-100 text-base-content">
			<header className="site-header navbar sticky top-0 z-30 px-4 md:px-7">
				<div className="navbar-start">
					<a className="flex items-center gap-2" href="#/" aria-label="DSH Plugin Market">
						<Kun className="h-11 w-11 object-contain" ariaHidden />
						<span className="brand-lockup flex flex-col">
							<strong>DSH</strong>
							<small>PLUGIN MARKET</small>
						</span>
					</a>
				</div>
				<nav className="navbar-center hidden gap-2 md:flex" aria-label="Primary">
					<a className="btn btn-sm bg-neutral text-neutral-content" href="#/plugins">{t("nav.explore")}</a>
					<a className="btn btn-ghost btn-sm" href="#/">{t("nav.developers")}</a>
					<a className="btn btn-ghost btn-sm" href="#/">{t("nav.docs")}</a>
					<a className="btn btn-ghost btn-sm" href="#/">{t("nav.about")}</a>
				</nav>
				<div className="navbar-end gap-2">
					<div className="dropdown dropdown-end md:hidden">
						<div tabIndex={0} role="button" className="btn btn-ghost btn-sm text-xl" aria-label="Menu">☰</div>
						<ul tabIndex={0} className="dropdown-content menu z-50 mt-3 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow">
							<li><a href="#/plugins">{t("nav.explore")}</a></li>
							<li><a href="#/">{t("nav.developers")}</a></li>
							<li><a href="#/">{t("nav.docs")}</a></li>
							<li><a href="#/submit">{t("nav.submit")}</a></li>
						</ul>
					</div>
					<button className="btn btn-ghost btn-sm hidden sm:inline-flex" onClick={toggleTheme} aria-label={theme === "light" ? t("theme.dark") : t("theme.light")}>
						{theme === "light" ? t("theme.dark") : t("theme.light")}
					</button>
					<button className="btn btn-ghost btn-sm hidden sm:inline-flex" onClick={toggleLang} aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}>
						{t("langSwitch")}
					</button>
					<a className="btn btn-outline btn-sm hidden lg:inline-flex" href="#/submit">{t("nav.login")}</a>
					<a className="btn btn-neutral btn-sm" href="#/submit">{t("nav.submit")}</a>
				</div>
			</header>

			<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
				{route.name === "home" && <Home />}
				{route.name === "explore" && <Explore key={route.query} query={route.query} />}
				{route.name === "plugin" && <PluginDetail key={route.owner + "/" + route.repo} owner={route.owner} repo={route.repo} />}
				{route.name === "publisher" && <Publisher owner={route.owner} />}
				{route.name === "submit" && <Submit />}
			</main>

			<footer className="site-footer footer bg-neutral p-8 text-neutral-content md:p-10">
				<aside>
					<div className="flex items-center gap-2">
						<Kun className="h-8 w-auto" ariaHidden />
						<span className="text-lg font-extrabold">dsh-plugin market</span>
					</div>
					<p className="max-w-md opacity-80">{t("footer")}</p>
				</aside>
				<nav>
					<h6 className="footer-title">Links</h6>
					<a className="link-hover link" href="#/plugins">{t("nav.explore")}</a>
					<a className="link-hover link" href="#/submit">{t("nav.submit")}</a>
					<a className="link-hover link" href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noreferrer">
						DeepSeek Harness
					</a>
					<a className="link-hover link" href="https://github.com/topics/dsh-plugin" target="_blank" rel="noreferrer">
						GitHub dsh-plugin
					</a>
				</nav>
			</footer>
		</div>
	);
}

export default App;
