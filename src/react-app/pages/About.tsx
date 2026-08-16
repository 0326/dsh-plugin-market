import { Icon, type IconName } from "../components/Icon";
import { Kun } from "../components/Kun";
import { useI18n } from "../lib/i18n";

const FEATURES: Array<{ icon: IconName; title: string; text: string }> = [
	{ icon: "check", title: "about.featureFormatTitle", text: "about.featureFormatText" },
	{ icon: "exchange", title: "about.featureCompatTitle", text: "about.featureCompatText" },
	{ icon: "shield", title: "about.featureSecurityTitle", text: "about.featureSecurityText" },
	{ icon: "history", title: "about.featureTraceTitle", text: "about.featureTraceText" },
];

export default function About() {
	const { t } = useI18n();
	return (
		<section className="about-page mx-auto w-full max-w-7xl">
			<header className="border-b-2 border-base-content py-8 md:py-14">
				<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-secondary">DSH-PLUGIN MARKET</p>
				<h1 className="text-4xl font-black tracking-[-0.05em] md:text-5xl">{t("about.title")}</h1>
				<p className="mt-5 w-full text-lg leading-relaxed opacity-70">{t("about.intro")}</p>
			</header>

			<div className="about-features grid border-x-2 border-b-2 border-base-content sm:grid-cols-2 lg:grid-cols-4">
				{FEATURES.map((feature) => (
					<article key={feature.title} className="about-feature border-b border-base-content p-6 md:p-8">
						<Icon name={feature.icon} size={30} stroke={1.8} className="mb-5 text-secondary" />
						<h2 className="text-xl font-extrabold">{t(feature.title)}</h2>
						<p className="mt-2 leading-relaxed opacity-65">{t(feature.text)}</p>
					</article>
				))}
			</div>

			<section className="about-logo-story mt-8 grid overflow-hidden border-2 border-base-content lg:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.7fr)]">
				<div className="about-logo-visual grid min-h-72 place-items-center border-b-2 border-base-content bg-secondary p-8 lg:border-r-2 lg:border-b-0">
					<Kun className="w-full max-w-72 object-contain" ariaHidden />
				</div>
				<div className="flex flex-col justify-center p-6 md:p-10">
					<p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-secondary">{t("about.logoKicker")}</p>
					<h2 className="text-3xl font-black tracking-[-0.04em] md:text-4xl">{t("about.logoTitle")}</h2>
					<p className="mt-4 max-w-3xl leading-relaxed opacity-70">{t("about.logoText")}</p>
					<p className="logo-equation mt-7" aria-label={t("about.logoEquationAria")}>
						<span>DeepSeek + AI</span><b>=</b><span>鲸 + AI</span><b>=</b><span>AI + 鲲</span><b>=</b><span>爱 + 鲲</span><b>=</b><strong>iKun</strong>
					</p>
				</div>
			</section>

			<div className="mt-8 flex flex-col justify-between gap-5 border-2 border-base-content bg-neutral p-6 text-neutral-content md:flex-row md:items-center md:p-8">
				<div><h2 className="text-2xl font-black">{t("about.communityTitle")}</h2><p className="mt-1 opacity-70">{t("about.communityText")}</p></div>
				<a className="btn bg-neutral-content text-neutral" href="https://github.com/0326/dsh-plugin-market" target="_blank" rel="noreferrer">
					<Icon name="github" size={18} stroke={2} />{t("about.source")}
				</a>
			</div>
		</section>
	);
}
