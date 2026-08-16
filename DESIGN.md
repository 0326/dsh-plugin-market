# DS Plugin Market Design Language

> 构建安全可信的 DSH 精选插件市场。
>
> 本文定义 `ds-plugin.market` 的品牌与界面设计语言，作为首页、插件列表、插件详情、提交页、文档页以及后续所有视觉实现的统一约束。

---

## 1. 设计目标

DS Plugin Market 不是一个传统 SaaS Dashboard，也不是 GitHub Topic 的“漂亮皮肤”。它应该更像一个经过编辑、筛选和验证的开发者插件市场。

设计需要同时传达四件事：

1. **可信**：验证、兼容性、安全信息必须清晰，但不制造“绝对安全”的误导。
2. **精选**：页面有明显的编辑感和人工筛选感，不是数据库结果平铺。
3. **开发者气质**：简洁、直接、结构清晰，有工具感，但不做“黑客终端风”。
4. **品牌辨识度**：用户第一眼能记住 Kun 吉祥物、黑白结构和高对比强调色。

核心体验关键词：

**Bold / Editorial / Curated / Trustworthy / Playful / Developer-first**

---

## 2. 核心设计原则

### 2.1 One Big Idea

每个页面只允许一个视觉主角。

首页主角是：

**DSH Plugin Market + Kun 吉祥物 + 搜索入口**

不要在 Hero 区同时堆叠：

- 六种统计指标
- 三层功能说明
- 五个 CTA
- 大量渐变装饰
- 多个浮动卡片
- AI 星星、光晕、粒子等无意义元素

页面首先要有“主视觉”，其次才是信息。

### 2.2 内容优先，UI 退后

插件是内容，界面只是框架。

优先展示：

- Plugin 名称
- 一句话能力描述
- Verified / Compatibility / Risk 等信任信息
- 作者
- 版本
- 安装/使用信号

减少展示：

- Public
- TypeScript
- GitHub 默认 metadata
- 无法帮助用户做判断的冗余字段

### 2.3 少卡片，强层级

避免典型 AI/SaaS 页面：

```text
Hero
+ 3 Feature Cards
+ 6 Category Cards
+ 4 Stats Cards
+ 8 Plugin Cards
+ CTA Cards
+ Footer Cards
```

推荐通过：

- 网格
- 分割线
- 大字号
- 留白
- 轻量标签
- 不等宽内容块

建立层级，而不是任何信息都装进圆角卡片。

### 2.4 编辑感优于算法感

使用：

- 精选
- 本周推荐
- 新上架
- 值得关注
- 安全检查通过
- 官方/社区精选

避免过度强调：

- AI 推荐
- AI Ranking
- AI Generated
- 智能推荐

AI 可以参与后台分析，但不应成为网站视觉主体。

### 2.5 不追求“未来感”，追求“记忆点”

网站不是 DeepSeek 官网，也不是 AI 模型产品页。

不要依赖：

- 蓝紫渐变
- 大面积毛玻璃
- Glow
- Aurora
- 3D 光球
- 随处可见的 AI Sparkle

品牌记忆点应该来自：

- Kun 吉祥物
- 黑 / 白高对比
- 蓝 / 黄 / 红少量强调
- 粗线条
- 强排版
- 插件内容本身

---

## 3. 视觉风格

整体风格定义：

**Editorial Marketplace × Light Neo-Brutalism × Developer Tool**

可以理解为：

- 编辑式内容网站的排版感
- 新粗野主义的清晰轮廓和高对比
- Developer Marketplace 的信息密度与可信感

但不要照抄任何参考站点的具体布局、组件或视觉资产。

### 3.1 应该有的感觉

- 大气
- 清楚
- 有设计感但不过度设计
- 有一点玩味
- 信息密度高但不拥挤
- 像“人做的产品”，而不是模板自动生成

### 3.2 不应该有的感觉

- AI SaaS 模板
- 企业后台
- Web3 Landing Page
- Cyberpunk
- Material Dashboard
- Apple 官网仿制
- GitHub 页面重皮肤

---

## 4. 品牌系统

### 4.1 品牌名

主品牌：

**DS Plugin Market**

域名：

**ds-plugin.market**

推荐主 Slogan：

> 构建安全可信的 DSH 精选插件市场

英文：

> A secure, trusted, curated plugin marketplace for DSH.

产品主张：

> Discover. Verify. Install with confidence.

### 4.2 Kun 吉祥物

Kun 是网站最重要的品牌视觉资产。

当前确定的视觉特征：

- 鲸鱼整体轮廓
- 黑色主体
- 白色 DeepSeek 风格腹部
- 保留鲸尾
- 大圆眼
- 红色腮红
- 黄色嘴部
- 头顶左右对称、中分式鱼鳍/装饰
- 背景透明

Kun 的核心作用不是“可爱装饰”，而是提供品牌辨识度。

#### 使用规则

推荐使用位置：

- 顶部品牌 Logo
- 首页 Hero 主视觉
- Empty State
- 404
- 提交成功
- Verification 完成
- 社区活动/精选栏目

避免：

- 每一张插件卡都出现 Kun
- 每个按钮旁都出现 Kun
- Kun 与大量 emoji 混用
- Kun 做成 3D 毛绒玩具风
- Kun 使用过多表情导致品牌幼稚化

首页建议 Kun 只出现 1 个主视觉版本。

---

## 5. 色彩系统

网站以 **黑 / 白** 为绝对主色。

### 5.1 Base

```css
--color-bg: #FFFFFF;
--color-text: #0B0B0B;
--color-muted: #666666;
--color-border: #111111;
--color-soft-border: #E6E6E6;
--color-surface: #FAFAFA;
```

### 5.2 Brand Accent

```css
--color-blue: #315CFF;
--color-yellow: #FFC928;
--color-red: #FF4438;
--color-green: #1CBF73;
```

用途约束：

- **Blue**：链接、可交互状态、品牌强调
- **Yellow**：Featured / Curated / 推荐
- **Red**：Kun 腮红、风险告警
- **Green**：Verified / Passed

### 5.3 色彩比例

推荐视觉比例：

```text
白色      70–80%
黑色      15–20%
品牌色     5–10%
```

不要让蓝色成为页面背景主色。

### 5.4 禁止

- 蓝紫渐变作为主背景
- 五颜六色的插件卡背景
- 大面积阴影制造层级
- 玻璃透明层
- 低对比灰字

---

## 6. 字体与排版

### 6.1 字体角色

标题：

- 粗体
- 高对比
- 紧凑行高
- 大字号

正文：

- 中性 Sans Serif
- 易读优先
- 不追求科技感

代码/版本/命令：

- Monospace

### 6.2 推荐层级

```text
Display      64–88px / 700–800
H1           48–64px / 700
H2           32–40px / 700
H3           22–28px / 650
Body Large   18–20px
Body         15–17px
Meta         12–14px
Code         13–15px monospace
```

首页 Hero 标题应该明显大于其他元素。

### 6.3 中文排版

中文标题尽量短：

好：

> 构建安全可信的 DSH 精选插件市场

差：

> 帮助所有 DeepSeek Harness 用户发现更多强大且值得信任的第三方插件

原则：

**短标题 + 一句解释，而不是大段营销话术。**

---

## 7. 线条、圆角和阴影

### 7.1 Border

边框是主要层级手段。

```css
--border-default: 1px solid #111;
--border-subtle: 1px solid #E6E6E6;
```

Featured 区或特殊 CTA 可以使用 2px 黑边。

### 7.2 Radius

整体圆角必须克制。

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
```

不要默认所有组件 `24px` 圆角。

### 7.3 Shadow

默认无阴影。

只允许：

- Hover 极轻微 shadow
- Overlay / Popover 必要阴影

禁止用阴影作为主要视觉结构。

---

## 8. 页面网格

桌面优先采用 12 列网格。

```text
Max width: 1280–1440px
Page padding: 32–48px
Section gap: 72–120px
Grid gap: 16–24px
```

### 8.1 不要全部等宽

精选区应允许出现不同尺寸的信息块，例如：

```text
┌─────────────────┐ ┌──────────┐
│                 │ │ Plugin B │
│   Featured A    │ └──────────┘
│                 │ ┌──────────┐
│                 │ │ Plugin C │
└─────────────────┘ └──────────┘
```

比标准四列等宽卡片更有编辑感。

---

## 9. 首页结构

首页不是“功能介绍页”，是“发现入口”。

建议信息结构：

```text
Header

Hero
├─ Brand statement
├─ Search
└─ Kun visual

Explore Navigation
├─ 精选
├─ 最新
├─ 热门
├─ 开发工具
├─ 浏览器
├─ MCP
├─ UI
└─ 安全

Featured Plugins

Trust Strip
├─ 格式验证
├─ 兼容性
└─ 安全信号

Latest / Trending

Developer CTA

Footer
```

### 9.1 Hero

Hero 只回答三个问题：

1. 这是什么？
2. 为什么值得用？
3. 我现在怎么找插件？

推荐文案：

```text
DSH
PLUGIN MARKET

构建安全可信的 DSH 精选插件市场

[ 搜索插件、功能或开发者…… ][ 搜索 ]
```

右侧 Kun 吉祥物作为唯一强插画。

统计信息如果使用，最多保留 2–3 个：

- 精选插件
- 已验证插件
- 本周更新

不要显示没有真实意义的数字。

---

## 10. Plugin Card

插件卡片的目标是帮助用户做选择，而不是展示所有 metadata。

### 10.1 必需信息

- Icon
- Plugin name
- Version
- 一句话描述
- Publisher
- Verification status
- Compatibility
- 安装量 / Stars（若有意义）
- 更新时间

### 10.2 Badge

推荐：

```text
精选
已验证
兼容 rc.6
低风险
官方
社区
```

Badge 要小，不能抢标题。

### 10.3 Featured Card

精选插件可以使用明显不同的视觉结构：

- 黑底白字
- 黄色 Featured 标签
- 更大的标题
- 更少 metadata

不要让所有卡片都长得一样。

---

## 11. 信任信息设计

“可信”是产品核心，但不能把首页做成安全控制台。

首页只展示三个高层信号：

### Format Verified

说明插件结构是否符合 DSH 插件规范。

### Compatibility

说明与当前 DSH / Cordis 版本兼容情况。

### Security Signals

说明静态扫描、安装脚本、权限和依赖风险。

详细信息全部放到 Plugin Detail。

### 11.1 文案原则

使用：

- 已验证格式
- 安全扫描通过
- 未发现已知高风险信号
- 需要安装时执行脚本

禁止使用：

- 100% 安全
- 官方保证安全
- 无风险
- 完全可信

---

## 12. 插件详情页

详情页应该比首页更工具化，但仍保持同一设计语言。

推荐：

```text
Plugin Header
├─ Icon
├─ Name
├─ Publisher
├─ Description
└─ Trust badges

Tabs
├─ Overview
├─ Install
├─ Compatibility
├─ Security
└─ Versions

Main Content            Sticky Install Panel
README                   Install command
Screenshots              Version
Capabilities             Commit SHA
                         Trust summary
```

右侧安装区域保持 sticky。

安装命令使用明显的 monospace block，但避免终端模拟器视觉。

---

## 13. 搜索体验

Search 是首页最核心交互之一。

搜索框应该：

- 足够大
- 高对比
- 无多余图标
- 支持关键词、插件、能力和开发者

推荐 Placeholder：

> 搜索插件、功能或开发者……

结果优先匹配：

1. Name
2. Capability
3. Description
4. Publisher
5. README

AI Search 可以作为二级能力存在，不占据首页视觉中心。

---

## 14. 动效

动效必须克制。

推荐：

- Hover 轻微位移 `1–2px`
- Border / background transition
- Search result 淡入
- Kun 极轻微 idle motion（可选）

时间：

```css
--motion-fast: 120ms;
--motion-default: 180ms;
--motion-slow: 280ms;
```

禁止：

- 大面积 parallax
- 鼠标跟随光晕
- 卡片 3D 翻转
- 每个模块进入视口都飞入
- 背景无限粒子

---

## 15. 响应式

### Desktop

强调编辑式网格和不对称布局。

### Tablet

精选区从复杂网格收敛为 2 列。

### Mobile

移动端优先顺序：

```text
Brand
Hero statement
Search
Kun
Category tabs
Featured
Latest
Trust
CTA
```

移动端不要保留桌面的复杂 Masonry。

Plugin Card 变为单列，信任信息做紧凑标签。

---

## 16. Accessibility

- 正文对比度至少 WCAG AA
- 不依赖颜色表达 Verified / Risk
- Badge 同时使用 icon + text
- Focus state 必须明显
- 所有可点击区域至少 40×40px
- Mascot / decorative artwork 必须正确设置 alt 或 `aria-hidden`
- Reduced motion 用户关闭非必要动效

---

## 17. Anti-AI Design Checklist

每次页面完成后检查：

- [ ] 是否出现无意义蓝紫渐变？
- [ ] 是否用了过多 20px+ 圆角卡片？
- [ ] 是否每个模块都是相同卡片结构？
- [ ] 是否有大量 AI Sparkle / Glow？
- [ ] 是否使用了“未来、智能、无限可能”等空泛营销话术？
- [ ] 是否 Hero 同时存在 5 个以上视觉重点？
- [ ] 是否所有信息都被框在卡片里？
- [ ] 是否缺少明显品牌角色？
- [ ] 是否看起来像一个通用 SaaS 模板换了 Logo？

任意 3 项为“是”，需要重新设计。

---

## 18. Do / Don't

### Do

- 大字号
- 黑白高对比
- 强网格
- 适当不对称
- 真实插件内容
- 小而明确的信任标签
- Kun 作为唯一品牌主视觉
- 少量高饱和强调色
- 清晰的编辑精选感

### Don't

- 玻璃拟态
- 蓝紫渐变海报
- 卡片海
- 浮动 AI 图标
- 过量 shadow
- 过量 radius
- Dashboard 化
- 机械等宽布局
- 大段 AI 营销文案
- 为“高级感”牺牲信息可读性

---

## 19. Design Tokens Starter

```css
:root {
  --bg: #fff;
  --surface: #fafafa;
  --text: #0b0b0b;
  --muted: #666;

  --border: #111;
  --border-subtle: #e6e6e6;

  --blue: #315cff;
  --yellow: #ffc928;
  --red: #ff4438;
  --green: #1cbf73;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 72px;
  --space-9: 96px;

  --motion-fast: 120ms;
  --motion-default: 180ms;
  --motion-slow: 280ms;
}
```

---

## 20. 最终判断标准

一个页面是否符合 DS Plugin Market 的设计语言，不看它是否“现代”，而看以下四点：

### 1. 一眼能不能认出来？

即使隐藏域名，也应该通过 Kun、黑白结构和强调色认出品牌。

### 2. 能不能快速做决定？

用户应该快速判断插件：

- 是什么
- 谁做的
- 能不能用
- 是否兼容
- 是否存在明显风险

### 3. 是否有人工精选感？

页面应该像一个被认真维护的市场，而不是搜索 API 的直接输出。

### 4. 是否克制？

删除一个装饰元素后如果页面没有信息损失，就应该删掉。

最终视觉原则：

> **Bold enough to remember. Quiet enough to trust.**
>
> 足够大胆，让人记住；足够克制，让人信任。
