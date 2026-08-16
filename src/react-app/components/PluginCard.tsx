import type { PluginListItem } from "../lib/api";
import { Badge } from "./Badge";

export function PluginCard({ p }: { p: PluginListItem }) {
	return (
		<a className="plugin-card" href={"#/plugin/" + p.owner + "/" + p.repo}>
			<div className="plugin-card-title">
				<span className="plugin-name">{p.fullName}</span>
				<Badge value={p.verificationStatus} />
			</div>
			<p className="plugin-desc">{p.description ?? "No description."}</p>
			<div className="plugin-meta">
				<span>★ {p.stars}</span>
				<Badge value={p.riskLevel} label={"risk " + p.riskLevel.toLowerCase()} />
			</div>
		</a>
	);
}
