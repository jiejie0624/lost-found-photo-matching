# 文献综述起步笔记：失物照片配对

> 本文件是文献阅读起点，不是完整或系统性的文献综述。整理日期：2026-10-10。正式论文引用前，请再次核对版本、页码和学校引用格式。

2026-10-10 做过定向网页检索，查找 lost-and-found image matching、lost object image retrieval 和多模态检索论文；实际检索式和筛选状态见 [`LITERATURE_SEARCH_LOG.md`](LITERATURE_SEARCH_LOG.md)。此次没有按系统综述流程覆盖多个学术数据库、执行去重或完整记录纳入/排除，不能据此声称检索穷尽或研究空缺已确认。

## 暂定主题

研究怎样把照片中可见的物品特征，与用户填写的类别、地点和大概时间结合起来，给失物记录排列可能的拾获记录。系统只提供候选提示，最终由用户判断。

## 建议先读的资料

### 1. 直接相关：LostNet

Zhou, M., Fung, I., Yang, L., Wan, N., Di, K., & Wang, T. (2024). “LostNet: A smart way for lost and find.” *PLOS ONE, 19*(10), e0310998. https://doi.org/10.1371/journal.pone.0310998

- **研究做法：** 使用 MobileNetV2、CBAM 和感知哈希处理失物照片；论文还描述了线上识别系统。
- **数据与报告：** 论文称数据集为私有数据集，报告 10 个物品类别、共 10,499 张照片和 70%/30% 训练/验证划分；原文对数据增强和总数的关系表述不清。论文报告的 96.8% 是类别分类准确率。论文数据声明链接一个公开 Figshare 文件记录，但压缩包尚未检查；论文已核对的公开方法/评估描述没有报告同一实物配对标签、Top-K 配对检索指标或独立测试集身份隔离，不能据此认定它可直接供本 FYP 做配对评估。
- **对本项目的启发：** 失物照片匹配已有直接相关工作，因此不要把“用 AI 配对失物”本身当作创新点。可以重点研究表单资料加视觉属性能否改善候选排序，以及真实配对数据的标注与评估。
- **比较时的限制：** 论文的模型实验主要报告图像分类指标；其系统流程还会先按类别筛选照片，再用感知哈希给候选排序。因此它不是“只有分类”的工作，但 96.8% 分类准确率仍不能直接与本项目的 Top-K 配对排序结果相比。论文没有在已核对段落中说明以物品身份隔离的测试划分。
- **勘误：** PLOS 在 2024-11-26 发布勘误，只更正作者单位；引用前仍应核对原论文书目信息。[PLOS 勘误](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0314697)

### 2. 直接相关：文字、地点与多特征照片匹配

Ghazal, M., Alkhalil, Y., Ali, S. S., Haneefa, F., & Rashed, E. (2016). “Archival and Retrieval of Lost Objects using Multi-feature Image Matching in Mobile Applications.” *International Journal of Computing and Digital Systems, 5*(1). [大学仓储记录](https://repository.adu.ac.ae/items/50e44846-18b5-4d8b-a629-e9e85abec7c7) · [DOI](https://doi.org/10.12785/IJCDS/050107)

- **研究做法：** 摘要列出文字搜索、GIS 地理过滤、SURF 图像匹配，以及 L*a*b* 颜色验证。
- **数据与报告：** 仓储摘要称以 40 件失物对 50 件拾获记录做实验，并报告 accuracy 95%、precision 100%、recall 90%。
- **关键影响：** 这是与“地点/文字＋照片”组合非常接近的早期工作；不能再把该组合本身写成研究空缺。
- **阅读限制：** 目前尚未核实全文中的标签定义、候选池、划分、公式和指标单位。这些数字不能直接与本项目的 Hit Rate@5、Recall@5 或 MRR@5 比较。

另有作者重叠、题名接近的 FiCloud 2015 会议论文 “Mobile-Based Archival and Retrieval of Missing Objects Using Image Matching” （DOI: [10.1109/FiCloud.2015.80](https://doi.org/10.1109/FiCloud.2015.80)），摘要称其以 SURF 匹配失物与拾获照片。需比较两篇全文，确认是否同一系统/数据的扩展版本，避免重复计数。

### 3. 直接相关：MobileNet 图像嵌入检索

Das, M., Biswas, R., Barik, D., & Ghosh, D. (2026). “Building a Smarter Lost and Found Systems: Leveraging TensorFlow.js for Image-Based Item Matching.” In *Data Mining and Information Security (ICDMIS 2024)*, Lecture Notes in Networks and Systems, 1385, 509–536. [Springer 页面](https://link.springer.com/chapter/10.1007/978-981-96-6046-9_32)

- **年份说明：** Springer 的正式引用格式列为 2026；页面同时注明 2025-10-02 首次在线发布，会议论文集为 ICDMIS 2024。参考文献请按学校格式使用正式引用年份。
- **研究做法：** 公开摘要描述使用 TensorFlow.js 和预训练 MobileNet 生成图像嵌入，以欧氏距离检索相似物品，并可按用户设定的阈值过滤。
- **阅读限制：** 当前只能核实出版方公开摘要；摘要没有展示可复核的数据量和具体排序数字。需通过学校图书馆获取全文后再比较评估设计。

### 4. 图像检索评估：Oxford / Paris 基准

Radenović, F., Iscen, A., Tolias, G., Avrithis, Y., & Chum, O. (2018). “Revisiting Oxford and Paris: Large-Scale Image Retrieval Benchmarking.” *Proceedings of CVPR 2018*, 5706–5715. [CVF Open Access 论文页](https://openaccess.thecvf.com/content_cvpr_2018/html/Radenovic_Revisiting_Oxford_and_CVPR_2018_paper.html)

- **研究重点：** 重新检查图像检索基准的标注可靠性、数据规模和难度，并设置不同难度的评估协议及干扰图像。
- **对本项目的启发：** 评估不只取决于排序算法；正确配对标签是否可靠、候选是否足够相似、测试划分是否公平，也会影响结论。数据集中应保留困难负例，并记录不确定标签。

### 5. 跨模态视觉表示：CLIP

Radford, A., et al. (2021). “Learning Transferable Visual Models From Natural Language Supervision.” [arXiv:2103.00020](https://arxiv.org/abs/2103.00020)

- **研究重点：** 从大量图像与文字配对中学习视觉表示，支持用文字描述视觉概念并迁移到不同任务。
- **对本项目的启发：** 图像与文字描述可以在共同表示空间中比较，未来可作为结构化视觉属性方法的替代基线。
- **限制：** 该论文不是失物数据集上的配对评估，也不证明 CLIP 或任何视觉模型能认出同一件外观相似的物品。当前 MVP 仍应先完成已计划的表单基线与视觉属性排序比较。

### 6. 排序指标：TREC 的 MRR 定义

Voorhees, E. M. (2001). “The TREC-10 Question Answering Track Report.” 见 NIST 的 [TREC-10 Measures 附录](https://trec.nist.gov/pubs/trec10/appendices/measures.pdf)。

- **指标含义：** 对每个查询，取第一个正确结果排名的倒数；若限定前 K 名而没有正确结果，则该查询记为 0；再对所有查询取平均。
- **对本项目的启发：** MRR@5 可以反映正确候选是否靠前；Hit Rate@5 可以报告前五名中是否出现正确配对。若每条查询可有多个正确配对，还应同时报告 Recall@5。
- **限制：** 指标定义来自问答检索任务；本项目要在自己的配对标签上明确定义“正确”，并报告样本数量和不确定性。

### 7. 近期多模态失物检索：YOLO、LLM 与 CLIP

“Cascaded YOLO-LLM-CLIP Model for Robust Multimodal Retrieval in Intelligent Lost & Found System.” *2025 8th International Conference on Intelligent Robotics and Control Engineering (IRCE)*. DOI: [10.1109/IRCE66030.2025.11203217](https://doi.org/10.1109/IRCE66030.2025.11203217). [IEEE Xplore 摘要](https://ieeexplore.ieee.org/document/11203217/)

- **研究做法：** IEEE 摘要描述 YOLOv12、LLM 与 CLIP 的级联，用于小目标、文字描述增强和跨模态检索。
- **阅读限制：** 当前只核实摘要；未取得足够的样本、基线、划分、消融或 Top-K 数字。不能据摘要判断效果大小或与本项目比较。

2026 年 IEEE ICHORA 又发表 Weerakoon et al. 的 *AI-Enabled Lost and Found System With Adaptive Retrieval and Intelligent Security Monitoring*（[DOI](https://doi.org/10.1109/ICHORA69329.2026.11537024)）。IEEE 摘要描述不确定性感知的级联检索：类别受限 FAISS 检索后由 CLIP 重排，并整合输入质量检查与安全监测。摘要的 94% 准确率对应 500 次提交的输入校验，不是配对检索结果；监控模块的 AUC 同样不能当作匹配指标。当前只核实 IEEE 摘要与 Crossref 书目，全文和检索评估方案待查。此文进一步说明“多模态/自适应失物检索”不构成新颖性；本研究问题须聚焦在同一人工配对、同一候选池下 A/B/C 排序增量能否得到可复核评估。

另有 IEEE MEDCOM 2025 论文 *An AI-Driven Intelligent Communication Framework for Lost-and-Found Services in Smart Cities*（[DOI](https://doi.org/10.1109/MEDCOM67532.2025.11405255)）。出版方摘要提到 Android 前端、Flask 后端、MongoDB、图片与文字登记，以及 dlib 人脸识别库；摘要称初步实验改善找回时间、可扩展性和用户满意度，但没有样本数或可核实的检索指标。摘要没有说明人脸识别具体用于物品配对的哪一步，且 IEEE 全文页面本次访问触发 JavaScript 验证，尚未读全文。应将它视为直接相关的系统工作线索，而不是其照片配对效果或本项目研究空缺的证据。

2026 年 Alruzuq 等人在 Riyadh Metro 智能数字孪生原型中也集成乘客/员工使用的 AI Lost & Found 流程（[MDPI 出版方页面](https://www.mdpi.com/2071-1050/18/15/7688)；*Sustainability*, 18(15), 7688；[DOI](https://doi.org/10.3390/su18157688)）。系统将乘客失物报告与员工登记拾获物交叉匹配，并在员工确认后用 OTP 处理领取。论文的失物模块只展示 6 个代表性情景，并称这些展示的预期与实际判定一致；没有说明固定候选池、同实物标签数据集、身份隔离测试或 Top-K 检索指标。故它进一步排除“端到端 AI 失物服务无人实现”的宽泛主张，但六个示例不能证明排序效果。当前据出版方页面/检索正文片段整理，需正式引用前核对全文。

### 7.1 直接相关：SBERT、Siamese 图片模型与时空融合（2025）

Dhanawardhana, B. M. P., Chalana, K. A. D., Abeywardena, I. D. S. P., Lankasena, N., & Paul, M. H. (2025). “Enhancing Lost and Found Systems with Multi-Modal Deep Learning: Integrating SBERT and Siamese Networks for Improved Semantic Matching.” *Advances in Artificial Intelligence and Machine Learning, 5*(2), 3736–3754. [出版方全文 PDF](https://www.oajaiml.com/uploads/archivepdf/299052212.pdf) · [DOI](https://doi.org/10.54364/AAIML.2025.52212)

- **研究方法：** 全文描述以 SBERT 比较描述文本、MobileNetV2 Siamese 网络比较包袋图片，并把两类相似度与地点/时间特征送入融合分类器；最终系统为 PWA。它已覆盖文字、图片、地点和时间的联合匹配，所以本 FYP 不能把这种组合本身当作新颖性。
- **数据：** 文中称文字配对共 2,600 条，由 Python 模板脚本生成，训练/测试划分为 1,799/801；848 张包袋图片对应 283 个包袋身份，每个身份至少两张不同角度/光照图片。融合模型使用 170 条配对特征，文中明确说时间相似度以随机值模拟。
- **评估与限制：** 论文以配对分类准确率/F1 报告效果，不是同一固定候选池上的 Hit Rate@K、Recall@K 或 MRR@K。摘要、讨论与结果段落对融合模型的 accuracy/F1 以及混淆矩阵数量报告不一致；不能将某一个数字选作可信基准。需在引用结果前由研究者回看表格/图与切分，记录这一报告不一致。
- **对本 FYP 的启发：** 可检验的问题更窄：在同一、按物品身份隔离并经人工确认的候选池上，比较用户表单、DeepSeek 提取视觉属性、以及 DeepSeek 对候选照片直接比较的 Top-K 排序增量，并报告实际调用成本/时延。该方向与这篇工作的方法不同，但是否足够新颖仍须系统检索并由导师确认。

### 7.2 直接相关：ResNet 图像特征加文字相似度（2024）

Prawira, J., & Saputri, T. R. D. (2024). “Lost item identification model development using similarity prediction method with CNN ResNet algorithm.” *Journal of Autonomous Intelligence, 7*(2). [全文 PDF 副本](https://pdfs.semanticscholar.org/5f6b/8c20f604763404a1f51be376d8a528e749bc.pdf) · [DOI](https://doi.org/10.32629/jai.v7i2.1381)

- **研究方法：** 以 ResNet-50 提取图片特征、欧氏距离衡量图像相似；用 NLP 预处理用户描述并以余弦相似度算文本相似，再把图像和文字用于失物/拾获报告匹配。这表明 CNN 图像比较加文字相似度的总体路线已有直接先例。
- **数据与切分：** 论文称数据集共 3,400 张图片，涵盖手机、相机、眼镜和帽子等；部分图像通过旋转、翻转和亮度变换扩充。训练/验证比例写为 80/20，但未充分说明同一实物的照片是否隔离到单一 split，也未清晰交代匹配配对测试集的构成。
- **不能混用的结果：** 论文报告 ResNet 验证分类准确率 96.4%，另报告图像阈值匹配“正确率” 29.96%、文字阈值匹配正确率 97.92%。这三个数不是同一个任务：分类准确率不是同一实物检索排名指标；后两者的配对分母、正负定义和候选池排名未充分说明。原型问卷/场景测试仅有 2 位潜在用户，不能支持广泛易用性或检索效果结论。
- **对本 FYP 的启发：** 不应以“首次组合视觉相似与文字”主张创新。可比较的问题仍是 DeepSeek 提取的结构化属性和候选照片直接比较能否在同一人工标注、按实物身份隔离的候选池中提升 Top-K 排名；这个差别尚须系统检索并让导师确认，不是已证实的研究空缺。

### 8. 直接相关：图像分类与加权排名（2018）

Jeong, H. et al. (2018). “Lost and Found Registration and Inquiry Management System for User-dependent Interface using Automatic Image Classification and Ranking System based on Deep Learning.” *Journal of the Korea Convergence Security Association, 18*(4), 19–25. [DBpia 出版方页面](https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE10088974)

- **研究做法：** 摘要描述以深度学习进行层级图片分类，并用权重排名整理失物信息；登记时还尝试从一张照片自动识别类别、品牌和相关标签。
- **对本项目的影响：** “从照片自动取得类别/品牌并排序”的总体想法已有相关先例。FYP 应强调可复现的配对排序比较，而非声称图像自动分类/排名本身是新颖贡献。
- **阅读限制：** 当前仅核实 DBpia 的书目信息与摘要，页面没有给出可复核的配对数据、Top-K 指标或身份隔离测试细节；不要拿其“可用性”结论当作本项目的检索效果证据。

### 9. 直接相关：只用图片登记并进行失物检索（2022）

Hirose, K., Hara, T., & Saito, H. (2022). “Proposal and Evaluation of a Lost Property Registration and Retrieval System in Which Only Images Are Registered.” *IEICE Technical Report*, 121(423), MVE2021-52, 70–75. [IEICE 出版方记录](https://ken.ieice.org/ken/paper/20220309ICJm/eng/)

- **研究做法：** IEICE 摘要说明拾获者只提交图片，系统用 Google Cloud Vision API 自动分析，再按成为目标失物的可能性排序；作者报告进行过可用性研究。
- **对本项目的影响：** 已有工作不仅做图片分类，也研究过视觉 API 驱动的失物登记/检索和可用性；不能把“用视觉 API 减少手填”或“做一个系统”作为已证实的新颖点。
- **阅读限制：** 当前只核实 IEICE 官方书目和摘要，摘要未给出 Top-K 排序指标、配对标签细节、数据规模或对照基线。论文语言为日语，需取得全文再核对方法。

### 10. 通用多模态检索：同类不等于同一件实物

Liu, B. et al. (2025). “IDMR: Towards Instance-Driven Precise Visual Correspondence in Multimodal Retrieval.” [arXiv:2504.00954](https://arxiv.org/abs/2504.00954)

- **研究重点：** 作者将任务定义为跨场景检索同一个具体实例，并明确区别于全局图像相似或类别层级匹配；其 IDMR-bench 基于真实物体追踪和第一人称视频资料。
- **对本项目的影响：** 失物配对的正例应代表同一件实物；同类别、同颜色但不同物品是重要困难负例。只识别“这是水瓶”并不等于识别“这是同一个水瓶”。
- **限制：** 这是通用多模态检索预印本，不是失物/拾获数据上的研究，也不证明 DeepSeek API 能可靠完成具体物品身份匹配。可用其支持任务定义，不可用来声称本方法有效。

### 11. 相邻领域的已知同实例照片排序评估（2017）

Matthé, M., Sannolo, M., Winiarski, K., Spitzen-van der Sluijs, A., Goedbloed, D., Steinfartz, S., & Stachow, U. (2017). “Comparison of photo-matching algorithms commonly used for photographic capture–recapture studies.” *Ecology and Evolution, 7*(15), 5861–5872. [PMC 开放全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC5552938/) · [DOI](https://doi.org/10.1002/ece3.3140)

- **研究方法：** 在多个有已知配对的两栖动物照片库中比较四种照片同个体算法，按全库候选计算正确配对排名与 rank-CDF，并报告 Top-1/Top-10 识别率。
- **发现与限制：** 摘要报告不同算法和照片库的 Top-10 识别率从 22.6% 到 100% 不等；表现随算法、图像库和图像质量变化。此任务是动物个体花纹识别，采集条件和目标特征与日常失物不同，数值不能作为本 FYP 基线或预期。
- **对本 FYP 的启发：** 有可靠身份标签后，Top-K 排名能表达人工需要查看前几张候选的目标；应在本研究数据上实测，而不是从其他任务移植准确率。这支持评估方法选择，不证明本项目的研究空缺或新颖性。

### 12. 通用物品同实例视觉基准与公开数据限制（2023）

Kotar, K., Tian, S., Yu, H.-X., Yamins, D. L. K., & Wu, J. (2023). “Are These the Same Apple? Comparing Images Based on Object Intrinsics.” *NeurIPS 2023 Datasets and Benchmarks*. [论文](https://proceedings.neurips.cc/paper_files/paper/2023/file/803c6ab3d62346e004ef70211d2d15b8-Paper-Datasets_and_Benchmarks.pdf) · [维护者数据说明](https://github.com/s-tian/CUTE/blob/main/datasheet.md)

- **研究重点：** CUTE 用常见实物在不同姿态、光照和拍摄环境中的照片，研究视觉方法能否根据物品本身的特征而非背景判断身份；提出 Foreground Feature Averaging，并比较预训练图像特征与前景筛选方法。
- **与本 FYP 的关系：** 它直接支持把“同类物品”与“同一件实物”分开定义，也提示背景和成像条件可能干扰照片比较。论文摘要称 18,000 张图片、180 件实物，但维护者数据说明写 10,000 张，公开来源数字不一致。仅用 HTTP Range 读取约 31.4 GB ZIP 的 ZIP64 目录（19,002 项，17,804 个 JPEG、67 个 `.DS_Store`）和一张样例 JPEG，成功解压；归档图数与两项官方数字仍不一致，原因未查明。目录样例包含 `instance_1/.../in_the_wild/`，支持身份/环境分组的初步核验，但未下载完整档案。
- **限制与使用边界：** CUTE 没有失物/拾获方向、地点、时间和用户描述，不能替代本项目的主要数据集。若导师认可且数据核验可行，只能作为冻结方法的补充同实例视觉测试，不用于调参，也不应把其效果外推为真实失物系统效果。引用需按 CC BY 4.0 署名；使用 DeepSeek 前还需学校批准第三方图像处理。数据数量差异尚未解决。

## 当前研究问题的文献定位（暂定）

现有资料已包括把文字和 GIS 过滤与 SURF、颜色验证结合的系统、图像分类与加权排名、只用图片和视觉 API 的失物检索、LostNet 的类别筛选与感知哈希、MobileNet 嵌入检索、YOLO/LLM/CLIP 与不确定性感知级联、SBERT/Siamese 时空融合，以及智能交通数字孪生中的端到端 AI 失物服务。因此不能声称“首次把照片与地点/时间结合”“此前没有失物照片检索”“首次用视觉语言模型做失物匹配”或“首个完整 AI 失物服务”。通用实例检索文献也指出同类相似与同一实物匹配不是同一任务。对本项目更具体、可检验但尚未证实新颖的问题可以表述为：

> 在相同查询、候选记录和人工配对标签下，加入照片提取的结构化属性，或对初筛候选做照片直接比较，是否比只使用用户填写的类别、地点、时间和说明，更常把正确的失物/拾获记录排入前 5 名？

目前不声称这是“首个”或“尚无人研究”的问题。要在论文中提出研究空缺，仍需系统搜索数据库和会议论文，取得早期多特征、IEEE/Springer、IEICE 与韩文学术论文全文，并与导师讨论范围。可能的具体贡献是：在同一组跨场景、同一实物身份有可靠标签的查询/候选数据上，公平比较表单基线、视觉属性增强方法，以及对初筛候选做照片直接比较的方法，并分析困难负例、错误案例、费用和响应时间。此定位仍属暂定，须经系统检索和导师确认。

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

1. 保留已经规划的表单基线、视觉属性方法和候选照片比较方法，使用完全相同的候选集合和查询标签。
2. 以物品身份为单位划分开发集和测试集，避免同一物品或近重复图片跨集合。
3. 用 Hit Rate@5、Recall@5、MRR@5 评估排序，不用分类准确率代替检索指标。
4. 把高置信度正例、确认负例与无法确认的候选分开保存；不把未知候选直接当负例。
5. 记录模型、提示词、数据划分、API 用量、失败率和响应时间，便于复现与费用分析。

## 参考来源

- Zhou et al. (2024), PLOS ONE: https://doi.org/10.1371/journal.pone.0310998
- Ghazal et al. (2015), FiCloud: https://doi.org/10.1109/FiCloud.2015.80
- Ghazal et al. (2016), IJCDS: https://doi.org/10.12785/IJCDS/050107
- IEEE IRCE (2025), YOLO-LLM-CLIP: https://doi.org/10.1109/IRCE66030.2025.11203217
- IEEE MEDCOM (2025), AI-Driven Intelligent Communication Framework: https://doi.org/10.1109/MEDCOM67532.2025.11405255
- Weerakoon et al. (2026), IEEE ICHORA: https://doi.org/10.1109/ICHORA69329.2026.11537024
- Alruzuq et al. (2026), Riyadh Metro digital twin with AI Lost & Found: https://doi.org/10.3390/su18157688
- Jeong et al. (2018), Journal of the Korea Convergence Security Association, DBpia record: https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE10088974
- Hirose, Hara, & Saito (2022), IEICE Technical Report: https://ken.ieice.org/ken/paper/20220309ICJm/eng/
- Liu et al. (2025), IDMR, arXiv:2504.00954: https://arxiv.org/abs/2504.00954
- Das et al. (2026; first online 2025), Springer: https://doi.org/10.1007/978-981-96-6046-9_32
- Radenović et al. (2018), CVPR / CVF Open Access: https://openaccess.thecvf.com/content_cvpr_2018/html/Radenovic_Revisiting_Oxford_and_CVPR_2018_paper.html
- Kotar et al. (2023), NeurIPS Datasets and Benchmarks, CUTE object-intrinsics benchmark: https://proceedings.neurips.cc/paper_files/paper/2023/file/803c6ab3d62346e004ef70211d2d15b8-Paper-Datasets_and_Benchmarks.pdf
- CUTE maintainer dataset datasheet: https://github.com/s-tian/CUTE/blob/main/datasheet.md
- Radford et al. (2021), arXiv: https://arxiv.org/abs/2103.00020
- TREC-10 Measures, NIST: https://trec.nist.gov/pubs/trec10/appendices/measures.pdf
