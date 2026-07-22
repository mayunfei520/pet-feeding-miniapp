# 即时聊天（IM）模块需求（客户 ↔ 喂养员沟通）

状态：待后端实现（前端已出具接口契约；前端聊天页骨架开发中）
仓库：mayunfei520/pet-feeding-admin（后端实现） + 小程序 pet-feeding-miniapp（前端实现）
前置：依赖订单报价流程（Issue #4）落地，会话与订单绑定。

---

## 1. 背景

当前客户与喂养员的价格/服务沟通仅靠「报价 → 确认/拒绝」的结构化流程，双方无法自由对话（如客户问「80 能优惠吗」、喂养员回「70 含猫砂」）。为把价格协商从死板的接受/拒绝变成真对话，需新增 IM 模块。

目标：客户与喂养员可就某一笔订单发起会话，发送文字/图片，实时（或准实时）收到对方消息。

---

## 2. 数据模型（建议）

### Conversation（会话，一对一，按订单唯一）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGINT PK | 会话 ID |
| orderId | BIGINT | 关联订单；同一订单 owner+feeder 唯一 |
| ownerId | BIGINT | 宠物主人用户 ID |
| feederId | BIGINT | 喂养员用户 ID |
| lastMessage | VARCHAR | 最后一条消息摘要（列表展示用） |
| lastMessageTime | DATETIME | 最后消息时间（排序/增量用） |
| ownerUnread | INT | 主人未读数 |
| feederUnread | INT | 喂养员未读数 |
| createTime | DATETIME | 创建时间 |

> 唯一约束：`UNIQUE(orderId, ownerId, feederId)`，避免重复会话。

### Message（消息）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGINT PK | 消息 ID（游标分页用） |
| conversationId | BIGINT FK | 所属会话 |
| senderId | BIGINT | 发送者用户 ID |
| senderRole | ENUM | OWNER / FEEDER |
| type | ENUM | TEXT / IMAGE |
| content | VARCHAR/TEXT | 文本或图片 URL |
| createTime | DATETIME | 发送时间 |
| read | BOOLEAN | 对方是否已读 |

---

## 3. 接口契约（前端将按此实现，后端需对齐）

基础前缀：`/api/miniapp`，全部 JWT 鉴权。

### 3.1 获取/创建会话（按订单）
`GET /api/miniapp/conversations/by-order/{orderId}`
- 若该 orderId 的会话不存在，自动创建（owner+feeder，确保双方唯一）。
- 返回 Conversation（含对方信息：昵称/真实姓名、头像、角色、是否认证）。
- 鉴权：仅订单 owner 或 feeder 可访问；否则 403。

### 3.2 会话列表
`GET /api/miniapp/conversations`
- 返回当前用户参与的会话列表，按 `lastMessageTime` 倒序。
- 每项含：`conversationId`、`orderId`、对方信息、`lastMessage`、`lastMessageTime`、`unreadCount`（**当前用户视角**）。
- 可选 `?updatedAfter={ISO时间}`：仅返回该时间后有更新的会话（供轮询增量）。

### 3.3 拉消息（游标分页）
`GET /api/miniapp/conversations/{id}/messages?cursor={messageId}&size=20`
- `cursor` 为空：取最新一页（最新 `size` 条）。
- `cursor` 有值：取比该消息更早的历史（向上翻页）。
- 返回：`{ messages: [...], hasMore: bool }`，按时间正序。
- 鉴权：仅会话双方。

### 3.4 发消息
`POST /api/miniapp/messages`
请求体：
```json
{ "conversationId": 12, "type": "TEXT", "content": "80 能优惠点吗？" }
```
后端处理：
- 校验 `senderId == 当前登录用户` 且当前用户在会话中（防伪造/越权）。
- 落库 Message（`read=false`）。
- 更新 `Conversation.lastMessage / lastMessageTime`，并**对对方未读 +1**（owner 发 → `feederUnread+1`；feeder 发 → `ownerUnread+1`）。
- 返回完整 Message。
- （可选）触发对方离线通知：订阅消息 / 模板消息「您有一条新消息」。

### 3.5 标记已读
`PUT /api/miniapp/conversations/{id}/read`
- 将**当前用户视角**的未读清零（owner 清 `ownerUnread` / feeder 清 `feederUnread`）。
- 返回更新后的 `unreadCount`。

### 3.6 实时通道（推荐轮询）
- 前端定时（5–10s）轮询 `GET /api/miniapp/conversations?updatedAfter={本地最新时间}` 拉新消息/未读数。
- 后续可升级 WebSocket（`/ws/miniapp`，需签名 token）。
- 离线通知走订阅消息 / 模板消息，不依赖长连接。

### 3.7 图片上传（如需要）
- 复用现有资源上传接口（如有），或新增 `POST /api/miniapp/upload` 返回 URL；`type=IMAGE` 时 `content` 存该 URL。

---

## 4. 鉴权与越权防护（后端为唯一可信兜底）

- 所有接口 JWT 鉴权；`senderId` 强制取当前登录用户，禁止前端传入。
- 仅会话双方可读写；非会话方访问 / 给非自己会话发消息 → 403。
- 图片上传校验大小/类型。
- curl 直测上述校验同样生效。

---

## 5. 验收标准

1. 订单双方通过 `by-order` 进入**同一**会话（不重复创建）。✅
2. 发 TEXT/IMAGE 落库，对方未读 +1，列表 `lastMessage` 更新。✅
3. 拉消息游标分页正确，`hasMore` 准确。✅
4. `read` 后当前用户未读清零，列表 `unreadCount` 归零。✅
5. 越权（非会话方发消息/读消息）被拒。✅
6. 轮询 `updatedAfter` 能拿到增量会话/未读。✅
7. curl 直测上述校验同样生效（后端唯一兜底）。✅

---

## 6. 前端实现说明（供联调）

- 页面：`pages/chat/list`（会话列表）、`pages/chat/detail`（会话详情）。
- 组件：`msg-bubble`（气泡）、`chat-input`（输入栏）、`conversation-item`（列表项）。
- api：`chatApi.conversations()` / `byOrder(orderId)` / `messages(id, cursor)` / `send(data)` / `read(id)`。
- 入口：① 订单详情页「联系喂养员」按钮（带 `orderId`）；② 首页「消息」入口（带未读红点）。
- 视觉：复用全局暖色体系（奶油底 `#FFF8F1`、暖橙 `#F97316`、圆角 token），气泡左=对方白底、右=自己暖橙底。
- 当前为骨架阶段，待后端按本契约实现并部署后联调。
