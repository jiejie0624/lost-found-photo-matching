# 拾见：失物照片配对 FYP

“拾见”是面向手机和电脑浏览器的失物照片配对 FYP 原型。网站已部署到 Vercel；本地也可使用 SQLite 与本地图片目录运行。

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

页面会在窄屏下切换为单列布局，表单控件也适合触屏。手机可直接打开公开网站；若要在同一 Wi-Fi 下用手机访问电脑上的开发服务器，可运行：

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

在电脑上运行 `ipconfig`，找到当前 Wi-Fi 的 IPv4 地址，再在手机浏览器打开 `http://电脑的IPv4地址:8000`。

没有 DeepSeek API 密钥时，仍可使用表单类别、颜色、地点和时间进行基础匹配。启用照片分析前，在当前 PowerShell 会话设置密钥：

```powershell
$env:DEEPSEEK_API_KEY = "你的 DeepSeek API 密钥"
python -m uvicorn app.main:app --reload
```

默认模型为 `deepseek-flash`，也可通过 `DEEPSEEK_MODEL` 环境变量修改。密钥只在后端读取。

登录使用 Neon Auth。当前公开部署已启用 Auth。若为本地环境或新分支配置，需提供 Auth URL；应用支持 `NEON_AUTH_BASE_URL`、Vercel Neon 集成的 `DATABASE_NEON_AUTH_BASE_URL` 或 `DATABASE_VITE_NEON_AUTH_URL`；JWKS 地址会从 Auth URL 推导，也可通过 `NEON_AUTH_JWKS_URL` 或 `DATABASE_NEON_AUTH_JWKS_URL` 覆盖。没有 Auth URL 时仍可浏览公开记录，但不能登录或发布。Vercel 过期清理还需要 `CRON_SECRET`。

## 当前应用功能

- 本地开发的 SQLite 数据库位于 `work/app_data/lost_found.sqlite3`；线上使用 Neon PostgreSQL。
- 本地图片在后端去除 EXIF 后保存到 `work/app_data/uploads/`；线上图片使用 Vercel Blob。
- Neon Auth 启用后，用户需要登录才能发布；公开浏览无需登录。每条新记录会绑定账号，用户可以在“我的记录”查看、关闭或删除自己的记录。
- 记录会在发布 90 天后自动清理；Vercel 每日运行一次过期清理任务，同时删除对应的 Vercel Blob 图片。
- 用户逐条明确同意后，配置 DeepSeek 才会提取该条照片属性；匹配时只会把双方均同意 AI 处理的候选照片发给模型比较，最多 5 条。未同意、未配置或调用失败时使用表单/属性排序。公开展示记录照片与发送到第三方 AI 是两种不同处理。
- 匹配分数是启发式与视觉比较组成的参考分，不是经过研究验证的概率或准确率。

开始招募参与者、收集真实研究照片或向第三方 AI 发送研究资料前，请先由导师/学校确认[伦理与数据处理草案](outputs/ETHICS_AND_DATA_HANDLING_DRAFT.md)及[导师讨论清单](outputs/SUPERVISOR_REVIEW_CHECKLIST.md)。这些材料不代表已获得批准。

受控物品配对数据的拍摄与标注流程草案见 [`outputs/CONTROLLED_DATA_COLLECTION_PROTOCOL_DRAFT.md`](outputs/CONTROLLED_DATA_COLLECTION_PROTOCOL_DRAFT.md)；正式采集前仍须完成学校/导师确认。

## 云端公开演示

Vercel 部署和数据存储设计见 [`outputs/PUBLIC_DEPLOYMENT_GUIDE.md`](outputs/PUBLIC_DEPLOYMENT_GUIDE.md)。Neon PostgreSQL 保存记录、Vercel Blob 保存照片，Neon Auth 负责登录。启用登录时，需要在 Neon 开启 Auth，并确认部署环境包含 Neon Auth URL（支持 Neon 集成生成的 `DATABASE_` 前缀）；每日清理还需要 `CRON_SECRET`。

## 离线排序评估

在项目根目录创建私有数据目录并复制模板；`work/` 不会提交到 Git。`vision_*` 列填照片分析得到的属性，其他表单列用作基线信息。

```powershell
New-Item -ItemType Directory -Force work/evaluation
Copy-Item outputs/records_template.csv work/evaluation/records.csv
Copy-Item outputs/pair_labels_template.csv work/evaluation/pair_labels.csv
Copy-Item outputs/photo_scores_template.csv work/evaluation/photo_scores.csv
Copy-Item outputs/experiment_log_template.csv work/evaluation/experiment_log.csv
```

填写并锁定 `records.csv` 的 `split` 后，为两位标注者分别生成完整、匿名的候选配对表（每份输出路径需是新文件）：

```powershell
python scripts/generate_annotation_pairs.py --records work/evaluation/records.csv --out work/evaluation/annotation_A01.csv --annotator-id A01
python scripts/generate_annotation_pairs.py --records work/evaluation/records.csv --out work/evaluation/annotation_A02.csv --annotator-id A02
```

两位标注者独立填完后，合并两份行到 `annotation_round.csv` 再计算一致性。生成器为每条 lost 记录列出同一 split 的所有 found 候选，标签和理由保持空白；默认最多 50,000 个配对，并且不覆盖已有文件。该工具不会生成 ground truth。

双人试标后，先按实际匿名 ID 汇总一致性；把 `A01`、`A02` 替换成两位标注者的 ID：

```powershell
python scripts/analyze_annotation_agreement.py --annotations work/evaluation/annotation_round.csv --annotator-a A01 --annotator-b A02
```

该工具报告双方共同标注的配对数、未重叠数量、原始一致率、三类混淆表和 Cohen's kappa。它不裁决标签。讨论并裁决后，人工整理为 `pair_labels.csv`，确保每个配对只有一行供评估脚本使用。`work/` 已加入 `.gitignore`，原始标注和研究数据不会被 Git 跟踪。

录入记录和配对标签后，先运行只读数据预检；它会检查编号、时间、分组、授权状态、配对方向和达到置信度门槛的正负例结构。视觉属性评估与照片分数加载时还会强制要求相关记录 `external_ai_consent=yes`。这些工具不能代替伦理审批，也不能确认标签是否真实：

```powershell
python scripts/validate_dataset.py --records work/evaluation/records.csv --pairs work/evaluation/pair_labels.csv
```

预检默认要求每个查询至少有一个高置信度正例和负例，与评估脚本默认设置一致。做敏感性分析时，可把两者都改成 `--min-confidence medium`。

不提供照片分数时，脚本比较表单基线和加入视觉属性的方法：

```powershell
python scripts/evaluate_rankings.py --records work/evaluation/records.csv --pairs work/evaluation/pair_labels.csv --split development --details-out work/evaluation/development_details.csv
```

在 `photo_scores.csv` 填入由固定模型、提示词和照片生成的候选直接比较分数后，可评估第三种方法。分数仅需覆盖视觉属性排序前五的候选：

```powershell
python scripts/evaluate_rankings.py --records work/evaluation/records.csv --pairs work/evaluation/pair_labels.csv --photo-scores work/evaluation/photo_scores.csv --split development --details-out work/evaluation/development_details.csv
```

第三种方法按线上当前规则把视觉属性分数的 45% 与照片比较分数的 55% 合并。评估脚本不会调用 DeepSeek；分数需先按学校批准的数据处理流程生成，并记录模型、提示词版本、日期和 API 用量。候选池是 `records.csv` 中同一 split 的全部拾获记录；每条失物记录都是一条查询，必须有池内每个候选的标签。`uncertain` 和低置信度候选仍参与排序并占据排名，但不作为正例或负例计入指标。默认只统计高置信度的 `0`/`1`，可用 `--min-confidence medium` 做敏感性分析。`--details-out` 会保存各方法的候选名次、参考分、标签置信度、是否计入指标和依据，供错误分析。只在 `development` 集调参；锁定方法后在 `test` 集做一次最终评估。

结果另列出按每条查询的完整候选池和已确认正例数精确计算的均匀随机排序期望值，作为候选池难度参考；它不是产品匹配方法，也不是实际 API 调用。

结果还会输出按 `item_group_id` 重抽样的配对 cluster bootstrap 95% 置信区间，比较表单、视觉方法、照片比较和随机参考线之间 Hit Rate@K、Recall@K 和 MRR@K 的差异。默认抽样 2,000 次；物品组较少时，区间仅作谨慎参考。

可把逐候选排名转成逐查询的人工错配复核表。表中列出前 K 名、漏掉的已确认正例、前 K 名中的已确认负例和未判定候选；原因和复核备注由研究者填写，不会自动推断。可自行使用一致的原因分类，例如视觉特征、类别、地点/时间、照片质量、标注不确定或其他：

```powershell
python scripts/analyze_ranking_errors.py --details work/evaluation/development_details.csv --out work/evaluation/development_error_review.csv --k 5
```

正式 test 结果应单独生成复核表。未判定候选也可能出现在前 K 名，因此阅读清单时不能把它们当作确认错配。

冻结方法后，在 test 数据和已固定的 test 照片分数上执行同样命令，将 `--split development` 改为 `--split test`，输出到单独的结果文件。不要根据 test 结果继续调整方法。

调用 DeepSeek 的 token、时延、失败和费用按 [`outputs/EXPERIMENT_LOG_GUIDE.md`](outputs/EXPERIMENT_LOG_GUIDE.md) 记录。模板只含表头；不得用未经批准的真实照片或个人资料做测试调用。

## FYP 尚未完成的部分

- 研究问题、数据来源、样本规模和评估范围需由导师确认；真实图片收集前需确认学校伦理与同意流程。
- 目前只有空白 CSV 模板，没有人工标注数据，也没有实验结果。
- 应用运行时会比较候选照片；离线评估脚本已支持导入预先计算的照片分数，但该方法尚未用真实研究数据评估。
- 用户测试、结果分析、正式论文和答辩材料仍待完成。

## 参考

- 项目上下文、计划及约束：[`outputs/PROJECT_CONTEXT.md`](outputs/PROJECT_CONTEXT.md)
- FYP Proposal 草案：[`outputs/FYP_PROPOSAL_DRAFT.md`](outputs/FYP_PROPOSAL_DRAFT.md)
- 论文写作路线图与证据清单：[`outputs/THESIS_WRITING_MAP.md`](outputs/THESIS_WRITING_MAP.md)
- 第一章草稿：[`outputs/THESIS_CHAPTER_1_DRAFT.md`](outputs/THESIS_CHAPTER_1_DRAFT.md)
- 第二章相关研究草稿：[`outputs/THESIS_CHAPTER_2_DRAFT.md`](outputs/THESIS_CHAPTER_2_DRAFT.md)
- 决策记录：[`outputs/DECISIONS.md`](outputs/DECISIONS.md)
- DeepSeek 官方参考：[`outputs/API_REFERENCES.md`](outputs/API_REFERENCES.md)
- 系统架构：[`outputs/SYSTEM_ARCHITECTURE.md`](outputs/SYSTEM_ARCHITECTURE.md)
- 匹配算法：[`outputs/MATCHING_ALGORITHM.md`](outputs/MATCHING_ALGORITHM.md)
- 研究评估方案：[`outputs/RESEARCH_AND_EVALUATION_PLAN.md`](outputs/RESEARCH_AND_EVALUATION_PLAN.md)
- 导师讨论与确认清单：[`outputs/SUPERVISOR_REVIEW_CHECKLIST.md`](outputs/SUPERVISOR_REVIEW_CHECKLIST.md)
- 参与者说明与同意清单工作模板：[`outputs/PARTICIPANT_INFORMATION_AND_CONSENT_DRAFT.md`](outputs/PARTICIPANT_INFORMATION_AND_CONSENT_DRAFT.md)
- 数据集与标注指南：[`outputs/DATASET_AND_ANNOTATION_GUIDE.md`](outputs/DATASET_AND_ANNOTATION_GUIDE.md)
- 双人标注一致性分析：[`scripts/analyze_annotation_agreement.py`](scripts/analyze_annotation_agreement.py)
- 完整匿名配对表生成：[`scripts/generate_annotation_pairs.py`](scripts/generate_annotation_pairs.py)
- 排名错配人工复核表：[`scripts/analyze_ranking_errors.py`](scripts/analyze_ranking_errors.py)
- API 实验调用日志指南：[`outputs/EXPERIMENT_LOG_GUIDE.md`](outputs/EXPERIMENT_LOG_GUIDE.md)
- 文献综述起步笔记：[`outputs/LITERATURE_REVIEW_STARTER.md`](outputs/LITERATURE_REVIEW_STARTER.md)
- 文献检索式、筛选决定与待查全文：[`outputs/LITERATURE_SEARCH_LOG.md`](outputs/LITERATURE_SEARCH_LOG.md)
- 相关工作对照表：[`outputs/RELATED_WORK_MATRIX.md`](outputs/RELATED_WORK_MATRIX.md)
- 公开演示部署指南：[`outputs/PUBLIC_DEPLOYMENT_GUIDE.md`](outputs/PUBLIC_DEPLOYMENT_GUIDE.md)
