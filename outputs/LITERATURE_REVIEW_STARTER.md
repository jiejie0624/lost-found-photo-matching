# 文献综述起步笔记：失物照片配对

> 本文件是文献阅读起点，不是完整或系统性的文献综述。整理日期：2026-10-09。正式论文引用前，请再次核对版本、页码和学校引用格式。

## 暂定主题

研究怎样把照片中可见的物品特征，与用户填写的类别、地点和大概时间结合起来，给失物记录排列可能的拾获记录。系统只提供候选提示，最终由用户判断。

## 建议先读的资料

### 1. 直接相关：LostNet

Zhou, M., Fung, I., Yang, L., Wan, N., Di, K., & Wang, T. (2024). “LostNet: A smart way for lost and find.” *PLOS ONE, 19*(10), e0310998. https://doi.org/10.1371/journal.pone.0310998

- **研究做法：** 使用 MobileNetV2、CBAM 和感知哈希处理失物照片；论文还描述了线上识别系统。
- **数据与报告：** 论文报告了自建数据集、10 个物品类别及 10,499 张经增强的图像，并报告最高 96.8% 测试准确率。
- **对本项目的启发：** 失物照片匹配已有直接相关工作，因此不要把“用 AI 配对失物”本身当作创新点。可以重点研究表单资料加视觉属性能否改善候选排序，以及真实配对数据的标注与评估。
- **比较时的限制：** 论文主要报告图像分类准确率；本项目关注的是在每条查询下把正确记录排到前几名，并结合地点和时间。两个任务和指标不同，96.8% 不能直接当成本项目的目标或比较结果。

### 2. 图像检索评估：Oxford / Paris 基准

Radenović, F., Iscen, A., Tolias, G., Avrithis, Y., & Chum, O. (2018). “Revisiting Oxford and Paris: Large-Scale Image Retrieval Benchmarking.” *Proceedings of CVPR 2018*, 5706–5715. [CVF Open Access 论文页](https://openaccess.thecvf.com/content_cvpr_2018/html/Radenovic_Revisiting_Oxford_and_CVPR_2018_paper.html)

- **研究重点：** 重新检查图像检索基准的标注可靠性、数据规模和难度，并设置不同难度的评估协议及干扰图像。
- **对本项目的启发：** 评估不只取决于排序算法；正确配对标签是否可靠、候选是否足够相似、测试划分是否公平，也会影响结论。数据集中应保留困难负例，并记录不确定标签。

### 3. 跨模态视觉表示：CLIP

Radford, A., et al. (2021). “Learning Transferable Visual Models From Natural Language Supervision.” [arXiv:2103.00020](https://arxiv.org/abs/2103.00020)

- **研究重点：** 从大量图像与文字配对中学习视觉表示，支持用文字描述视觉概念并迁移到不同任务。
- **对本项目的启发：** 图像与文字描述可以在共同表示空间中比较，未来可作为结构化视觉属性方法的替代基线。
- **限制：** 该论文不是失物数据集上的配对评估，也不证明 CLIP 或任何视觉模型能认出同一件外观相似的物品。当前 MVP 仍应先完成已计划的表单基线与视觉属性排序比较。

### 4. 排序指标：TREC 的 MRR 定义

Voorhees, E. M. (2001). “The TREC-10 Question Answering Track Report.” 见 NIST 的 [TREC-10 Measures 附录](https://trec.nist.gov/pubs/trec10/appendices/measures.pdf)。

- **指标含义：** 对每个查询，取第一个正确结果排名的倒数；若限定前 K 名而没有正确结果，则该查询记为 0；再对所有查询取平均。
- **对本项目的启发：** MRR@5 可以反映正确候选是否靠前；Hit Rate@5 可以报告前五名中是否出现正确配对。若每条查询可有多个正确配对，还应同时报告 Recall@5。
- **限制：** 指标定义来自问答检索任务；本项目要在自己的配对标签上明确定义“正确”，并报告样本数量和不确定性。

## 当前研究问题的文献定位（暂定）

现有资料至少覆盖了两类工作：失物照片的分类或匹配系统，以及通用图像检索和视觉表示方法。对本项目最直接、可检验的问题可以表述为：

> 在相同查询、候选记录和人工配对标签下，加入照片提取的结构化属性，是否比只使用用户填写的类别、地点、时间和说明，更常把正确的失物/拾获记录排入前 5 名？

目前不声称这是“首个”或“尚无人研究”的问题。要在论文中提出研究空缺，仍需系统搜索数据库和会议论文，并与导师讨论范围。可能的具体贡献是：在本项目的数据和检索设定下，公平比较表单基线与视觉属性增强方法，并分析错误案例、费用和响应时间。

## 后续检索词

建议在 Google Scholar、ACM Digital Library、IEEE Xplore、Scopus 或学校订阅数据库组合检索：

- `lost and found image matching` / `lost property image retrieval`
- `lost item visual recognition matching dataset`
- `content-based image retrieval object instance matching`
- `multimodal retrieval image text metadata ranking`
- `image retrieval evaluation ground truth hard negatives`
- `CLIP image text retrieval benchmark`

记录每次检索日期、数据库、完整查询式、纳入与排除理由，并优先阅读原始论文及正式出版版本。不要只凭摘要或搜索结果写研究结论。

## 当前阅读后的设计建议

1. 保留已经规划的表单基线与视觉属性方法，使用完全相同的候选集合和查询标签。
2. 以物品身份为单位划分开发集和测试集，避免同一物品或近重复图片跨集合。
3. 用 Hit Rate@5、Recall@5、MRR@5 评估排序，不用分类准确率代替检索指标。
4. 把高置信度正例、确认负例与无法确认的候选分开保存；不把未知候选直接当负例。
5. 记录模型、提示词、数据划分、API 用量、失败率和响应时间，便于复现与费用分析。

## 参考来源

- Zhou et al. (2024), PLOS ONE: https://doi.org/10.1371/journal.pone.0310998
- Radenović et al. (2018), CVPR / CVF Open Access: https://openaccess.thecvf.com/content_cvpr_2018/html/Radenovic_Revisiting_Oxford_and_CVPR_2018_paper.html
- Radford et al. (2021), arXiv: https://arxiv.org/abs/2103.00020
- TREC-10 Measures, NIST: https://trec.nist.gov/pubs/trec10/appendices/measures.pdf
