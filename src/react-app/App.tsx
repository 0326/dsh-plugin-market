import { useSyncExternalStore } from "react";
import "./App.css";
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
		<div className="app">
			<header className="topbar">
				<a className="brand" href="#/">
					<Kun className="brand-kun" ariaHidden />
					<span className="brand-name">
						dsh-plugin <span className="brand-invert">market</span>
					</span>
				</a>
				<nav>
					<a href="#/">{t("nav.home")}</a>
					<a href="#/plugins">{t("nav.explore")}</a>
					<a href="#/submit">{t("nav.submit")}</a>
				</nav>
				<div className="topbar-actions">
					<button
						className="theme-switch"
						onClick={toggleTheme}
						aria-label={theme === "light" ? t("theme.dark") : t("theme.light")}
					>
						{theme === "light" ? t("theme.dark") : t("theme.light")}
					</button>
					<button
						className="lang-switch"
						onClick={toggleLang}
						aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
					>
						{t("langSwitch")}
					</button>
				</div>
			</header>
			<main className="content">
				{route.name === "home" && <Home />}
				{route.name === "explore" && <Explore key={route.query} query={route.query} />}
				{route.name === "plugin" && <PluginDetail owner={route.owner} repo={route.repo} />}
				{route.name === "publisher" && <Publisher owner={route.owner} />}
				{route.name === "submit" && <Submit />}
			</main>
			<footer className="footer">
				<div className="footer-inner">
					<div className="footer-brand">
						<Kun className="footer-kun" ariaHidden />
						<span>dsh-plugin market</span>
					</div>
					<p>{t("footer")}</p>
					<p className="footer-links">
						<a href="#/plugins">{t("nav.explore")}</a>
						<a href="#/submit">{t("nav.submit")}</a>
						<a href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noreferrer">
							DeepSeek Harness
						</a>
						<a href="https://github.com/topics/dsh-plugin" target="_blank" rel="noreferrer">
							GitHub dsh-plugin
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
}

export default App;
