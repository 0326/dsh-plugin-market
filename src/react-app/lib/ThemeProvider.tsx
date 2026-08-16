import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { initialTheme, ThemeContext, THEME_STORAGE_KEY, type Theme } from "./theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(initialTheme);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		try {
			window.localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// ignore storage write errors
		}
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme(theme === "light" ? "dark" : "light");
	}, [theme, setTheme]);

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
		const meta = document.querySelector('meta[name="theme-color"]');
		if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0b0b" : "#ffffff");
	}, [theme]);

	const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
