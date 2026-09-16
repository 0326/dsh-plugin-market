# DSH Living Whitepaper 验收记录（2026-09-16）

本次验收以 `0326/build-dev-whitepaper` 的 `main` 分支方法为基线，对 `0326/dsh-plugin-market` 中现有 DSH Living Whitepaper 做结构、版本、证据边界和工程维护检查，并完成 P0 优化。

## 1. 验收范围

- 白皮书站点与路由：`src/react-app/pages/Whitepaper*`、`src/react-app/components/whitepaper/**`、`src/react-app/lib/whitepaper.ts`
- 白皮书正文：`src/react-app/content/whitepaper/v0.1.5-rc.1`、`v0.1.5-rc.2`
- 版本与发布策略：`docs/DSH_WHITEPAPER_RELEASE_POLICY.md`、`scripts/whitepaper/release-policy.mjs`
- 内容构建与校验：`scripts/whitepaper/**`
- 图资产：`public/whitepaper/diagrams/**`
- 上游事实源：`deepseek-ai/deepseek-harness`

本轮不是重新撰写全部正文，也不把工程校验结果等同于全部技术结论已重新完成语义核验。

## 2. 基线与版本锁

当前项目策略只收录 RC 与正式版本，明确忽略 alpha、beta、canary、dev、nightly 与 master 快照。

验收时 DeepSeek Harness 已发布 `dsh-v0.1.6-alpha.1`，但该版本属于策略明确排除的 alpha，因此不会进入白皮书版本列表，也不会推动 `latestPublished`。

当前策略范围内最新白皮书仍为 `v0.1.5-rc.2`。

| 白皮书版本 | 官方 Tag | 固定 Commit | 结果 |
| --- | --- | --- | --- |
| v0.1.5-rc.2 | `dsh-v0.1.5-rc.2` | `fb2c4b9e698e30edb738bca4cf0618587db7d203` | Tag → Commit 已核对 |
| v0.1.5-rc.1 | `dsh-v0.1.5-rc.1` | `183f08e9c6dde7e36cd2318eaee70b0da08fb35e` | Tag → Commit 已核对 |

## 3. 验收结论

| 检查维度 | 状态 | 结论 |
| --- | --- | --- |
| 版本策略 | 通过 | RC + Stable 边界清晰，alpha 最新版本被正确排除 |
| 固定版本来源 | 通过 | rc.1 / rc.2 的 Tag 与完整 Commit SHA 一致 |
| 信息架构 | 通过 | 正文按认识、运行时、编排、扩展、生产演进分组，并有独立附录 |
| 角色阅读入口 | 通过 | 已有阅读路径与角色入口，适合先建立全局模型再下钻 |
| 机制拆篇 | 通过 | Subagent、Workflow、Jobs 已从选择页拆成独立文章 |
| 附录体系 | 通过 | 术语、约定、生命周期、能力索引、来源索引均独立存在 |
| 元数据唯一事实源 | 已修复 | 原 `versions.json + nav.json + per-version manifest.json` 收敛为 project-level canonical manifest |
| 项目策略与通用校验分离 | 已修复 | “五组正文”不再写死在校验器逻辑中，而由 manifest 的项目策略声明 |
| 文章职责元数据 | 已增强 | canonical manifest 增加 Article Type、Audience、Reader Outcome、Authority、Verification |
| 构建投影一致性 | 已修复 | 前端导航、版本入口、Markdown 编译、Mermaid 渲染和校验统一读取 canonical manifest |
| Claim 级 Evidence | 部分完成 | 当前正文仍主要使用 frontmatter `sources` 路径列表，尚未为关键主张建立稳定 Evidence ID / Claim 绑定 |
| 独立读者测试 | 未重新执行 | 现有正文不能因为本次结构验收自动视为完成新一轮 Independent Reader Test |
| 全量源码路径审计 | 未执行 | 已核对 Tag → Commit；未在 CI 中 checkout 每个固定上游版本逐路径验证所有 `sources` |
| 浏览器人工验收 | 待 CI / 部署后检查 | 本轮代码层完成路由与元数据收敛，仍需部署后检查窄屏、深链、版本切换和图表交互 |

## 4. 本轮 P0 优化

### 4.1 建立 canonical manifest

新增：

`src/react-app/content/whitepaper/manifest.json`

它成为白皮书项目级元数据唯一事实源，统一维护：

- 版本同步策略与最新入口；
- 官方来源身份；
- 稳定文章 ID / slug；
- Article Type；
- Audience；
- Reader Outcome；
- Authority / Verification；
- Tag / Commit source lock；
- 每个版本的分组与文章顺序；
- 文档修订号、内容根目录与图资产根目录。

旧的 `versions.json`、每版本 `nav.json` 和每版本 `manifest.json` 已删除，避免长期维护时出现多份注册表漂移。

### 4.2 统一所有工程投影

以下消费者全部改为从 canonical manifest 读取：

- `src/react-app/lib/whitepaper.ts`
- `src/shared/whitepaper-release.ts`
- `scripts/whitepaper/build-content.mjs`
- `scripts/whitepaper/render-diagrams.mjs`
- `scripts/whitepaper/validate-content.mjs`

因此导航、版本选择、Sitemap、正文构建、图表渲染和 CI 验收不再各自维护一套结构。

### 4.3 升级内容质量门禁

`validate-content.mjs` 现在会额外检查：

- canonical article ID / slug / file 唯一；
- Article Type 是否属于项目允许集合；
- Audience 与 Reader Outcome 是否存在；
- 正文 / 附录 kind 与导航分组是否一致；
- 必备附录是否在每个版本中出现；
- 发布版本是否只引用 reviewed article metadata；
- 版本 Tag、Commit 与 source lock 是否一致；
- 正文 frontmatter 与 canonical article / version metadata 是否一致；
- Mermaid 预渲染资产、官方来源 URL 与 Markdown 结构是否满足现有约束。

正文分组数量仍保留为 DSH 项目约定，但来源从硬编码改为 `policy.expectedBodyGroups`。

## 5. 内容质量评审

现有白皮书的信息架构已经明显优于早期版本：选择页与机制页开始分工，Subagent / Workflow / Jobs 等主题也已经独立拆篇，附录与源码索引能承担查阅职责。

当前最明显的下一层缺口不是继续增加文章数量，而是把关键文章从“来源列表”提升到“主张可追溯”。例如 Session 写所有权、Jobs 的持久性边界、安全与权限、版本迁移等结论，应逐步形成：

`Claim → Evidence ID → 固定版本官方路径 / Symbol / Test → 限制`

这样才能让文章的 `reviewed` 状态不只是“整篇看过”，而是重要结论可以单独复核。

## 6. 后续优先级

### P1：关键文章 Claim / Evidence 化

优先覆盖高风险或高决策价值文章：

1. `session-state`
2. `security-permissions`
3. `jobs-background`
4. `subagent-delegation`
5. `evolution`

不需要一次给所有句子建 Claim，只覆盖核心因果链、可靠性保证、安全边界和迁移结论。

### P1：固定来源路径审计

在白皮书 CI 中按版本 checkout / fetch 官方 DSH 固定 Commit，对 manifest / frontmatter 声明的源码路径做存在性校验。该检查用于证明“引用路径在固定基线存在”，不能替代语义核验。

### P1：Independent Reader Test

至少为机制解释、设计取舍和版本迁移三类文章建立快照测试，问题应覆盖：

- 这篇文章解决什么问题；
- 状态 / 责任由谁拥有；
- 一次真实过程如何推进；
- 为什么选择这个机制；
- 哪一步可能失败；
- 哪些结论有固定版本证据；
- 哪些保证仍未知。

关键问题答错时，文章应退回 draft / blocked，而不是仅依赖作者自审。

## 7. 验收状态说明

本轮可以确认：

- **版本与信息架构验收通过；**
- **P0 元数据与工程维护问题已完成修复；**
- **当前版本新鲜度符合既定 RC + Stable 策略；**
- **Claim 级证据和 Independent Reader Test 仍是后续内容质量门禁，不能用本轮工程验收替代。**

因此本次结果应描述为“完成 P0 工程与结构验收并优化”，而不是“全部白皮书技术事实已经重新验证完毕”。
