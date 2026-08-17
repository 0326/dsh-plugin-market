import type { Language } from "../lib/i18n";

export type GuideSlug = "what-is-dsh-plugin" | "install-dsh-plugin" | "choose-dsh-plugin";
export type GuideExampleMode = "overview" | "install" | "evaluate";

export interface GuideSection {
	kicker: string;
	title: string;
	body: string[];
	bullets?: { title: string; text: string }[];
	code?: { label: string; value: string }[];
	note?: { label: string; text: string };
}

export interface GuideCopy {
	slug: GuideSlug;
	kicker: string;
	title: string;
	directAnswer: string;
	intro: string;
	factLabels: { scanner: string; dsh: string; cordis: string; verified: string };
	sections: GuideSection[];
	examplesTitle: string;
	examplesIntro: string;
	examplesEmpty: string;
	exampleMode: GuideExampleMode;
	relatedTitle: string;
	related: { href: string; label: string }[];
	sourcesTitle: string;
	sources: { href: string; label: string; external?: boolean }[];
	updatedLabel: string;
	updated: string;
}

const zh: Record<GuideSlug, GuideCopy> = {
	"what-is-dsh-plugin": {
		slug: "what-is-dsh-plugin",
		kicker: "GUIDE / CONCEPT",
		title: "什么是 DSH Plugin？",
		directAnswer: "DSH Plugin 是 DeepSeek Harness 的扩展单元，用来向 Harness 接入工具、Agent、外部集成或运行时能力。一个仓库被称为 DSH Plugin，不只取决于它的 README 描述，还要看实际 manifest、入口、导出和依赖是否符合当前插件结构。",
		intro: "这篇指南从插件在 DeepSeek Harness 中的位置开始，解释 DSH Plugin Market 如何发现、识别和验证公开插件仓库，以及安装前应该关注哪些事实。",
		factLabels: { scanner: "当前 Scanner", dsh: "DSH baseline", cordis: "Cordis baseline", verified: "已验证插件" },
		sections: [
			{
				kicker: "01 / POSITION",
				title: "DSH Plugin 在 DeepSeek Harness 中做什么？",
				body: ["DeepSeek Harness 把能力扩展交给插件体系。插件把一个可复用能力接入 Harness，而 Market 的任务是把 GitHub 上的候选仓库转换成结构化、可验证的 Registry 记录。"],
				bullets: [
					{ title: "Tools", text: "为 Agent 暴露可调用的工具能力。" },
					{ title: "Agents", text: "提供可复用的 Agent 或 Agent 相关扩展。" },
					{ title: "Integrations", text: "连接外部服务、数据源或开发工具。" },
					{ title: "Runtime", text: "扩展 Harness 运行时或 Web / Client 侧能力。" },
				],
			},
			{
				kicker: "02 / STRUCTURE",
				title: "Market 如何判断一个仓库是不是 DSH Plugin？",
				body: ["Scanner 会读取仓库结构和配置，而不是只相信 Topic 或 README。当前验证会关注 package.json、DSH / Cordis 依赖、plugin entry / exports，以及 bundle / patch 等可识别结构。", "Format Verified 表示仓库通过当前 Scanner 的结构规则；它不代表代码绝对安全，也不代表未来版本永远兼容。"],
				note: { label: "IMPORTANT", text: "Format Verified ≠ Safe。格式、兼容性、安全和维护状态是四个独立维度。" },
			},
			{
				kicker: "03 / DISCOVERY",
				title: "DSH Plugin 是怎么被发现的？",
				body: ["DSH Plugin Market 会从 GitHub 的 dsh-plugin Topic 等公开来源发现候选仓库，也接受用户直接提交 GitHub 仓库。候选仓库进入扫描队列后，只有真实源码和配置能够支持相应判断时，才会升级到更高的验证状态。"],
				bullets: [
					{ title: "Candidate", text: "公开来源发现的候选仓库。" },
					{ title: "Detected", text: "Scanner 识别到 DSH 相关结构。" },
					{ title: "Format Verified", text: "通过当前插件结构规则。" },
					{ title: "Featured", text: "在验证基础上进一步精选展示。" },
				],
			},
			{
				kicker: "04 / INSTALL",
				title: "DSH Plugin 如何安装？",
				body: ["DeepSeek Harness 支持从 GitHub 安装插件。Market 对已经扫描的插件优先展示绑定 commit 的安装方式，使安装源码与扫描证据尽量保持一致。"],
				code: [
					{ label: "GitHub", value: "dsh plugin --profile web add github:owner/repo" },
					{ label: "Pinned commit", value: "dsh plugin --profile web add github:owner/repo#<scanned_commit>" },
				],
			},
			{
				kicker: "05 / EVALUATE",
				title: "安装前应该看什么？",
				body: ["不要只看 Stars。至少同时检查格式验证、当前 DSH / Cordis 兼容性、安全信号、维护状态、发布者来源，以及页面展示的 scanned commit。"],
			},
		],
		examplesTitle: "Registry 中的真实 DSH Plugin 示例",
		examplesIntro: "下面的示例直接来自当前 Registry 的已验证插件，不使用虚构仓库。状态会随重新扫描而变化。",
		examplesEmpty: "当前没有可展示的已验证插件，请直接浏览 Registry。",
		exampleMode: "overview",
		relatedTitle: "继续阅读",
		related: [
			{ href: "/guide/install-dsh-plugin", label: "如何安装 DSH Plugin" },
			{ href: "/guide/choose-dsh-plugin", label: "如何评估和选择 DSH Plugin" },
			{ href: "/trust", label: "理解验证机制" },
		],
		sourcesTitle: "来源与依据",
		sources: [
			{ href: "https://github.com/deepseek-ai/deepseek-harness", label: "DeepSeek Harness", external: true },
			{ href: "https://github.com/topics/dsh-plugin", label: "GitHub dsh-plugin Topic", external: true },
			{ href: "/trust", label: "DSH Plugin Market 验证机制" },
		],
		updatedLabel: "内容更新",
		updated: "2026-08-17",
	},
	"install-dsh-plugin": {
		slug: "install-dsh-plugin",
		kicker: "GUIDE / INSTALL",
		title: "如何安装 DSH Plugin",
		directAnswer: "最直接的方式是使用 `dsh plugin --profile web add github:owner/repo` 从 GitHub 安装。对于已经被 DSH Plugin Market 扫描的插件，优先使用带 `#<scanned_commit>` 的命令，把实际安装源码固定到 Market 检查过的 commit。",
		intro: "安装命令本身很短，但真正需要判断的是：装哪个仓库、哪个 commit，以及安装阶段是否可能执行第三方脚本。",
		factLabels: { scanner: "当前 Scanner", dsh: "DSH baseline", cordis: "Cordis baseline", verified: "已验证插件" },
		sections: [
			{
				kicker: "01 / QUICK START",
				title: "从 GitHub 安装",
				body: ["确定仓库 owner / repo 后，可以直接让 DSH 从 GitHub 添加插件。先在插件详情页确认它的格式、兼容性和安全信号，再执行安装。"],
				code: [{ label: "Install", value: "dsh plugin --profile web add github:owner/repo" }],
			},
			{
				kicker: "02 / PINNED COMMIT",
				title: "为什么 Market 推荐固定 commit？",
				body: ["Scanner 的每次结果都绑定具体 commit SHA。仓库默认分支可能在扫描后继续变化，因此只安装 `github:owner/repo` 并不能保证拿到的源码就是页面上被分析过的版本。", "固定 scanned commit 后，安装代码和扫描证据之间建立了明确的一一对应关系。"],
				code: [{ label: "Recommended", value: "dsh plugin --profile web add github:owner/repo#<scanned_commit>" }],
				note: { label: "RULE", text: "Installed commit = Scanned commit。固定 commit 降低源码漂移风险，但不等于第三方代码绝对安全。" },
			},
			{
				kicker: "03 / BEFORE INSTALL",
				title: "安装前先检查四件事",
				body: ["一个插件可以格式正确，但与当前 baseline 不兼容；也可以兼容，但存在需要人工判断的安装脚本或高风险静态信号。"],
				bullets: [
					{ title: "Format", text: "确认仓库确实符合当前 DSH Plugin / Bundle 结构。" },
					{ title: "Compatibility", text: "确认 DSH、Cordis、Node 和依赖范围与当前 baseline 的判断。" },
					{ title: "Security", text: "查看 prepare / postinstall、Shell、process、filesystem、network 等静态信号。" },
					{ title: "Commit", text: "确认你准备安装的 commit 与 Market 的 scanned commit 一致。" },
				],
			},
			{
				kicker: "04 / INSTALL SCRIPTS",
				title: "为什么 prepare / postinstall 值得单独看？",
				body: ["Git dependency 可能依赖 prepare 等脚本生成构建产物。允许这些脚本意味着第三方代码可能在安装阶段执行，所以 Market 会把 install scripts 作为一等安全信号，而不是隐藏在依赖信息里。"],
				note: { label: "SCAN BOUNDARY", text: "Market Scanner 本身不会运行 npm / pnpm install，也不会执行第三方插件入口或仓库 Shell 脚本。" },
			},
			{
				kicker: "05 / TROUBLESHOOT",
				title: "遇到 Unknown 或没有 scanned commit 怎么办？",
				body: ["Unknown 表示现有静态信息不足以做可靠结论，不应当理解为通过。如果插件还没有 scanned commit，可以等待扫描、查看源码和仓库说明，或者在明确接受源码漂移和未知风险的前提下使用非 pinned 安装。"],
			},
		],
		examplesTitle: "从真实插件生成安装命令",
		examplesIntro: "以下命令根据 Registry 当前已验证插件和它们最新的 scanned commit 动态生成；没有 commit 时不会伪造版本。",
		examplesEmpty: "当前没有带有效 Registry 数据的已验证插件，请先浏览插件市场。",
		exampleMode: "install",
		relatedTitle: "继续阅读",
		related: [
			{ href: "/guide/what-is-dsh-plugin", label: "什么是 DSH Plugin" },
			{ href: "/guide/choose-dsh-plugin", label: "安装前如何选择插件" },
			{ href: "/trust", label: "Scanner 安全边界" },
		],
		sourcesTitle: "来源与依据",
		sources: [
			{ href: "https://github.com/deepseek-ai/deepseek-harness", label: "DeepSeek Harness", external: true },
			{ href: "/plugins", label: "DSH Plugin Registry" },
			{ href: "/trust", label: "DSH Plugin Market 验证机制" },
		],
		updatedLabel: "内容更新",
		updated: "2026-08-17",
	},
	"choose-dsh-plugin": {
		slug: "choose-dsh-plugin",
		kicker: "GUIDE / EVALUATE",
		title: "如何评估和选择 DSH Plugin",
		directAnswer: "选择 DSH Plugin 时，不要把 Stars 或单个 Verified Badge 当成最终答案。更可靠的方法是同时看 Format、Compatibility、Security、Maintenance、Publisher 和 Scanned Commit 六组信号，并把 Unknown 保留为真正的不确定性。",
		intro: "DSH Plugin Market 的 Trust Profile 不是一个总分，而是一组可追溯证据。下面给出安装前可以直接使用的判断顺序。",
		factLabels: { scanner: "当前 Scanner", dsh: "DSH baseline", cordis: "Cordis baseline", verified: "已验证插件" },
		sections: [
			{
				kicker: "01 / FORMAT",
				title: "先确认它真的是可识别的 DSH Plugin",
				body: ["Format Verification 是第一道门槛：Scanner 检查 manifest、入口、exports、依赖和 bundle / patch 等结构。没有通过格式验证时，不应该因为 Stars 很高就跳过结构问题。"],
			},
			{
				kicker: "02 / COMPATIBILITY",
				title: "再看它和当前 DSH / Cordis 是否匹配",
				body: ["兼容判断必须放到当前 baseline 上理解。Compatible、Likely Compatible、Outdated、Incompatible 和 Unknown 表达的置信程度不同；Unknown 不是 Compatible 的另一种写法。"],
			},
			{
				kicker: "03 / SECURITY",
				title: "把静态安全信号当成审查入口",
				body: ["查看安装脚本、进程执行、文件系统、网络和动态代码等发现。Security Scan 的价值是告诉你哪里值得继续看源码，而不是替代人工审查或运行时隔离。"],
				note: { label: "IMPORTANT", text: "没有发现高风险信号 ≠ 插件绝对安全。Scanner 不执行第三方代码，因此动态行为可能仍然未知。" },
			},
			{
				kicker: "04 / MAINTENANCE + PUBLISHER",
				title: "判断这个仓库现在是否值得依赖",
				body: ["维护状态、仓库更新时间、是否归档、发布者来源和历史插件可以补足纯代码扫描看不到的上下文。它们不是官方背书，但会直接影响长期使用成本。"],
			},
			{
				kicker: "05 / COMMIT",
				title: "最后确认你安装的是被检查过的源码",
				body: ["扫描结果绑定 commit SHA 和 Scanner version。选择插件后，优先使用插件详情页给出的 pinned command，避免默认分支在扫描后变化导致证据失配。"],
				code: [{ label: "Pinned install", value: "dsh plugin --profile web add github:owner/repo#<scanned_commit>" }],
			},
			{
				kicker: "06 / DECISION",
				title: "一个简单的安装决策顺序",
				body: ["先排除结构和明确兼容问题，再检查风险信号和维护状态，最后固定 scanned commit。任何关键维度是 Unknown 时，都应该把它当成需要补证据的事项，而不是默认放行。"],
				bullets: [
					{ title: "Good signal", text: "Format Verified + 当前 baseline 兼容 + 风险信号可解释 + 仍在维护 + commit 可追溯。" },
					{ title: "Review", text: "存在安装脚本、中高风险 finding、Likely Compatible 或维护状态不明确。" },
					{ title: "Stop", text: "明确 Incompatible、关键结构失败，或发现你无法接受的高风险行为。" },
					{ title: "Unknown", text: "补充信息后再判断，不把未知自动映射成通过。" },
				],
			},
		],
		examplesTitle: "用当前 Registry 信号做一次快速评估",
		examplesIntro: "下面直接展示真实已验证插件的 Format、Compatibility、Security、Maintenance 和 Risk 状态，方便理解 Trust Profile 不是一个单一总分。",
		examplesEmpty: "当前没有可展示的已验证插件，请直接浏览 Registry。",
		exampleMode: "evaluate",
		relatedTitle: "继续阅读",
		related: [
			{ href: "/guide/what-is-dsh-plugin", label: "什么是 DSH Plugin" },
			{ href: "/guide/install-dsh-plugin", label: "如何安装 DSH Plugin" },
			{ href: "/trust", label: "完整验证机制" },
		],
		sourcesTitle: "来源与依据",
		sources: [
			{ href: "/trust", label: "DSH Plugin Market 验证机制" },
			{ href: "/plugins", label: "当前 Plugin Registry" },
			{ href: "https://github.com/deepseek-ai/deepseek-harness", label: "DeepSeek Harness", external: true },
		],
		updatedLabel: "内容更新",
		updated: "2026-08-17",
	},
};

const en: Record<GuideSlug, GuideCopy> = {
	"what-is-dsh-plugin": {
		...zh["what-is-dsh-plugin"],
		kicker: "GUIDE / CONCEPT",
		title: "What is a DSH Plugin?",
		directAnswer: "A DSH Plugin is an extension unit for DeepSeek Harness that adds tools, agents, external integrations, or runtime capabilities. A repository is not a DSH Plugin merely because its README says so: its manifest, entrypoints, exports, and dependencies still need to match the plugin structures understood by the current scanner.",
		intro: "This guide explains where plugins fit in DeepSeek Harness, how DSH Plugin Market discovers and verifies public repositories, and which facts matter before installation.",
		factLabels: { scanner: "Current scanner", dsh: "DSH baseline", cordis: "Cordis baseline", verified: "Verified plugins" },
		sections: [
			{ kicker: "01 / POSITION", title: "What does a DSH Plugin do in DeepSeek Harness?", body: ["DeepSeek Harness delegates extensibility to its plugin system. A plugin connects a reusable capability to the Harness, while the Market turns candidate GitHub repositories into structured, verifiable Registry records."], bullets: [{ title: "Tools", text: "Expose callable tool capabilities to agents." }, { title: "Agents", text: "Provide reusable agents or agent-related extensions." }, { title: "Integrations", text: "Connect external services, data sources, or developer tools." }, { title: "Runtime", text: "Extend Harness runtime or Web / Client capabilities." }] },
			{ kicker: "02 / STRUCTURE", title: "How does the Market decide whether a repository is a DSH Plugin?", body: ["The scanner reads repository structure and configuration instead of trusting a Topic or README alone. Current checks include package.json, DSH / Cordis dependencies, plugin entry / exports, and recognizable bundle / patch structures.", "Format Verified means the repository passed the current scanner's structural rules. It does not mean the code is absolutely safe or permanently compatible."], note: { label: "IMPORTANT", text: "Format Verified ≠ Safe. Format, compatibility, security, and maintenance are separate dimensions." } },
			{ kicker: "03 / DISCOVERY", title: "How are DSH Plugins discovered?", body: ["DSH Plugin Market discovers candidates from public sources such as the GitHub dsh-plugin Topic and also accepts direct GitHub submissions. A candidate only advances when source and configuration evidence support the corresponding verdict."], bullets: [{ title: "Candidate", text: "A repository discovered from public sources." }, { title: "Detected", text: "The scanner recognizes DSH-related structure." }, { title: "Format Verified", text: "The current plugin structure rules pass." }, { title: "Featured", text: "Curated discovery on top of verification." }] },
			{ kicker: "04 / INSTALL", title: "How do you install a DSH Plugin?", body: ["DeepSeek Harness can install plugins from GitHub. For scanned plugins, the Market prefers a commit-pinned command so the installed source can match the evidence shown on the page."], code: [{ label: "GitHub", value: "dsh plugin --profile web add github:owner/repo" }, { label: "Pinned commit", value: "dsh plugin --profile web add github:owner/repo#<scanned_commit>" }] },
			{ kicker: "05 / EVALUATE", title: "What should you check before installation?", body: ["Do not stop at Stars. Check format verification, current DSH / Cordis compatibility, security signals, maintenance state, publisher provenance, and the scanned commit together."] },
		],
		examplesTitle: "Real DSH Plugin examples from the Registry",
		examplesIntro: "These examples come directly from currently verified Registry entries rather than invented repositories. Their status can change after a new scan.",
		examplesEmpty: "No verified plugins are currently available for this example. Browse the Registry directly.",
		relatedTitle: "Continue reading",
		related: [{ href: "/guide/install-dsh-plugin", label: "How to install a DSH Plugin" }, { href: "/guide/choose-dsh-plugin", label: "How to evaluate and choose a DSH Plugin" }, { href: "/trust", label: "Understand verification" }],
		sourcesTitle: "Sources and evidence",
		sources: [{ href: "https://github.com/deepseek-ai/deepseek-harness", label: "DeepSeek Harness", external: true }, { href: "https://github.com/topics/dsh-plugin", label: "GitHub dsh-plugin Topic", external: true }, { href: "/trust", label: "DSH Plugin Market verification" }],
		updatedLabel: "Content updated",
	},
	"install-dsh-plugin": {
		...zh["install-dsh-plugin"],
		kicker: "GUIDE / INSTALL",
		title: "How to install a DSH Plugin",
		directAnswer: "Use `dsh plugin --profile web add github:owner/repo` to install directly from GitHub. For a plugin already scanned by DSH Plugin Market, prefer the command with `#<scanned_commit>` so the installed source is pinned to the commit the Market inspected.",
		intro: "The command is short. The important decisions are which repository and commit to install, and whether installation can execute third-party scripts.",
		factLabels: { scanner: "Current scanner", dsh: "DSH baseline", cordis: "Cordis baseline", verified: "Verified plugins" },
		sections: [
			{ kicker: "01 / QUICK START", title: "Install from GitHub", body: ["Once you know the owner and repository, DSH can add the plugin directly from GitHub. Check its format, compatibility, and security signals on the plugin page first."], code: [{ label: "Install", value: "dsh plugin --profile web add github:owner/repo" }] },
			{ kicker: "02 / PINNED COMMIT", title: "Why does the Market recommend a pinned commit?", body: ["Every scanner result is bound to a concrete commit SHA. A repository's default branch can change after a scan, so installing only `github:owner/repo` does not guarantee that you receive the revision analyzed on the page.", "Pinning the scanned commit creates an explicit link between installed code and scan evidence."], code: [{ label: "Recommended", value: "dsh plugin --profile web add github:owner/repo#<scanned_commit>" }], note: { label: "RULE", text: "Installed commit = Scanned commit. Pinning reduces source drift; it does not make third-party code absolutely safe." } },
			{ kicker: "03 / BEFORE INSTALL", title: "Check four things before installation", body: ["A plugin can be structurally valid but incompatible with the current baseline, or compatible while still exposing install scripts and other risk signals that deserve review."], bullets: [{ title: "Format", text: "Confirm the repository matches the current DSH Plugin / Bundle structure." }, { title: "Compatibility", text: "Review DSH, Cordis, Node, and dependency ranges against the current baseline." }, { title: "Security", text: "Inspect prepare / postinstall, shell, process, filesystem, network, and related static signals." }, { title: "Commit", text: "Make sure the revision you install matches the Market's scanned commit." }] },
			{ kicker: "04 / INSTALL SCRIPTS", title: "Why do prepare / postinstall scripts matter?", body: ["A Git dependency may rely on prepare or other scripts to build artifacts. Allowing them means third-party code can run during installation, so the Market treats install scripts as first-class security signals rather than hiding them inside dependency metadata."], note: { label: "SCAN BOUNDARY", text: "The Market scanner itself does not run npm / pnpm install, plugin entrypoints, or repository shell scripts." } },
			{ kicker: "05 / TROUBLESHOOT", title: "What if the result is Unknown or there is no scanned commit?", body: ["Unknown means the available static evidence is insufficient for a reliable verdict; it is not a pass. If there is no scanned commit yet, wait for a scan, review the source and repository instructions, or use an unpinned install only when you explicitly accept source drift and unknown risk."] },
		],
		examplesTitle: "Install commands generated from real plugins",
		examplesIntro: "The commands below are generated from currently verified Registry entries and their latest scanned commits. The page never invents a commit when none exists.",
		examplesEmpty: "No verified plugin with usable Registry data is currently available. Browse the plugin market first.",
		relatedTitle: "Continue reading",
		related: [{ href: "/guide/what-is-dsh-plugin", label: "What is a DSH Plugin?" }, { href: "/guide/choose-dsh-plugin", label: "How to choose before installing" }, { href: "/trust", label: "Scanner safety boundary" }],
		sourcesTitle: "Sources and evidence",
		sources: [{ href: "https://github.com/deepseek-ai/deepseek-harness", label: "DeepSeek Harness", external: true }, { href: "/plugins", label: "DSH Plugin Registry" }, { href: "/trust", label: "DSH Plugin Market verification" }],
		updatedLabel: "Content updated",
	},
	"choose-dsh-plugin": {
		...zh["choose-dsh-plugin"],
		kicker: "GUIDE / EVALUATE",
		title: "How to evaluate and choose a DSH Plugin",
		directAnswer: "Do not treat Stars or a single Verified badge as the final answer. Evaluate Format, Compatibility, Security, Maintenance, Publisher, and Scanned Commit together, and preserve Unknown as real uncertainty rather than silently converting it into a pass.",
		intro: "A DSH Plugin Market Trust Profile is a set of traceable evidence, not one score. This guide gives you an installation decision order you can apply directly.",
		factLabels: { scanner: "Current scanner", dsh: "DSH baseline", cordis: "Cordis baseline", verified: "Verified plugins" },
		sections: [
			{ kicker: "01 / FORMAT", title: "First confirm that it is a recognizable DSH Plugin", body: ["Format Verification is the first gate: the scanner checks manifest, entrypoints, exports, dependencies, and recognizable bundle / patch structures. High Stars should not override a failed structure check."] },
			{ kicker: "02 / COMPATIBILITY", title: "Then check the current DSH / Cordis baseline", body: ["Compatibility only makes sense against the current baseline. Compatible, Likely Compatible, Outdated, Incompatible, and Unknown represent different confidence levels; Unknown is not another spelling of Compatible."] },
			{ kicker: "03 / SECURITY", title: "Use static security signals as review entry points", body: ["Inspect install scripts, process execution, filesystem, network, dynamic code, and other findings. The value of a security scan is showing you where source review matters; it does not replace human review or runtime isolation."], note: { label: "IMPORTANT", text: "No high-risk finding ≠ absolute safety. The scanner does not execute third-party code, so dynamic behavior can remain unknown." } },
			{ kicker: "04 / MAINTENANCE + PUBLISHER", title: "Decide whether this repository is worth depending on now", body: ["Maintenance state, repository activity, archived status, publisher provenance, and other plugins from the same publisher add context that source scanning alone cannot provide. They are not an official endorsement, but they affect long-term operational cost."] },
			{ kicker: "05 / COMMIT", title: "Finally confirm you install the source that was inspected", body: ["Scan results are bound to a commit SHA and scanner version. After choosing a plugin, prefer the pinned command from its detail page so default-branch changes do not break the link between evidence and installed code."], code: [{ label: "Pinned install", value: "dsh plugin --profile web add github:owner/repo#<scanned_commit>" }] },
			{ kicker: "06 / DECISION", title: "A simple installation decision order", body: ["Eliminate structural and explicit compatibility failures first, then inspect risk and maintenance signals, and finally pin the scanned commit. When a critical dimension is Unknown, treat it as evidence still needed rather than an automatic pass."], bullets: [{ title: "Good signal", text: "Format Verified + compatible current baseline + explainable risk + active maintenance + traceable commit." }, { title: "Review", text: "Install scripts, medium/high findings, Likely Compatible, or unclear maintenance deserve more source review." }, { title: "Stop", text: "Explicit Incompatible, failed structure, or high-risk behavior you cannot accept." }, { title: "Unknown", text: "Gather more evidence before deciding; do not map uncertainty to success." }] },
		],
		examplesTitle: "Run a quick evaluation with current Registry signals",
		examplesIntro: "These real verified entries show Format, Compatibility, Security, Maintenance, and Risk side by side so the Trust Profile stays multi-dimensional.",
		examplesEmpty: "No verified plugins are currently available for this example. Browse the Registry directly.",
		relatedTitle: "Continue reading",
		related: [{ href: "/guide/what-is-dsh-plugin", label: "What is a DSH Plugin?" }, { href: "/guide/install-dsh-plugin", label: "How to install a DSH Plugin" }, { href: "/trust", label: "Full verification model" }],
		sourcesTitle: "Sources and evidence",
		sources: [{ href: "/trust", label: "DSH Plugin Market verification" }, { href: "/plugins", label: "Current Plugin Registry" }, { href: "https://github.com/deepseek-ai/deepseek-harness", label: "DeepSeek Harness", external: true }],
		updatedLabel: "Content updated",
	},
};

export const GUIDE_SLUGS: GuideSlug[] = ["what-is-dsh-plugin", "install-dsh-plugin", "choose-dsh-plugin"];

export function isGuideSlug(value: string): value is GuideSlug {
	return GUIDE_SLUGS.includes(value as GuideSlug);
}

export function getGuideCopy(lang: Language, slug: GuideSlug): GuideCopy {
	return (lang === "zh" ? zh : en)[slug];
}
