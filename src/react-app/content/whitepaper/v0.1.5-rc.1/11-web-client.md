---
title: Web Client 架构
chapter_id: web-client
slug: web-client
dsh_version: v0.1.5-rc.1
upstream_tag: dsh-v0.1.5-rc.1
upstream_commit: 183f08e9c6dde7e36cd2318eaee70b0da08fb35e
status: verified
verified_at: 2026-09-10
sources:
  - docs/subsystems/web-client.zh.md
  - docs/subsystems/slots.zh.md
  - docs/api-gateway.zh.md
  - packages/client/ui-slots/README.zh.md
---
# Web Client 架构

DSH Web Client 自身也是由插件组装的浏览器侧 Cordis 应用。Host 保留权威业务状态，浏览器通过类型化 Remote 构建本地 Model，再由 UI Adapter、Conversation 与 Slots 形成 React 界面。

## 数据通路

```mermaid id=web-client-flow
flowchart LR
  H["Host State"] --> R["Remote / API Gateway"]
  R --> M["Client Model"]
  M --> U["UI Adapter"]
  U --> C["Conversation / Presentation"]
  C --> S["Typed Slots"]
  S --> V["React UI"]
  V -. "callbacks / commands" .-> R
  R -. "authoritative mutation" .-> H
```

官方 Web Client 的依赖方向就是 **Host State → Remote Transport → Client Model → UI Adapter → Conversation / Presentation → Slots → React**。用户操作沿 callback 反向进入 Client Service 或生成的 Remote，再由 Host 完成权威 Mutation，并通过 Stream / Event 回到 Client Model。

## 四个基础设施

| 基础设施 | 负责什么 |
| --- | --- |
| Client Modules | 加载浏览器插件图与模块依赖 |
| API Gateway | 类型化 Host Method、Stream、Event 转发 |
| Conversation | 把 Session Event Window 转成 Chat、Trajectory 等 View |
| Slots | 类型化 React 组合与插件 UI 挂载 |

UI 组件不直接接收 Cordis `ctx`，也不应持有 Transport。运行时 Service 留在插件 `apply` 闭包中，组件只拿经过 Slot 注入的 callback、observable hook 与业务 props。

## Host 与 Client Model

Host Controller 拥有持久化、访问策略、Mutation 顺序与 Stream 生产。Client Model 只是最新可用状态的浏览器投影，需要处理重连、Baseline 替换和增量更新，但不成为第二份业务真相。

Session Client 维护事件窗口、分页、Follow、Queue、Projection 与 Control State；Workspace Client 维护 Workspace 列表与导航状态。React 层通过 UI Adapter 消费这些稳定 Model。

## Slot 模型

`ui-slots` 支持 `single`、`list`、`keyed`、`chain` 四类组合。Slot 声明同时定义 cardinality、scope、owner props 与授权关系；插件通过 `ctx.slots.inject()` 等待目标 Slot 生命周期，再用 `ctx.slots.register()` 贡献 UI。

销毁父 Entry 会递归撤销其 Child Slot 和贡献，UI 扩展因此与 Cordis 生命周期一致，而不是长期残留在全局 React 注册表中。

## rc.1 的全局面板 API

rc.1 新增 root 作用域 keyed `main` Slot，并由 `sidebar.panellist` 提供与主面板 id 对应的入口。原先独立的 Conversation 主区迁移为 `main` 的 `conversation` key，其内部仍保留 Session Header、Composer、Input、Chat 等细粒度 Slot。

这意味着需要新增产品级全局面板时，应注册 `main` + `sidebar.panellist`；需要增强具体会话 Header 或输入区时，则继续进入 `main.conversation` 下的 Conversation Slot，而不是替换整个主区。

## 插件边界

功能插件可以 `import type` 共享声明，但不应运行时导入另一个功能插件的组件或状态。跨功能行为使用 Cordis Service，跨功能 UI 使用 Slot；这条边界是 Web Client 能保持可组合性的基础。
