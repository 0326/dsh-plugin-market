import { installCommand, type PluginDetail } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Badge } from "./Badge";

export function InstallCard({ plugin }: { plugin: PluginDetail }) {
	const { t } = useI18n();
	const cmd = installCommand(plugin.owner, plugin.repo, plugin.latestCommitSha);
	return (
		<aside className="card sticky top-20 border border-base-300 bg-base-100 shadow-sm">
			<div className="card-body gap-4">
				<h3 className="card-title text-sm font-bold uppercase tracking-wide">{t("install.title")}</h3>
				<dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
					<dt className="opacity-60">{t("install.format")}</dt>
					<dd className="m-0"><Badge value={plugin.verificationStatus} /></dd>
					<dt className="opacity-60">{t("install.compatibility")}</dt>
					<dd className="m-0"><Badge value={plugin.compatibilityStatus} /></dd>
					<dt className="opacity-60">{t("install.security")}</dt>
					<dd className="m-0"><Badge value={plugin.securityStatus} /></dd>
					<dt className="opacity-60">{t("install.risk")}</dt>
					<dd className="m-0"><Badge value={plugin.riskLevel} /></dd>
				</dl>
				<div className="mockup-code text-xs">
					<pre data-prefix="$" className="whitespace-pre-wrap break-all"><code>{cmd}</code></pre>
				</div>
				<button className="btn btn-neutral btn-block" onClick={() => navigator.clipboard?.writeText(cmd)}>
					{t("install.copy")}
				</button>
				{plugin.latestCommitSha ? (
					<p className="text-xs opacity-60">{t("install.pinned", { sha: plugin.latestCommitSha.slice(0, 7) })}</p>
				) : (
					<p className="text-xs opacity-60">{t("install.noCommit")}</p>
				)}
			</div>
		</aside>
	);
}
