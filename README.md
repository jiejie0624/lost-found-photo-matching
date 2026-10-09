# 拾见：失物照片配对 FYP

中文本地 MVP：发布失物或拾获记录，上传照片，并按类别、照片描述、地点和时间排列可能的配对记录。

## 启动

需要 Python 3.10 或更新版本。在项目目录的 PowerShell 中运行：

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

然后打开 <http://127.0.0.1:8000>。

## 手机浏览器

页面会在窄屏下切换为单列布局，表单控件也适合触屏。手机可以用浏览器打开；若要在同一 Wi-Fi 下用手机访问电脑上的开发服务器，可运行：

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

在电脑上运行 `ipconfig`，找到当前 Wi-Fi 的 IPv4 地址，再在手机浏览器打开 `http://电脑的IPv4地址:8000`。此原型没有登录保护，只在可信的本地网络中临时演示，不要将其直接暴露到公网。

没有 DeepSeek API 密钥时，仍可使用表单类别、颜色、地点和时间进行基础匹配。启用照片分析前，在当前 PowerShell 会话设置密钥：

```powershell
$env:DEEPSEEK_API_KEY = "你的 DeepSeek API 密钥"
python -m uvicorn app.main:app --reload
```

默认模型为 `deepseek-flash`，也可通过 `DEEPSEEK_MODEL` 环境变量修改。密钥只在后端读取。

登录使用 Neon Auth。需要在 Neon 启用 Auth，并提供 Auth URL。应用支持 `NEON_AUTH_BASE_URL`、Vercel Neon 集成的 `DATABASE_NEON_AUTH_BASE_URL` 或 `DATABASE_VITE_NEON_AUTH_URL`；JWKS 地址会从 Auth URL 推导，也可通过 `NEON_AUTH_JWKS_URL` 或 `DATABASE_NEON_AUTH_JWKS_URL` 覆盖。没有 Auth URL 时仍可浏览公开记录，但不能登录或发布。Vercel 过期清理还需要 `CRON_SECRET`。

## 当前范围

- SQLite 数据库位于 `work/app_data/lost_found.sqlite3`。
- 图片在后端去除 EXIF 后保存到 `work/app_data/uploads/`。
- Neon Auth 启用后，用户需要登录才能发布；公开浏览无需登录。每条新记录会绑定账号，用户可以关闭或删除自己的记录。
- 记录会在发布 90 天后自动清理；Vercel 每日运行一次过期清理任务，同时删除对应的 Vercel Blob 图片。
- 配置 DeepSeek 后，发布记录时提取照片属性；再从文字排序选出的最多 5 条候选中读取照片，让模型比较外观并重排。未配置或调用失败时退回属性排序。
- 匹配分数是启发式与视觉比较组成的参考分，不是经过研究验证的概率或准确率。

## 云端公开演示

Vercel 部署和数据存储设计见 [`outputs/PUBLIC_DEPLOYMENT_GUIDE.md`](outputs/PUBLIC_DEPLOYMENT_GUIDE.md)。Neon PostgreSQL 保存记录、Vercel Blob 保存照片，Neon Auth 负责登录。启用登录时，需要在 Neon 开启 Auth，并确认部署环境包含 Neon Auth URL（支持 Neon 集成生成的 `DATABASE_` 前缀）；每日清理还需要 `CRON_SECRET`。

## 离线排序评估

在项目根目录创建私有数据目录并复制模板；`work/` 不会提交到 Git。`vision_*` 列填照片分析得到的属性，其他表单列用作基线信息。

```powershell
New-Item -ItemType Directory -Force work/evaluation
Copy-Item outputs/records_template.csv work/evaluation/records.csv
Copy-Item outputs/pair_labels_template.csv work/evaluation/pair_labels.csv
```

在项目根目录运行：

```powershell
python scripts/evaluate_rankings.py --records work/evaluation/records.csv --pairs work/evaluation/pair_labels.csv --split test --details-out work/evaluation/ranking_details.csv
```

脚本在相同的已标注候选集合上比较表单基线和加入视觉属性的方法，输出 Hit Rate@5、Recall@5 和 MRR@5。默认只纳入高置信度标签，`uncertain` 配对不会计入指标；可用 `--min-confidence medium` 做敏感性分析。`--details-out` 会保存每个候选的名次、参考分、标签和排序依据，供错误分析。调权重时使用 `development` 集；不要根据 `test` 结果继续调整。

## 参考

- 项目上下文、计划及约束：[`outputs/PROJECT_CONTEXT.md`](outputs/PROJECT_CONTEXT.md)
- FYP Proposal 草案：[`outputs/FYP_PROPOSAL_DRAFT.md`](outputs/FYP_PROPOSAL_DRAFT.md)
- 决策记录：[`outputs/DECISIONS.md`](outputs/DECISIONS.md)
- DeepSeek 官方参考：[`outputs/API_REFERENCES.md`](outputs/API_REFERENCES.md)
- 系统架构：[`outputs/SYSTEM_ARCHITECTURE.md`](outputs/SYSTEM_ARCHITECTURE.md)
- 匹配算法：[`outputs/MATCHING_ALGORITHM.md`](outputs/MATCHING_ALGORITHM.md)
- 研究评估方案：[`outputs/RESEARCH_AND_EVALUATION_PLAN.md`](outputs/RESEARCH_AND_EVALUATION_PLAN.md)
- 数据集与标注指南：[`outputs/DATASET_AND_ANNOTATION_GUIDE.md`](outputs/DATASET_AND_ANNOTATION_GUIDE.md)
- 文献综述起步笔记：[`outputs/LITERATURE_REVIEW_STARTER.md`](outputs/LITERATURE_REVIEW_STARTER.md)
- 相关工作对照表：[`outputs/RELATED_WORK_MATRIX.md`](outputs/RELATED_WORK_MATRIX.md)
- 公开演示部署指南：[`outputs/PUBLIC_DEPLOYMENT_GUIDE.md`](outputs/PUBLIC_DEPLOYMENT_GUIDE.md)
