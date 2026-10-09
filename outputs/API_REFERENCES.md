# API 参考（DeepSeek）

最后查阅：2026-10-09。开始开发前请重新核对文档和价格。

- 视觉输入能力、图片格式、图片输入方式和 token 估算：[DeepSeek Vision](https://api-docs.deepseek.com/guides/vision/)
- 模型和价格（包括高峰/非高峰及缓存价格）：[Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/)
- API 接入方式和模型名称：[DeepSeek API Quick Start](https://api-docs.deepseek.com/en/)

## 当前规划相关摘录

- 官方文档列出 `deepseek-flash` 支持图片输入。
- 图片会缩放后转为 token 计费；文档说明单张图片最多约 1,024 个输入 token。
- 支持 JPEG、PNG、GIF 和 WebP。
- 价格会变化，费用依赖输入 token、输出 token、缓存情况和调用时间。
- 当前工作估算：最多 10 张候选图片加 1 张新图片，1,000 次查询约 US$2–5；这是规划级粗算，未包括托管、存储和数据库费用。
