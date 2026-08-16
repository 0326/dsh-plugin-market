import { installCommand, type PluginDetail } from "../lib/api";
import { Badge } from "./Badge";

export function InstallCard({ plugin }: { plugin: PluginDetail }) {
	const cmd = installCommand(plugin.owner, plugin.repo, plugin.latestCommitSha);
	return (
		<aside className="install-card">
			<h3>Install</h3>
			<dl className="install-rows">
				<dt>Format</dt>
				<dd><Badge value={plugin.verificationStatus} /></dd>
				<dt>Compatibility</dt>
				<dd><Badge value={plugin.compatibilityStatus} /></dd>
				<dt>Security</dt>
				<dd><Badge value={plugin.securityStatus} /></dd>
				<dt>Risk</dt>
				<dd><Badge value={plugin.riskLevel} /></dd>
			</dl>
			<pre className="install-cmd">{cmd}</pre>
			<button className="copy-btn" onClick={() => navigator.clipboard?.writeText(cmd)}>Copy command</button>
			{plugin.latestCommitSha ? (
				<p className="hint">
					Pinned to the scanned commit <code>{plugin.latestCommitSha.slice(0, 7)}</code>.
				</p>
			) : (
				<p className="hint">No scanned commit yet.</p>
			)}
		</aside>
	);
}
