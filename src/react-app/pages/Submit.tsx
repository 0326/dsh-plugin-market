import { useState } from "react";
import { submitPlugin } from "../lib/api";

export default function Submit() {
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
			setStatus("Queued " + res.owner + "/" + res.repo + " for scanning.");
			setUrl("");
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="submit">
			<h1>Submit a plugin</h1>
			<p className="plugin-desc">Paste a GitHub repository URL. We validate it, add it as a candidate, and enqueue a scan.</p>
			<form onSubmit={handleSubmit}>
				<input
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="https://github.com/owner/repo"
					required
				/>
				<button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit"}</button>
			</form>
			{status && <p className="ok-text">{status}</p>}
			{error && <p className="error">{error}</p>}
		</section>
	);
}
