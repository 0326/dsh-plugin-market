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
		<div className="flex min-h-screen flex-col bg-base-100 text-base-content">
			<header className="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/95 backdrop-blur">
				<div className="navbar-start">
					<a className="btn btn-ghost px-2 text-lg normal-case" href="#/">
						<Kun className="h-6 w-auto" ariaHidden />
						<span className="font-extrabold tracking-tight">
							dsh-plugin <span className="badge badge-neutral align-middle">market</span>
						</span>
					</a>
				</div>
				<div className="navbar-center hidden gap-1 md:flex">
					<a className="btn btn-ghost btn-sm" href="#/">{t("nav.home")}</a>
					<a className="btn btn-ghost btn-sm" href="#/plugins">{t("nav.explore")}</a>
					<a className="btn btn-ghost btn-sm" href="#/submit">{t("nav.submit")}</a>
				</div>
				<div className="navbar-end gap-1">
					<div className="dropdown dropdown-end md:hidden">
						<div tabIndex={0} role="button" className="btn btn-ghost btn-sm" aria-label="Menu">☰</div>
						<ul tabIndex={0} className="dropdown-content menu z-50 mt-3 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow">
							<li><a href="#/">{t("nav.home")}</a></li>
							<li><a href="#/plugins">{t("nav.explore")}</a></li>
							<li><a href="#/submit">{t("nav.submit")}</a></li>
						</ul>
					</div>
					<button className="btn btn-ghost btn-sm" onClick={toggleTheme} aria-label={theme === "light" ? t("theme.dark") : t("theme.light")}>
						{theme === "light" ? t("theme.dark") : t("theme.light")}
					</button>
					<button className="btn btn-ghost btn-sm" onClick={toggleLang} aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}>
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
			</main>

			<footer className="footer bg-neutral p-10 text-neutral-content">
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
