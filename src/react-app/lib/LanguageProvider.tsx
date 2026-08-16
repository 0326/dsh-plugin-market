import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { detectLanguage, I18nContext, translations, type Language } from "./i18n";

const STORAGE_KEY = "dsh-market-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [lang, setLangState] = useState<Language>(detectLanguage);

	const setLang = useCallback((next: Language) => {
		setLangState(next);
		try {
			window.localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// ignore storage write errors
		}
	}, []);

	const toggleLang = useCallback(() => {
		setLang(lang === "zh" ? "en" : "zh");
	}, [lang, setLang]);

	const t = useCallback(
		(key: string, params?: Record<string, string | number>, fallback?: string): string => {
			let s: string | undefined;
			let node: unknown = translations[lang];
			for (const part of key.split(".")) {
				if (typeof node !== "object" || node === null) break;
				node = (node as Record<string, unknown>)[part];
				if (typeof node === "string") {
					s = node;
					break;
				}
			}
			let out = s ?? fallback ?? key;
			if (params) {
				for (const [k, v] of Object.entries(params)) {
					out = out.split("{" + k + "}").join(String(v));
				}
			}
			return out;
		},
		[lang],
	);

	useEffect(() => {
		document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
		document.title = t("meta.title");
		const meta = document.querySelector('meta[name="description"]');
		if (meta) meta.setAttribute("content", t("meta.description"));
	}, [lang, t]);

	const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
