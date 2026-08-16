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
		<section className="mx-auto max-w-2xl">
			<h1 className="mb-1 text-3xl font-extrabold tracking-tight">{t("submit.title")}</h1>
			<p className="mb-6 opacity-60">{t("submit.desc")}</p>
			<form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
				<input
					className="input flex-1"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder={t("submit.placeholder")}
					required
				/>
				<button type="submit" className="btn btn-primary" disabled={busy}>
					{busy ? t("submit.submitting") : t("submit.submit")}
				</button>
			</form>
			{status && <p className="mt-4 font-semibold text-success">{status}</p>}
			{error && <p className="mt-4 text-error">{error}</p>}
		</section>
	);
}
