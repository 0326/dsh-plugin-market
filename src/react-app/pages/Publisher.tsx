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

	if (error) return <p className="text-error">{t("publisher.loadError", { msg: error })}</p>;
	if (!pub) return <p className="text-base-content/60">{t("common.loading")}</p>;

	return (
		<section>
			<h1 className="mb-2 text-3xl font-extrabold tracking-tight">{pub.owner}</h1>
			<p className="mb-6 opacity-60">
				{t("publisher.summary", { verified: pub.verifiedCount, plugins: pub.repos.length, stars: pub.totalStars })}
			</p>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{pub.repos.map((p) => (
					<PluginCard key={p.fullName} p={p} />
				))}
			</div>
		</section>
	);
}
