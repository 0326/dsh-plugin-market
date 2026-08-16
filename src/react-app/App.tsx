import { useSyncExternalStore } from "react";
import { GitHubStar } from "./components/GitHubStar";
import { Icon } from "./components/Icon";
import { Kun } from "./components/Kun";
import { useI18n } from "./lib/i18n";
import { useTheme } from "./lib/theme";
import About from "./pages/About";
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
	| { name: "submit" }
	| { name: "about" };

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
	if (segments[0] === "about") return { name: "about" };
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
					<a className="flex items-center gap-2" href="#/" aria-label="DSH-PLUGIN MARKET">
						<Kun className="h-11 w-11 object-contain" ariaHidden />
						<span className="brand-lockup">
							DSH-PLUGIN <strong>MARKET</strong>
						</span>
					</a>
				</div>
				<nav className="navbar-center hidden gap-2 md:flex" aria-label="Primary">
					<a className="btn btn-sm bg-neutral text-neutral-content" href="#/plugins">{t("nav.explore")}</a>
					<a className="btn btn-ghost btn-sm" href="#/submit">{t("nav.submit")}</a>
					<a className="btn btn-ghost btn-sm" href="#/about">{t("nav.about")}</a>
				</nav>
				<div className="navbar-end gap-2">
					<div className="hidden sm:block"><GitHubStar /></div>
					<div className="dropdown dropdown-end md:hidden">
						<div tabIndex={0} role="button" className="btn btn-ghost btn-sm text-xl" aria-label="Menu">☰</div>
						<ul tabIndex={0} className="dropdown-content menu z-50 mt-3 w-52 border border-base-300 bg-base-100 p-2 shadow">
							<li><a href="#/">{t("nav.home")}</a></li>
							<li><a href="#/plugins">{t("nav.explore")}</a></li>
							<li><a href="#/submit">{t("nav.submit")}</a></li>
							<li><a href="#/about">{t("nav.about")}</a></li>
							<li><button type="button" onClick={toggleTheme}><Icon name={theme === "light" ? "moon" : "sun"} size={16} stroke={2} />{theme === "light" ? t("theme.dark") : t("theme.light")}</button></li>
						</ul>
					</div>
					<button className="btn btn-square btn-ghost btn-sm hidden border border-base-content sm:inline-flex" onClick={toggleTheme} aria-label={theme === "light" ? t("theme.dark") : t("theme.light")}>
						<Icon name={theme === "light" ? "moon" : "sun"} size={18} stroke={2} />
					</button>
					<button className="btn btn-ghost btn-sm gap-1.5 border border-base-content px-3" onClick={toggleLang} aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}>
						<Icon name="language" size={18} stroke={2} />
						{t("langSwitch")}
					</button>
				</div>
			</header>

			<main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
				{route.name === "home" && <Home />}
				{route.name === "explore" && <Explore key={route.query} query={route.query} />}
				{route.name === "plugin" && <PluginDetail key={route.owner + "/" + route.repo} owner={route.owner} repo={route.repo} />}
				{route.name === "publisher" && <Publisher owner={route.owner} />}
				{route.name === "submit" && <Submit />}
				{route.name === "about" && <About />}
			</main>

			<footer className="site-footer bg-neutral p-8 text-neutral-content md:p-10">
				<div>
					<div className="flex items-center gap-2">
						<Kun className="h-8 w-auto" ariaHidden />
						<span className="text-lg font-extrabold">DSH-PLUGIN MARKET</span>
					</div>
					<p className="max-w-md opacity-80">{t("footer")}</p>
				</div>
				<nav className="flex flex-wrap items-center gap-x-6 gap-y-3 md:justify-end" aria-label={t("footerLinks")}>
					<a className="link-hover link inline-flex items-center gap-1.5" href="https://github.com/0326/dsh-plugin-market" target="_blank" rel="noreferrer">
						<Icon name="github" size={16} stroke={2} />
						{t("footerSource")}
					</a>
					<a className="link-hover link inline-flex items-center gap-1.5" href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noreferrer">
						<Icon name="external-link" size={14} stroke={2} />
						DeepSeek Harness
					</a>
				</nav>
			</footer>
		</div>
	);
}

export default App;
