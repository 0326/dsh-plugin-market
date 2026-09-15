---
title: 阅读路径与角色入口
chapter_id: reading-paths
slug: reading-paths
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-15
sources:
  - README.zh.md
  - docs/architecture.zh.md
  - packages/README.zh.md
---
# 阅读路径与角色入口

白皮书按“先判断职责，再进入细节”的顺序组织。左侧每一项都是独立文章；本页只给出入口，不重复各章的技术结论。

## 先选你的问题

| 你的目标 | 建议阅读顺序 | 完成后应能回答 |
| --- | --- | --- |
| 理解 DSH 如何运行 | 全貌 → 组合模型 → 启动配置 → Agent Core → 运行机制 → Session | 一次输入如何进入 Agent、被执行并沉淀为可恢复事实？ |
| 开发或替换插件 | Capability Seam → 核心能力 → Preset → Hooks → 插件开发 → 扩展地图 | 新行为应是 Provider、Tool、Event、Preset 还是 UI Slot？ |
| 编排多个工作单元 | 编排方式选择 → Subagent → Workflow → Jobs → Agent Teams | 需要独立会话、脚本化协调、后台生命周期，还是长期协作？ |
| 建设产品界面或接入外部系统 | Web Client → 插件开发 → 外部接入方式 → SDK / ACP / Webhook | 状态应留在 Host、浏览器投影、外部 Client 还是事件规则？ |
| 上线、排障或升级 | 安全与权限 → 调试与观测 → 可靠性与验证 → 已知边界 → 版本演进 | 哪个层持有安全、证据、可靠性和迁移责任？ |

## 建议的第一遍阅读

1. 先读“DSH 全貌”，建立组合层、Agent 主干、能力层和产品层的边界。
2. 再连续读“运行时基础”的五篇文章；不要在不了解 Session 之前设计 Tool 或插件状态。
3. 按实际目标进入“编排与能力”或“产品与扩展”。这里的文章从决策页进入，再落到单项机制。
4. 最后读“生产、边界与演进”，再使用附录核对术语、版本约束和源码入口。

## 怎样使用附录

“术语表”统一解释本文的核心名词；“文档约定与证据规则”说明事实如何被固定；“版本与生命周期规范”说明为何切换版本会同时切换正文、导航和源码链接；两个索引用于从概念返回官方资料。

> 白皮书是架构导航，不替代 API Reference。需要精确类型、配置字段或事件签名时，应沿右侧“官方来源”进入固定 tag 的源码或文档。
