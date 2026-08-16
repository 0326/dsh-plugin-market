import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { submitPlugin } from "../lib/api";

export default function Submit() {
	const { t } = useI18n();
	const [url, setUrl] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		setStatus(null);
		try {
			const res = await submitPlugin(url);
			setStatus(t("submit.queued", { owner: res.owner, repo: res.repo }));
			setUrl("");
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="submit">
			<h1 className="page-title">{t("submit.title")}</h1>
			<p className="page-subtitle">{t("submit.desc")}</p>
			<form onSubmit={handleSubmit}>
				<input
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder={t("submit.placeholder")}
					required
				/>
				<button type="submit" className="btn btn-primary" disabled={busy}>
					{busy ? t("submit.submitting") : t("submit.submit")}
				</button>
			</form>
			{status && <p className="ok-text">{status}</p>}
			{error && <p className="error">{error}</p>}
		</section>
	);
}
