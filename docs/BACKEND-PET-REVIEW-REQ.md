# 后端需求：添加宠物走「平台审核」流程

> 提给后端（pet-feeding-admin / Spring Boot）的需求规格。
> 前端仓库：`pet-feeding-miniapp`；后端仓库：`pet-feeding-admin`。
> 提出方：前端（依据用户要求「添加宠物需要后端审核，同意了再进行下一步」）。
> 提出日期：2026-07-10

---

## 一、业务目标

用户在小程序「添加宠物」提交后，宠物**不直接对外生效**，而是进入「待审核」状态。
平台（管理员）在后台审核通过后才对外可见 / 可被预约喂养；驳回则告知用户原因。

防止「随便填一个宠物就立刻能约人上门」的信任风险，与已加的前端表单校验、敏感词过滤形成「前端拦截 + 后端兜底」双防线。

---

## 二、现状（已核实代码）

- `module/pet/entity/Pet.java`：**无 `status` 字段**（仅 id/userId/name/species/bre/age/weight/medicalNotes/vaccinated/image/createdAt）。
- `module/miniapp/controller/MiniAppPetController.java` 的 `add()`：直接 `pet.setUserId(...)` → `petService.save(pet)` → 返回，**无审核态**。
- 已存在的校验（**务必保留，不要删**）：
  - `name` `@NotBlank` + `@Size(max=20)`
  - `species` `@NotBlank` + `@Pattern("CAT|DOG")`
  - `bre` `@Size(max=20)`（注：字段名 `bre` 疑似 `breed` 笔误，属历史遗留，本次不要求改名）
  - `age` `@Min(0) @Max(50)`、`weight` `@DecimalMin(0) @DecimalMax(200)`、`medicalNotes` `@Size(max=200)`

---

## 三、需要后端改的点

### 1. `Pet` 实体增加审核状态字段
- 新增字段 `status`（`String`，或枚举 `PetStatus`）。建议取值：
  - `PENDING` —— 待审核（小程序新增默认）
  - `APPROVED` —— 已通过（对外可见 / 可预约）
  - `REJECTED` —— 已驳回（需附原因）
- 数据库 `pets` 表新增 `status` 列（VARCHAR，默认 `PENDING`）。
- 新增可选字段 `rejectReason`（`String`，驳回原因，最多 200 字）。

### 2. 小程序 `add()` 默认置为待审核（关键）
- 在 `petService.save(pet)` **之前**强制：`pet.setStatus("PENDING")`。
- **不要信任客户端传来的 status**——无论前端发什么，服务端一律覆盖为 `PENDING`，防止绕过。
- 返回保存后的 `Pet`（含 `status=PENDING`），前端据此提示「审核中」。

### 3. 列表接口的可见性规则
- `GET /api/miniapp/pets`（我的宠物）：**仍返回该用户全部宠物**，包含 `PENDING`，让主人能看到「审核中」状态。
- 任何**对他人 / 对喂养员可见**的宠物列表（如预约喂养时选择宠物、喂养员接单视图等），**必须过滤 `status = APPROVED`**，待审核 / 驳回的不可见、不可被预约。

### 4. 新增管理员审核接口（仅 `ADMIN` 角色可调用）
建议挂在后台宠物管理 Controller（如 `PetAdminController` 或现有 admin 路由）：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/admin/pets?status=PENDING` | 审核队列，列出待审宠物（分页可选） |
| `POST` | `/api/admin/pets/{id}/approve` | 置 `status=APPROVED` |
| `POST` | `/api/admin/pets/{id}/reject` | Body `{ "reason": "..." }`，置 `status=REJECTED` + 存 `rejectReason` |

- 三个接口都需校验调用者 `role == ADMIN`，否则 `403`。
- `approve` / `reject` 先 `getById` 判空（`404`）；非 `PENDING` 状态重复操作可返回 `400 当前状态不可审核`。

### 5.（可选，建议）审核结果通知主人
- 审核通过 / 驳回后，给宠物主人发一条消息通知（站内信 / 订阅消息均可），驳回时带上 `rejectReason`。非必须，但能明显提升体验。

---

## 四、接口契约（前端依赖，请后端确认实现后同步）

小程序端后续需要：
1. `POST /api/miniapp/pets` 返回体里的 `Pet.status` 字段。
2. `GET /api/miniapp/pets` 每条带 `status` 与（若驳回）`rejectReason`。
3. 字段取值固定为 `PENDING` / `APPROVED` / `REJECTED` 三态字符串。

---

## 五、验收标准（后端自测）

- [ ] 新增宠物后查库，`status = PENDING`，不是立即可见。
- [ ] 客户端伪造 `status=APPROVED` 提交，落库仍为 `PENDING`（服务端覆盖生效）。
- [ ] 喂养员 / 他人视角看不到 `PENDING` 宠物。
- [ ] 管理员 `approve` 后状态变 `APPROVED`；`reject` 后变 `REJECTED` 且原因入库。
- [ ] 非 ADMIN 调用审核接口返回 `403`。
- [ ] 原有表单校验（名字/种类/年龄/体重/备注）全部仍然生效。

---

## 六、前端侧配套（属前端职责，后端无需管）

后端交付上述 `status` 字段与接口后，前端会做：
- 添加成功提示改为「提交成功，等待平台审核」，**不**直接当"已添加"跳转。
- 我的宠物列表：按 `status` 显示徽标（待审核=暖黄、已通过=绿、已驳回=灰红），待审核宠物**禁用「去预约喂养」**。
- 驳回宠物展示 `rejectReason`，引导用户修改后重新提交。
