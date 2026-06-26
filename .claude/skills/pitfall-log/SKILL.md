---
name: pitfall-log
description: 项目开发踩坑日志 — 记录踩过的坑、原因和解决方案，避免重复犯错
---

# 宠物喂养平台 — 踩坑日志

记录开发过程中遇到的坑，每次踩坑后更新此文件。

## 格式

```markdown
### YYYY-MM-DD: 标题

**现象**：发生了什么
**原因**：为什么会发生
**解决**：怎么修的
**教训**：以后怎么写代码避免
```

---

### 2026-06-26: MiniAppPetController 演示模式/token 无效时 500 错误

**现象**：小程序"我的宠物"页面提示"加载失败，下拉刷新重试"。后端返回 500（服务器内部错误）。其他小程序 API（如 `/api/miniapp/feeders`）正常。

**原因**：`MiniAppPetController` 所有方法的 `@RequestHeader("Authorization")` 是必传参数（默认 `required = true`），且 `getUserId()` 方法对无效 token（如演示模式的 `demo-token`）直接抛 NullPointerException 或 JWT 解析异常。小程序在演示模式下 token 为 `demo-token`，解析失败。

对比 `MiniAppFeederController.list()` 和 `/api/miniapp/feeders/{id}/reviews` 不需要 token，所以正常。

**解决**：
1. `@RequestHeader` 改为 `required = false`
2. 新增 `getUserIdOrNull()` 方法，返回 null 时做兼容处理
3. GET：无 token → 返回所有宠物（不是报错）
4. POST/PUT/DELETE：无 token → 默认用户 ID=1（演示模式兜底）

修改文件：`MiniAppPetController.java`
提交：`fix: MiniAppPetController 无token/演示模式兼容处理`

**教训**：
- 小程序端的 API Controller 应该**兼容演示模式**（token 可能无效）
- `@RequestHeader` 要设置 `required = false`，并从 `getUserIdOrNull()` 方法中优雅处理 null
- **同类的其他 Controller 也要检查**：`MiniAppOrderController`、`MiniAppReviewController`、`MiniAppFeederController` 是否也有同样的问题
- ⚠️ **待处理**：`MiniAppOrderController`(list/create/accept/complete/cancel)、`MiniAppReviewController`(create)、`MiniAppFeederController`(apply) 中 `@RequestHeader("Authorization")` 仍然是 `required=true`，演示模式下也会 500

---

### 2026-06-26: 管理后台前端端口不通

**现象**：浏览器打开 `http://localhost:5173` 提示"无法访问此页面"。

**原因**：后端 `:8080` 已启动但前端 `:5173` 还没启。管理后台是前后端分离的，Vite 前端需要单独 `npm run dev`。

**解决**：`cd frontend && npm run dev` 启动 Vite 开发服务器。

**教训**：这个项目有三个组成部分，要依次启动：
1. 后端：`mvn spring-boot:run`（端口 8080）
2. 前端：`npm run dev`（端口 5173）
3. 小程序：微信开发者工具打开 miniapp 目录
缺一个都不行，不要把 "后端启动了" 当成 "整个后台都能用了"。

---

### 2026-06-26: GitHub HTTPS 推送超时，SSH 正常

**现象**：`git push origin master` 用 HTTPS 协议连不上 GitHub，报 `Failed to connect to github.com port 443`。

**原因**：国内网络环境 HTTPS 直连 github.com 不稳定。

**解决**：切换为 SSH 协议：
```bash
git remote set-url origin git@github.com:mayunfei520/pet-feeding-miniapp.git
```

**教训**：这个项目统一用 SSH（`git@github.com:` 开头），不要用 HTTPS（`https://github.com/` 开头）。clone 时也用 SSH。

---

### 2026-06-26: `project.private.config.json` 含敏感信息被提交

**现象**：miniapp 的 `project.private.config.json` 包含本地微信开发者工具的个人配置，不应公开。

**原因**：该文件通常包含本地路径、appid 等个人信息。

**解决**：在 `.gitignore` 中添加 `project.private.config.json`。

**教训**：微信小程序项目有两个配置文件：
- `project.config.json` → ✅ 应提交（项目级配置）
- `project.private.config.json` → ❌ 不应提交（个人私有配置）
