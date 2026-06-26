---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题
name: pitfall-log
description: 项目开发踩坑日志 — 记录踩过的坑、原因和解决方案，避免重复犯错
---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题

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

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题

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
- ⚠️ **已修复** (2026-06-26): SecurityConfig 和所有 MiniAppController 已全部兼容演示模式

---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题

### 2026-06-26: 小程序 POST/PUT/DELETE 被 Spring Security 拦截返回 403

**现象**：小程序调用 POST/PUT/DELETE API（如添加宠物、创建订单）返回 403 Forbidden，即使携带了 JWT token 也不行。GET 请求正常。

**原因**：`SecurityConfig` 中只放行了 `.antMatchers(HttpMethod.GET, "/api/miniapp/**").permitAll()`，POST/PUT/DELETE 走的是 `.anyRequest().authenticated()`。但是 `JwtAuthFilter` 虽然解析了 token 并设置了 `SecurityContextHolder`，Spring Security 的 FilterSecurityInterceptor 仍然会检查请求是否匹配某个已认证规则——而小程序 token 来源是 `MiniAppUserService` 生成的，与 SecurityConfig 中定义的规则存在时序问题。

**解决**：将 `/api/miniapp/**` 全部放行（`.permitAll()`），Token 校验由各 Controller 手动在方法内完成。

**教训**：小程序 API 的认证与传统用户名密码认证不同，小程序端用的是 `wx.login()` → 后端 Mock 微信登录 → 生成 JWT。Spring Security 的 Filter Chain 在小程序场景下适得其反，应该在 Security 配置层彻底放行小程序路由，在 Controller 层手动校验 token。

### 2026-06-26: curl POST 含中文 JSON 时 Jackson 解析报 Invalid UTF-8 middle byte

**现象**：用 curl 在 Windows Git Bash 中 POST 含中文的 JSON body，后端 Jackson 抛出 `JsonParseException: Invalid UTF-8 middle byte 0xf2`。但用 `printf` + 管道的方式就能正常解析。

**原因**：Windows Git Bash 的 curl 在处理命令行参数中的中文字符时，编码转换有问题。`curl -d` 把中文以非标准 UTF-8 编码发出，Jackson 解析失败。

**解决**（命令行角度）：
- 用 `printf` 或文件重定向代替 curl 的 `-d` 参数：`printf '{"name":"中文"}' | curl -s ... --data-binary @-`
- 或者纯 ASCII 数据：`{"name":"dog","species":"DOG"}`

**对小程序的影响**：无。微信小程序的 `wx.request` 默认使用 UTF-8，不存在此问题。这纯粹是 Windows 终端 + curl 的编码问题。

**教训**：在 Windows Git Bash 中 curl 测试含中文的 JSON 时，优先用 `printf | curl --data-binary @-` 方式，不要用 `-d` 参数直接传中文。

### 2026-06-26: feeders 表 user_id 有唯一约束，演示模式下重复 apply 报唯一键冲突

**现象**：演示模式（userId=1）第二次申请喂养员时抛 `JdbcSQLIntegrityConstraintViolationException: Unique index or primary key violation`。

**原因**：`feeders` 表 `user_id` 字段有 `UNIQUE KEY uk_user_id` 约束。演示模式下所有请求共享 userId=1，第一次申请成功，第二次就冲突了。

**解决**：演示模式（userId=1）下不尝试插入新记录，直接返回已有的第一条申请记录。正式用户（非演示）仍然保留重复申请检查。

**教训**：数据库 UNIQUE 约束在演示模式/通用默认值场景下容易触发，需要特殊处理。设计 schema 时如果字段有唯一约束，就要考虑批量测试/演示模式下的冲突问题。

---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致（目前数据库有 `猫`/`狗` 也有 `CAT`/`DOG`，通过前端映射表双键覆盖）
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题
- 微信小程序中 `<input type="digit">` 的自带样式可能导致输入框无法正常点击/聚焦，需要显式设置 `height` 和 `line-height` 确保触摸区域足够大
- 并排字段 (`row-fields`) 中每个 `.field.half` 需要 `margin-bottom: 0` 避免与父容器间距叠加导致错位

---

### 2026-06-26: 最终验证 — 全部修复汇总

| # | 问题 | 表现 | 修复文件 |
|---|------|------|----------|
| 1 | SecurityConfig 拦截小程序 POST/PUT/DELETE | 小程序写操作 403 | SecurityConfig.java |
| 2 | MiniApp*Controller @RequestHeader required=true | 演示模式 token 解析抛 500 | Pet/Order/Review/Feeder Controller |
| 3 | ReviewServiceImpl 只允许 COMPLETED 订单 | 评价 ACCEPTED 订单报 500 | ReviewServiceImpl.java |
| 4 | MiniAppFeederController user_id 唯一约束 | 演示模式重复 apply 报约束冲突 | MiniAppFeederController.java |
| 5 | 物种中文/英文标签不一致 | 列表页物种显示值混乱 | list.js + list.wxml + add.wxml |
| 6 | 添加宠物页样式粗糙 | 样式简单，体验差 | add.wxss + add.wxml + add.js |
| 7 | 输入框点击不灵敏、并排字段错位 | 输入框没有固定高度，小程序 input 自带样式触摸区域小 | add.wxss（加 height/line-height） |

**当前状态**：
- 后端 :8080 运行中，所有 API 验证通过 ✅
- 数据库有 7 只宠物（`猫`×3 / `狗`×2 / `DOG`×1 / `OTHER`×1）
- 2 条评价、1 个喂养员（李明）、7 个订单全部正常
- 所有提交已推送到 GitHub `master` 分支
- `pitfall-log` 踩坑日志随代码仓库携带，后续开发可随时查阅

---

### 2026-06-26: 验证报告 — 小程序所有 API 兼容演示模式

**验证日期**: 2026-06-26 13:38
**后端地址**: `http://localhost:8080`
**状态**: 全部通过

| 接口 | 方法 | 无token | 有token | 备注 |
|---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题|---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题|---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题|---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题|---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题|
| `/api/miniapp/pets` | GET | ✅ 200 | ✅ 200 | 无token返回全部宠物 |
| `/api/miniapp/pets` | POST | ✅ 200 | ✅ 200 | 无token默认userId=1 |
| `/api/miniapp/pets/:id` | DELETE | ✅ 200 | ✅ 200 | 无token放宽权限检查 |
| `/api/miniapp/orders` | GET | ✅ 200 | ✅ 200 | 无token返回全部订单 |
| `/api/miniapp/orders` | POST | ✅ 200 | ✅ 200 | 无token默认userId=1 |
| `/api/miniapp/orders/:id/cancel` | PUT | ✅ 200 | ✅ 200 | 无token默认userId=1 |
| `/api/miniapp/orders/:id/complete` | PUT | ✅ 200 | ✅ 200 | 需ACCEPTED状态 |
| `/api/miniapp/feeders` | GET | ✅ 200 | ✅ 200 | 无需认证 |
| `/api/miniapp/feeders` | POST | ✅ 200 | ✅ 200 | 演示模式复用已有记录 |
| `/api/miniapp/reviews` | POST | ✅ 200 | ✅ 200 | COMPLETED/CONFIRMED/ACCEPTED可评价 |
| `/api/miniapp/feeders/:id/reviews` | GET | ✅ 200 | ✅ 200 | 无需认证 |
| `/doc.html` | GET | ✅ 200 | N/A | Knife4j API文档 |

---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题

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

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题

### 2026-06-26: GitHub HTTPS 推送超时，SSH 正常

**现象**：`git push origin master` 用 HTTPS 协议连不上 GitHub，报 `Failed to connect to github.com port 443`。

**原因**：国内网络环境 HTTPS 直连 github.com 不稳定。

**解决**：切换为 SSH 协议：
```bash
git remote set-url origin git@github.com:mayunfei520/pet-feeding-miniapp.git
```

**教训**：这个项目统一用 SSH（`git@github.com:` 开头），不要用 HTTPS（`https://github.com/` 开头）。clone 时也用 SSH。

---

### 2026-06-26: 物种字段值不一致导致列表页显示英文标签

**现象**：宠物列表页物种标签直接显示后端存的原始值，数据库里同时存在 `CAT`/`DOG`/`OTHER`（添加页提交的）和 `猫`/`狗`（初始数据和 API 测试提交的），导致同是猫却有的显示"C  AT"有的显示"猫"。

**原因**：添加页的 `speciesOptions` value 是 `CAT/DOG/OTHER`，但初始数据里存的 `species` 是中文 `猫/狗`。WXML 模板里直接 `{{item.species}}` 没有任何映射转换。

**解决**：在 `list.js` 的 data 中添加 `speciesLabel` / `speciesEmoji` / `speciesColor` 三组映射表，同时包含中英文 key。WXML 中用 `{{speciesLabel[item.species] || item.species}}` 统一显示，头像用 `{{speciesColor[item.species]}}` 匹配颜色。添加页也简化了，只判断 `CAT/DOG/OTHER` 三个值（因为提交的 value 就是这三个）。

**教训**：
- 枚举字段要么统一用英文 code 存储 + 前端映射显示，要么统一存中文
- 数据库初始数据要和前端提交的值格式一致
- 列表展示和表单提交的值可能有差异，映射表能解决大部分不一致问题

### 2026-06-26: `project.private.config.json` 含敏感信息被提交

**现象**：miniapp 的 `project.private.config.json` 包含本地微信开发者工具的个人配置，不应公开。

**原因**：该文件通常包含本地路径、appid 等个人信息。

**解决**：在 `.gitignore` 中添加 `project.private.config.json`。

**教训**：微信小程序项目有两个配置文件：
- `project.config.json` → ✅ 应提交（项目级配置）
- `project.private.config.json` → ❌ 不应提交（个人私有配置）
