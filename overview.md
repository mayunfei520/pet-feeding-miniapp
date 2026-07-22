# IM 即时聊天模块 — 交付说明

> 日期：2026-07-22 ｜ 提交：`752e9c3` ｜ 后端 Issue：[#9](https://github.com/mayunfei520/pet-feeding-admin/issues/9)
> 角色边界：前端骨架由本 Agent 搭建；后端接口由后端按契约实现（Issue #9 + `docs/BACKEND-CHAT-IM-REQ.md`）。

## 1. 做了什么

为「客户 ↔ 喂养员沟通价格/服务」新增 IM 聊天能力（用户确认方案：即时聊天，非结构化报价-接受/拒绝）。

- 聊天界面草图（设计稿）已随方案给出：左=喂养员白底气泡、右=客户暖橙底气泡、底部输入栏，暖色体系对齐全站。
- 前端 4 个页面/模块骨架已落地，沿用全局暖色 token（奶油底 `#FFF8F1`、暖橙 `#F97316`、圆角 `--r-*`），无视觉碎片化。
- 后端接口契约已出具并开 Issue #9，前后端按此联调。

## 2. 前端文件清单

| 文件 | 作用 |
|---|---|
| `pages/chat/list/list.{js,wxml,wxss,json}` | 会话列表：对方首字头像/昵称、最后消息、时间、未读红点、空态、骨架屏 |
| `pages/chat/detail/detail.{js,wxml,wxss,json}` | 会话详情：消息气泡（左白/右橙）、发送中/失败重发、图片占位、输入栏；8s 轮询拉增量、进页标记已读 |
| `utils/api.js` | 新增 `chatApi`：`conversations()` / `byOrder(id)` / `messages(id, cursor)` / `send(data)` / `read(id)` |
| `app.json` | 注册 `pages/chat/list` 与 `pages/chat/detail` |
| `pages/index/index.js` | 首页 `quickActions` 加「消息」入口（OWNER / FEEDER） |
| `pages/orders/detail/detail.{js,wxml}` | 订单详情加「联系喂养员」按钮（有 feederId 且未取消 → 跳会话） |
| `docs/BACKEND-CHAT-IM-REQ.md` | 后端接口契约文档（数据模型 + 5 接口 + 验收） |

## 3. 后端需实现（Issue #9，待合入）

1. `GET /api/miniapp/conversations/by-order/{orderId}` — 按订单获取/自动创建会话
2. `GET /api/miniapp/conversations` — 会话列表（含对方信息、最后消息、未读数）
3. `GET /api/miniapp/conversations/{id}/messages?cursor=` — 游标分页拉消息
4. `POST /api/miniapp/messages` — 发消息（落库 + 对方未读 +1）
5. `PUT /api/miniapp/conversations/{id}/read` — 标记已读
6. 实时：轮询优先（`updatedAfter` 增量）；离线走订阅消息/模板消息
7. 越权防护：仅会话双方可读写，发送者强制取当前登录用户

## 4. 当前状态与限制

- ⚠️ **后端未合入前，前端跑不通**：`chatApi` 调用会 404，列表/会话页为空态或报错降级。
- 首期范围：文字 + 图片消息；语音/更多富媒体后续增强。
- 实时方案：先用 8s 轮询（小程序最稳），后期可升级 WebSocket。

## 5. 下一步

1. 后端按 Issue #9 + 契约文档实现并部署。
2. 联调：前端在开发者工具中验证列表加载、发消息、未读红点、已读清零、轮询增量。
3. （可选）把「消息」做成独立 Tab（需补 tab 图标 png）；当前走首页入口。
