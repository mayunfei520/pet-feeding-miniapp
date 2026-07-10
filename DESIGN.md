# DESIGN.md — 毛茸茸暖屋 · 宠物上门喂养小程序设计系统

> 设计哲学：像把毛孩子交到邻居手里一样安心。整体走「奶油暖屋」风——奶油底色 + 暖橙主色 + 暖调柔光阴影，圆角更大更软，文案像朋友说话。参考基调：**Airbnb（温暖/信任/有人情味）** 为主，**Stripe（组件纪律/间距克制）** 为骨，**Apple（排版清晰/系统字）** 为皮。

---

## 1. Visual Theme & Atmosphere（视觉主题与氛围）

- **品牌设计哲学**：上门喂养是「把家人暂时托付给陌生人」的信任生意。设计要用温度抵消焦虑——让人一打开就觉得「这家靠谱又亲切」。
- **视觉基调**：温暖、柔软、有人情味；像晒过太阳的棉被，不像冷冰冰的工具软件。
- **核心视觉特征关键词**：`奶油感` · `暖橙` · `圆润` · `柔光` · `熟人感`
- **光影与质感倾向**：轻量毛玻璃 + 大圆角卡片 + 暖橙 tint 的柔和投影（拒绝纯黑硬阴影）；点缀用 emoji 当插画（宠物/爱心/太阳），而非冷图标。

---

## 2. Color Palette & Roles（调色板与角色）

| 角色 | HEX | CSS 变量 | 使用场景 |
|------|-----|-----------|----------|
| 页面奶油底 | `#FFF8F1` | `--wf-cream` | 所有页面背景（替代冷灰 #F5F5F5） |
| 次表面暖白 | `#FFFBF7` | `--wf-surface-alt` | 分区、浮层底 |
| 卡片纯白 | `#FFFFFF` | `--wf-surface` | 卡片、弹窗主体 |
| 主色 暖橙 | `#F97316` | `--wf-orange` | 主按钮、关键数字、选中态 |
| 主色 浅 | `#FB923C` | `--wf-orange-light` | 渐变高光、hover |
| 主色 深 | `#EA580C` | `--wf-orange-deep` | 按压态、强调文字 |
| 主色 tint | `#FFF7ED` | `--wf-orange-tint` | 标签底、提示块、轻背景 |
| 蜜桃 | `#FFEDD5` | `--wf-peach` | 渐变柔和收尾 |
| 暖绿（健康/信任） | `#34D399` / `#059669` | `--wf-green` | 宠物头像、健康/完成态 |
| 暖墨（正文） | `#2B2420` | `--wf-ink` | 主文字（非纯黑，带暖） |
| 暖灰中 | `#4A3F38` | `--wf-ink-mid` | 次要正文 |
| 暖灰弱 | `#8A7F78` | `--wf-ink-muted` | 辅助说明、占位 |
| 暖灰最弱 | `#B8A99C` | `--wf-ink-faint` | 箭头、极弱提示 |
| 描边暖灰 | `#F0E6DC` | `--wf-border` | 输入框、分区描边 |
| 成功 | `#16A34A` / `#DCFCE7` | `--wf-success` | 完成订单、成功提示 |
| 警告 | `#B45309` / `#FEF3C7` | `--wf-warning` | 待处理、注意 |
| 错误 | `#DC2626` / `#FEE2E2` | `--wf-error` | 校验失败、删除 |
| 信息 | `#0369A1` / `#E0F2FE` | `--wf-info` | 链接、说明 |
| 暖调阴影色 | `rgba(249,115,22,x)` | `--wf-shadow` | 所有卡片/按钮投影（橙 tint） |

---

## 3. Typography Rules（排版规则）

- **Font Family**：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- **设计哲学**：用系统字体保证各机型稳定；字重克制（正文 400、标题 500/600），靠**字距微收 + 行高放松**营造呼吸感，不靠粗体喊话。

| 层级 | 字号(rpx) | 字重 | 行高 | 字距 | 用途 |
|------|-----------|------|------|------|------|
| Display | 48 | 600 | 1.3 | -0.5rpx | 首页大标题、欢迎语 |
| H1 | 40 | 600 | 1.35 | 0 | 页面主标题 |
| H2 | 34 | 500 | 1.4 | 0 | 分区标题、卡片标题 |
| H3 | 30 | 500 | 1.45 | 0 | 列表项名、小标题 |
| Body | 28 | 400 | 1.6 | 0 | 正文、说明 |
| Small | 24 | 400 | 1.5 | 0 | 辅助、meta |
| Nano | 22 | 500 | 1.4 | 0.5rpx | 标签、胶囊小字 |

---

## 4. Component Stylings（组件样式）

**Buttons（胶囊化，更软更暖）**
```css
/* Primary — 暖橙渐变 + 柔光 */
.btn-primary {
  background: linear-gradient(135deg, #FB923C, #F97316);
  color: #fff; font-weight: 500;
  border-radius: 9999rpx;            /* 胶囊 */
  padding: 24rpx 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(249,115,22,0.25);
}
.btn-primary:active { background: #EA580C; transform: scale(0.97); }

/* Secondary — 白底暖橙描边 */
.btn-outline {
  background: #fff; color: #F97316;
  border: 2rpx solid #F97316; border-radius: 9999rpx;
}
/* Ghost — 纯文字暖橙 */
.btn-ghost { background: transparent; color: #F97316; }
/* Danger — 暖红 */
.btn-danger { background: #DC2626; color: #fff; border-radius: 9999rpx; }
```

**Cards（大圆角 + 暖调柔光）**
```css
.card {
  background: #FFFFFF;
  border-radius: 28rpx;                         /* 更软 */
  padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(249,115,22,0.08);   /* 暖橙 tint */
  border: 1rpx solid #FFF3E8;                    /* 极淡暖边 */
}
.card:active { transform: scale(0.985); }
```

**Inputs（暖边 + 聚焦发暖光）**
```css
.input {
  height: 92rpx; padding: 0 28rpx;
  background: #FFFFFF;
  border: 2rpx solid #F0E6DC;
  border-radius: 20rpx;
  font-size: 28rpx; color: #2B2420;
}
.input:focus { border-color: #F97316; box-shadow: 0 0 0 4rpx rgba(249,115,22,0.12); }
.input.error { border-color: #DC2626; background: #FEF2F2; }
```

**Navigation（TabBar — 暖橙选中 + 奶油底）**
```css
/* tabBar 配置：color #8A7F78 / selectedColor #F97316 / backgroundColor #FFF8F1 / borderStyle white */
```

**Badges / Tags（圆润胶囊 + 暖 tint）**
```css
.tag { display: inline-block; padding: 6rpx 16rpx; border-radius: 9999rpx; font-size: 22rpx; font-weight: 500; }
.tag-pending { background: #FEF3C7; color: #B45309; }
.tag-done    { background: #DCFCE7; color: #16A34A; }
.tag-owner   { background: #FFF7ED; color: #EA580C; }
```

**Modals / Dialogs（毛玻璃遮罩）**
```css
.mask { background: rgba(43,36,32,0.45); backdrop-filter: blur(8rpx); }
.dialog {
  background: #FFF8F1; border-radius: 32rpx;
  box-shadow: 0 16rpx 40rpx rgba(249,115,22,0.18);
}
```

---

## 5. Layout Principles（布局原则）

- **Spacing System**：基数 `8rpx`，倍数 8 / 16 / 24 / 32 / 48 / 64。留白比之前更松，让人「喘得过气」。
- **Grid System**：快捷入口 4 列；列表单列；横向喂养员卡 `200rpx` 宽可滑动。
- **Container**：页面左右安全边距 `24rpx`；底部安全区 `env(safe-area-inset-bottom)` 必加。
- **Section Spacing**：分区间距 `32rpx`；卡片间距 `16rpx`。
- **留白哲学**：用奶油底色本身当留白，卡片之间不靠线分隔，靠呼吸感分区——像摊开的柔软地毯，不是表格。

---

## 6. Depth & Elevation（深度与层级）

| 层级 | box-shadow | 用途 |
|------|-----------|------|
| shadow-xs | `0 2rpx 8rpx rgba(249,115,22,0.05)` | 输入、轻标签 |
| shadow-sm | `0 4rpx 16rpx rgba(249,115,22,0.08)` | 普通卡片 |
| shadow-md | `0 8rpx 24rpx rgba(249,115,22,0.10)` | 主卡片、头像 |
| shadow-lg | `0 16rpx 40rpx rgba(249,115,22,0.12)` | 弹窗、悬浮 CTA |

- **Surface Layers**：`奶油底 #FFF8F1` → `卡片 #FFFFFF` → `悬浮/弹窗 #FFF8F1+大阴影`。
- **Z-index Scale**：内容 1 / 吸顶头 10 / TabBar 20 / 遮罩 100 / 弹窗 101。
- **Backdrop Effects**：弹窗遮罩 `backdrop-filter: blur(8rpx)`；头图可用轻微 `blur` 毛玻璃。

---

## 7. Do's and Don'ts（设计规范与禁忌）

**Do's**
1. 页面背景一律用奶油 `#FFF8F1`，**禁止**冷灰 `#F5F5F5`。
2. 卡片阴影用**暖橙 tint** `rgba(249,115,22,…)`，**不要**纯黑 `rgba(0,0,0,…)`。
3. 圆角走大：卡片 28rpx、输入 20rpx、按钮/标签 9999rpx 胶囊。
4. 主色只用暖橙家族；次要信息用暖灰 `#8A7F78`，别用冷 `#999`。
5. 文案像朋友：「放心出门，毛孩子有人疼」而非「服务已提交」。
6. 宠物/状态用 emoji 当插画（🐱🐶❤️☀️），亲切且零资源依赖。
7. 空状态给行动指引（「添加第一只毛孩子吧 ➕」），别只丢一句「暂无数据」。

**Don'ts**
1. ❌ 不要冷灰背景 + 黑阴影（回到「工具感」）。
2. ❌ 不要 <12rpx 的硬直角（显得廉价尖锐）。
3. ❌ 不要用 `#EA580C` 以外的红做主错色；删除用暖红 `#DC2626`。
4. ❌ 不要堆砌纯色块，奶油底本身就是设计。
5. ❌ 不要长按态用生硬变色，用 `scale(0.97)` + 微透明更「软」。
6. ❌ 不要把 emoji 和冷线性图标混排（风格打架）。
7. ❌ 不要在首屏放大段说明，信任靠「暖图 + 一句人话」建立。

---

## 8. Responsive Behavior（响应式行为）

- **Breakpoints**：小程序以 `rpx` 自适应（750rpx = 屏宽），无需断点；仅处理**安全区**与**大屏留白**。
- **Touch Targets**：所有可点元素 ≥ `88rpx` 高；胶囊按钮整块可点。
- **折叠策略**：首页快捷入口 4 列固定；喂养员卡横向滑动不换行；分区标题 `查看全部 ›` 右对齐收口。
- **Font Scaling**：字号用 rpx 随屏缩放；Display 在窄屏降一档（40rpx）防溢出。
- **安全区**：`.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }` 所有含底部 CTA 的页必挂。

---

## 9. Agent Prompt Guide（AI 代理提示指南）

**Quick Reference**
```
品牌=毛茸茸暖屋(宠物上门喂养) · 底色=奶油#FFF8F1 · 主色=暖橙#F97316
阴影=暖橙tint rgba(249,115,22,…) · 圆角=卡片28/输入20/胶囊9999
字体=PingFang SC系统栈 · 文案=朋友口吻让人安心 · 图标=emoji当插画
```

**Component Prompts（可直接复制）**
1. 「按 DESIGN.md 生成一个宠物卡片组件，奶油底、白卡 28rpx 圆角、暖橙 tint 柔光、左侧圆形 emoji 头像、右侧名字+品种+年龄，按压 scale(0.985)。」
2. 「生成一个暖橙渐变胶囊主按钮，文案『预约喂养』，底部带柔光阴影，按压变深。」
3. 「生成首页 hero 区：奶油底 +  peach→orange 渐变卡片，圆角 28rpx，一句暖文案『放心出门，毛孩子有人疼』+ 4 个快捷入口。」
4. 「生成空状态组件：大 emoji（🐾）、暖灰标题、行动按钮『添加第一只毛孩子吧 ➕』。」
5. 「把现有冷灰页面背景改为奶油 #FFF8F1，卡片阴影改为 rgba(249,115,22,0.08)，圆角放大到 28rpx。」

**Iteration Guide**
1. 先定底色与阴影 tint，再动组件——底色错了全盘冷。
2. 暖感 80% 来自「奶油底 + 暖橙 tint 阴影」，先改这两项看效果。
3. 圆角一次放大到位（卡片 28、输入 20），别小步试探。
4. emoji 当图标时，统一用同字号、同对齐，避免像故障。
5. 文案改一版「人话」：把「提交成功」换成「搞定，出门放心啦 🐾」。
6. 所有页面背景必须统一奶油，否则像拼贴。
7. 按压态用 transform + 透明度，别用突兀变色。
8. 大屏（iPad）加 `max-width` 居中，避免卡片被拉成面条。
9. 每次改动后，在微信开发者工具里点一遍主流程（登录→加宠物→下单→看喂养员），确认暖感连贯。
10. 真机预览看阴影 tint 是否过浓——暖橙阴影浓度比黑阴影要更淡才显干净。
