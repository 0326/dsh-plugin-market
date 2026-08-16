import { useSyncExternalStore } from "react";
import "./App.css";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import PluginDetail from "./pages/PluginDetail";
import Submit from "./pages/Submit";

type Route =
	| { name: "home" }
	| { name: "explore" }
	| { name: "plugin"; owner: string; repo: string }
	| { name: "submit" };

function parseRoute(hash: string): Route {
	const path = hash.replace(/^#/, "") || "/";
	const segments = path.split("/").filter(Boolean);
	if (segments.length === 0) return { name: "home" };
	if (segments[0] === "plugins") return { name: "explore" };
	if (segments[0] === "plugin" && segments[1] && segments[2]) return { name: "plugin", owner: segments[1], repo: segments[2] };
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
	return (
		<div className="app">
			<header className="topbar">
				<a className="brand" href="#/">DS Plugin Market</a>
				<nav>
					<a href="#/">Home</a>
					<a href="#/plugins">Explore</a>
					<a href="#/submit">Submit</a>
				</nav>
			</header>
			<main className="content">
				{route.name === "home" && <Home />}
				{route.name === "explore" && <Explore />}
				{route.name === "plugin" && <PluginDetail owner={route.owner} repo={route.repo} />}
				{route.name === "submit" && <Submit />}
			</main>
			<footer className="footer">
				<p>DS Plugin Market is a community project — not an official DeepSeek product. Format Verified ≠ Safe.</p>
			</footer>
		</div>
	);
}

export default App;
