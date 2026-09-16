---
title: 版本与生命周期规范
chapter_id: appendix-lifecycle
slug: appendix-lifecycle
dsh_version: v0.1.5-rc.2
upstream_tag: dsh-v0.1.5-rc.2
upstream_commit: fb2c4b9e698e30edb738bca4cf0618587db7d203
status: verified
verified_at: 2026-09-15
sources:
  - README.zh.md
  - docs/architecture.zh.md
  - docs/testing.zh.md
---
# 版本与生命周期规范

白皮书以 DSH 发布版本为快照单位，而不是以站点发布时间或单篇文章更新时间为单位。一个快照同时拥有自己的正文、导航、图、源码链接和核验元数据。

## 纳入规则

| 发布通道 | 白皮书处理 |
| --- | --- |
| RC | 纳入并生成独立快照 |
| Stable | 纳入并生成独立快照 |
| Alpha / Beta / Canary / Dev / Nightly | 不生成快照 |
| Master / Next 等开发分支 | 不生成快照 |

这是为了避免把尚未形成发布承诺的变化写成稳定知识。新 RC 或 Stable 发布后，应重新核验并新增完整目录，而不是把旧页面静默改成“最新”。

## 切换版本时必须一起变化的内容

1. 文章正文和前置元数据；
2. 分组导航、文章顺序和可用章节；
3. Mermaid 图与预渲染资产；
4. 右侧官方源码链接及其 tag；
5. 版本演进、已知边界和实验状态。

## 文章生命周期

一篇文章在某个快照中可以是已核验、预览或实验；该标记只描述该快照中可确认的范围。后续版本可以新增、替换、拆分或删除文章，但不能让旧版本的路由悄然指向新版本内容。

## 升级原则

版本演进页只比较官方支持的基线。迁移建议应指向公开 Service、协议、配置或 Release 差异；依赖私有 DOM、内部实现或默认组合的内容必须明确为兼容性风险。
