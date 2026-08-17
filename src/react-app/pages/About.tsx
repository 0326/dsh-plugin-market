import { Icon } from "../components/Icon";
import { Kun } from "../components/Kun";
import { useI18n } from "../lib/i18n";

const COPY = {
	zh: {
		kicker: "ABOUT / BRAND",
		tagline: "一只从深海游向 AI 世界的爱鲲",
		intro: "DSH-PLUGIN MARKET 的鲲，不只是一个 Logo。它从 DeepSeek 的深海意象出发，游进 AI 世界，也把技术社区的创造力和一点轻松的 iKun 彩蛋带了进来。",
		equationLabel: "iKun 计算公式",
		equation: ["DeepSeek + AI", "鲸 + AI", "AI + 鲲", "爱 + 鲲", "iKun"],
		hobbyLabel: "iKun 的爱好",
		hobbyEquation: "iKun = 唱跳 + Code + 打篮球",
		hobbies: [
			{ key: "music", label: "唱跳", caption: "SING & DANCE" },
			{ key: "code", label: "代码", caption: "CODE" },
			{ key: "ball", label: "打篮球", caption: "BASKETBALL" },
		],
		brandText: "从深海、鲸、鲲，到 AI 与“爱”的谐音，最终汇成 iKun。这里保留的是一个开发者社区自己的品牌玩心：认真做插件市场，也认真把它做得有记忆点。",
		browse: "浏览插件",
		docs: "查看文档",
		communityTitle: "社区驱动，开放协作",
		communityText: "DSH-PLUGIN MARKET 并非 DeepSeek 官方产品，欢迎通过 GitHub 参与改进。",
		source: "查看项目源码",
	},
	en: {
		kicker: "ABOUT / BRAND",
		tagline: "An AI-loving Kun swimming from the deep sea into the AI world",
		intro: "The Kun is more than the DSH-PLUGIN MARKET logo. It starts with DeepSeek's deep-sea imagery, swims into the AI world, and carries a playful iKun signature from the developer community.",
		equationLabel: "The iKun equation",
		equation: ["DeepSeek + AI", "Whale + AI", "AI + Kun", "Love + Kun", "iKun"],
		hobbyLabel: "What iKun loves",
		hobbyEquation: "iKun = Sing & Dance + Code + Basketball",
		hobbies: [
			{ key: "music", label: "Sing & Dance", caption: "SING & DANCE" },
			{ key: "code", label: "Code", caption: "CODE" },
			{ key: "ball", label: "Basketball", caption: "BASKETBALL" },
		],
		brandText: "Deep sea becomes whale, whale becomes Kun, and AI meets the sound of love — eventually forming iKun. It is a small piece of developer-community playfulness inside a serious plugin marketplace.",
		browse: "Browse plugins",
		docs: "Read the docs",
		communityTitle: "Community-driven and open",
		communityText: "DSH-PLUGIN MARKET is not an official DeepSeek product. Contributions are welcome on GitHub.",
		source: "View source code",
	},
} as const;

export default function About() {
	const { lang } = useI18n();
	const copy = COPY[lang];

	return (
		<section className="about-brand-page">
			<section className="about-ocean-hero">
				<div className="about-ocean-glow" aria-hidden="true" />
				<div className="about-ocean-wave about-ocean-wave-one" aria-hidden="true" />
				<div className="about-ocean-wave about-ocean-wave-two" aria-hidden="true" />

				<div className="about-brand-copy">
					<p className="about-brand-kicker">{copy.kicker}</p>
					<h1 className="about-brand-title">
						<span>DSH-PLUGIN</span>
						<strong>MARKET</strong>
					</h1>
					<p className="about-brand-tagline">{copy.tagline}</p>
					<p className="about-brand-intro">{copy.intro}</p>
					<div className="about-brand-actions">
						<a className="btn about-btn-primary" href="/plugins">{copy.browse} →</a>
						<a className="btn about-btn-secondary" href="/guide/what-is-dsh-plugin">{copy.docs}</a>
					</div>
				</div>

				<div className="about-kun-stage" aria-label={copy.tagline}>
					<span className="about-bubble about-bubble-one" aria-hidden="true" />
					<span className="about-bubble about-bubble-two" aria-hidden="true" />
					<span className="about-bubble about-bubble-three" aria-hidden="true" />

					<div className="about-orbit about-orbit-music" aria-hidden="true">
						<span className="about-orbit-glyph">♪</span>
						<strong>{copy.hobbies[0].label}</strong>
					</div>
					<div className="about-orbit about-orbit-code" aria-hidden="true">
						<span className="about-orbit-glyph">&lt;/&gt;</span>
						<strong>{copy.hobbies[1].label}</strong>
					</div>
					<div className="about-orbit about-orbit-ball" aria-hidden="true">
						<Icon name="ball-basketball" size={54} stroke={2.2} />
						<strong>{copy.hobbies[2].label}</strong>
					</div>

					<Kun className="about-kun" ariaHidden />
				</div>

				<div className="about-equation-panel">
					<p className="about-equation-label">{copy.equationLabel}</p>
					<div className="about-equation-track" aria-label={copy.equation.join(" equals ")}>
						{copy.equation.map((item, index) => (
							<span className={index === copy.equation.length - 1 ? "about-equation-result" : ""} key={item}>
								<strong>{item}</strong>
								{index < copy.equation.length - 1 && <b aria-hidden="true">=</b>}
							</span>
						))}
					</div>
				</div>
			</section>

			<section className="about-hobby-section">
				<div className="about-hobby-copy">
					<p className="content-kicker">{copy.hobbyLabel}</p>
					<h2>{copy.hobbyEquation}</h2>
					<p>{copy.brandText}</p>
				</div>
				<div className="about-hobby-grid">
					{copy.hobbies.map((hobby, index) => (
						<article className={`about-hobby-card about-hobby-${hobby.key}`} key={hobby.key}>
							<span>{String(index + 1).padStart(2, "0")}</span>
							<div className="about-hobby-icon" aria-hidden="true">
								{hobby.key === "music" && "♪"}
								{hobby.key === "code" && "</>"}
								{hobby.key === "ball" && <Icon name="ball-basketball" size={50} stroke={2.2} />}
							</div>
							<strong>{hobby.label}</strong>
							<small>{hobby.caption}</small>
						</article>
					))}
				</div>
			</section>

			<section className="about-community-strip">
				<div>
					<h2>{copy.communityTitle}</h2>
					<p>{copy.communityText}</p>
				</div>
				<a className="btn bg-neutral-content text-neutral" href="https://github.com/0326/dsh-plugin-market" target="_blank" rel="noreferrer">
					<Icon name="github" size={18} stroke={2} />{copy.source}
				</a>
			</section>
		</section>
	);
}
