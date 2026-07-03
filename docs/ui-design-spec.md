# 宠物喂养小程序 UI 设计规范

> 版本 1.0 | 适用于所有页面，作为统一设计基准

---

## 1. 设计理念

### 1.1 关键词

**温暖 · 可靠 · 清爽 · 专业**

宠物主人把毛孩子托付给陌生人，需要信任感。UI 应当传达「我们很专业，也很温暖」——不能冷冰冰，也不能太花哨。

### 1.2 核心原则

| 原则 | 说明 |
|------|------|
| 少即是多 | 每个页面只突出一个核心操作，其余弱化 |
| 状态可感知 | 订单状态、加载状态、空状态都要有明确视觉反馈 |
| 触控友好 | 可点击区域 ≥ 88rpx 高度，按钮间距 ≥ 24rpx |
| 颜色有意义 | 状态色（红/绿/黄/蓝）只用于语义，不做装饰 |
| 文案即界面 | 用直接清晰的文字代替复杂图标，emoji 仅用于情绪点缀 |

---

## 2. 色彩系统

### 2.1 主色调

宠物喂养场景选择 **暖橘色**作为主色——既有家的温暖感，也代表活力和信任。

```
主色 (Primary):    #F97316 (橙)
主色悬停:          #EA580C (深橙)
主色浅底:          #FFF7ED (极浅橙)
```

### 2.2 辅助色

```
辅助色 (Accent):   #0EA5E9 (天蓝) — 用于链接、信息提示
```


### 2.3 中性色

```
页面背景:          #F5F5F5
卡片背景:          #FFFFFF
分隔线:            #EEEEEE
主文字:            #1A1A1A
次要文字:          #666666
辅助文字:          #999999
占位文字:          #CCCCCC
```

### 2.4 语义色（状态）

```
成功:              #22C55E (绿)  浅底: #F0FDF4
警告:              #F59E0B (黄)  浅底: #FFFBEB
危险:              #EF4444 (红)  浅底: #FEF2F2
信息:              #3B82F6 (蓝)  浅底: #EFF6FF
```

### 2.5 各页面对应的 CSS 变量（用于 app.wxss）

```css
page {
  /* 主色 */
  --color-primary:       #F97316;
  --color-primary-dark:  #EA580C;
  --color-primary-light: #FFF7ED;
  /* 辅助色 */
  --color-accent:        #0EA5E9;
  --color-accent-light:  #F0F9FF;
  /* 中性色 */
  --bg-page:             #F5F5F5;
  --bg-card:             #FFFFFF;
  --border-color:        #EEEEEE;
  --text-primary:        #1A1A1A;
  --text-secondary:      #666666;
  --text-hint:           #999999;
  --text-placeholder:    #CCCCCC;
  /* 语义色 */
  --color-success:       #22C55E;
  --color-warning:       #F59E0B;
  --color-danger:        #EF4444;
  --color-info:          #3B82F6;
  --bg-success:          #F0FDF4;
  --bg-warning:          #FFFBEB;
  --bg-danger:           #FEF2F2;
  --bg-info:             #EFF6FF;
  /* 圆角 */
  --radius-sm:           8rpx;
  --radius-md:           12rpx;
  --radius-lg:           16rpx;
  --radius-full:         9999rpx;
}
```

---

## 3. 字体系统

单位统一用 `rpx`，小程序 1rpx ≈ 0.5px（375 基准）。

| 层级 | 字号 | 字重 | 用途 |
|------|------|------|------|
| H1 页面大标题 | 40rpx | 600 | 详情页标题、金额 |
| H2 卡片标题 | 32rpx | 500 | 卡片标题、列表项名称 |
| H3 分组标题 | 28rpx | 500 | 表单标签、分组标题 |
| Body 正文 | 28rpx | 400 | 正文、描述文字 |
| Caption 辅助 | 24rpx | 400 | 辅助说明、时间、标签 |
| Small 极小 | 20rpx | 400 | 角标、极小提示 |

全局字体：`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`

---

## 4. 间距系统

基于 8rpx 递增：4, 8, 12, 16, 20, 24, 32, 40, 48

| Token | 值 | 用途 |
|-------|-----|------|
| xs | 8rpx | 标签内边距、图标文字间距 |
| sm | 12rpx | 列表项内部间距 |
| md | 16rpx | 卡片内边距 |
| lg | 24rpx | 组件间距 |
| xl | 32rpx | 分区间距 |
| 2xl | 40rpx | 页面上下留白 |

```css
/* 建议加到 app.wxss 作为间距变量 */
--space-xs:  8rpx;
--space-sm:  12rpx;
--space-md:  16rpx;
--space-lg:  24rpx;
--space-xl:  32rpx;
--space-2xl: 40rpx;
```

---

## 5. 组件规范

### 5.1 按钮 (Button)

每种按钮都有三种尺寸：L（全宽）、M（半宽）、S（内联）

```css
/* 主按钮 — 全宽 */
.btn-primary {
  width: 100%;
  height: 88rpx;
  background: var(--color-primary);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-primary:active { background: var(--color-primary-dark); }

/* 线框按钮 */
.btn-outline {
  width: 100%;
  height: 88rpx;
  background: #fff;
  color: var(--color-primary);
  font-size: 32rpx;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
}
.btn-outline:active { background: var(--color-primary-light); }

/* 次要按钮（灰色） */
.btn-secondary {
  padding: 16rpx 32rpx;
  background: #fff;
  color: var(--text-secondary);
  font-size: 28rpx;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
}
.btn-secondary:active { background: #f5f5f5; }

/* 危险按钮 */
.btn-danger {
  composes: btn-primary;
  background: var(--color-danger);
}

/* 小按钮 */
.btn-sm {
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  border-radius: var(--radius-sm);
  height: 56rpx;
}

/* 禁用态 */
.btn-primary[disabled] {
  background: #FDBA74;
  color: #fff;
}
```

**按钮使用规则**：
- 每个页面最多一个主按钮（btn-primary）
- 底部固定按钮需留 `safe-area-inset-bottom` 的 padding
- 两个操作并排时，主操作走 primary，次要走 outline

### 5.2 卡片 (Card)

```css
.card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 24rpx;
  margin: 0 24rpx 16rpx;
}

/* 可点击卡片 */
.card-clickable:active { background: #f9f9f9; }

/* 带阴影卡片（用于重要信息块） */
.card-elevated {
  composes: card;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.06);
}
```

### 5.3 输入框 (Input)

```css
.form-item {
  margin-bottom: 24rpx;
}
.form-label {
  font-size: 28rpx;
  color: var(--text-primary);
  margin-bottom: 8rpx;
  display: block;
}
.form-label .required::after {
  content: ' *';
  color: var(--color-danger);
}

.form-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 28rpx;
  box-sizing: border-box;
}
.form-input:focus {
  border-color: var(--color-primary);
}

/* error 状态 */
.form-input.error {
  border-color: var(--color-danger);
  background: var(--bg-danger);
}
.form-error-text {
  font-size: 24rpx;
  color: var(--color-danger);
  margin-top: 8rpx;
}
```

### 5.4 标签 (Tag) — 用于状态

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 16rpx;
  border-radius: var(--radius-sm);
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.6;
}

/* 订单状态 */
.tag-pending    { background: #FFFBEB; color: #92400E; }
.tag-accepted   { background: #EFF6FF; color: #1E40AF; }
.tag-inprogress { background: #EFF6FF; color: #1E40AF; }
.tag-completed  { background: #F0FDF4; color: #166534; }
.tag-cancelled  { background: #FEF2F2; color: #991B1B; }

/* 角色标签 */
.tag-owner  { background: var(--color-primary-light); color: var(--color-primary-dark); }
.tag-feeder { background: #F0F9FF; color: #0369A1; }
```

### 5.5 空状态 (Empty State)

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
  text-align: center;
}
.empty-state-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 24rpx;
  opacity: 0.6;
}
.empty-state-title {
  font-size: 32rpx;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 12rpx;
}
.empty-state-desc {
  font-size: 26rpx;
  color: var(--text-hint);
  margin-bottom: 32rpx;
}
```

### 5.6 骨架屏 (Skeleton)

```css
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
@keyframes skeleton-loading {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-line   { height: 28rpx; margin-bottom: 16rpx; }
.skeleton-title  { height: 36rpx; width: 60%; margin-bottom: 20rpx; }
.skeleton-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; }
.skeleton-card   { height: 160rpx; margin-bottom: 16rpx; border-radius: var(--radius-md); }
```

---

## 6. 图标方案

### 6.1 方案选择

微信小程序原生支持 SVG 有限，推荐用 **iconfont 字体图标**或 **PNG/SVG 图片**。禁止用 emoji 作为功能性图标。

### 6.2 需要的图标清单

| 使用位置 | 图标 | 名称 |
|----------|------|------|
| TabBar | 首页 | icon-home / icon-home-active |
| TabBar | 订单 | icon-order / icon-order-active |
| TabBar | 我的 | icon-mine / icon-mine-active |
| 首页快捷入口 | 我的宠物 | icon-pet |
| 首页快捷入口 | 预约喂养 | icon-booking |
| 首页快捷入口 | 喂养员 | icon-feeder |
| 订单卡片 | 日期 | icon-calendar |
| 订单卡片 | 时段 | icon-clock |
| 订单卡片 | 地址 | icon-location |
| 订单卡片 | 金额 | icon-price |
| 宠物信息 | 品种/体重/年龄 | icon-paw / icon-weight / icon-age |
| 喂养员详情 | 评分 | icon-star / icon-star-fill |
| 喂养员详情 | 接单数 | icon-order-count |
| 通用 | 空状态 | icon-empty |
| 通用 | 返回 | icon-back |
| 通用 | 更多 | icon-more |
| 通用 | 关闭 | icon-close |

### 6.3 图标尺寸规范

| 场景 | 尺寸 |
|------|------|
| TabBar 图标 | 40rpx × 40rpx (PNG, 81px@3x) |
| 列表行内图标 | 32rpx × 32rpx |
| 卡片内图标 | 36rpx-40rpx |
| 空状态插图 | 200rpx × 200rpx |

### 6.4 图标图片准备清单

需要在 `images/icons/` 目录下准备（81px × 81px，PNG 格式）：

```
images/icons/
├── tab-home.png
├── tab-home-active.png
├── tab-order.png
├── tab-order-active.png
├── tab-mine.png
├── tab-mine-active.png
├── pet.png
├── booking.png
├── feeder.png
├── calendar.png
├── clock.png
├── location.png
├── price.png
├── star.png
├── star-fill.png
├── empty.png
```

---

## 7. 页面布局规范

### 7.1 通用页面结构

```
┌──────────────────────────────┐
│  导航栏 (Navigation Bar)      │  系统自带，设置标题
├──────────────────────────────┤
│                              │
│  页面内容区域                  │  padding-top: 24rpx
│  (scroll-view 包裹)           │
│                              │
│  ┌─ 卡片 / 列表 / 表单 ─┐    │  margin: 0 24rpx
│  │                        │    │
│  └────────────────────────┘    │
│                              │
├──────────────────────────────┤
│  底部固定操作区               │  需加 safe-area-inset-bottom
│  [主按钮]                    │
└──────────────────────────────┘
```

### 7.2 首页布局

```
┌──────────────────────────────┐
│  Header: 用户头像 + 问候语     │  渐变背景，padding: 48rpx 24rpx
├──────────────────────────────┤
│  快捷入口 (Grid 3列)          │  3个图标入口，点击跳转
├──────────────────────────────┤
│  分区标题: "推荐喂养员"        │  28rpx, bold, padding
├──────────────────────────────┤
│  喂养员卡片列表 (横向滑动)     │  卡片: 头像+姓名+评分+标签
├──────────────────────────────┤
│  分区标题: "最新订单"          │
├──────────────────────────────┤
│  订单卡片 (2条)               │  状态标签 + 宠物名 + 日期
└──────────────────────────────┘
```

### 7.3 列表页通用布局

```
┌──────────────────────────────┐
│  筛选 Tab (可选)              │  PENDING / ACCEPTED / COMPLETED
├──────────────────────────────┤
│  列表卡片 1                   │
├──────────────────────────────┤
│  列表卡片 2                   │
├──────────────────────────────┤
│  ...                         │
├──────────────────────────────┤
│  空状态 (列表为空时)           │
└──────────────────────────────┘
```

### 7.4 表单页通用布局

```
┌──────────────────────────────┐
│  分组标题 (可选): "基本信息"    │
├──────────────────────────────┤
│  表单项 1                     │  标签在上，输入框在下
│  表单项 2                     │
│  ...                         │
├──────────────────────────────┤
│  预览区 (可选)                │  宠物信息预览卡片
├──────────────────────────────┤
│  [提交按钮]                   │  底部固定
└──────────────────────────────┘
```

### 7.5 详情页通用布局

```
┌──────────────────────────────┐
│  状态横幅 (带颜色)            │  "待接单" → 橙色背景
├──────────────────────────────┤
│  信息卡片组                   │
│  ┌─ 宠物信息 ──────────┐    │
│  ├─ 喂养员信息 ────────┤    │
│  ├─ 服务详情 ──────────┤    │
│  └──────────────────────┘    │
├──────────────────────────────┤
│  操作按钮区                   │  底部固定
└──────────────────────────────┘
```

---

## 8. TabBar 规范

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#F97316",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/icons/tab-home.png",
        "selectedIconPath": "images/icons/tab-home-active.png"
      },
      {
        "pagePath": "pages/orders/list",
        "text": "订单",
        "iconPath": "images/icons/tab-order.png",
        "selectedIconPath": "images/icons/tab-order-active.png"
      },
      {
        "pagePath": "pages/mine/index",
        "text": "我的",
        "iconPath": "images/icons/tab-mine.png",
        "selectedIconPath": "images/icons/tab-mine-active.png"
      }
    ]
  }
}
```

---

## 9. 角色主题（渐进式）

不同角色在特定区域可以有不同的微主题色，但主色调不变。这比目前的全局角色切换更克制。

| 区域 | OWNER | FEEDER |
|------|-------|--------|
| 首页 Header 强调色 | 暖橙 | 天蓝 |
| "我的"页面头像框 | 暖橙边框 | 天蓝边框 |
| 角色标签 | 橙底白字 | 蓝底白字 |

**原则**：角色色`仅用于点缀`，不改变按钮、卡片、输入框等核心组件的颜色。

---

## 10. 安全区域适配

所有固定底部的按钮需要适配 iPhone X 及以上机型：

```css
.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 11. 页面导航标题

每个页面单独设置标题，不使用全局默认值：

| 页面 | 标题 |
|------|------|
| 首页 | 宠物喂养 |
| 订单列表 | 我的订单 |
| 订单详情 | 订单详情 |
| 创建订单 | 预约喂养 |
| 我的 | 个人中心 |
| 宠物列表 | 我的宠物 |
| 添加宠物 | 添加宠物 |
| 喂养员列表 | 喂养员 |
| 喂养员详情 | 喂养员详情 |
| 创建评价 | 写评价 |
| 申请喂养员 | 申请喂养员 |

---

## 12. 改版优先级

| 优先级 | 内容 | 影响范围 |
|--------|------|----------|
| P0 | TabBar 图标 + 配色变量替换 + 评价页重做 | 全局 + reviews/create |
| P1 | 统一按钮/卡片/输入框组件样式 | app.wxss + 所有页面 |
| P2 | 安全区适配 + 骨架屏 + 空状态 | 全局 |
| P3 | 页面导航标题 + 图标系统替换 emoji | 逐页 |
| P4 | 角色主题微调 | index / mine |
