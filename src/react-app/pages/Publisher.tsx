import { useEffect, useState } from "react";
import { PluginCard } from "../components/PluginCard";
import { useI18n } from "../lib/i18n";
import { getPublisher, type Publisher } from "../lib/api";

export default function Publisher({ owner }: { owner: string }) {
	const { t } = useI18n();
	const [pub, setPub] = useState<Publisher | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let ignore = false;
		getPublisher(owner)
			.then((p) => {
				if (!ignore) setPub(p);
			})
			.catch((err) => {
				if (!ignore) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			ignore = true;
		};
	}, [owner]);

	if (error) return <p className="error">{t("publisher.loadError", { msg: error })}</p>;
	if (!pub) return <p className="empty">{t("common.loading")}</p>;

	return (
		<section>
			<h1 className="page-title">{pub.owner}</h1>
			<p className="publisher-summary">
				{t("publisher.summary", { verified: pub.verifiedCount, plugins: pub.repos.length, stars: pub.totalStars })}
			</p>
			<div className="plugin-grid">
				{pub.repos.map((p) => (
					<PluginCard key={p.fullName} p={p} />
				))}
			</div>
		</section>
	);
}
