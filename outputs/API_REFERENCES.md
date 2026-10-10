# API 参考（DeepSeek）

最后查阅：2026-10-10。开始正式实验前请再次核对模型能力和价格。

- 视觉输入能力、图片格式、图片输入方式和 token 估算：[DeepSeek Vision](https://api-docs.deepseek.com/guides/vision/)
- 模型和价格（包括高峰/非高峰及缓存价格）：[Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/)
- API 接入方式和模型名称：[DeepSeek API Quick Start](https://api-docs.deepseek.com/en/)
- JSON 输出模式：[JSON Output](https://api-docs.deepseek.com/guides/json_mode/)
- Chat Completions 参数与响应字段：[Chat Completions API](https://api-docs.deepseek.com/api/create-chat-completion/)

## 当前规划相关摘录

- 官方 Vision 文档（2026-10-10 查阅）说明 `deepseek-flash` 支持图片输入；当前代码以它作为默认模型 ID。
- Vision 文档列出 JPEG、PNG、GIF 和 WebP；图片可用 Base64 `data:` URL 或公开 URL 提交。一次请求可包含多张图片。
- 图片会缩放后转为 token 计费；文档说明单张图片最多约 1,024 个输入 token。
- JSON 模式需设置 `response_format: {"type":"json_object"}`，并在提示词中明确要求输出 JSON；代码会校验和解析返回内容。
- 价格会变化，费用依赖输入 token、输出 token、缓存情况和调用时间。
- 线上每次照片比较目前最多使用 1 张新图片和 5 张候选图片；这与早期按 10 张候选计算的粗略费用估算不同。不要把旧估算当作当前报价；正式实验前按实际模型、图片尺寸、输出和 API 控制台用量重新核算。
