import { useState } from "react";
import { installCommand, type PluginDetail } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Icon } from "./Icon";

export function InstallCard({ plugin }: { plugin: PluginDetail }) {
	const { t } = useI18n();
	const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
	const cmd = installCommand(plugin.owner, plugin.repo, plugin.latestCommitSha);
	async function copyCommand() {
		try {
			if (!navigator.clipboard) throw new Error("clipboard unavailable");
			await navigator.clipboard.writeText(cmd);
			setCopyState("copied");
		} catch {
			setCopyState("failed");
		}
	}
	return (
		<section className="install-panel border-2 border-base-content bg-base-100 p-4 md:p-5">
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
				<h2 className="text-sm font-extrabold uppercase tracking-widest">{t("install.title")}</h2>
				<p className="text-xs opacity-55">
					{plugin.latestCommitSha ? t("install.pinned", { sha: plugin.latestCommitSha.slice(0, 7) }) : t("install.noCommit")}
				</p>
			</div>
			<div className="flex flex-col gap-3">
				<div className="mockup-code min-w-0 text-xs">
					<pre data-prefix="$" className="whitespace-pre-wrap break-all"><code>{cmd}</code></pre>
				</div>
				<div className="flex flex-col gap-2">
					<button className="btn btn-neutral" onClick={copyCommand}>
						<Icon name="copy" size={16} stroke={2} />
						{copyState === "copied" ? t("install.copied") : copyState === "failed" ? t("install.copyFailed") : t("install.copy")}
					</button>
					<a className="btn btn-outline" href={plugin.htmlUrl} target="_blank" rel="noreferrer">
						<Icon name="github" size={17} stroke={2} />{t("install.source")}
					</a>
				</div>
			</div>
		</section>
	);
}
