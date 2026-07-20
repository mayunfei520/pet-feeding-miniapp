# 订单报价流程改造需求（喂养员报价 → 客户同意）

状态：待后端实现（前端已按此契约改造，需求文档由小程序端出具，供后端对齐实现）
仓库：mayunfei520/pet-feeding-admin（后端）+ 小程序 pet-feeding-miniapp（前端已改）

---

## 1. 背景与现状问题

当前订单流程是「客户自己填金额 → 下单 → 喂养员接单」，价格字段 `price` 由**客户在创建订单时输入**并直接落库，存在两个问题：

1. **定价权错配**：价格本该由提供服务的喂养员报出，现在客户随意填（可填 0 / 负数 / 离谱数），喂养员接单时只能被动接受，没有报价权。
2. **无「报价-确认」协商环节**：状态机 `PENDING → ACCEPTED` 是一步到位，客户没有「看到报价 → 同意/拒绝」的机会。

本次改造目标：改为「客户发需求 → **喂养员报价** → **客户同意/拒绝** → 履约」的标准撮合流程。

---

## 2. 目标流程

```
客户创建需求单 (不选金额)
      │  POST /api/miniapp/orders
      ▼
[PENDING 待报价]  ← 客户发需求，等喂养员报价
      │  PUT .../{id}/quote  (喂养员填报价金额)
      ▼
[QUOTED 已报价待确认]  ← 等待客户确认
      │  PUT .../{id}/confirm (同意)  ──┐
      │  PUT .../{id}/reject  (拒绝)   ──┤ 拒绝则回 PENDING，喂养员可重报
      ▼                                    │
[ACCEPTED 已确认/待服务] ←─────────────┘  (confirm 后)
      │  PUT .../{id}/start (喂养员开始)
      ▼
[IN_PROGRESS 服务中]
      │  PUT .../{id}/complete (客户确认完成)
      ▼
[COMPLETED 已完成]  → 客户可评价
```

取消：客户在 `PENDING` 或 `QUOTED` 状态可 `cancel` → `CANCELLED`。

---

## 3. 状态机定义（枚举值，前后端统一）

| 状态值 | 中文 | 含义 | 进入动作触发者 |
|---|---|---|---|
| `PENDING` | 待报价 | 客户已发需求，等待喂养员报价 | 客户创建订单 |
| `QUOTED` | 已报价待确认 | 喂养员已报价，等待客户同意/拒绝 | 喂养员 quote |
| `ACCEPTED` | 已确认/待服务 | 客户已同意报价，等待履约 | 客户 confirm |
| `IN_PROGRESS` | 服务中 | 喂养员已开始服务 | 喂养员 start |
| `COMPLETED` | 已完成 | 客户确认完成 | 客户 complete |
| `CANCELLED` | 已取消 | 订单取消 | 客户 cancel |

> `Order.java` 的 `status` 字段注释需同步更新，新增 `QUOTED` 状态说明。

---

## 4. 角色操作矩阵

| 角色 | 状态 | 允许操作 | 目标状态 |
|---|---|---|---|
| 客户 OWNER | 创建 | 提交需求单（不含金额） | PENDING |
| 喂养员 FEEDER | PENDING | 填报价金额 `quote` | QUOTED |
| 客户 OWNER | QUOTED | `confirm` 同意 | ACCEPTED |
| 客户 OWNER | QUOTED | `reject` 拒绝 | PENDING（喂养员可重报） |
| 喂养员 FEEDER | ACCEPTED | `start` 开始服务 | IN_PROGRESS |
| 客户 OWNER | ACCEPTED | `complete` 确认完成 | COMPLETED |
| 客户 OWNER | PENDING/QUOTED | `cancel` 取消 | CANCELLED |

> 原 `accept`（喂养员接单）接口语义已被 `confirm`（客户同意）取代；**保留 accept 向后兼容、不删除**，新前端不再调用。

---

## 5. 接口契约（前端已按此实现，后端需对齐）

### 5.1 创建订单 `POST /api/miniapp/orders`
请求体（**去掉 price 字段**）：
```json
{
  "petId": 12,
  "feederId": 7,
  "serviceDate": "2026-07-25",
  "servicePeriod": "AM",
  "address": "北京市朝阳区xxx",
  "notes": "猫较怕生"
}
```
后端处理：
- 校验宠物 `status == APPROVED`（沿用现有预约防护）
- `price` 置 `null`
- `status = "PENDING"`
- 返回完整订单（含 `id`、`orderNo`、`status`）

### 5.2 喂养员报价 `PUT /api/miniapp/orders/{id}/quote`
请求体：
```json
{ "price": 88.00 }
```
后端处理：
- 校验订单存在且 `status == "PENDING"`
- 校验 `price`（BigDecimal）> 0，否则抛 `BusinessException("报价金额必须大于0")`
- 写入 `order.price`，`status = "QUOTED"`
- 可选：发短信/通知客户「喂养员已报价」

### 5.3 客户同意 `PUT /api/miniapp/orders/{id}/confirm`
后端处理：
- 校验订单存在且 `status == "QUOTED"`
- 校验 `order.ownerId == 当前登录用户 id`（防越权）
- `status = "ACCEPTED"`

### 5.4 客户拒绝 `PUT /api/miniapp/orders/{id}/reject`
后端处理：
- 校验订单存在且 `status == "QUOTED"`
- 校验 `order.ownerId == 当前登录用户 id`
- `status = "PENDING"`（保留 `price` 历史，喂养员可再次 quote 覆盖）

### 5.5 取消 `PUT /api/miniapp/orders/{id}/cancel`
现有逻辑「仅 PENDING 可取消」**扩展为 PENDING / QUOTED 均可取消** → `CANCELLED`。
其余 `start` / `complete` 保持不变。

---

## 6. 字段归属变更

| 字段 | 原归属 | 新归属 |
|---|---|---|
| `price` | 客户创建时填 | **喂养员 quote 时写**；创建时为空 |

`Order.java` 实体无需新增字段，复用现有 `BigDecimal price`。

---

## 7. 验收标准

1. 客户创建订单**不传 price** → 订单 `status=PENDING`，`price=null` ✅
2. 喂养员对 PENDING 单 `quote(88)` → `status=QUOTED`，`price=88` ✅
3. `quote(0)` 或 `quote(-5)` → 拒绝，提示「报价金额必须大于0」✅
4. 客户对 QUOTED 单 `confirm` → `status=ACCEPTED` ✅
5. 客户对 QUOTED 单 `reject` → `status=PENDING`，price 保留 ✅
6. 非订单主人调 `confirm`/`reject` → 403/业务错误拒绝 ✅
7. 对 PENDING/QUOTED 单 `cancel` → `CANCELLED`；对 ACCEPTED 单 `cancel` → 拒绝 ✅
8. 直接用 curl 绕过前端，上述校验同样生效（后端为唯一可信兜底）✅

---

## 8. 前端已改动清单（供后端知悉，便于联调）

- `pages/orders/create`：移除金额输入框，提交不再带 `price`
- `utils/api.js`：`orderApi` 新增 `quote(id, {price})` / `confirm(id)` / `reject(id)`
- `pages/orders/detail`：喂养员 PENDING 显示「填报价」入口；客户 QUOTED 显示「同意/拒绝」
- `pages/orders/list`：新增 `QUOTED` 状态文案与配色、对应列表操作按钮

> 前端改动已提交小程序仓库 master，待后端按本契约实现并部署后即可联调。
