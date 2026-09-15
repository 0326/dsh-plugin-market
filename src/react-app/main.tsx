import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./content.css";
import "./guide.css";
import "./about.css";
import "./docs.css";
import "./whitepaper.css";
import "./whitepaper-host.css";

import App from "./App.tsx";
import { LanguageProvider } from "./lib/LanguageProvider";
import { ThemeProvider } from "./lib/ThemeProvider";
import { isWhitepaperHost } from "../shared/site-routing";

document.documentElement.classList.toggle("whitepaper-standalone", isWhitepaperHost(window.location.hostname));

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ThemeProvider>
			<LanguageProvider>
				<App />
			</LanguageProvider>
		</ThemeProvider>
	</StrictMode>,
);
