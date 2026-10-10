# 公开网站部署计划（Vercel）

> 当前状态（2026-10-10）：网站已部署到 Vercel，Neon PostgreSQL、Vercel Blob 和 Neon Auth 已连接。线上首页、登录页、“我的记录”页、配置接口和健康接口均返回正常；未用真实账号完整重跑发布、AI 匹配和删除流程。维护或新部署时可参考下面的配置清单。

2026-10-10 的补充只读检查：`/`、`/login`、`/login.html`、`/my-records`、`/my-records.html`、`/api/health`、`/api/config` 和 `/api/records` 均返回 HTTP 200；当时 `/api/records` 返回空数组。未带登录凭证请求 `/api/me/records` 返回 HTTP 401，符合该接口要求认证的行为。这只能确认公开路由和未认证拦截可达，不能证明真实登录、发布、AI 匹配、图片存储、关闭/删除或过期清理流程已通过。

推送逐条 AI 授权功能后，再次只读访问 `/`、`/static/app.js` 和 `/api/health`，均返回 HTTP 200；首页包含 AI 授权文案，脚本包含 `not_consented` 状态。这证明该前端版本已部署、健康路由可达；没有实际提交记录或调用 DeepSeek，完整授权逻辑仍需在获准且使用非敏感样本后验收。

同日只读检查 Neon Auth：对当前网站来源查询 `/neondb/auth/get-session` 得到 HTTP 200、响应 `null`，并返回匹配网站来源的 `Access-Control-Allow-Origin`；对应 POST 预检返回 HTTP 204 并允许该来源。这说明 Auth 路由和浏览器来源的 CORS 设置当前可达，但没有提交注册/登录请求，因此不能据此确认 `Invalid origin` 注册错误已完全解决。

后续代码复核发现前端取 API JWT 的实现调用了 SDK 未记录的 `auth.token()`，这与用户遇到的“获取登录凭证失败 HTTP 404”相符。已改为优先调用固定 SDK 文档中的 `auth.getJWTToken()`，并在 SDK session 带 `access_token` 时作为后备。2026-10-10 修复已部署后的只读检查确认：`/`、`/login.html`、`/my-records.html`、`/api/health`、`/api/config`、`/api/records` 和 `/static/auth.js` 返回 HTTP 200；线上脚本包含 `getJWTToken` 且不再调用 `auth.token()`；未带凭证访问 `/api/me/records` 返回 HTTP 401。以上只证明部署文件和未认证保护可达，尚未用真实登录会话确认获取 JWT、读取个人记录、发布、AI 匹配、图片存储和删除流程。

2026-10-10 较早一次检查时，浏览器账号尚未授权查看项目；该限制后来已解除，以下最新记录覆盖此前“无法核对”状态。

2026-10-10 最新 Vercel 控制台只读核对：项目 `lost-found-photo-matching-fyp` 可见；最新 GitHub 提交 `2213f0d` 的 Production deployment 显示 Ready。环境变量列表中可见 `DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、Neon 集成提供的 `DATABASE_URL` 与 `DATABASE_NEON_AUTH_BASE_URL`、Blob 集成提供的 `BLOB_READ_WRITE_TOKEN`，以及 `CRON_SECRET`。只核对了变量名称和环境范围，没有显示或读取任何值；因此只能确认这些变量条目存在，不能确认 DeepSeek key 有效、模型值正确或实际 API 调用成功。Neon/Blob 变量行显示关联的集成资源。没有修改生产配置，也没有发起 DeepSeek 调用。

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
