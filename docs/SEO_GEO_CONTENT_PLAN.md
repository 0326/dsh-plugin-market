# DSH Plugin Market 内容 SEO / GEO 开发计划

> 目标：把 DSH Plugin Market 从插件列表站升级为 **DeepSeek Harness Plugin 生态的权威知识入口 + 可验证数据源**。
>
> 原则：Registry as Content，不建设 Blog CMS，不批量生成低质量关键词页。静态知识内容负责解释概念，D1 / Scanner 负责持续提供可验证事实。

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

## 2. Sprint 1 — 首页实体建设 + Trust

预计 2–3 天。

### 首页新增 5 个知识模块

1. **What is DSH Plugin Market?**
   - 直接解释独立 Registry 的定位。
   - 建立 DSH Plugin Market ↔ DeepSeek Harness ↔ GitHub 实体关系。
   - 链接 `/about`、`/trust`。

2. **What is a DSH Plugin?**
   - 解释 DSH Plugin 在 DeepSeek Harness 中的位置。
   - 用 Tools / Agents / Integrations / Runtime capabilities 做能力示意。
   - Sprint 2 再链接独立 Guide。

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

- [ ] 首页 5 个知识模块完成
- [ ] 首页 FAQ 完成
- [ ] `/trust` 完成
- [ ] 中英文完成
- [ ] 延续现有 Design Language
- [ ] 首页发现主路径不被内容区抢占
- [ ] 真实 Registry / Scanner 数据进入内容区
- [ ] `/trust` 纳入 Edge SEO 和 sitemap
- [ ] lint / tests / build / Wrangler dry-run 全绿

## 3. Sprint 2 — Knowledge Layer

预计 2–3 天。

新增：

- `/guide/what-is-dsh-plugin`
- `/guide/install-dsh-plugin`
- `/guide/choose-dsh-plugin`

统一结构：Direct Answer → Key Facts → How it works → Evidence / Data → Example → Related concepts → Sources → Last updated。

所有示例优先引用 Registry 中真实插件，避免虚构内容。

SEO：Title / Description / Canonical / OpenGraph / WebPage JSON-LD / BreadcrumbList / dateModified，并纳入 Edge SEO 与 sitemap。

## 4. Sprint 3 — Registry as Content

预计 2–3 天。

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

## 5. 后续 Capability Page

仅当某 capability 至少有 3–5 个有效 Plugin 时创建 `/capability/:name`，避免 Thin Content。

页面至少包含概念解释、Registry stats、Verified plugins、选择建议和相关 capability。

## 6. 数据与工程原则

### 静态知识

优先代码管理，可放在：

```text
src/content/
  trust.ts
  guides/
```

不引入 CMS。

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

## 7. 最终目标

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

执行优先级：**首页 + Trust → 3 个 Guide → Plugin Detail 内容化 → Capability Page**。
