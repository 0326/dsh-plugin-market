import { useSyncExternalStore } from "react";
import "./App.css";
import { useI18n } from "./lib/i18n";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import PluginDetail from "./pages/PluginDetail";
import Publisher from "./pages/Publisher";
import Submit from "./pages/Submit";

type Route =
	| { name: "home" }
	| { name: "explore" }
	| { name: "plugin"; owner: string; repo: string }
	| { name: "publisher"; owner: string }
	| { name: "submit" };

function parseRoute(hash: string): Route {
	const path = hash.replace(/^#/, "") || "/";
	const segments = path.split("/").filter(Boolean);
	if (segments.length === 0) return { name: "home" };
	if (segments[0] === "plugins") return { name: "explore" };
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
	return (
		<div className="app">
			<header className="topbar">
				<a className="brand" href="#/">DS Plugin Market</a>
				<nav>
					<a href="#/">{t("nav.home")}</a>
					<a href="#/plugins">{t("nav.explore")}</a>
					<a href="#/submit">{t("nav.submit")}</a>
				</nav>
				<button
					className="lang-switch"
					onClick={toggleLang}
					aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
				>
					{t("langSwitch")}
				</button>
			</header>
			<main className="content">
				{route.name === "home" && <Home />}
				{route.name === "explore" && <Explore />}
				{route.name === "plugin" && <PluginDetail owner={route.owner} repo={route.repo} />}
				{route.name === "publisher" && <Publisher owner={route.owner} />}
				{route.name === "submit" && <Submit />}
			</main>
			<footer className="footer">
				<p>{t("footer")}</p>
			</footer>
		</div>
	);
}

export default App;
