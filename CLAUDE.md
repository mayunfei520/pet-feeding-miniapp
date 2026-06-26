# 宠物喂养微信小程序 (pet-feeding-miniapp)

## 项目概述

一个微信小程序宠物喂养平台，支持宠物主人预约喂养员上门喂养宠物。包含宠物管理、喂养员浏览、订单创建与管理、评价等功能。

**AppID**: `wxf385de0f1540fcc6`

## 关联项目

⚠️ **本项目与 `D:\Workspace\pet-feeding-admin` 共用同一个后端。**

```
pet-feeding-admin/backend   ← 共享后端 (Spring Boot :8080)
        ▲
        ├── pet-feeding-miniapp    ← 本小程序 (微信开发者工具)
        └── pet-feeding-admin/frontend  ← 管理后台 (Vue 3 :5173)
```

- **后端代码**: `D:\Workspace\pet-feeding-admin\backend\` — 所有 API 在此修改
- **管理后台前端**: `D:\Workspace\pet-feeding-admin\frontend\` — Vue 3 + Vite + Element Plus
- **数据库 schema**: `pet-feeding-admin\backend\src\main\resources\db\schema.sql`

当修改 API 接口时，需要同时更新两个项目：
1. 后端 Controller（admin/backend）
2. 本项目的 `utils/api.js`

## 技术架构

- **类型**: 原生微信小程序 (无第三方框架)
- **语言**: JavaScript (ES6)
- **基础库版本**: 3.16.2
- **后端 API**: `http://localhost:8080` (与 admin 共享的 Spring Boot 后端)
- **认证方式**: 微信 `wx.login()` → 后端 `POST /api/miniapp/auth/login` 返回 JWT → 存储 `wx.setStorageSync('token', token)` → API 请求通过 `Authorization: Bearer <token>` 头

## 后端 API 架构

后端有两条路径：
| 路径前缀 | 受众 | SecurityConfig 策略 |
|----------|------|---------------------|
| `/api/miniapp/*` | 小程序 | GET 公开，POST/PUT/DELETE 需 JWT |
| `/api/*` (non-miniapp) | 管理后台 | 全部需认证（login/register 除外）|

小程序相关的后端代码在：
- `pet-feeding-admin\backend\...\module\miniapp\controller\` — 5 个小程序控制器
- `pet-feeding-admin\backend\...\security\config\SecurityConfig.java` — 安全规则

## 项目结构

```
/
├── app.js              # 全局 App 入口，globalData(baseUrl, token, userInfo)
├── app.json            # 页面注册、window/tabBar 配置
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 站点地图
├── utils/
│   ├── api.js          # API 模块 (authApi, petApi, feederApi, orderApi, reviewApi)
│   └── request.js      # wx.request 封装，自动带 token，统一错误处理
└── pages/
    ├── index/          # 🏠 首页 (Tab) — Banner 轮播、快捷入口、推荐喂养员
    ├── orders/
    │   ├── list/       # 📋 订单列表 (Tab) — 全部/待接单/已完成筛选
    │   ├── create/     # 创建订单 — 选择宠物、喂养员、日期、时段
    │   └── detail/     # 订单详情
    ├── mine/           # 👤 我的 (Tab) — 用户信息、菜单、角色切换、退出
    ├── pets/
    │   ├── list/       # 宠物列表 — 支持下拉刷新
    │   └── add/        # 添加/编辑宠物
    ├── feeders/
    │   ├── list/       # 喂养员列表
    │   └── detail/     # 喂养员详情 + 评价列表
    ├── reviews/
    │   └── create/     # 创建评价
    └── feeder/
        └── apply/      # 喂养员认证申请
```

## 角色系统

- **OWNER** (宠物主人): 管理宠物、创建订单、查看订单、评价喂养员
- **FEEDER** (喂养员): 查看接单列表、申请认证

角色切换通过"我的"页面的 `switchRole()` 实现，存储在 `wx.setStorageSync('userInfo')`

## API 接口（对应后端 MiniApp*Controller）

| 模块 | 方法 | 接口 | 后端 Controller | 说明 |
|------|------|------|-----------------|------|
| auth | POST | `/api/miniapp/auth/login` | MiniAppAuthController | 登录 (code + role) |
| pet | GET/POST/PUT/DELETE | `/api/miniapp/pets[/:id]` | MiniAppPetController | 宠物 CRUD |
| feeder | GET | `/api/miniapp/feeders` | MiniAppFeederController | 喂养员列表 |
| feeder | GET | `/api/miniapp/feeders/:id/reviews` | MiniAppFeederController | 喂养员评价 |
| feeder | POST | `/api/miniapp/feeders` | MiniAppFeederController | 申请成为喂养员 |
| order | GET | `/api/miniapp/orders` | MiniAppOrderController | 订单列表 |
| order | POST | `/api/miniapp/orders` | MiniAppOrderController | 创建订单 |
| order | PUT | `/api/miniapp/orders/:id/accept` | MiniAppOrderController | 接单 |
| order | PUT | `/api/miniapp/orders/:id/complete` | MiniAppOrderController | 完成订单 |
| order | PUT | `/api/miniapp/orders/:id/cancel` | MiniAppOrderController | 取消订单 |
| review | POST | `/api/miniapp/reviews` | MiniAppReviewController | 创建评价 |
| review | GET | `/api/miniapp/reviews/feeder/:id` | MiniAppReviewController | 喂养员的评价 |

## 数据模型

### 订单状态
- `PENDING` → `ACCEPTED` → `COMPLETED`
- `PENDING` → `CANCELLED`
- `ACCEPTED` → `CANCELLED`

### 服务时段 (servicePeriod)
- `AM`: 上午, `PM`: 下午, `EVENING`: 晚上

## 开发注意事项

- 所有 API 请求通过 `utils/request.js` 统一处理，自动带 token
- token 获取：`wx.getStorageSync('token')`
- 用户信息获取：`wx.getStorageSync('userInfo')`
- 演示模式：API 失败时兜底 token = `'demo-token'`（后端未启动时用）
- 每个 Page 独立加载依赖 (`require('../../utils/api')`) — 无全局注入
- 页面间导航统一用 `wx.navigateTo`，tab 页用 `wx.switchTab`
- 小程序无 `npm` 依赖，所有功能原生实现
- **修改 API 时务必同步检查后端 Controller 是否匹配**
