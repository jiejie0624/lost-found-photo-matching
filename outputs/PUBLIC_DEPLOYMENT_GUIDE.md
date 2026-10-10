# 公开网站部署计划（Vercel）

> 当前状态（2026-10-11）：网站已部署到 Vercel，Neon PostgreSQL、Vercel Blob 和 Neon Auth 已连接。现行认证前端调用 Neon Auth SDK 的 `getJWTToken()`；Production commit `a327829` 显示 Ready，生产静态 `auth.js` 已更新。健康、配置和公开列表接口返回 HTTP 200，现有两条合成线索仍保留。此提交之后尚未用登录会话复验个人列表或发布；关闭/删除、DeepSeek 成功、自动过期清理也未全部验收。下面较早日期的记录描述当时部署状态和当时代码，不代表现在的认证实现。

2026-10-11 安全诊断已上线：Vercel Production 的早期提交 `87d2fd5` 曾显示 Ready，之后最新的 `a327829` 也已部署 Ready。线上只读 `GET /api/health` 返回 `status=ok`、`deepseek_key_configured=true`、`deepseek_model_id=deepseek-flash`、`deepseek_vision_model_supported=true`。这证明 Vercel 环境变量非空且模型 ID 在代码允许列表中；接口不返回密钥。它**不能**证明密钥有效、供应商接受请求、图片分析/比较成功或费用正确。要确认 AI 实际功能，仍需在使用非敏感图片且接受 API 费用后做单次端到端验收，并对照 Vercel 安全错误日志；不要把密钥放入公开截图或日志。

2026-10-11 登录凭证修订：`a327829` 将之前手动访问 Neon Auth `/token` 的代码替换为 `@neondatabase/auth@0.5.0-beta` SDK 的 `getJWTToken()`。生产部署已 Ready，生产 `/static/auth.js` 已切换到该方法。此前只读 `/token` 探测没有登录 cookie，不能代替真实会话验收；新实现下的个人页/API 请求和发布操作尚未实际复核。

随后查看 Vercel 最近一小时可见运行日志，时间范围内只有健康/配置/公开列表等 HTTP 请求记录，没有新的 DeepSeek 请求或供应商错误详情。因此目前仍不能从线上日志确认之前 `unavailable` 的具体原因；这不是“AI 正常”或“没有错误”的证明。

2026-10-10 的补充只读检查：`/`、`/login`、`/login.html`、`/my-records`、`/my-records.html`、`/api/health`、`/api/config` 和 `/api/records` 均返回 HTTP 200；当时 `/api/records` 返回空数组。未带登录凭证请求 `/api/me/records` 返回 HTTP 401，符合该接口要求认证的行为。这只能确认公开路由和未认证拦截可达，不能证明真实登录、发布、AI 匹配、图片存储、关闭/删除或过期清理流程已通过。

推送逐条 AI 授权功能后，再次只读访问 `/`、`/static/app.js` 和 `/api/health`，均返回 HTTP 200；首页包含 AI 授权文案，脚本包含 `not_consented` 状态。这证明该前端版本已部署、健康路由可达；没有实际提交记录或调用 DeepSeek，完整授权逻辑仍需在获准且使用非敏感样本后验收。

同日只读检查 Neon Auth：对当前网站来源查询 `/neondb/auth/get-session` 得到 HTTP 200、响应 `null`，并返回匹配网站来源的 `Access-Control-Allow-Origin`；对应 POST 预检返回 HTTP 204 并允许该来源。这说明 Auth 路由和浏览器来源的 CORS 设置当前可达，但没有提交注册/登录请求，因此不能据此确认 `Invalid origin` 注册错误已完全解决。

后续代码复核发现前端取 API JWT 的实现调用了 SDK 未记录的 `auth.token()`，这与用户遇到的“获取登录凭证失败 HTTP 404”相符。已改为优先调用固定 SDK 文档中的 `auth.getJWTToken()`，并在 SDK session 带 `access_token` 时作为后备。2026-10-10 修复已部署后的只读检查确认：`/`、`/login.html`、`/my-records.html`、`/api/health`、`/api/config`、`/api/records` 和 `/static/auth.js` 返回 HTTP 200；线上脚本包含 `getJWTToken` 且不再调用 `auth.token()`；未带凭证访问 `/api/me/records` 返回 HTTP 401。以上只证明部署文件和未认证保护可达，尚未用真实登录会话确认获取 JWT、读取个人记录、发布、AI 匹配、图片存储和删除流程。

2026-10-10 较早一次检查时，浏览器账号尚未授权查看项目；该限制后来已解除，以下最新记录覆盖此前“无法核对”状态。

2026-10-10 最新 Vercel 控制台只读核对：项目 `lost-found-photo-matching-fyp` 可见；最新 GitHub 提交 `2213f0d` 的 Production deployment 显示 Ready。环境变量列表中可见 `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、Neon 集成提供的 `DATABASE_URL` 与 `DATABASE_NEON_AUTH_BASE_URL`、Blob 集成提供的 `BLOB_READ_WRITE_TOKEN`，以及 `CRON_SECRET`。只核对了变量名称和环境范围，没有显示或读取任何值；因此只能确认这些变量条目存在，不能确认 DeepSeek key 有效、模型值正确或实际 API 调用成功。Neon/Blob 变量行显示关联的集成资源。没有修改生产配置，也没有发起 DeepSeek 调用。

随后将文档提交 `25ccce2` 推送到 GitHub；Vercel 最新 Production deployment 显示该提交 Ready。线上只读 GET 检查的 `/`、`/login`、`/login.html`、`/my-records`、`/my-records.html`、`/api/health`、`/api/config`、`/api/records` 和 `/static/auth.js` 均返回 HTTP 200，公开记录为空，Auth 配置为已启用。浏览器最初短暂显示 `/login` Internal Server Error，刷新后页面正常加载。此检查没有提交登录表单或发布记录，所以此前发布操作中出现的 HTTP 404 仍未定位；不能把它说成已修复。没有调用 DeepSeek。

2026-10-10 登录凭证 404 修复：此前 `getJWTToken()` 实际返回会话标识，不能当作 API JWT；现改为在浏览器携带 Neon Auth 会话 cookie 请求 Auth `/token`，并只接受 JWT 格式的返回值。提交 `aacb208` 已推送到 `main` 并自动部署。生产静态脚本确认包含新 token 请求；刷新已有登录会话的“我的记录”页后，成功显示个人记录列表（0 条）。这验证了登录态、取 JWT 和只读个人记录接口。没有创建、修改或删除记录，也没有调用 DeepSeek。若浏览器仍显示旧错误，刷新页面即可加载新脚本。

2026-10-10 后续生产路由复核：`/api/health`、`/api/config`、`/api/records`、`/login`、`/my-records` 和 `/static/app.js` 均返回 HTTP 200；Auth 配置为已启用，公开记录列表为空。对 `/api/records` 发送不完整请求得到 HTTP 422；发送字段完整但无登录凭证的合成 multipart 请求得到 HTTP 401（“请先登录后再操作”），未创建记录、未上传有效照片，也未调用 DeepSeek。这证明当前发布路由存在且要求登录，**不能**解释或证明此前真实登录发布时截图中的 HTTP 404 已解决。注册、真实 JWT 下发布、Blob 保存、DeepSeek 两阶段视觉流程和删除仍需端到端验收。

2026-10-11 最新只读复核：`/`、`/login`、`/my-records`、`/api/health`、`/api/config`、`/api/records` 均返回 HTTP 200；无凭证访问 `/api/me/records` 返回 HTTP 401。Auth 和数据库健康检查正常。两条合成测试记录仍保留在线上（用户要求暂不删除）；本次未读取记录详情、未新增或删除记录，也未调用 DeepSeek。以上仅证明路由可达及无凭证个人记录访问被拒绝，不能证明此前截图中的登录后 HTTP 404 已解决，或 DeepSeek、Blob 发布、授权边界和过期清理已完整验收。

2026-10-10 最新浏览器复核：当前已有登录会话打开首页后，导航正确切换为“我的记录”；“我的记录”页成功显示用户 `jie` 和 0 条记录。线上 `/api/health`、`/api/config`、`/api/me/records`（未带令牌时为预期的 401）、`/login` 与 `/my-records` 均有响应。结合此前 `auth.js` 的 `/token` 修复，这确认当前登录态取 JWT 及个人记录读取可用。此前发布时的 404 可能与同一旧 JWT 获取问题有关，但尚未通过登录后提交验证，不能称发布流程已修复。未创建公开记录或调用 DeepSeek。

注册来源状态（2026-10-10 后续核对）：Neon 控制台的 `neon-cordovan-ribbon` / `main` Better Auth 设置中，Trusted domains 已包含 `https://lost-found-photo-matching-fyp.vercel.app`；生产 `/api/config` 返回的 Auth URL 与该页的 Auth URL 完全一致。Auth 用户页还显示已有 1 个账号。由此可排除“生产环境连错 Neon Auth 项目”以及“生产域名完全未加入 trusted domains”这两个当前假设。用户此前仍曾看到 `Invalid origin`，但本次没有重新提交注册表单，故实际注册错误状态仍待端到端验证；不要重复添加域名或盲目改其他配置。参见 [Neon Auth trusted origins 与 Vercel 自动配置说明](https://neon.com/blog/auth-that-just-works-in-vercel-previews) 及 [Neon Auth 分支配置说明](https://neon.com/blog/neon-auth-branchable-identity-in-your-database)。

## 数据放在哪里

- **记录与账号：Neon PostgreSQL**，通过 Vercel Marketplace 连接。数据库保存失物/拾获记录、发布者 ID、状态、90 天过期时间和照片 URL；Neon Auth 在 `neon_auth` schema 管理账号与会话。
- **照片：Vercel Blob**。图片文件存放在 Blob，PostgreSQL 只保存对应的 URL/路径。当前产品会向所有访客显示记录图片，所以第一版可使用公开 Blob；公开 URL 会被任何持有者打开。若以后需要只对登录用户开放图片，应改为私有 Blob 并添加登录与授权。
- **应用：Vercel Python Runtime / FastAPI Function**。Vercel 托管网页和后端，所有访客通过同一网址使用。
- **AI：DeepSeek-V4.1-Flash**。在 Vercel 项目环境变量中配置 `DEEPSEEK_API_KEY`，API 模型 ID 为 `deepseek-flash`。

Vercel Functions 不提供可持久保存 SQLite 与上传文件的本地磁盘；重启或换实例后，临时文件不能作为共享数据库或照片库。因此生产记录应放在外部数据库，图片应放在对象存储。

## 数据流

1. 浏览器提交表单和照片。
2. FastAPI 校正图片方向、压缩并移除 EXIF。
3. 后端把图片上传到 Vercel Blob，并取得公开 URL。
4. 只有发布者为这条记录勾选 AI 处理同意且配置了 DeepSeek key，后端才调用 `deepseek-flash` 提取照片可见属性；否则只使用表单信息。
5. 后端把文字字段、照片 URL 和分析 JSON 存入 Neon PostgreSQL。
6. 搜索时从 PostgreSQL 读取相反类型的记录并排序。只有新记录和候选记录双方都同意 AI 处理时，DeepSeek 才会比较这两条照片；否则该候选只按表单和已有属性排序。
7. 登录后，前端从 Neon Auth 获取短期 JWT；FastAPI 使用 Neon 提供的 JWKS 验证身份，再把记录绑定到登录用户。
8. 每日 Vercel Cron 删除 90 天前的记录和对应的 Blob 图片。

## 代码现状

- `app/app.py` 是 Vercel FastAPI 入口，网页资源已放在 `public/`。
- 配置 `DATABASE_URL` 后，应用使用 PostgreSQL；本地未配置时仍使用 SQLite。
- 配置 `BLOB_READ_WRITE_TOKEN` 后，应用会把规范化照片上传到 Vercel Blob，并在数据库记录照片 URL；本地未配置时仍保存到本机目录。
- 用户需在 Neon 控制台为数据库分支启用 Managed Better Auth。Vercel Neon 集成若使用了 `DATABASE_` 自定义前缀，应用会读取 `DATABASE_NEON_AUTH_BASE_URL` 或 `DATABASE_VITE_NEON_AUTH_URL`；JWKS 地址可从 Neon Auth URL 推导，也可用 `NEON_AUTH_JWKS_URL` 或 `DATABASE_NEON_AUTH_JWKS_URL` 显式覆盖。登录页使用 Neon JavaScript Auth SDK；FastAPI 校验 EdDSA 签名、有效期和 issuer。
- `CRON_SECRET` 用于验证每日 `/api/cron/expire` 清理请求。清理失败的照片会留到后续运行重试，过期记录不会出现在公开列表或匹配结果中。
- 老记录会自动迁移为无所有者记录，按原发布时间计算 90 天期限；未登录的老记录无法由普通用户管理。
- 浏览器会将大于 4 MiB 的图片压缩到请求正文限制以内；服务端仍接受最大 8 MiB 的图片，以便本地使用。
- `vercel.json` 将 FastAPI Function 的最长运行时间设为 180 秒，因为发布记录会同步等待属性分析和候选照片比较；较慢的模型响应仍可能让用户等待。
- Vercel Python Runtime 对 FastAPI 的支持状态和部署细节请以官方文档为准。

Neon 和 Blob 已由用户在控制台创建并连接。旧 SQLite 数据和本地照片不会自动迁移到云端。

## Vercel 配置清单（新部署或排查时）

1. 在 Neon 项目里打开主分支的 **Auth** 并启用 Managed Better Auth。
2. 在 Vercel 项目环境变量中确认 Neon 提供了 Auth URL（例如 `DATABASE_NEON_AUTH_BASE_URL` 或 `DATABASE_VITE_NEON_AUTH_URL`）。应用会根据 Auth URL 推导 JWKS 地址；如果 Neon 另外提供了 JWKS 变量，也可以保留并由应用读取。
3. 在 Vercel 添加 Secret 类型的 `CRON_SECRET`，至少使用 16 个随机字符；该值不需要写进 GitHub。
4. 保留已经连接好的 `DATABASE_URL`、`BLOB_READ_WRITE_TOKEN` 和 `DEEPSEEK_API_KEY`，并确认 `DEEPSEEK_MODEL=deepseek-flash`。
5. 推送代码触发部署。用非敏感测试图片检查首页、登录/注册、发布记录、我的记录、关闭/删除和 `/api/health`。图片分析和比较会产生真实 DeepSeek API 用量；发布记录时须单独勾选 AI 处理同意，不勾选仍可用表单信息匹配。

Neon、Blob、Auth、DeepSeek 密钥和 `CRON_SECRET` 已由用户在控制台配置；`/api/cron/expire` 未带密钥请求返回 401，说明清理接口的密钥校验已生效。真实密钥不要写入 GitHub、聊天或网页代码。部署后的完整业务流程仍需用本人账号和不敏感测试图片验收，这会产生实际 DeepSeek API 用量。

## 公开前的产品限制

- 公开访客可以读取公开记录和照片；已登录用户才能新增、关闭或删除记录。旧记录因没有所有者，不能由普通用户关闭或删除。
- 用户决定暂不增加应用自定义的登录尝试限流。应用级 API 费用上限和异常用量告警仍未确认；应查看 DeepSeek 与 Vercel 控制台的用量和账单设置。
- 页面已区分照片公开展示与第三方 AI 处理同意，后者需逐条勾选；匹配比较候选照片时也要求候选记录发布者先行同意。应用勾选不等于学校伦理批准；真实参与者数据仍须先由导师/学校确认处理流程、同意文本和保留期限。
- 如扩大到真实用户规模，仍需评估管理员处理举报、备份/恢复演练、费用告警、隐私删除流程和数据库连接池。

## 官方文档

- [Vercel 上部署 FastAPI](https://vercel.com/docs/frameworks/backend/fastapi)
- [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Vercel Marketplace 存储和 Postgres](https://vercel.com/docs/marketplace-storage)
- [Vercel Blob](https://vercel.com/docs/vercel-blob)
- [Vercel Blob 服务端上传与 4.5 MB 限制](https://vercel.com/docs/vercel-blob/server-upload)
- [Vercel Function 最长运行时间](https://vercel.com/docs/functions/configuring-functions/duration)
- [DeepSeek Vision：多图输入与图片 token 计量](https://api-docs.deepseek.com/guides/vision/)
- [Neon Auth 官方介绍](https://neon.com/blog/neon-auth-branchable-identity-in-your-database)
- [Neon JavaScript Auth SDK](https://github.com/neondatabase/neon-js/tree/main/packages/auth)
- [Vercel Cron Jobs 与 CRON_SECRET](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
