import { installCommand, type PluginDetail } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Badge } from "./Badge";

export function InstallCard({ plugin }: { plugin: PluginDetail }) {
	const { t } = useI18n();
	const cmd = installCommand(plugin.owner, plugin.repo, plugin.latestCommitSha);
	return (
		<aside className="install-card">
			<h3>{t("install.title")}</h3>
			<dl className="install-rows">
				<dt>{t("install.format")}</dt>
				<dd><Badge value={plugin.verificationStatus} /></dd>
				<dt>{t("install.compatibility")}</dt>
				<dd><Badge value={plugin.compatibilityStatus} /></dd>
				<dt>{t("install.security")}</dt>
				<dd><Badge value={plugin.securityStatus} /></dd>
				<dt>{t("install.risk")}</dt>
				<dd><Badge value={plugin.riskLevel} /></dd>
			</dl>
			<pre className="install-cmd">{cmd}</pre>
			<button className="copy-btn" onClick={() => navigator.clipboard?.writeText(cmd)}>{t("install.copy")}</button>
			{plugin.latestCommitSha ? (
				<p className="hint">
					{t("install.pinned", { sha: plugin.latestCommitSha.slice(0, 7) })}
				</p>
			) : (
				<p className="hint">{t("install.noCommit")}</p>
			)}
		</aside>
	);
}
