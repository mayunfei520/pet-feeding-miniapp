# 后端需求：注册接收并落库「真实姓名」

> 状态：待后端实现（前端已落地真实姓名字段与前端格式校验，后端按本文档接收 realName 并落库即可）

## 背景
小程序注册页（`pages/login/login.js` 的 `doRegister`）已新增**真实姓名**输入框，注册请求 `POST /api/miniapp/auth/register` 的 payload 已携带 `realName` 字段。

当前前端与后端的契约缺口：
- 前端 `registerPayload` 已带 `realName: p.realName.trim()`（commit `f9e8523`）
- 后端 `register` 接口**大概率不接收该字段**，导致姓名无法落库、登录后也取不回。

**必须由后端在 `register` 接口接收 `realName` 并落库，且登录返回的 `userInfo` 需带上 `realName`。**

## 需求规则（前后端必须一致）
| 项 | 规则 | 说明 |
|----|------|------|
| 字段名 | `realName` | 与前端 payload 键名一致 |
| 格式 | 2–4 个汉字 | 前端正则 `/^[\u4e00-\u9fa5]{2,4}$/` |
| 必填 | 是 | 注册必须填写真实姓名 |
| 存储 | `user` 表新增 `real_name` 列 | 落库 |

不满足时注册接口应返回业务错误，建议 message：
`请输入真实姓名（2-4个汉字）`

## 接口契约
- 路径：`POST /api/miniapp/auth/register`
- 现有入参：`phone, password, code, gender`
- 新增入参：`realName`（String，2–4 汉字）
- 改动点：
  1. `User` 实体（或 `UserProfile`）新增字段 `realName` / 数据库列 `real_name`
  2. `MiniAppUserRegisterDTO`（或对应 DTO）新增 `realName` 属性
  3. `register(...)` 中将 `realName` 写入用户记录
  4. `password-login` / 微信 `phone-login` 返回的 `userInfo` 中**带上 `realName`**，供前端展示
- 错误抛出建议：`BusinessException("请输入真实姓名（2-4个汉字）")`
  （HTTP 业务码非 200，前端 `request.js` 会原样把 `message` toast 出来，无需前端再改）

## 前端已落地（供对齐）
- `login.wxml` 注册表单在手机号与密码之间新增真实姓名输入框，placeholder：`真实姓名（2-4个汉字）`
- `login.js`：
  - `data.realName`、`onRealNameInput` 输入 trim
  - `checkRealName(name)`：空→"请输入真实姓名"；非 2–4 汉字→"姓名需为 2-4 个汉字"
  - `doRegister` 提交前 `if (!this.checkRealName(p.realName))` 拦截，payload 带 `realName`
- 规则与上表**完全一致**，后端可直接据此实现，无需前端配合改动。

## 验收标准
1. 不传 `realName` → 接口拒绝，提示需填真实姓名。
2. `realName="a"` / `"123"` / `"abc"` / `"张三丰丰丰"`（非汉字或超 4 字）→ 拒绝。
3. `realName="张三"` / `"李雷"`（2–4 汉字）→ 通过，落库成功。
4. 该用户登录后，`userInfo.realName` 返回填写值。
5. **直接 curl 调接口绕过前端，同样被校验** → 证明后端兜底生效。

## 备注
- 此 `realName` 为注册环节收集的实名信息，与「申请成为喂养员」时的真实姓名（`apply` 页）是两回事——后者还需配合身份证做实名审核（另议）。两者可后续合并，但本次仅要求注册接口落库 `realName`。
- 不影响登录、验证码、密码策略等既有逻辑。
