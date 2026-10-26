---
title: 版本演进
chapter_id: evolution
slug: evolution
dsh_version: v0.2.1-rc.3
upstream_tag: dsh-v0.2.1-rc.3
upstream_commit: 1f81c047fc48fa190a683e469daa699857e9afe8
status: draft
verified_at: 2026-10-26
sources:
  - docs/subsystems/feedback.zh.md
  - packages/client/ui-message-feedback/README.zh.md
  - packages/client/ui-deliverables/README.zh.md
  - packages/client/ui-chat/README.zh.md
  - packages/client/ui-primitives/README.zh.md
---
# 版本演进

> **Preview 状态**：本页由上一已发布白皮书快照迁移到 `v0.2.1-rc.3`，frontmatter 已锁定到官方 Tag/Commit，但正文尚未完成逐段源码复核。跨版本新增与破坏性变化优先以“版本演进”页及本页的 RC 迁移提示为准；完成逐章复核后才可发布。


`v0.2.1-rc.3` 是当前策略范围内检测到的最新 DSH Release Candidate。当前白皮书最后一个已发布版本仍是 `v0.1.5-rc.2`；本快照先以 **preview** 收录，避免在逐章源码复核完成前把新版本标记为已发布。

从 `v0.1.5-rc.2` 到 `v0.2.1-rc.3` 跨过了 `v0.1.7`、`v0.2.0`、`v0.2.1` 三个 RC 系列，升级判断不能再按“UI 小修订”处理，而应视为一次需要重新审查插件、编排、SDK、Web 与安全边界的跨版本迁移。

## RC 链

| RC | 发布时间 | 主要关注点 |
| --- | --- | --- |
| `v0.1.7-rc.1` | 2026-09-23 | 插件管理、Web 终端、MCP/浏览器能力、后台任务、Agent Team |
| `v0.1.7-rc.2` | 2026-09-24 | 定时任务、动态工具、桌面后台运行、插件/模式体验 |
| `v0.2.0-rc.1` | 2026-09-28 | 插件与创造模式、Web 搜索、Windows Sandbox、自动化任务 |
| `v0.2.0-rc.2` | 2026-09-29 | Desktop `dsh` 命令、模型目录、异步问答、Sandbox 诊断 |
| `v0.2.1-rc.1` | 2026-10-17 | 插件索引/热重载、SDK resume/working directory、Gateway、Web 部署、Agent Team 迁移 |
| `v0.2.1-rc.2` | 2026-10-17 | DeepSeek-V4.1-Flash-1017、Search / Fetch API |
| `v0.2.1-rc.3` | 2026-10-23 | 多区域插件入口、草稿恢复修复、模型列表同步 |

## 迁移优先级

| 领域 | 风险 | 升级动作 |
| --- | --- | --- |
| 插件兼容与包元信息 | 高 | 检查 `engines.dsh`、子路径插件元信息、启停/卸载/更新与热重载 |
| Agent Team / Subagent | 高 | 移除对旧 outbox 的依赖；适配 child ID 与 `session/wait` |
| Tool 展示与 PTC | 高 | 旧 `both` 模式迁移到 `native` 或 `ptc`；复核 Python PTC Sandbox |
| SDK | 中高 | 显式选择 profile；验证 `resume` 与 working directory 生命周期 |
| Web / Remote | 中高 | 复核 `--public-url`、反向代理路径、bind/TLS 与账号登录 |
| 凭据与 Gateway | 中高 | 复核 API Key 来源优先级、密钥脱敏和调用方身份授权 |
| Search / Model | 中 | 验证 V4.1 Flash 与 Search / Fetch API 的配置和能力发现 |
| UI 内部依赖 | 中 | 新菜单、预览、终端、会话列表变化较多，避免依赖内部 DOM/CSS |

## 插件开发是本轮最需要复核的区域

0.2.1 系列把插件从“安装后静态存在”进一步推进到可发现、可启停、可更新和可热重载的运行时资产。第三方插件兼容判断优先使用 `engines.dsh`，子路径插件元信息读取方式也发生变化。

升级检查不应只跑一次安装成功，而应覆盖：

1. 插件能否从目标索引发现并安装；
2. 启用/停用/卸载后 effect 是否完整撤销；
3. 更新后依赖是否同步，热重载是否真的替换运行中实例；
4. `engines.dsh` 是否准确声明支持范围；
5. UI 扩展是否走公开 Slot，而不是依赖旧页面结构。

## 编排与多 Agent 语义发生变化

Subagent 工具现在更强调“立即返回 child ID，后续通过等待/通知完成”；Agent Team 消息则直接投递目标 Inbox，旧 outbox、自动重试和重发去重被移除。

自定义 runtime、Team 插件或观测插件如果仍把父 Tool 生命周期、outbox 队列或旧结果字段当作完成判断，需要优先迁移。

## SDK、Web 与外部接入继续扩展

SDK 增加 Session `resume` 与 working directory API，默认 profile 改为通用 AI Agent。Web 侧增加 `--public-url`、指定 bind 地址与原生 TLS，Gateway 也加强按调用方身份的授权与连接管理。

外部系统集成应重新验证三件事：**会话归属、工作目录归属、调用方身份**。不要继续依赖旧默认值推断它们。

## 安全边界需要重新验收

新版本会识别消息中的密钥/令牌并默认脱敏，同时调整 Web/Desktop 与 headless 的 API Key 来源优先级；Python PTC 也接入 Session 文件 Sandbox。

从旧基线升级后至少需要重新跑：

- 凭据来源与覆盖优先级；
- 敏感信息展示/复制路径；
- 文件读写越界；
- Gateway 调用方身份；
- PTC / Shell / Remote 的权限边界。

## 当前 preview 的完成条件

本 PR 只完成“最新 RC 可读”与迁移差异入口，不直接前移 `latestPublished`。发布 `v0.2.1-rc.3` 前还需要：

1. 按新 Tag/Commit 逐章核对官方源码路径；
2. 更新受影响架构图，而不是永久复用旧图；
3. 将所有 preview 章节的 `status: draft` 切为 `verified`；
4. 通过 whitepaper validate / build / Mermaid / application build；
5. Review 后把版本状态改为 `published`，再前移 `latestPublished`。

## 官方变更入口

- [v0.1.5-rc.2...v0.1.7-rc.1](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.5-rc.2...dsh-v0.1.7-rc.1)
- [v0.1.7-rc.1...v0.1.7-rc.2](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.7-rc.1...dsh-v0.1.7-rc.2)
- [v0.1.7-rc.2...v0.2.0-rc.1](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.1.7-rc.2...dsh-v0.2.0-rc.1)
- [v0.2.0-rc.1...v0.2.0-rc.2](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.1...dsh-v0.2.0-rc.2)
- [v0.2.0-rc.2...v0.2.1-rc.1](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.0-rc.2...dsh-v0.2.1-rc.1)
- [v0.2.1-rc.1...v0.2.1-rc.2](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.1...dsh-v0.2.1-rc.2)
- [v0.2.1-rc.2...v0.2.1-rc.3](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.2...dsh-v0.2.1-rc.3)
- [v0.2.1-rc.3 Release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.3)
