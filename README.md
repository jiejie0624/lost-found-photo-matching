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

## 当前范围

- SQLite 数据库位于 `work/app_data/lost_found.sqlite3`。
- 图片在后端去除 EXIF 后保存到 `work/app_data/uploads/`。
- API 目前不做账号、认领验证、聊天或管理员审核，适用于本地原型演示，不适合直接公开部署。
- 视觉模型只在发布时提取一次属性；匹配排序由应用程序根据两条记录的信息计算，避免每次搜索都反复调用模型。
- 匹配分数是原型启发式排序，不是经过研究验证的概率或准确率。

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
