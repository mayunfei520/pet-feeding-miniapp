# 后端需求：微信支付 · 平台托管资金流

> 关联前端：宠物上门喂养小程序（pet-feeding-miniapp）
> 关联后端 Issue：#10
> 状态：待后端实现
> 作者：前端 Agent（UI Designer）
> 日期：2026-07-22

---

## 0. 背景与决策

产品已确认支付模式为 **平台托管（Escrow）**：客户在「确认报价」时预付全款到 **平台微信支付商户号**，资金由平台冻结；服务完成且客户评价后，平台将款项（可扣平台服务费）分账/打款给喂养员；取消或纠纷则原路退款。

当前前端订单状态机已到 `COMPLETED` 结束，**完全没有支付代码**（无 `wx.requestPayment`、无 pay 页面、无支付接口）。本文件定义后端需补齐的能力，供后端照实现，前端据此接入。

> 支付渠道唯一现实选择为 **微信支付·小程序支付（JSAPI）**：后端用商户号调微信统一下单换取 `prepay_id`，前端用 `wx.requestPayment` 拉起收银台。

---

## 1. 资金流时序

```
客户                      小程序前端                    后端 /pay                  微信支付
  |                           |                            |                         |
  |-- 确认报价(doConfirm) -->|                            |                         |
  |                           |-- POST /orders/{id}/pay -->|                         |
  |                           |                            |-- 统一下单(JSAPI) ------>|
  |                           |                            |<-- prepay_id -----------|
  |                           |<-- payParams --------------|                         |
  |<-- wx.requestPayment ----|                            |                         |
  |---------------- 收银台支付(客户输密码) ----------------------------> 扣款平台商户号 |
  |                           |                            |<== 异步回调 /pay/notify =|
  |                           |                            |-- 更新 Payment=PAID -----|
  |                           |-- 轮询 /payments/order/{id} 查 PAID -->|             |
  |<-- 订单 ACCEPTED + 已付 --|                            |                         |
  ... 服务进行 ...                                                                    |
  |-- 完成 + 评价(COMPLETED) ->|                          |                         |
  |                           |-- 触发结算(自动/后台) ----->|                         |
  |                           |                            |-- 分账/企业付款给喂养员 ->|
  |                           |                            |-- Payment=SETTLED -------| |
  |<-- 款项已打给喂养员 ------|                            |                         |
```

### 取消 / 纠纷（退款）
- 订单处于 `PENDING` / `QUOTED` 且**未支付**：直接取消，无资金动作。
- 已支付后取消 / 纠纷：调微信**退款 API** 原路退回，Payment 置 `REFUNDED`，订单 `CANCELLED`。

---

## 2. 数据模型（建议）

### Payment 表（新增或复用现有 `payments` 表）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | bigint PK | |
| order_id | FK → orders.id | 关联订单 |
| payer_user_id | FK → users.id | 付款人（客户） |
| payee_feeder_id | FK → feeders.id | 收款喂养员（结算目标） |
| amount | decimal(10,2) | 订单金额（= 报价 price） |
| currency | varchar | CNY |
| status | enum | `PENDING` / `PAID` / `SETTLED` / `REFUNDED` / `FAILED` |
| wx_transaction_id | varchar | 微信支付流水号（回调回写） |
| prepay_id | varchar | 统一下单返回的 prepay_id |
| platform_fee | decimal | 平台服务费（可空，结算时扣） |
| paid_at | datetime | 支付成功时间 |
| settled_at | datetime | 打款给喂养员时间 |
| refund_id | varchar | 退款单号 |
| created_at / updated_at | datetime | |

### Order 表建议新增字段
- `payment_id` FK（冗余关联，便于查询）
- `payment_status` enum（`UNPAID` / `PAID` / `SETTLED` / `REFUNDED`）——或由 Payment 表反查，二选一，建议冗余一个 `paid boolean` 方便列表展示。

---

## 3. 接口契约

### 3.1 统一下单（前端在 doConfirm 后调用）
`POST /api/miniapp/orders/{orderId}/pay`

请求（前端不传金额，金额以后端订单 price 为准，防篡改）：
```json
{ "orderId": 123 }
```
后端校验：
- 当前登录用户 == 订单 owner
- 订单 status == `QUOTED`（只有报价后确认才允许支付）
- 订单未支付过（payment_status != PAID）
- price > 0

后端动作：计算金额、调微信 JSAPI 统一下单（sub_mch / 平台商户），落 Payment(status=PENDING, prepay_id)，返回前端 `wx.requestPayment` 所需参数。

响应：
```json
{
  "code": 0,
  "data": {
    "timeStamp": "1690000000",
    "nonceStr": "abc123",
    "package": "prepay_id=wx2026...",
    "signType": "RSA",
    "paySign": "xxxxx",
    "orderId": 123
  }
}
```
> 注意：`appId` 前端已有；`paySign` 由后端用商户 APIv3 私钥按微信规则生成，前端**不能**自己算。

### 3.2 微信支付异步回调（公网）
`POST /api/pay/notify`
- 微信服务器回调，需校验签名、解密报文拿 `out_trade_no` / `transaction_id`。
- 更新对应 Payment：`status=PAID`、`wx_transaction_id`、`paid_at`；订单标记已付。
- 返回微信成功报文（否则微信会重试）。
- 回调域名需在微信支付后台配为 `https://mayunfei.asia`（当前 nginx 已满足 https）。

### 3.3 查询支付状态（前端确认后轮询）
`GET /api/miniapp/payments/order/{orderId}`
```json
{ "code": 0, "data": { "status": "PAID", "amount": 80.00, "paidAt": "..." } }
```
用于 `wx.requestPayment` 成功回调后，确认后端确已落 PAID（避免前端乐观更新但后端回调延迟）。

### 3.4 结算 / 打款给喂养员
`POST /api/miniapp/orders/{orderId}/settle`（建议服务完成+评价后由后端自动触发，或后台手动）
- 调微信**分账**或**企业付款到零钱**（视商户类型），把 `amount - platform_fee` 打给 `payee_feeder_id`。
- Payment 置 `SETTLED`、`settled_at`。

### 3.5 退款
`POST /api/miniapp/orders/{orderId}/refund`
- 调微信退款 API，原路退 `amount`。
- Payment 置 `REFUNDED`；订单 `CANCELLED`。
- 前端在「取消已支付订单」时调用。

---

## 4. 前端接入点（前端侧 TODO，待本 Issue 合后实现）

1. `orderApi` 增加 `pay(id)` / `queryPayment(orderId)` / `refund(id)`（已在 `utils/api.js` 预置 stub）。
2. `orders/detail` 的 `doConfirm` 改造为：
   确认弹窗 → `orderApi.pay(id)` → `wx.requestPayment(payParams)` → 成功 → `orderApi.queryPayment` 轮询直到 PAID → 订单置 `ACCEPTED` + 已付标记。
   失败/用户取消：`wx.requestPayment` fail → 订单保持 `QUOTED`，可重试。
3. 订单详情页展示「已支付 ¥xx」「待结算 / 已结算给喂养员」「退款中」。
4. 取消已支付订单 → 调 `orderApi.refund`。

---

## 5. 前置硬门槛（务必先确认，否则无法开工）

1. **主体资质**：微信支付仅对企业 / 个体工商户开放，**个人主体小程序无法开通**。需确认小程序认证主体为企业/个体户。
2. **商户号**：微信支付商户号（mchid）已申请，且小程序 AppID `wx1ad1b47d97fb0e04` 已绑定该商户号。
3. **后端密钥**：商户 APIv3 密钥、API 证书 `apiclient_key.pem`、证书序列号、平台/微信支付公钥已配置到后端。
4. **回调域名**：`https://mayunfei.asia` 已在微信支付后台配置为支付回调/授权域名（当前 nginx 已走 https，符合）。

> 以上任一不满足，支付功能无法联调。请后端同学先确认 1–4 是否齐备，再开始写代码。

---

## 6. 验收标准
- [ ] 确认报价后 `wx.requestPayment` 能拉起真实收银台，金额 = 订单 price。
- [ ] 支付成功回调落地 Payment=PAID，订单标记已付。
- [ ] 服务完成+评价后，款项正确打给喂养员（含平台费扣除）。
- [ ] 已支付订单取消 → 原路退款成功，Payment=REFUNDED。
- [ ] 前端 `queryPayment` 轮询逻辑能正确补齐乐观更新的延迟。
