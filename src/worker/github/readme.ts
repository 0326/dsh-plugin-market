import type { GithubTreeEntry } from "./client";

export type ReadmeLanguage = "zh" | "en";

export interface ResolvedReadme {
	path: string;
	language: ReadmeLanguage | "unknown";
	fallback: boolean;
}

const README_DIRS = ["", ".github/", "docs/"] as const;

const LANGUAGE_NAMES: Record<ReadmeLanguage, readonly string[]> = {
	zh: ["README.zh-CN.md", "README.zh-Hans.md", "README.zh.md", "README_CN.md", "README-zh-CN.md", "README-zh.md"],
	en: ["README.en.md", "README.en-US.md", "README_EN.md", "README-en.md", "README-en-US.md"],
};

function findByName(paths: Map<string, string>, names: readonly string[]): string | undefined {
	for (const name of names) {
		for (const dir of README_DIRS) {
			const actual = paths.get((dir + name).toLowerCase());
			if (actual) return actual;
		}
	}
	return undefined;
}

export function resolveReadmePath(entries: Pick<GithubTreeEntry, "path" | "type">[], language: ReadmeLanguage): ResolvedReadme | null {
	const files = new Map<string, string>();
	for (const entry of entries) {
		if (entry.type === "blob") files.set(entry.path.toLowerCase(), entry.path);
	}

	const preferred = findByName(files, LANGUAGE_NAMES[language]);
	if (preferred) return { path: preferred, language, fallback: false };

	const generic = findByName(files, ["README.md"]);
	if (generic) return { path: generic, language: "unknown", fallback: false };

	const otherLanguage: ReadmeLanguage = language === "zh" ? "en" : "zh";
	const fallback = findByName(files, LANGUAGE_NAMES[otherLanguage]);
	if (fallback) return { path: fallback, language: otherLanguage, fallback: true };

	return null;
}
