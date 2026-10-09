# 公开网站部署计划（Vercel）

> 用户指定 Vercel。代码已加入部署适配，但尚未连接云端资源或发布，目前没有公开网址。

## 数据放在哪里

- **记录与匹配属性：Neon PostgreSQL**，通过 Vercel Marketplace 连接。数据库保存失物/拾获文字、DeepSeek 提取的特征、照片 URL 和时间等结构化数据。
- **照片：Vercel Blob**。图片文件存放在 Blob，PostgreSQL 只保存对应的 URL/路径。当前产品会向所有访客显示记录图片，所以第一版可使用公开 Blob；公开 URL 会被任何持有者打开。若以后需要只对登录用户开放图片，应改为私有 Blob 并添加登录与授权。
- **应用：Vercel Python Runtime / FastAPI Function**。Vercel 托管网页和后端，所有访客通过同一网址使用。
- **AI：DeepSeek-V4.1-Flash**。在 Vercel 项目环境变量中配置 `DEEPSEEK_API_KEY`，API 模型 ID 为 `deepseek-flash`。

Vercel Functions 不提供可持久保存 SQLite 与上传文件的本地磁盘；重启或换实例后，临时文件不能作为共享数据库或照片库。因此生产记录应放在外部数据库，图片应放在对象存储。

## 数据流

1. 浏览器提交表单和照片。
2. FastAPI 校正图片方向、压缩并移除 EXIF。
3. 后端把图片上传到 Vercel Blob，并取得公开 URL。
4. 如果配置 DeepSeek key，后端调用 `deepseek-flash` 提取照片可见属性。
5. 后端把文字字段、照片 URL 和分析 JSON 存入 Neon PostgreSQL。
6. 搜索时从 PostgreSQL 读取相反类型的记录，先由 FastAPI 排序出前 5 名，再可让 DeepSeek 同时比较新照片和候选照片，返回综合排序。
7. 网页通过照片 URL 展示 Blob 图片。

## 代码现状

- `app/app.py` 是 Vercel FastAPI 入口，网页资源已放在 `public/`。
- 配置 `DATABASE_URL` 后，应用使用 PostgreSQL；本地未配置时仍使用 SQLite。
- 配置 `BLOB_READ_WRITE_TOKEN` 后，应用会把规范化照片上传到 Vercel Blob，并在数据库记录照片 URL；本地未配置时仍保存到本机目录。
- 浏览器会将大于 4 MiB 的图片压缩到请求正文限制以内；服务端仍接受最大 8 MiB 的图片，以便本地使用。
- `vercel.json` 将 FastAPI Function 的最长运行时间设为 180 秒，因为发布记录会同步等待属性分析和候选照片比较；较慢的模型响应仍可能让用户等待。
- Vercel Python Runtime 对 FastAPI 的支持状态和部署细节请以官方文档为准。

以上只表示仓库已有适配代码，不代表 Vercel 部署已成功。尚未连接 Neon/Blob，也未在 Vercel 上构建或运行云端版本。旧 SQLite 数据和本地照片不会自动迁移到新云端资源。

## Vercel 控制台部署步骤

1. 在 Vercel 选择 **Add New > Project**，连接 GitHub 私有仓库 `lost-found-photo-matching-fyp`。
2. 在 Vercel Storage / Marketplace 添加 Neon PostgreSQL，并将 `DATABASE_URL` 连接到项目。
3. 创建一个**公开**的 Vercel Blob store，并将 `BLOB_READ_WRITE_TOKEN` 连接到项目。公开模式下，照片 URL 可被任何拿到链接的人访问。
4. 在项目的 Production 环境变量中填入 `DEEPSEEK_API_KEY`，并设置 `DEEPSEEK_MODEL=deepseek-flash`。
5. 确认 `DATABASE_URL`、`BLOB_READ_WRITE_TOKEN`、`DEEPSEEK_API_KEY` 已加入需要的部署环境，触发部署。
6. 部署后验证首页、`/api/health`、数据库读写、照片上传/显示和 DeepSeek 分析/图片比较状态；先用非敏感测试图片。属性提取和多图比较会产生真实 API token 用量。

以上步骤需要在用户自己的 Vercel 控制台完成账号授权、存储资源建立和密钥输入。密钥不应写入 GitHub 或网页代码。

## 公开前的产品限制

- 当前没有登录、举报、管理员删除或审核。任何访客都可以发记录，所有访客都可以读取记录和图片。
- 当前没有速率限制或费用上限保护；公开表单可能被滥用并触发 DeepSeek 用量。
- 页面已提示访客记录和照片会公开显示，启用 AI 时照片会发送给 DeepSeek；仍需和导师确认真实参与者数据的伦理、同意和保留期限。
- 用户量增大时需加认证、滥用防护、管理删除、备份、费用告警和数据库连接池。

## 官方文档

- [Vercel 上部署 FastAPI](https://vercel.com/docs/frameworks/backend/fastapi)
- [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Vercel Marketplace 存储和 Postgres](https://vercel.com/docs/marketplace-storage)
- [Vercel Blob](https://vercel.com/docs/vercel-blob)
- [Vercel Blob 服务端上传与 4.5 MB 限制](https://vercel.com/docs/vercel-blob/server-upload)
- [Vercel Function 最长运行时间](https://vercel.com/docs/functions/configuring-functions/duration)
- [DeepSeek Vision：多图输入与图片 token 计量](https://api-docs.deepseek.com/guides/vision/)
