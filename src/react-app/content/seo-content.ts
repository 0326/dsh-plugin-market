import type { Language } from "../lib/i18n";

export interface ContentSeoCopy {
	home: {
		sectionKicker: string;
		sectionTitle: string;
		sectionIntro: string;
		market: { kicker: string; title: string; body: string; about: string; trust: string };
		plugin: { kicker: string; title: string; body: string; capabilities: string[] };
		works: {
			kicker: string;
			title: string;
			body: string;
			steps: string[];
			facts: { total: string; verified: string; scanner: string; baseline: string; lastScan: string };
		};
		install: { kicker: string; title: string; body: string; standard: string; pinned: string; equation: string; browse: string };
		verified: {
			kicker: string;
			title: string;
			body: string;
			warning: string;
			items: { label: string; text: string }[];
			learn: string;
		};
		faqTitle: string;
		faq: { question: string; answer: string; href?: string; linkLabel?: string }[];
	};
	trust: {
		kicker: string;
		title: string;
		intro: string;
		warning: string;
		pillars: { index: string; title: string; text: string }[];
		processKicker: string;
		processTitle: string;
		processBody: string;
		process: string[];
		safetyKicker: string;
		safetyTitle: string;
		safetyBody: string;
		never: string[];
		evidenceKicker: string;
		evidenceTitle: string;
		evidenceBody: string;
		facts: { scanner: string; dsh: string; cordis: string; checked: string; lastScan: string };
		unknownTitle: string;
		unknownBody: string;
		back: string;
		browse: string;
	};
}

const zh: ContentSeoCopy = {
	home: {
		sectionKicker: "KNOW WHAT YOU INSTALL",
		sectionTitle: "不只找到插件，还要知道你在安装什么",
		sectionIntro: "DSH Plugin Market 把 GitHub 上的候选仓库转成结构化、可验证、可追溯的插件信息，让发现和安装建立在同一组事实之上。",
		market: {
			kicker: "01 / MARKET",
			title: "什么是 DSH Plugin Market？",
			body: "DSH Plugin Market 是面向 DeepSeek Harness 生态的独立社区插件注册表。它从 GitHub 发现插件，验证插件格式，评估兼容性，并展示安全、维护与 commit 级扫描信号。",
			about: "了解项目",
			trust: "查看验证机制",
		},
		plugin: {
			kicker: "02 / DSH PLUGIN",
			title: "什么是 DSH Plugin？",
			body: "DSH Plugin 是 DeepSeek Harness 的扩展单元，用来把新的工具、Agent、外部集成或运行时能力接入 Harness。Market 关注的不只是它声称能做什么，还关注它是否符合当前可识别的插件结构。",
			capabilities: ["TOOLS", "AGENTS", "INTEGRATIONS", "RUNTIME"],
		},
		works: {
			kicker: "03 / HOW IT WORKS",
			title: "从 GitHub 仓库到可追溯 Trust Profile",
			body: "市场不会执行第三方插件代码。Scanner 读取仓库与配置，生成绑定到具体 commit 的结构化判断，并持续跟随仓库更新。",
			steps: ["GitHub Repository", "Discovery", "Format Verification", "Compatibility", "Security Signals", "Maintenance", "Commit-bound Trust Profile"],
			facts: { total: "Registry 插件", verified: "格式已验证", scanner: "Scanner", baseline: "兼容性基线", lastScan: "最近扫描" },
		},
		install: {
			kicker: "04 / INSTALL",
			title: "如何安装 DSH Plugin？",
			body: "DeepSeek Harness 可以直接从 GitHub 安装插件。对于已经扫描的插件，Market 优先推荐固定到扫描过的 commit，让你安装的代码与页面展示的扫描结果保持一致。",
			standard: "直接从 GitHub 安装",
			pinned: "推荐：固定到已扫描 commit",
			equation: "Installed commit = Scanned commit",
			browse: "去找一个插件",
		},
		verified: {
			kicker: "05 / TRUST",
			title: "“Format Verified” 到底代表什么？",
			body: "Verified 是结构判断，不是安全背书。Market 将格式、兼容性、安全、维护和发布者信息拆开呈现，避免把不同维度压缩成一个模糊的“可信”标签。",
			warning: "Format Verified ≠ Safe",
			items: [
				{ label: "FORMAT", text: "仓库结构是否符合当前 Scanner 理解的 DSH Plugin / Bundle 规则。" },
				{ label: "COMPATIBILITY", text: "依赖声明是否与当前 DSH / Cordis baseline 相容。" },
				{ label: "SECURITY", text: "安装脚本、敏感 API 与静态风险信号。" },
				{ label: "MAINTENANCE", text: "仓库是否仍在活跃维护、是否归档等状态。" },
				{ label: "PUBLISHER", text: "发布者与来源仓库信息，作为判断上下文，而非官方背书。" },
			],
			learn: "完整理解 Trust 体系",
		},
		faqTitle: "关于 DSH Plugin Market 的常见问题",
		faq: [
			{ question: "DSH Plugin Market 是什么？", answer: "它是面向 DeepSeek Harness 插件生态的独立社区 Registry，用于发现插件并展示格式、兼容性、安全、维护和扫描来源信息。", href: "/about", linkLabel: "了解项目" },
			{ question: "什么是 DSH Plugin？", answer: "DSH Plugin 是 DeepSeek Harness 的扩展单元，可以提供工具、Agent、集成或运行时能力。Market 通过公开仓库信息识别和分析这些插件。" },
			{ question: "DSH Plugin Market 是 DeepSeek 官方产品吗？", answer: "不是。DSH Plugin Market 是社区项目，不代表 DeepSeek 对任何第三方插件的审核、担保或安全背书。" },
			{ question: "Format Verified 是什么意思？", answer: "它只表示仓库符合当前 Scanner 所理解的插件结构规则，不代表插件绝对安全。安全与兼容性是独立维度。", href: "/trust", linkLabel: "查看验证机制" },
			{ question: "Scanner 会执行插件代码吗？", answer: "不会。Scanner 只通过 API 读取和静态分析仓库源码与配置，不运行 npm install、prepare、postinstall、插件入口或仓库 Shell 脚本。", href: "/trust", linkLabel: "查看安全边界" },
			{ question: "为什么推荐安装 pinned commit？", answer: "因为扫描结果绑定到具体 commit。固定安装 commit 可以尽量保证实际安装代码与页面展示的扫描证据是同一份源码。" },
		],
	},
	trust: {
		kicker: "TRUST MODEL",
		title: "DSH Plugin Market 如何验证插件",
		intro: "Market 的目标不是替你宣布一个插件“安全”，而是把安装前最关键的事实拆开、验证并绑定到具体源码版本，让你能基于证据做判断。",
		warning: "Format Verified ≠ Safe",
		pillars: [
			{ index: "01", title: "Format Verification", text: "检查 package.json、bundle / patch 文件、入口与导出等结构，判断仓库是否符合当前 Scanner 理解的 DSH Plugin 规范。" },
			{ index: "02", title: "Compatibility", text: "结合 DSH、Cordis、Node 与依赖版本声明，对照当前 baseline 给出兼容、可能兼容、不兼容或未知状态。" },
			{ index: "03", title: "Security Signals", text: "识别安装脚本、进程执行、文件系统、网络、动态代码等静态风险信号；没有发现高风险信号不等于绝对安全。" },
			{ index: "04", title: "Maintenance", text: "结合仓库更新时间、归档状态等公开信息，帮助判断插件是否仍在维护。" },
			{ index: "05", title: "Commit Evidence", text: "每次扫描绑定 commit SHA 和 Scanner version，页面和安装建议都能追溯到被检查的源码版本。" },
		],
		processKicker: "PIPELINE",
		processTitle: "扫描结果是怎么产生的？",
		processBody: "发现与扫描分离执行。GitHub 是代码来源，D1 保存结构化 Registry 与扫描历史，Scanner 始终以具体 commit 为分析边界。",
		process: ["Discover repository", "Resolve commit SHA", "Read manifest / patch / source", "Run static rules", "Store findings", "Publish Trust Profile"],
		safetyKicker: "SAFETY BOUNDARY",
		safetyTitle: "Scanner 永远不执行第三方插件代码",
		safetyBody: "这是 Scanner v1 的硬边界。无法通过静态信息确定的内容会标记为 Unknown，而不是为了得到一个好看的结果去执行不可信代码。",
		never: ["npm / pnpm install third-party repo", "run prepare / postinstall", "execute plugin entry", "execute repository shell scripts"],
		evidenceKicker: "LIVE EVIDENCE",
		evidenceTitle: "当前验证基线",
		evidenceBody: "这些值来自正在运行的 Registry / Scanner，而不是写死在文档里的营销数字。",
		facts: { scanner: "Scanner version", dsh: "DSH baseline", cordis: "Cordis baseline", checked: "Baseline checked", lastScan: "Latest scan" },
		unknownTitle: "Unknown 不是通过，也不是失败",
		unknownBody: "当仓库信息不足、依赖范围无法静态判断或 Scanner 规则还不能给出可靠结论时，Market 保留 Unknown。宁可明确未知，也不把不确定性包装成安全结论。",
		back: "返回首页",
		browse: "浏览插件",
	},
};

const en: ContentSeoCopy = {
	home: {
		sectionKicker: "KNOW WHAT YOU INSTALL",
		sectionTitle: "Find plugins — and understand what you are installing",
		sectionIntro: "DSH Plugin Market turns candidate GitHub repositories into structured, verifiable, traceable plugin information so discovery and installation are grounded in the same evidence.",
		market: {
			kicker: "01 / MARKET",
			title: "What is DSH Plugin Market?",
			body: "DSH Plugin Market is an independent community registry for the DeepSeek Harness ecosystem. It discovers plugins from GitHub, verifies plugin format, evaluates compatibility, and surfaces security, maintenance, and commit-bound scan signals.",
			about: "About the project",
			trust: "How verification works",
		},
		plugin: {
			kicker: "02 / DSH PLUGIN",
			title: "What is a DSH Plugin?",
			body: "A DSH Plugin is an extension unit for DeepSeek Harness that can add tools, agents, external integrations, or runtime capabilities. The Market checks not only what a repository claims to do, but whether it matches the plugin structures the current scanner understands.",
			capabilities: ["TOOLS", "AGENTS", "INTEGRATIONS", "RUNTIME"],
		},
		works: {
			kicker: "03 / HOW IT WORKS",
			title: "From GitHub repository to a traceable Trust Profile",
			body: "The Market never executes third-party plugin code. The scanner reads repositories and configuration, produces structured findings bound to a concrete commit, and keeps tracking repository changes.",
			steps: ["GitHub Repository", "Discovery", "Format Verification", "Compatibility", "Security Signals", "Maintenance", "Commit-bound Trust Profile"],
			facts: { total: "Registry plugins", verified: "Format verified", scanner: "Scanner", baseline: "Compatibility baseline", lastScan: "Latest scan" },
		},
		install: {
			kicker: "04 / INSTALL",
			title: "How do you install a DSH Plugin?",
			body: "DeepSeek Harness can install plugins directly from GitHub. For scanned plugins, the Market recommends pinning the scanned commit so the code you install matches the evidence shown on the page.",
			standard: "Install from GitHub",
			pinned: "Recommended: pin the scanned commit",
			equation: "Installed commit = Scanned commit",
			browse: "Find a plugin",
		},
		verified: {
			kicker: "05 / TRUST",
			title: "What does “Format Verified” actually mean?",
			body: "Verified is a structural verdict, not a safety endorsement. The Market keeps format, compatibility, security, maintenance, and publisher context separate instead of collapsing them into one vague trust badge.",
			warning: "Format Verified ≠ Safe",
			items: [
				{ label: "FORMAT", text: "Whether the repository matches the DSH Plugin / Bundle structure understood by the current scanner." },
				{ label: "COMPATIBILITY", text: "Whether declared dependencies align with the current DSH / Cordis baseline." },
				{ label: "SECURITY", text: "Install scripts, sensitive APIs, and other static risk signals." },
				{ label: "MAINTENANCE", text: "Repository activity, archived state, and other maintenance signals." },
				{ label: "PUBLISHER", text: "Publisher and source repository context — not an official endorsement." },
			],
			learn: "Understand the Trust model",
		},
		faqTitle: "Frequently asked questions about DSH Plugin Market",
		faq: [
			{ question: "What is DSH Plugin Market?", answer: "It is an independent community registry for the DeepSeek Harness plugin ecosystem, built to discover plugins and surface format, compatibility, security, maintenance, and provenance signals.", href: "/about", linkLabel: "About the project" },
			{ question: "What is a DSH Plugin?", answer: "A DSH Plugin is an extension unit for DeepSeek Harness. It can add tools, agents, integrations, or runtime capabilities, and the Market analyzes public repository data to identify and assess it." },
			{ question: "Is DSH Plugin Market an official DeepSeek product?", answer: "No. DSH Plugin Market is a community project and does not represent DeepSeek review, warranty, or endorsement of third-party plugins." },
			{ question: "What does Format Verified mean?", answer: "It means the repository matches the plugin structure rules understood by the current scanner. It does not mean the plugin is absolutely safe; security and compatibility are separate dimensions.", href: "/trust", linkLabel: "How verification works" },
			{ question: "Does the scanner execute plugin code?", answer: "No. The scanner reads and statically analyzes repository source and configuration through APIs. It does not run npm install, prepare, postinstall, plugin entrypoints, or repository shell scripts.", href: "/trust", linkLabel: "Read the safety boundary" },
			{ question: "Why does the Market recommend pinned commits?", answer: "Scan results are bound to a specific commit. Pinning the install helps ensure the code you install is the same revision the Market analyzed." },
		],
	},
	trust: {
		kicker: "TRUST MODEL",
		title: "How DSH Plugin Market verifies plugins",
		intro: "The Market does not try to declare a plugin “safe” for you. It separates, verifies, and binds the most important pre-install facts to a concrete source revision so you can make an evidence-based decision.",
		warning: "Format Verified ≠ Safe",
		pillars: [
			{ index: "01", title: "Format Verification", text: "Checks package.json, bundle / patch files, entrypoints, exports, and related structure against the DSH Plugin rules understood by the current scanner." },
			{ index: "02", title: "Compatibility", text: "Compares DSH, Cordis, Node, and dependency version declarations against the current baseline and reports compatible, likely compatible, incompatible, or unknown." },
			{ index: "03", title: "Security Signals", text: "Surfaces install scripts, process execution, filesystem, network, dynamic code, and other static risk signals. No high-risk finding is not a guarantee of safety." },
			{ index: "04", title: "Maintenance", text: "Uses public repository activity and archived state to help show whether a plugin appears to be actively maintained." },
			{ index: "05", title: "Commit Evidence", text: "Every scan is bound to a commit SHA and scanner version, making the page and install recommendation traceable to the inspected source revision." },
		],
		processKicker: "PIPELINE",
		processTitle: "How are scan results produced?",
		processBody: "Discovery and scanning run separately. GitHub is the code source, D1 stores the structured registry and scan history, and every scanner run is bounded by a concrete commit.",
		process: ["Discover repository", "Resolve commit SHA", "Read manifest / patch / source", "Run static rules", "Store findings", "Publish Trust Profile"],
		safetyKicker: "SAFETY BOUNDARY",
		safetyTitle: "The scanner never executes third-party plugin code",
		safetyBody: "This is a hard boundary for scanner v1. Information that cannot be determined statically is marked Unknown instead of executing untrusted code just to produce a cleaner-looking verdict.",
		never: ["npm / pnpm install third-party repo", "run prepare / postinstall", "execute plugin entry", "execute repository shell scripts"],
		evidenceKicker: "LIVE EVIDENCE",
		evidenceTitle: "Current verification baseline",
		evidenceBody: "These values come from the running registry and scanner rather than being hard-coded marketing numbers.",
		facts: { scanner: "Scanner version", dsh: "DSH baseline", cordis: "Cordis baseline", checked: "Baseline checked", lastScan: "Latest scan" },
		unknownTitle: "Unknown is neither passed nor failed",
		unknownBody: "When repository information is insufficient, version constraints cannot be decided statically, or scanner rules cannot reach a reliable conclusion, the Market keeps the result Unknown. Explicit uncertainty is better than presenting uncertainty as safety.",
		back: "Back home",
		browse: "Browse plugins",
	},
};

export function getContentSeoCopy(lang: Language): ContentSeoCopy {
	return lang === "zh" ? zh : en;
}
