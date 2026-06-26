---
name: miniapp-dev
description: 微信小程序开发规范 — 页面结构、数据绑定、API 调用模式等
---

# 微信小程序开发规范

本项目是原生微信小程序，不依赖任何第三方 UI 框架或 npm 包。

⚠️ **后端在 `D:\Workspace\pet-feeding-admin\backend`** — 此项目和 admin 后台共用后端。

## 页面文件结构

每个页面由 4 个文件组成：
- `<name>.js` — Page 逻辑
- `<name>.wxml` — 视图模板
- `<name>.wxss` — 页面样式
- `<name>.json` — 页面配置（按需）

## 数据请求模式

所有 API 调用必须通过 `utils/` 模块：

```js
// ✅ 正确 — 通过 api.js 调用
const { petApi } = require('../../utils/api')
petApi.list().then(res => {
  this.setData({ pets: res.data || [] })
}).catch(() => {
  this.setData({ error: '加载失败' })
})

// ❌ 错误 — 直接 wx.request
```

## API 模块注册

在 `utils/api.js` 中新增 API 时：
1. 确认后端 Controller 路径是否存在
2. 使用 `http.get/post/put/del` 封装
3. 后端对应代码在 `pet-feeding-admin\backend\...\module\miniapp\controller\`

## 页面生命周期

- `onShow()` — 每次页面显示时触发，适合刷新数据
- `onLoad(options)` — 页面首次加载，接收路由参数
- `onPullDownRefresh()` — 下拉刷新（需在 json 中配置 `enablePullDownRefresh: true`）

## 数据绑定规范

- 使用 `this.setData()` 更新视图数据
- 列表数据始终设默认值 `[]` 防止 undefined 错误
- loading/error 状态要同步管理：

```js
this.setData({ loading: true, error: '' })
api.list().then(res => {
  this.setData({ items: res.data || [], loading: false })
}).catch(() => {
  this.setData({ loading: false, error: '加载失败' })
})
```

## 导航规范

- Tab 页面间跳转：`wx.switchTab({ url: '/pages/xxx/xxx' })`
- 非 Tab 页面：`wx.navigateTo({ url: '/pages/xxx/xxx?id=' + id })`
- 带参数的页面用 `onLoad(options)` 接收

## 角色判断

```js
const user = wx.getStorageSync('userInfo') || {}
const role = user.role || 'OWNER'  // 'OWNER' | 'FEEDER'
```

## WXML 条件渲染

```xml
<!-- 按角色显示 -->
<view wx:if="{{role === 'FEEDER'}}">喂养员专属内容</view>

<!-- 空数据占位 -->
<view wx:if="{{items.length === 0}}" class="empty">暂无数据</view>
```

## 样式规范

- 全局样式在 `app.wxss`
- 页面样式使用 rpx 单位（响应式像素）
- 卡片使用 `<view class="card">` 模式，样式定义在各页面的 wxss 中
