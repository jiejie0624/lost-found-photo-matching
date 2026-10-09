# 公开演示部署指南（Render 初稿）

## 目标

让任何人用浏览器访问公开网址，并共用云端记录和照片。当前配置使用一个 Render Web Service 和一块持久磁盘：FastAPI 应用、SQLite 数据库及照片保存在同一服务的磁盘中。`APP_DATA_DIR` 默认仍指向本地 `work/app_data`；Render 配置将它改为 `/var/data`。

这适用于 FYP 小规模演示和单实例运行。Render 持久磁盘不能由多个服务实例共用，也不能横向扩展；如果用户量或可用性要求提高，应迁移到托管 PostgreSQL 和对象存储。Render 默认文件系统是临时的，所以数据库和照片必须写入已挂载的持久盘。

## 仓库已准备的配置

- 根目录 `render.yaml` 定义 Python Web Service、启动命令、健康检查、1 GB 持久盘和环境变量。
- 后端通过 `APP_DATA_DIR` 选择数据库与图片目录，保留本地运行默认值。
- `DEEPSEEK_MODEL=deepseek-flash` 对应用户选定的 DeepSeek-V4.1-Flash。
- `DEEPSEEK_API_KEY` 标记为部署时输入的密钥；不要写进仓库或网页代码。
- `/api/health` 提供部署健康检查。
- 上传表单已说明记录/图片可被网站访问者看到，且启用 AI 时会把照片发送给 DeepSeek。

## 首次部署步骤

1. 登录 Render 并连接 GitHub 账号，授权访问私有仓库 `lost-found-photo-matching-fyp`。
2. 在 Render Dashboard 选择 **New > Blueprint**，选中该仓库和 `main` 分支。Render 会读取根目录的 `render.yaml`。
3. Blueprint 会要求填写 `DEEPSEEK_API_KEY`。在 Render 的 secret/environment field 中填入 DeepSeek API key；不要把它粘贴到 GitHub、源代码或公开聊天。
4. 检查即将创建的资源与价格后再部署。这个 Blueprint 使用付费 Web Service 和持久磁盘；Render 官方说明，持久磁盘只适用于付费 Web Service，且默认文件系统会在重启或重新部署时丢失更改。
5. 部署完成后，在 Render 提供的 `onrender.com` 网址打开首页，并访问 `/api/health` 确认服务状态为 `ok`。从手机浏览器再打开同一网址检查窄屏显示。
6. 先用非敏感测试图片各发布一条失物和拾获记录，确认记录、图片和 DeepSeek 分析状态都能正常工作；这会产生真实 API token 用量。

Render 的官方文档：

- [Blueprint YAML 规范](https://render.com/docs/blueprint-spec)
- [持久磁盘说明](https://render.com/docs/disks)
- [FastAPI 部署指南](https://render.com/docs/deploy-fastapi)
- [免费方案限制](https://render.com/docs/free)

## 公开前必须处理的限制

- **目前没有登录、举报、管理员删除或审核。** 匿名访客可以创建公开记录，记录和照片可被其他访客查看。部署配置本身不会补上这些功能。
- **API 费用可能被公开提交触发。** DeepSeek key 放在服务端环境变量中，但当前没有用户级配额或请求速率限制。正式公开前需加防滥用措施和费用告警。
- **数据治理尚未完成。** 需要说明数据保存多久、怎样申请删除，以及谁负责审核不当内容；真实参与者数据需遵守导师和学校伦理要求。
- **运行磁盘为单实例。** 同一个服务访问数据库与图片；不要开启多个实例。此配置不是高可用或大规模生产架构。
- **备份计划需要确认。** 部署后应定期导出数据库并检查磁盘快照；不要只把 GitHub 当作数据库备份。

## 当前状态

代码仓库已经有部署配置，但尚未在 Render 创建服务，也没有公开网址。创建服务需要 Render 账号连接私有 GitHub 仓库，并在 Dashboard 输入 API key。完成这些后，部署过程和费用会由 Render 账号管理。
