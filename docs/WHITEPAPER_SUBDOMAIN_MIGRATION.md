# Whitepaper 子域迁移

目标：将 DSH Living Whitepaper 的 canonical 入口从：

`https://dsh-plugin.market/whitepaper/<version>/<chapter>`

迁移到：

`https://whitepaper.dsh-plugin.market/<version>/<chapter>`

仓库、Worker 与发布流水线保持单一：**1 repo / 1 Worker / 2 hostnames**。

## Phase 1：域名基础设施

已完成并通过生产部署验收：

- `config/cloudflare-domains.json` 声明由仓库管理的额外 Worker Custom Domain；
- `scripts/ensure-worker-domains.mjs` 通过 Cloudflare Workers Domains API 幂等绑定域名；
- 仅 `main` 的生产部署执行域名绑定；PR Preview 永不修改生产 hostname；
- 如果 hostname 已绑定到其他 Worker，部署直接失败，禁止自动抢占；
- `whitepaper.dsh-plugin.market` 已绑定现有 `dsh-plugin-market` Worker，并复用同一发布流水线。

Custom Domain 不直接写入顶层 `wrangler.json`。原因是仓库同时使用 Cloudflare PR Preview Build；将生产 Custom Domain 放入共享 Wrangler routes 会让分支预览与生产域名生命周期耦合。生产域名由 `deploy.yml` 显式管理，配置来源为 `config/cloudflare-domains.json`。

## Phase 2：路由、SEO 与阅读模式迁移

Phase 2 将子域升级为唯一 canonical 白皮书入口。

### Canonical URL

- `https://whitepaper.dsh-plugin.market/` → 302 到 `/<latestPublished>/overview`；
- `https://whitepaper.dsh-plugin.market/latest/<chapter>` → 302 到当前发布版本对应章节；
- `https://whitepaper.dsh-plugin.market/versions` → 版本快照列表；
- `https://whitepaper.dsh-plugin.market/<version>/<chapter>` → 稳定版本章节 URL；
- `https://dsh-plugin.market/whitepaper/<version>/<chapter>` → 301 到新子域；
- Phase 1 临时地址 `https://whitepaper.dsh-plugin.market/whitepaper/*` → 301 到短路径。

`versions.json.latestPublished` 是 latest、SEO 和生产 smoke test 的共同事实源。

### 阅读模式

白皮书子域不显示插件市场的全局 Header 和 Footer，避免 Market 导航干扰阅读。保留白皮书自身阅读能力：

- Whitepaper local header；
- DSH 版本选择；
- 左侧章节导航；
- 移动端章节导航；
- 本页目录；
- 官方来源与源码定位；
- 页面正文和版本固定信息。

主站仍保留完整 Market Header/Footer，并通过绝对子域链接进入白皮书。

### SEO

- 白皮书 canonical / OpenGraph URL 使用 `whitepaper.dsh-plugin.market`；
- 白皮书独立 `robots.txt` 指向自己的 sitemap；
- 白皮书 sitemap 在构建时从 `versions.json + nav.json` 自动生成；
- 所有 `published` 的 RC / Stable 章节进入 sitemap；
- Market sitemap 保持插件市场自身页面，不混入白皮书历史版本；
- 旧 `/whitepaper/*` 不再返回重复 200 页面。

### Cloudflare Worker

以下路径必须 `run_worker_first`，保证 Redirect / robots / sitemap 由 Worker 处理而不是直接落到 SPA Asset：

- `/whitepaper`
- `/whitepaper/*`
- `/latest`
- `/latest/*`
- `/robots.txt`
- `/sitemap.xml`
- `/`

具体版本章节路径仍直接由 SPA Assets 提供，不增加不必要的 Worker 处理开销。

### CI / CD

PR CI 校验：

- hostname-aware Router；
- legacy URL 301；
- root/latest 302；
- Wrangler worker-first 路径；
- Markdown / Shiki / Mermaid / Whitepaper content policy；
- TypeScript / Vite / Wrangler dry-run。

生产部署后的 smoke test 校验：

1. 新 canonical 章节 URL 返回 200；
2. 子域 `/` 302 到具体 latest 章节；
3. `/latest/overview` 302 到具体 latest 章节；
4. 原主域 `/whitepaper/<version>/overview` 301 到新子域；
5. 子域 `robots.txt` 指向子域 sitemap；
6. 子域 sitemap 包含 latestPublished 的 concrete URL。

## 回滚

Phase 2 若发生应用问题，可回滚 Phase 2 commit/PR，Custom Domain 继续保留，Phase 1 基础设施无需撤销。

只有确认不再使用白皮书子域时，才应单独解除 `whitepaper.dsh-plugin.market` Custom Domain；不得删除或迁移现有 `dsh-plugin.market` 绑定。
