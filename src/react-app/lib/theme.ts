import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "dsh-market-theme";

export interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
	return ctx;
}

export function initialTheme(): Theme {
	// 默认亮色；仅当用户明确保存过暗色选择时才使用暗色。
	if (typeof window === "undefined") return "light";
	try {
		const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
		if (saved === "dark" || saved === "light") return saved;
	} catch {
		// ignore storage access errors
	}
	return "light";
}
