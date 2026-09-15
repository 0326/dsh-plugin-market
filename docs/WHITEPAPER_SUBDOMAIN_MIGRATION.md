# Whitepaper 子域迁移

目标：将 DSH Living Whitepaper 的 canonical 入口从：

`https://dsh-plugin.market/whitepaper/<version>/<chapter>`

迁移到：

`https://whitepaper.dsh-plugin.market/<version>/<chapter>`

仓库、Worker 与发布流水线保持单一：**1 repo / 1 Worker / 2 hostnames**。

## Phase 1：域名基础设施

本阶段只建立新 hostname，不改变现有页面 URL 与 SEO：

- `config/cloudflare-domains.json` 声明由仓库管理的额外 Worker Custom Domain；
- `scripts/ensure-worker-domains.mjs` 通过 Cloudflare Workers Domains API 幂等绑定域名；
- 仅 `main` 的生产部署执行域名绑定；PR Preview 永不修改生产 hostname；
- 如果 hostname 已绑定到其他 Worker，部署直接失败，禁止自动抢占；
- 部署后访问 `https://whitepaper.dsh-plugin.market/whitepaper/<latestPublished>/overview` 做 TLS / DNS / Worker smoke check；
- 原 `https://dsh-plugin.market/whitepaper/*` 完全保持不变。

Custom Domain 不直接写入顶层 `wrangler.json`。原因是仓库同时使用 Cloudflare PR Preview Build；将生产 Custom Domain 放入共享 Wrangler routes 会让分支预览与生产域名生命周期耦合。生产域名由 `deploy.yml` 显式管理，配置来源为 `config/cloudflare-domains.json`。

### Phase 1 验收

生产部署后必须满足：

1. `whitepaper.dsh-plugin.market` 已绑定 `dsh-plugin-market` Worker；
2. TLS 可用；
3. `https://whitepaper.dsh-plugin.market/whitepaper/<latestPublished>/overview` 返回 200；
4. 原主域白皮书 URL 继续返回 200；
5. 插件市场其他页面无行为变化。

### Phase 1 回滚

如果 Custom Domain 创建失败，Worker 本身已经部署，但主域与旧白皮书路径不受影响。

若需要撤销新域名，应先在 Cloudflare Workers Domains 中解除 `whitepaper.dsh-plugin.market`，再回滚本 PR；不要删除或迁移现有 `dsh-plugin.market` 绑定。

## Phase 2：路由与 canonical 迁移

仅在 Phase 1 域名/TLS 验收通过后实施：

- Router 改为 hostname-aware；
- 白皮书新路由改为 `/<version>/<chapter>`、`/versions`、`/latest/...`；
- 主站导航改为跨域进入 `https://whitepaper.dsh-plugin.market/`；
- 白皮书内部指向 Market 的链接使用绝对主域 URL；
- `dsh-plugin.market/whitepaper/*` 301 到新子域对应路径；
- `/latest/...` 302 到 `versions.json.latestPublished`；
- canonical、OpenGraph、robots、sitemap 切换到白皮书子域；
- `versions.json` 保持唯一版本事实源；
- 增加 hostname/path/redirect 单元测试和生产 smoke tests。

Phase 2 完成后，旧 URL 只作为永久重定向入口，不再提供可索引的重复 200 页面。
