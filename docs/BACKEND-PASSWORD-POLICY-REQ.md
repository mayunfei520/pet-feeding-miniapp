# 后端需求：注册密码复杂度策略

> 状态：待后端实现（前端已落地，规则完全一致，后端按本文档加强制校验即可）

## 背景
小程序注册页（`pages/login/login.js` 的 `doRegister`）已落地**前端**密码复杂度提示与提交拦截，规则为：
- 长度 8–20 位
- 必须同时包含：大写字母、小写字母、数字

但前端校验只是体验层，可被绕过——直接调 `POST /api/miniapp/auth/register` 即可用弱密码注册。
**必须由后端在 `register` 接口强制校验，作为唯一可信兜底。**

## 需求规则（前后端必须一致）
| 项 | 规则 | 正则 |
|----|------|------|
| 最小长度 | 8 | — |
| 最大长度 | 20 | — |
| 大写字母 | 必须包含 | `[A-Z]` |
| 小写字母 | 必须包含 | `[a-z]` |
| 数字 | 必须包含 | `\d` |
| 特殊符号 | 不强制 | — |

不满足时注册接口应返回业务错误，建议 message：
`密码需为8-20位，且同时包含大小写字母与数字`

## 接口契约
- 路径：`POST /api/miniapp/auth/register`
- 现有入参：`phone, password, code, gender`
- 改动点：`MiniAppUserService.register(...)` 中，将现有
  `if (password == null || password.length() < 6)` 这一长度判断**替换为**上述复杂度校验。
- 错误抛出：`BusinessException("密码需为8-20位，且同时包含大小写字母与数字")`
  （HTTP 业务码非 200，前端 `request.js` 会原样把 `message` toast 出来，无需前端再改）。

## 前端已落地（供对齐）
- `login.js` 新增 `checkPassword(pwd)`：实时计算 `passwordHint` / `passwordValid`。
- `login.wxml` 密码框下显示 `.pwd-hint`（不合格 `bad` 红 / 合格 `ok` 绿）。
- `doRegister` 提交前 `if (!this.checkPassword(p.password))` 拦截。
- 规则与上表**完全一致**，后端可直接据此实现，无需前端配合改动。

## 验收标准
1. `aaaaaa`（纯小写 6 位）→ 接口拒绝，提示密码复杂度错误。
2. `12345678`（纯数字）→ 拒绝。
3. `abcdefgh`（纯小写 8 位）→ 拒绝（缺大写 + 数字）。
4. `Abcd1234`（8 位，含大小写 + 数字）→ 通过。
5. `Ab1`（3 位）/ `Abcdefghijklmnopqrstu1234567890`（超 20 位）→ 拒绝。
6. **直接 curl 调接口绕过前端，同样被拒绝** → 证明后端兜底生效。

## 备注
- 与短信验证码（mock / 真实短信）无关，仅新增 `password` 字段的复杂度校验。
- 登录接口 `password-login` 无需改动（只验证密码匹配，不强制改密）。
- 微信手机号一键登录（`phone-login`）走微信授权，不经过 `password` 字段，不受影响。
