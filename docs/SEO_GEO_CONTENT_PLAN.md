# DSH Plugin Market 内容 SEO / GEO 开发计划

> 目标：把 DSH Plugin Market 从插件列表站升级为 **DeepSeek Harness Plugin 生态的权威知识入口 + 可验证数据源**。
>
> 原则：Registry as Content，不建设 Blog CMS，不批量生成低质量关键词页。静态知识内容负责解释概念，D1 / Scanner 负责持续提供可验证事实。
>
> 当前阶段（2026-09）：基础收录链路和 Edge 内容已经跑通，重点从“继续增加可抓取页面”切换为 **详情页独特价值、可解释索引门槛、真实 taxonomy Landing Page、实体一致性和高质量内部链接**。

## 1. 内容架构

```text
Entity Layer
DSH Plugin Market / DeepSeek Harness / GitHub
        ↓
Knowledge Layer
Guide / Trust / FAQ / Concepts
        ↓
Registry Data Layer
Plugin / Publisher / Capability / Scanner Evidence
```

内容建设必须延续 `DESIGN.md`：Editorial Marketplace × Light Neo-Brutalism × Developer Tool。避免 SaaS 功能卡片堆叠，以强排版、网格、分割线、黑白高对比和少量品牌色建立层级。

## 2. 当前 SEO 基线与判断

截至 2026-09，代码侧已经具备以下可验证能力；线上“已收录/稳定发现”仍必须以 Search Console URL Inspection 和覆盖率数据为准：

- 首页 `/`
- 插件列表 `/plugins`
- Trust / Guide 页面
- Publisher 页面
- 大量 `/plugin/*` 详情页
- 部分插件详情页已经直接使用 README / Security / Compatibility / Version 等正文信息生成搜索摘要

因此当前不再把“是否可抓取”作为唯一问题；必须同时验证首屏 Edge HTML 的内容质量、索引门槛和 sitemap 完整性。当前单文件 sitemap 按约 45,000 条 Plugin URL 留出静态页、Landing 和 Publisher 空间；接近容量阈值时必须切换 sitemap index，不能静默截断。

当前最重要的风险与机会：

1. **主域信号需要继续集中**
   - `www.dsh-plugin.market` 与 `dsh-plugin.market` 曾同时进入索引。
   - 继续保持 `www → non-www` 永久重定向、canonical、sitemap、SSR 内链完全统一。
   - 不因为搜索索引仍残留旧 URL 而频繁修改 canonical 策略，等待搜索引擎完成重算。

2. **插件详情页已经获得收录，下一步是提高页面独特价值**
   - 避免详情页退化为 GitHub README 镜像。
   - 强化 Registry 独有的 Verified / Security / Compatibility / Maintenance / Scan Evidence。

3. **品牌词“dsh plugin market”竞争激烈**
   - 同类市场、目录和近似域名较多。
   - 需要通过统一品牌实体、外链、插件作者反链和站内实体信号提高品牌确定性。

4. **长尾搜索入口不足**
   - 当前主要入口仍集中在首页、列表和插件实体页。
   - 下一阶段需要基于真实 Registry 数据建设有限数量的高质量 Capability / Discovery Landing Page。

5. **最新观察结论（截至 2026-09-01）**
   - 首页此前的 `api_error` 根因已确认是 D1 额度达到上限；额度升级后最新抓取能够读取服务端 `Latest DSH plugins` 和详情内链。远端 `3e9af11` 又补充了公共读缓存、预览列表跳过 COUNT 和 D1 热查询索引，作为持续的读量保护；前端首页也改为部分读取失败时保留知识内容和导航，不再退化成单行错误页。
   - 搜索结果仍可能残留 `www` 旧 URL，这是 301 后的索引合并延迟；继续保持现有 canonical，不因短期排名或旧结果频繁改动主域策略。
   - 当前开发优先级维持 Capability / Discovery Landing、Related Plugins 和 Plugin Detail 独特评估内容。

## 3. Sprint 1 — 首页实体建设 + Trust

**状态：已完成。**

### 首页新增 5 个知识模块

1. **What is DSH Plugin Market?**
   - 直接解释独立 Registry 的定位。
   - 建立 DSH Plugin Market ↔ DeepSeek Harness ↔ GitHub 实体关系。
   - 链接 `/about`、`/trust`。

2. **What is a DSH Plugin?**
   - 解释 DSH Plugin 在 DeepSeek Harness 中的位置。
   - 用 Tools / Agents / Integrations / Runtime capabilities 做能力示意。
   - Sprint 2 链接独立 Guide。

3. **How DSH Plugin Market works**
   - GitHub Repository → Discovery → Format Verification → Compatibility → Security Signals → Maintenance → Commit-bound Trust Profile。
   - 展示真实 Registry 数据：插件数、已验证数、最后扫描时间、Scanner version、DSH/Cordis baseline。

4. **How to install a DSH Plugin**
   - 展示 GitHub 安装命令。
   - 强调 Market 推荐 pinned commit：`Installed commit = Scanned commit`。

5. **What does Verified mean?**
   - 明确 `Format Verified ≠ Safe`。
   - 解释 Format / Compatibility / Security / Maintenance / Publisher Trust。
   - 链接 `/trust`。

### 首页 FAQ

首批问题：

- What is DSH Plugin Market?
- What is a DSH Plugin?
- Is DSH Plugin Market official?
- What does Format Verified mean?
- Does DSH Plugin Market execute plugin code?
- Why does DSH Plugin Market recommend pinned commits?

要求：内容直接渲染在页面中，可阅读、可内链，不以 FAQ Rich Result 为目标。

### 通用内容组件

抽象：

- `ContentSection`
- `DirectAnswer`
- `FactList`
- `EvidenceBlock`
- `RelatedLinks`
- `LastUpdated`
- `FAQ`

### `/trust`

Sprint 1 同步建设 Trust 页面，作为首页 Verified / Scanner 说明的权威落点。

核心内容：

- Format Verified ≠ Safe
- Format Verification
- Compatibility
- Security Signals
- Maintenance
- Commit-bound Evidence
- Scanner safety boundary
- 当前 Scanner / DSH / Cordis baseline

### Sprint 1 验收

- [x] 首页 5 个知识模块完成
- [x] 首页 FAQ 完成
- [x] `/trust` 完成
- [x] 前端界面中英文完成；canonical Edge HTML 采用英文，避免 localStorage 语言状态产生重复索引 URL
- [x] 延续现有 Design Language
- [x] 首页发现主路径不被内容区抢占
- [x] 真实 Registry / Scanner 数据进入内容区
- [x] `/trust` 纳入 Edge SEO 和 sitemap
- [x] lint / tests / build / Wrangler dry-run 全绿

## 4. Sprint 2 — Knowledge Layer

**状态：已开发完成。**

新增：

- `/guide/what-is-dsh-plugin`
- `/guide/install-dsh-plugin`
- `/guide/choose-dsh-plugin`

统一结构：Direct Answer → Key Facts → How it works → Evidence / Data → Example → Related concepts → Sources → Last updated。

所有示例引用 Registry 当前真实 Verified Plugin，避免虚构内容；安装示例直接基于真实 scanned commit 生成命令，不伪造 commit。

SEO：Title / Description / Canonical / OpenGraph / WebPage JSON-LD / BreadcrumbList / dateModified，并纳入 Edge SEO 与 sitemap。未知 `/guide/*` 路径由 Worker 返回真实 `404 + noindex`。

### Sprint 2 验收

- [x] 3 个 Guide 页面完成
- [x] 前端中英文内容完成；canonical Edge HTML 输出英文 Direct Answer / Sections / Sources
- [x] Direct Answer / Key Facts / Guide Sections / Evidence / Related / Sources 完成
- [x] 实时 Scanner / DSH / Cordis / Verified Plugin 数据接入
- [x] 真实 Registry Plugin 示例接入
- [x] 首页 → Guide 内链完成
- [x] Trust → Guide 内链完成
- [x] Guide 之间交叉内链完成
- [x] Edge SEO / Canonical / OG / Twitter metadata 完成
- [x] WebPage + BreadcrumbList JSON-LD 完成
- [x] sitemap + `lastmod` 完成
- [x] 未知 Guide 路径真实 404 / noindex 完成
- [x] 路由精确匹配回归测试完成
- [x] lint / tests / build / Wrangler dry-run 全绿
- [x] 开发完成后 diff 自审完成并修复文案、状态色、内联代码、入口格式问题

## 5. Sprint 3 — Plugin Detail 内容化

**优先级：P0。状态：已完成第一版。**

这是当前最重要的内容 SEO 工作。

强化 Plugin Detail：

- What does this plugin do?
- Compatibility 可读解释
- Security 可读解释
- Maintenance
- Pinned install
- Scan Evidence
- Publisher 双向内链
- Related Plugins
- Source / GitHub / commit / scanner version

Direct Answer 使用 Structured Facts 模板化生成，不让 AI 自由编写事实。

### 目标

让搜索引擎明确区分：

```text
GitHub Repository = source code
DSH Plugin Market = verified discovery + structured trust profile
```

### 页面独特价值要求

每个被索引的插件详情页至少提供以下 Registry 独有字段中的多数：

- Format verification
- Compatibility status
- Security findings / risk level
- Maintenance status
- Last scan time
- Scanned commit
- Scanner version
- Pinned install command
- Publisher profile
- Related plugins

README 作为补充内容，而不是页面唯一正文。

### 验收

- [x] 详情页首屏包含可读 Direct Answer
- [x] Verified / Compatibility / Security / Maintenance 均有自然语言解释
- [x] Scan Evidence、scanner version、last scan 可被服务端 HTML 读取
- [x] Publisher 双向内链完成
- [x] Related Plugins 基于 capability 或同 Publisher 的真实 Registry 信号
- [x] pinned install command 与 scanned commit 一致
- [x] 不生成虚构风险结论或 AI 自由推断，Unknown 保持 Unknown
- [x] Edge SEO / canonical / JSON-LD 保持一致

Edge SEO 以英文作为 canonical crawlable 文档，前端界面继续支持中英文切换。这样避免 localStorage 语言偏好制造重复 URL；如将来需要独立双语收录，必须先增加 locale URL、canonical 和 hreflang，而不是仅切换浏览器状态。

## 6. Sprint 4 — Capability Landing Page

**优先级：P1。状态：已完成可索引版本。**

当前长尾入口不足，下一阶段通过真实 Registry 分类数据建设有限数量的 Capability 页面。

仅当某 capability 至少有 **3 个可索引 Plugin** 时创建页面，且必须有独特 capability 定义、选择说明、Trust 说明和真实插件链接，避免 Thin Content。页面是否进入 sitemap 与页面本身使用同一索引门槛。

推荐路由：

```text
/plugins/security
/plugins/developer-tools
/plugins/productivity
/plugins/themes
/plugins/git
/plugins/memory
/plugins/browser
/plugins/database
```

实际是否创建必须由当前 Registry 数据决定，不强行覆盖以上全部分类。路由必须映射到 Scanner 的真实 taxonomy：`developer-tools → DEVELOPMENT`、`git → GIT_GITHUB`、`browser → BROWSER_WEB`、`database → DATA`；没有真实 `AI` capability 时不创建 `/plugins/ai`。

### 页面结构

```text
H1: DSH <Capability> Plugins
↓
Direct Answer / capability 定义
↓
Registry Stats
↓
Verified Plugins
↓
插件对比 / 选择建议
↓
Trust / Security 说明
↓
Related Capabilities
↓
FAQ / Sources / Last Updated
```

### SEO 目标词

优先覆盖有真实内容支撑的长尾：

- `dsh plugins`
- `dsh security plugins`
- `dsh memory plugin`
- `dsh git plugin`
- `deepseek harness plugins`

不为 Query 变体创建重复页面。

### 验收

- [x] 每个页面至少 3 个可索引插件
- [x] 每页均有独特概念说明和选择建议
- [x] Plugin 列表由真实 Registry 数据动态生成
- [x] 页面与 Plugin Detail 双向内链
- [x] sitemap / canonical / JSON-LD 完成
- [x] 空分类 / 低内容分类返回 404 + noindex 且不进入 sitemap

初期不用 “Best” 作为结论性标题；页面使用中性的 capability 名称。只有建立可复现的排序和评价方法后，才考虑 “Best” 词组。

## 7. Sprint 5 — Discovery Landing Page

**优先级：P1 / P2。状态：Popular / New / Verified 已完成；Trending 延后。**

在 `/plugins` 现有发现能力之上增加少量稳定入口：

```text
/plugins/popular
/plugins/new
/plugins/verified
```

### 原则

这些页面必须有稳定、透明、可解释的排序逻辑，而不是仅复制 `/plugins`。当前只有 Popular（Stars）、New（discovered_at）和 Verified（格式验证 + evidence）满足条件。

建议：

**Trending（后置）**

```text
recent GitHub growth
+ recent update signal
+ market interaction signal（如果未来有）
+ trust / verification constraints
```

**Popular**

```text
GitHub stars / forks
+ historical market interaction（如果有）
```

**New**

```text
first discovered at / repository created or published time
```

**Verified**

```text
format verified
+ scan evidence available
```

### 验收

- [x] 排序算法有明确说明
- [x] 页面服务端输出真实插件内链
- [x] 不与 `/plugins` 形成完全重复内容
- [x] 可通过内部导航稳定发现

`/plugins/trending` 暂不作为 SEO Landing Page。现有 Stars 和更新时间只能支持 Popular / New，不能推导真实增长；待建立历史指标快照后再增加 Trending。

## 8. 品牌实体与主域信号

**优先级：P0。**

### 统一品牌命名

所有核心场景统一使用：

```text
DSH Plugin Market
```

避免核心实体在不同页面同时主要使用：

- DSH Market
- Plugin Market
- DSH Plugin Registry
- DeepSeek Harness Plugin Registry

这些词可以作为描述，但不替代品牌主名称。

### Structured Data

首页 `WebSite` / `Organization` 保持统一：

```text
name: DSH Plugin Market
url: https://dsh-plugin.market
logo: canonical logo URL
alternateName: 仅保留真实长期使用别名
sameAs: GitHub / 其他官方可控页面
```

代码中同时输出 `Organization`、`WebSite`、`WebPage`，并通过 `@id` 关联；不把社区项目写成 DeepSeek 官方产品。

### Host 统一

必须持续保证：

```text
https://www.dsh-plugin.market/*
        ↓ 301
https://dsh-plugin.market/*
```

并且以下全部只生成 non-www：

- canonical
- sitemap
- JSON-LD URL
- OpenGraph URL
- SSR 内链
- hreflang（如存在）

### 不做

- 因短期搜索排名波动频繁改首页 title
- 因搜索结果仍保留旧 www URL 就切换 canonical
- 同时提交 www / non-www sitemap

## 9. Internal Link Graph

**优先级：P1。**

目标结构：

```text
                    Home
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Plugins     Guides      Trust
          │
     ┌────┼────┐
     ↓    ↓    ↓
 Security AI  Tools
     │
     ↓
   Plugin
     │
 ┌───┴────┐
 ↓        ↓
Publisher Related Plugins
```

### Required Links

- Home → `/plugins` / Guides / Trust / 重点 Capability
- `/plugins` → Capability / Plugin
- Capability → Plugin
- Plugin → Publisher
- Publisher → Plugin
- Plugin → Related Plugins（基于 capability 或同 Publisher 的真实信号）
- Guide / Trust → 相关 Capability / Plugin 示例

### Related Plugins

推荐优先级：

1. 相同 capability
2. 相同 GitHub topic / metadata
3. 相似功能标签
4. 同 Publisher（仅作为弱信号）

禁止随机推荐。

## 10. 外链与生态分发

**优先级：P2。**

当前 metadata 优化的边际收益已经较低，下一阶段需要建立外部实体信号。外链只能作为实体确认信号，不作为未经验证的安全背书。

优先渠道：

- GitHub README
- GitHub About
- GitHub Topics
- Awesome DSH / Awesome DeepSeek Harness 列表
- DSH 社区内容
- 插件作者 README

### 插件作者反链计划

鼓励插件作者加入：

```md
View on DSH Plugin Market
```

并链接自己的插件详情页：

```text
https://dsh-plugin.market/plugin/<owner>/<repo>
```

目标是形成：

```text
Plugin GitHub Repository → DSH Plugin Market Plugin Detail
```

这种实体级反链优先级高于泛站点外链。

## 11. 数据与工程原则

### 静态知识

优先代码管理，当前落在：

```text
src/react-app/content/
  seo-content.ts
  guide-content.ts
```

不引入 CMS。Edge SEO 复用同一套内容源；不能只更新 React 内容而让抓取 HTML 继续输出旧的通用摘要。

### 动态事实

继续以 D1 / Scanner 为 Source of Truth：

```text
Repository
Plugin
Scan
Findings
Compatibility
Metadata
```

### 不做

- Blog 系统 / CMS
- AI 自动写博客
- 每日批量 SEO 文章
- 大量关键词 Landing Page
- Query 变体一页一个
- Next.js 重构
- 为 SEO 重写完整 React SSR
- 没有增长历史时伪造 Trending 排名
- 未达到内容阈值就创建 Capability Page
- 仅复制 GitHub README 的详情页

## 12. SEO KPI

下一阶段不再只看“收录页面数量”。

核心 KPI（每项需记录统计口径、时间周期、数据来源和目标值）：

1. **有效索引 Plugin Detail 数量**
2. **非品牌词 Impression**
3. **品牌词 `dsh plugin market` 排名与 CTR**
4. **Organic Clicks**
5. **Capability / Plugin Detail 的自然流量占比**
6. **www URL 在索引中的残留比例**
7. **Indexable URL coverage**：可索引数据库记录进入 sitemap 的比例
8. **Evidence coverage**：被索引详情页包含 scanned commit / scanner version / scan time 的比例
9. **Freshness lag**：扫描完成到页面/sitemap 可见的延迟
10. **Qualified outbound clicks**：详情页到 GitHub / pinned install 的点击率
11. **D1 quota headroom**：按日记录 rows read / 请求量、定时任务消耗和额度余量；付费额度提高后仍需保留告警，避免把额度提升误当成无限资源

### Search Console 建议观察维度

按页面类型拆分：

```text
/
/plugins
/plugin/*
/publisher/*
/guide/*
/trust
/plugins/<capability>
/plugins/popular|new|verified
```

按 Query 拆分：

```text
brand: dsh plugin market
category: dsh plugins / dsh security plugins / dsh memory plugin / ...
capability: dsh memory plugin / dsh git plugin / ...
entity: <plugin name>
```

## 13. 执行顺序

### P0 — 立即保持稳定

- [ ] 线上验证 www → non-www 301（代码已有回归测试，仍需生产 smoke test）
- [x] canonical / sitemap / JSON-LD / Edge 内链全部 non-www
- [x] 统一 Plugin / Publisher / Landing Page indexability predicate
- [x] Organization / WebSite / WebPage 实体关联
- [x] Edge HTML 输出完整知识内容和详情证据
- [ ] Search Console 重新提交 sitemap
- [ ] 对首页、`/plugins`、Guide、Trust 请求重新抓取
- [ ] 暂停无必要的首页 title / description 调整

### P1 — 已完成与后置项

1. [x] Plugin Detail 内容化与证据覆盖
2. [x] Related Plugins / Publisher ↔ Plugin 双向内链
3. [x] Capability Landing Page（真实 taxonomy + 3 个插件门槛）
4. [x] 首页增强 Capability 入口
5. [x] Popular / New / Verified Discovery Landing Page
6. [ ] 有历史指标后再启用 Trending

### P2 — 权重建设

1. 插件作者 README 反链
2. Awesome List / 社区曝光
3. 根据 Search Console Impression 选择下一批 Capability
4. 只对已经有真实搜索需求和足够 Registry 数据的主题扩展页面

## 14. 最终目标

```text
                         DSH Plugin Market
                               │
             ┌─────────────────┼──────────────────┐
             ▼                 ▼                  ▼
           Trust              Guides             Registry
             │                 │                  │
      Verification      What is DSH Plugin       Plugins
      Compatibility     Install Plugin           Publishers
      Security          Choose Plugin            Capabilities
             │                 │                  │
             └─────────────────┼──────────────────┘
                               ▼
                    Scanner-backed Evidence
                               │
                               ▼
                     GitHub / Commit / DSH
```

执行重点从原来的：

```text
首页 + Trust → Guides → Plugin Detail → Capability
```

升级为：

```text
主域权重集中
→ Plugin Detail 独特价值
→ Related Plugins 内链网络
→ Capability / Discovery Landing Page
→ 品牌实体和外部反链
→ Search Console 数据驱动扩展
```

最终目标不是“收录更多页面”，而是让 DSH Plugin Market 成为搜索引擎和用户都能明确识别的 **DSH Plugin discovery + verification authority**。
