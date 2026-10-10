# 第二章：相关研究（草稿）

> 状态：依据现有阅读笔记整理的中文草稿，不是系统综述或最终论文。正式提交前须按学校格式核对书目信息、补充数据库检索与筛选记录，并取得导师对研究范围的意见。文中“研究空缺”均为待检验的问题，不代表已证明没有先前研究。

## 2.1 本研究的任务定义

失物照片配对可以被看作一个候选检索与排序问题：输入一条失物记录，在同一候选集合中排列可能对应的拾获记录。每条记录可能同时含照片、类别、颜色、说明、粗略地点和时间。系统输出候选顺序供用户查看，不判定物品所有权。

需要区分“同一类别”与“同一件实物”。两张照片都显示蓝色水瓶，只能说明类别和外观属性接近，并不能证明是同一个水瓶。因而，研究标签应尽可能由了解实物来源的人确认；仅有类别、颜色或文字相似的配对不应直接标为正例。对候选检索而言，可靠的同实物标签和候选集合定义与模型选择同样重要。

本草案将评价任务定义为固定候选池上的 Top-K 排序。方法 A 使用用户提交的表单信息；方法 B 在 A 上增加照片提取的结构化属性；方法 C 先按 B 初筛，再比较查询照片与有限数量的候选照片。建议唯一确认性主要比较为 C 对 A 的 Hit Rate@5 差值，B 对 A 和 C 对 B 用于描述组件增量。这个研究设计仍须导师确认。

## 2.2 失物招领系统中的图像检索

早期系统已经探索把图像和其他线索用于失物检索。Ghazal 等人的摘要描述了文字搜索、GIS 地理过滤、SURF 局部特征匹配和 L*a*b* 颜色验证，并报告了小规模失物/拾获记录实验。[机构仓储摘要](https://repository.adu.ac.ae/items/50e44846-18b5-4d8b-a629-e9e85abec7c7)中的结果单位、标签构造和候选排名协议仍需通过全文核对。因此，这项工作足以说明“文字/地点与图片结合”并非新想法，却不足以作为本项目 Top-K 结果的直接基准。

Hirose、Hara 与 Saito 提出只需提交拾获物照片的登记与检索系统，摘要称系统使用 Google Cloud Vision API 自动分析图片，并按可能性显示搜索结果，且做过可用性研究。[IEICE 英文摘要](https://ken.ieice.org/ken/paper/20220309ICJm/eng/)没有展示可核实的配对标签细节、候选池规模或 Top-K 数值；全文为日文，当前材料尚不足以比较其评估协议。这一工作同样提示，使用视觉 API 分析失物图片已有先例。

Zhou 等人的 LostNet 结合 MobileNetV2、CBAM 与感知哈希，并实现线上失物识别框架；论文摘要报告测试准确率为 96.8%。[PLOS ONE 全文](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0310998)同时描述了图片分类与候选相似度排序。分类准确率不能直接解释为“正确失物配对进入前五名的比例”，两种任务的标签单位和评价过程不同。论文链接的公开数据也不能仅凭数据可下载就视为适合本研究：数据标签、身份隔离和候选池仍需逐项核实。PLOS 的勘误只更正作者单位，[勘误记录](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0314697)。

Prawira 与 Saputri 将 ResNet-50 图片特征与自然语言文本相似度用于失物报告匹配；现有阅读笔记记录论文分别报告了分类准确率和阈值匹配数值。[论文记录及全文副本](https://doi.org/10.32629/jai.v7i2.1381)显示，这些指标对应不同任务，且身份隔离的测试划分和固定候选池排名细节不充分。因此应分别陈述分类、阈值配对与 Top-K 排序结果，不能互换这些数字。

较新的 Dhanawardhana 等人把 SBERT 描述相似度、MobileNetV2 Siamese 图片相似度与地点/时间特征组合为失物招领 PWA。[出版方全文](https://www.oajaiml.com/uploads/archivepdf/299052212.pdf)报告文字配对由模板脚本生成、包袋图片按物品身份分组，并使用较小的融合特征数据；时间相似特征有随机模拟。该研究证明文字、图片和时空融合已有直接先例。论文以配对分类指标报告结果，并且不同章节的融合结果数字不一致；故它不能为本研究的固定候选池 Top-K 排名提供可直接比较的性能基准。

IEEE IRCE 2025 的摘要描述 YOLO、LLM 与 CLIP 级联；IEEE MEDCOM 2025 摘要描述面向城市失物服务的系统；IEEE ICHORA 2026 摘要描述类别受限 FAISS 检索后以 CLIP 重排及安全监测。这些摘要表明，当前研究也在采用级联和多模态检索。[IRCE 摘要](https://ieeexplore.ieee.org/document/11203217/) · [MEDCOM 摘要](https://ieeexplore.ieee.org/document/11405255/) · [ICHORA DOI 记录](https://doi.org/10.1109/ICHORA69329.2026.11537024)。由于当前仅核实公开摘要或书目信息，样本、拆分、消融和检索指标仍属未知，不能据摘要推断其方法效果或本研究的创新性。

Alruzuq 等人（2026）进一步在 Riyadh Metro 的智能数字孪生原型中加入乘客与员工使用的 AI 失物招领流程。[出版方页面](https://www.mdpi.com/2071-1050/18/15/7688)说明系统使用 AI 匹配乘客的失物报告与员工登记的拾获物，并用 OTP 做确认后的交接；失物模块报告了六个代表性情景，称示例预期和实际判定一致。该页面没有展示有身份真值的配对数据集、固定候选池或 Top-K 检索指标，因此这些情景应视作功能示例，不能当作受控检索性能验证。它也意味着“此前没有完整 AI 失物服务”的主张不成立。当前核实来自出版方页面及可检索正文片段，正式引用前仍需逐节核查全文。

## 2.3 同一实物的视觉相似性

通用实例识别研究强调，视觉系统需要从光照、姿态、背景和拍摄条件的变化中识别物品本身的稳定特征。Kotar 等人提出 CUTE 数据集，论文称其包含 18,000 张、覆盖 180 件物品的照片，并比较预训练特征和前景处理方法。[NeurIPS 论文摘要](https://proceedings.neurips.cc/paper_files/paper/2023/hash/803c6ab3d62346e004ef70211d2d15b8-Abstract-Datasets_and_Benchmarks.html)；维护者数据说明则称共有 10,000 张图像，身份关系隐含在目录结构中，并说明整个数据集意图作为测试集、许可为 CC BY 4.0。[CUTE 数据说明](https://github.com/s-tian/CUTE/blob/main/datasheet.md)。

本项目仅通过 HTTP Range 检查了 CUTE ZIP64 目录和一张样例图，没有下载完整档案；实际目录中发现 17,804 个 JPEG。该数量与论文和维护者说明的数量都不一致，原因未查明。这项差异必须在任何数据描述中明示。即便该公开数据经导师认可，它也没有失物/拾获方向、用户说明、地点或时间，最多适合作为冻结方法的补充视觉测试，不能替代本项目的失物配对数据或用于推断现实找回效果。

Oxford/Paris 图像检索基准的修订工作展示了标签可靠性、难度协议和干扰候选对方法比较的重要性。[CVPR 论文](https://openaccess.thecvf.com/content_cvpr_2018/html/Radenovic_Revisiting_Oxford_and_Paris_2018_paper.html)重新检查了基准标注，并加入不同难度协议与大量困难干扰项。该基准研究的是地点图像，不是日常物品；可借鉴的是评估设计原则，而不是把其数据或数值当作本项目结果。

动物个体照片匹配也使用已知身份配对的排名评价。Matthé 等人比较多种两栖动物照片匹配算法，发现 Top-10 识别表现会随算法和图像数据库明显改变。[全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC5552938/)支持在目标数据上单独检验排序器，并报告候选进入短列表的情况；但动物斑纹识别与普通物品外观相似度不同，其具体表现数值不能转作本系统基准。

## 2.4 数据与评估设计

上述研究使用的任务和指标并不一致，至少包括物品类别分类、阈值化图片或文字配对、系统可用性评价和候选排序。单独报告分类准确率或模型相似分数，不能回答失主是否能在有限候选中看到正确拾获记录。因此，评估须先明确查询、候选池、同实物正例和已确认负例，并让 A/B/C 三种方法使用相同数据。

本项目建议为每条失物查询标注同一 split 中所有拾获候选。只把达到预先设定置信度的确认标签计为正例或负例；不确定候选仍进入排序池并占据名次。每一物品身份只能进入 development 或 test 其中一个集合，避免同一物品的不同照片跨集合。若数据来自多个参与者或共享拍摄批次，也应检查这类来源是否跨集合。

建议 Hit Rate@5 为唯一主要效果指标：它表示查询的前五名中至少出现一个已确认正例的比例。Recall@5 和 MRR@5 作为次要指标，分别补充多个正例的覆盖率和第一个正确结果的位置。方法差异可按物品身份组进行配对 cluster bootstrap，报告 95% 区间；物品组数量较少时，应谨慎解释区间。主要比较建议为 C 对 A，B 对 A 与 C 对 B 则作为次要组件分析。指标和统计方案须在查看最终 test 结果前由导师确认。

API 系统还应报告运行耗时、失败率、模型 API 名称、提示词版本、token 与实际费用。运行成本和模型调用成功率属于系统指标，不能取代检索效果指标。若研究图片未经学校许可不得发送到 DeepSeek，则应保留表单基线，并在获得批准前不处理真实研究图片。

## 2.5 综合讨论与暂定研究问题

现有证据排除了若干过宽的创新主张：失物系统使用图片检索、图片与文字/地点/时间融合、视觉 API 分析、多阶段图像检索、同实物照片排序，以及端到端 AI 失物招领服务都已有相关工作。Alruzuq 等人的智能交通原型包含六个失物示例，但没有展示受控候选排名评估；不同论文的任务、数据和划分差异很大，不能把分类准确率或功能示例与本项目的 Top-K 指标直接比较。

可继续调查的较窄问题是：在可靠的同一实物标签、困难负例和按身份隔离的固定候选池上，完整的 DeepSeek 视觉流程相较表单基线是否改善 Hit Rate@5；属性抽取和直接候选照片比较分别贡献多少；这种变化伴随多少 API 延迟、失败和费用。现有阅读尚未证明没有研究做过这一公平比较，因此该问题只能作为候选研究方向，必须通过学院认可的数据库系统检索和导师讨论后再作为正式研究空缺。

本章草稿的主要限制是：部分文献仍只有摘要级信息；Ghazal 与 FiCloud 两篇可能存在系统版本重叠，尚未通过全文比较；IEEE ICHORA、MEDCOM 和 IRCE 全文未全部取得；CUTE 档案统计与公开文档存在未解释差异；目前没有经批准的研究图片、配对标签或实验结果。论文最终版本应补充检索日期、数据库、完整检索式、去重和排除过程，并清楚区分实测结果、论文摘要主张与本项目尚待验证的假设。

## 参考文献与来源（格式待学校模板统一）

1. Ghazal, M., et al. (2016). “Archival and Retrieval of Lost Objects using Multi-feature Image Matching in Mobile Applications.” *International Journal of Computing and Digital Systems, 5*(1). [DOI](https://doi.org/10.12785/IJCDS/050107)
2. Hirose, K., Hara, T., & Saito, H. (2022). “Proposal and Evaluation of a Lost Property Registration and Retrieval System in Which Only Images Are Registered.” IEICE Technical Report, 121(423), 70–75. [IEICE](https://ken.ieice.org/ken/paper/20220309ICJm/eng/)
3. Zhou, M., Fung, I., Yang, L., Wan, N., Di, K., & Wang, T. (2024). “LostNet: A smart way for lost and find.” *PLOS ONE, 19*(10), e0310998. [DOI](https://doi.org/10.1371/journal.pone.0310998)
4. Prawira, J., & Saputri, T. R. D. (2024). “Lost item identification model development using similarity prediction method with CNN ResNet algorithm.” *Journal of Autonomous Intelligence, 7*(2). [DOI](https://doi.org/10.32629/jai.v7i2.1381)
5. Dhanawardhana, B. M. P., et al. (2025). “Enhancing Lost and Found Systems with Multi-Modal Deep Learning: Integrating SBERT and Siamese Networks for Improved Semantic Matching.” *Advances in Artificial Intelligence and Machine Learning, 5*(2), 3736–3754. [DOI](https://doi.org/10.54364/AAIML.2025.52212)
6. Kotar, K., Tian, S., Yu, H.-X., Yamins, D. L. K., & Wu, J. (2023). “Are These the Same Apple? Comparing Images Based on Object Intrinsics.” *NeurIPS 2023 Datasets and Benchmarks*. [论文](https://proceedings.neurips.cc/paper_files/paper/2023/file/803c6ab3d62346e004ef70211d2d15b8-Paper-Datasets_and_Benchmarks.pdf)
7. Radenović, F., Iscen, A., Tolias, G., Avrithis, Y., & Chum, O. (2018). “Revisiting Oxford and Paris: Large-Scale Image Retrieval Benchmarking.” *CVPR 2018*, 5706–5715. [CVF](https://openaccess.thecvf.com/content_cvpr_2018/html/Radenovic_Revisiting_Oxford_and_CVPR_2018_paper.html)
8. Matthé, M., et al. (2017). “Comparison of photo-matching algorithms commonly used for photographic capture–recapture studies.” *Ecology and Evolution*. [全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC5552938/)
9. Alruzuq, J., Alsuwayyid, M., Alajmi, H., Alfayez, H., & Alabduljabbar, R. (2026). “An AI-Powered Digital Twin Prototype for Predictive Crowd Management and Sustainable Operations in the Riyadh Metro.” *Sustainability, 18*(15), 7688. [出版方全文页面](https://www.mdpi.com/2071-1050/18/15/7688) · [DOI](https://doi.org/10.3390/su18157688)
