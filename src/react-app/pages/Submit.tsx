import { useState } from "react";
import { Icon, type IconName } from "../components/Icon";
import { useI18n } from "../lib/i18n";
import { submitPlugin } from "../lib/api";

const STEPS: Array<{ icon: IconName; titleKey: string; descKey: string }> = [
	{ icon: "github", titleKey: "submit.step1Title", descKey: "submit.step1Desc" },
	{ icon: "shield", titleKey: "submit.step2Title", descKey: "submit.step2Desc" },
	{ icon: "check", titleKey: "submit.step3Title", descKey: "submit.step3Desc" },
];

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
		<section className="mx-auto max-w-4xl">
			<header className="mb-10 text-center">
				<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-secondary">{t("submit.eyebrow")}</p>
				<h1 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">{t("submit.title")}</h1>
				<p className="mx-auto mt-4 max-w-xl text-base leading-relaxed opacity-65">{t("submit.desc")}</p>
			</header>

			<form className="border-2 border-base-content bg-base-100 p-6 md:p-10" onSubmit={handleSubmit}>
				<label className="sr-only" htmlFor="repository-url">{t("submit.placeholder")}</label>
				<div className="flex flex-col gap-3 sm:flex-row">
					<label className="input flex min-w-0 flex-1 items-center gap-2 text-base">
						<Icon name="github" size={20} stroke={1.75} className="shrink-0 opacity-50" />
						<input
							id="repository-url"
							className="grow border-0 bg-transparent outline-none"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder={t("submit.placeholder")}
							required
						/>
					</label>
					<button type="submit" className="btn btn-primary min-w-32" disabled={busy}>
						<Icon name="send" size={16} stroke={2} />
						{busy ? t("submit.submitting") : t("submit.submit")}
					</button>
				</div>
				{status && <p className="mt-4 font-semibold text-success">{status}</p>}
				{error && <p className="mt-4 text-error">{error}</p>}
			</form>

			<ol className="mt-10 grid gap-6 sm:grid-cols-3">
				{STEPS.map((step, i) => (
					<li key={step.titleKey} className="relative border-2 border-base-content bg-base-100 p-6">
						<span className="absolute -top-4 -left-4 grid h-8 w-8 place-items-center bg-secondary text-sm font-black text-secondary-content">{i + 1}</span>
						<Icon name={step.icon} size={26} stroke={1.8} className="mb-4 text-secondary" />
						<h2 className="text-lg font-extrabold">{t(step.titleKey)}</h2>
						<p className="mt-2 text-sm leading-relaxed opacity-65">{t(step.descKey)}</p>
					</li>
				))}
			</ol>
		</section>
	);
}
