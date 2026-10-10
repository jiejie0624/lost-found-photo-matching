# 文献检索记录（起步版）

> 状态：定向网络检索记录，不是系统综述，也不证明研究空缺。检索与更新日期：2026-10-10 至 2026-10-11。检索者：FYP 学生。使用一般网络搜索发现论文，再打开出版社、会议、期刊或 arXiv 原始页面核对可见书目信息/摘要；没有系统检索 Scopus、Web of Science、ACM DL、IEEE Xplore 全库或学校订阅数据库，没有执行正式去重。

## 已执行的定向检索

| 检索式 | 用途/结果 | 后续处理 |
| --- | --- | --- |
| `site:ieeexplore.ieee.org lost found object image retrieval lost item matching lost found photo retrieval` | 找到 IEEE IRCE 2025 的 YOLO/LLM/CLIP 级联论文；目前只核实 IEEE 页面摘要。 | 取得全文，抽取数据、基线、Top-K 指标、消融和划分。 |
| `site:ieeexplore.ieee.org "AI-Enabled Lost and Found System With Adaptive Retrieval"` | 发现 Weerakoon et al. (2026) IEEE ICHORA 论文；摘要描述不确定性感知级联检索、FAISS 类别过滤后 CLIP 重排，并包含输入质量/安全监测模块。 | 获取全文核查检索标签、候选池、对照、拆分和检索指标；摘要中的输入校验准确率及安全监测 AUC 不能当作检索效果。 |
| `site:dl.acm.org lost and found image matching retrieval items` | 本轮没有确认 ACM 出版的直接相关论文。 | 之后在 ACM DL 以同义词和引用追踪重查；本结果不能说明 ACM 无相关工作。 |
| `"lost and found" "image retrieval" item matching system` | 找到 LostNet、Ghazal 等失物图片检索工作，以及图像分类/排名与视觉 API 线索。 | 查看引用链，区分实例匹配、类别分类和系统论文。 |
| `2024 2025 lost and found object image matching paper multimodal retrieval` | 找到 IEEE 2025 YOLO/LLM/CLIP 论文；另发现通用实例检索 IDMR (2025)。 | 前者查全文；后者仅用于界定“同一实例”任务，不作为失物领域证据。 |
| `lost and found AI framework smart cities image matching dlib` | 发现 IEEE MEDCOM 2025 的 *An AI-Driven Intelligent Communication Framework for Lost-and-Found Services in Smart Cities*。摘要描述 Android/Flask/MongoDB 与照片/文字信息；提及 dlib 人脸识别，但摘要未说清它是否用于具体物品配对。 | 获取全文，确认系统任务、dlib 的用途、数据和检索评估；摘要没有样本数或可核验的配对指标。 |
| `lost-and-found visual matching dataset`（OpenAlex 定向书目检索后核出版方） | 找到 Dhanawardhana et al. (2025) 的 SBERT + Siamese 多模态失物配对研究；已读出版方开放全文。 | 全文已核实：文字描述为合成数据，融合数据仅 170 条且时间特征随机生成；报告的融合分类数字在摘要/结果段落间不一致。需把它作为直接相关先例，并避免直接比较分类准确率与本 FYP 的 Top-K 排序指标。 |
| `"Lost item identification model development using similarity prediction method with CNN ResNet algorithm"` / DOI `10.32629/jai.v7i2.1381` | 找到 Prawira & Saputri 的 2024 期刊全文 PDF；全文说明 ResNet-50 图像特征/欧氏距离、NLP 文字预处理/余弦相似度，并把两者用于失物报告匹配。 | 已读全文：文中报 3,400 张四类物品图片、训练/验证 80/20；另报验证分类准确率 96.4%，阈值图像匹配正确率 29.96%、文字匹配正确率 97.92%。三类指标的任务不同；配对标签分母、候选池排名指标和按实物身份划分方式没有充分说明。不得把 96.4% 当作实例检索结果。 |
| `"Deep Learning-Based Image Retrieval System for School Lost and Found"` | 结果主要是非学术汇报材料，没有确认可引用的正式论文。 | 暂不纳入核心证据；若导师提供题名/来源再核查。 |
| `"lost property" image matching dataset retrieval academic paper lost and found benchmark dataset` | 发现 IEICE 2022 只以图片登记/检索论文。 | 目前只核实官方英文摘要；须查全文及其可用性研究设计。 |
| `lost and found item matching dataset paired images public dataset` | 发现 LostNet 论文数据声明链接到 Figshare 公共记录；另筛除道路遗落货物数据集，因为任务不是日常失物配对。 | 更新核查：论文主要报告图像分类；Figshare 列出代码、模型和 `test.zip`，但同实物配对标签/候选池并未确认，技术说明下载返回 HTTP 403。不能视为已确认适用的数据集。 |
| `public paired object instance image dataset different views lighting CC BY` | 找到 Stanford 发布的 CUTE（Common paired objects Under differenT Extrinsics）数据集及其数据说明。 | 已核实官方数据说明将目录结构作为对象身份标签，列明 CC BY 4.0；适合冻结方法的辅助视觉压力测试。它不是失物招领数据，也没有地点/时间元数据，不能替代主要研究数据。论文、数据说明和本次检查的档案条目数不一致。 |
| `2026-10-11 public lost-found dataset availability license ground-truth check` | 对照 PLOS 原文、Figshare API 元数据、Figshare 文件下载响应、Stanford CUTE 官方论文/数据说明和道路场景 LostAndFound 数据集说明。 | 本次仍未确认可直接用于主研究的公开、可访问且带同实物 lost-found 配对标签的数据。GitHub 上的原型仓库没有经过数据来源/标签/许可核验，不纳入候选。 |
| `site:arxiv.org "lost and found" item retrieval image matching` | 发现 IDMR 等同实例多模态检索工作；也命中与日常失物系统无关的多目标跟踪论文。 | 仅保留任务相关来源；记录排除理由，不把标题中 “Lost and Found” 当作相关性依据。 |
| `"Proposal and Evaluation of a Lost Property Registration and Retrieval System" PDF` / `"MVE2021-52" PDF Hirose` | 搜索到 IEICE 官方技术报告页面，未取得可核实的全文 PDF。 | 通过学校图书馆或作者正式渠道找全文；不要推测其指标。 |
| `"Lost and Found Registration and Inquiry Management System" "19" "25" 2018 pdf` / `"Automatic Image Classification and Ranking System" "Lost and Found" Jeong` | 找到 DBpia 期刊页面，确认 2018 年、作者/期刊页码和摘要，全文访问受限。 | 通过学校图书馆取得全文；补充层级分类数据、排名定义、可用性样本与结果。 |
| `photo matching algorithms top-k known identity ranking evaluation dataset effects` | 找到 Matthé et al. (2017) 同一实例照片匹配算法比较研究，已读 PMC 开放全文。 | 该研究比较四种算法和多个两栖动物照片库，以已知配对 rank-CDF 报告 Top-1/Top-10 识别率；不同算法/数据库的 Top-10 结果从 22.6% 到 100%。可支持“必须在目标数据上评估”的方法论理由，但动物纹理识别与普通失物照片不同，不能移作本 FYP 基线、性能预期或直接领域先例。 |
| `site:aissmsioitesci.edu.in 2026 ESCI "Automated Lost and Found Retrieval System"`；按题名核对 IEEE DOI 与 JST J-GLOBAL | 确认 **Automated Lost & Found Retrieval System Using Deep learning and Geospatial Analysis** 为 2026 IEEE ESCI 会议论文；会议日程列出题名，JST J-GLOBAL 记录列出 6 位作者、2026 年及 1–6 页，IEEE DOI 为 `10.1109/ESCI68015.2026.11493387`。IEEE Xplore 页面本轮被机器人验证拦截。 | 这是新增的直接相关研究，进一步排除“失物照片检索系统尚不存在”的宽泛主张。暂不记录算法、数据量、结果或评估协议：IEEE 全文/摘要页未能读取，网络检索中的非出版方摘要不作为方法证据。下一步通过 IEEE 正式全文或学校图书馆核实 CLIP/地理搜索、样本、标签、基线、排名指标和按物品身份划分；研究空缺继续标为未确认。 [IEEE DOI](https://doi.org/10.1109/ESCI68015.2026.11493387) · [IEEE Xplore](https://ieeexplore.ieee.org/document/11493387) · [JST J-GLOBAL](https://jglobal.jst.go.jp/en/detail?JGLOBAL_ID=202602258697791670) · [会议日程](https://aissmsioitesci.edu.in/wp-content/uploads/2026/02/IEEE-ESCI-2026-Conference-Schedule.pdf) |
| `site:mdpi.com/2071-1050/18/15/7688 lost and found matching evaluation` | 发现 Alruzuq et al. (2026) 的 Riyadh Metro AI digital-twin 原型，包含乘客与员工使用的 AI 辅助 Lost & Found 流程。 | 核对 MDPI 出版方页面和可检索到的论文内容：论文展示 6 个代表性配对情景，并称这些示例的预期/实际判定一致；未找到固定查询候选池、同实物标签集、身份隔离划分或 Hit Rate@K/MRR 等检索结果。它是相关系统原型证据，不是受控检索性能证据，也进一步排除“已经没有端到端 AI 失物服务”的宽泛主张。页面部分区域本次无法直接加载，正式引用前仍应下载/逐节核全文。 [MDPI](https://www.mdpi.com/2071-1050/18/15/7688) · [DOI](https://doi.org/10.3390/su18157688) |

## 当前筛选出的核心来源

| 来源 | 可核实证据 | 当前限制/待查 |
| --- | --- | --- |
| Ghazal et al. (2016), 多特征失物检索 | 机构仓储/论文摘要列文字、GIS、SURF、L*a*b*；摘要报告小型数据和 accuracy/precision/recall。 | 核对全文指标分母、标签、候选池、划分；与同团队 2015 FiCloud 版本比较是否重复。 |
| Zhou et al. (2024), LostNet | PLOS ONE 全文可读；包含类别分类与感知哈希候选排序。 | 需将分类指标与实例检索排名指标分开；核查测试集物品身份隔离和数据增强描述。 |
| Jeong et al. (2018), 层级分类与加权排名 | DBpia 出版方页面及摘要。 | 无可核实的配对检索数值和数据细节；全文未取得。 |
| Hirose et al. (2022), 只用图片登记的失物检索 | IEICE 出版方页面/英文摘要；使用 Google Cloud Vision API，摘要称进行了 usability study。 | 全文为日语且尚未取得；未知配对标注、检索指标、样本和易用性方法。 |
| Das et al. (2026), MobileNet 嵌入检索 | Springer 出版方摘要。 | 未取得全文；数值、样本和拆分方式未知。 |
| IEEE IRCE (2025), YOLO/LLM/CLIP | IEEE 出版方摘要描述多阶段多模态检索。 | 未取得全文；数据、指标、消融、比较基线未知。 |
| IEEE MEDCOM (2025), **An AI-Driven Intelligent Communication Framework for Lost-and-Found Services in Smart Cities** | IEEE 摘要描述 Android 前端、Flask 后端、dlib 人脸识别库、MongoDB，以及图片/描述登记与找回流程；摘要声称初步实验改善找回时间、可扩展性和用户满意度。 | 仅摘要级证据；没有给出样本数、对照、指标数值或同一实物配对协议。摘要未说明人脸识别在物品找回中的具体用途，须读全文，不能把摘要的主张当作已验证的照片配对效果。 DOI: [10.1109/MEDCOM67532.2025.11405255](https://doi.org/10.1109/MEDCOM67532.2025.11405255)。 |
| Dhanawardhana et al. (2025), **Enhancing Lost and Found Systems with Multi-Modal Deep Learning: Integrating SBERT and Siamese Networks for Improved Semantic Matching** | 已读期刊出版方开放全文。研究实现 SBERT 文字相似、MobileNetV2 Siamese 图片相似和融合模型，并加入地点/时间。 | 文字数据 2,600 对由模板脚本生成；848 张包袋图按 283 个具体袋子分组、每组至少两张；融合特征数据共 170 条，文中称时间相似度用随机值模拟。摘要报 fusion accuracy 0.87/F1 0.98，但结果章节给出的验证/混淆矩阵和 F1 叙述彼此不一致；指标是配对分类而非固定候选池 Top-K 排名。 | 这是与本项目“文字+图片+地点/时间融合”最接近的直接先例，排除了把多模态融合本身当作新颖点的说法。其数据与报告限制提示候选 FYP 应在相同、按实物隔离的候选池上评估 Hit Rate@K/Recall@K/MRR@K，并记录 API 成本/时延；这种研究空缺仍须继续检索与导师确认。 [全文 PDF](https://www.oajaiml.com/uploads/archivepdf/299052212.pdf) · [DOI](https://doi.org/10.54364/AAIML.2025.52212)。 |
| Prawira & Saputri (2024), **Lost item identification model development using similarity prediction method with CNN ResNet algorithm**，*Journal of Autonomous Intelligence, 7*(2) | 已读论文全文副本。以 ResNet-50 提取图像特征、欧氏距离衡量图像相似；以 NLP 预处理和余弦相似度衡量文字相似，并把两者用于失物/拾获报告匹配。 | 文中称数据集有 3,400 张、来自手机、相机、眼镜和帽子等类别；有些类别采用旋转/翻转/亮度增强。80/20 是模型训练/验证描述，但按同一实物身份隔离的测试协议没有说明。论文分别报告 ResNet 验证分类准确率 96.4%、图像阈值匹配正确率 29.96%、文字阈值匹配正确率 97.92%；这些数字对应不同任务，配对分母和固定候选池排名未充分说明。原文另称仅 2 位潜在用户参与原型测试。 | 这是传统深度视觉嵌入加文本相似度的直接失物配对先例，排除了把“图片相似度与文字匹配结合”本身称为新颖。它没有充分报告与本 FYP 相同的固定候选池 Top-K 配对排名和身份隔离；该协议差别可作为待核实的研究比较方向，不等于已证明研究空缺。 [全文 PDF 副本](https://pdfs.semanticscholar.org/5f6b/8c20f604763404a1f51be376d8a528e749bc.pdf) · [DOI](https://doi.org/10.32629/jai.v7i2.1381)。 |
| Matthé et al. (2017), **Comparison of photo-matching algorithms commonly used for photographic capture–recapture studies**，*Ecology and Evolution* | 比较 Wild-ID、I3S Pattern+、APHIS 和 AmphIdent 的已知同个体照片排序。 | 多个两栖动物图像库上计算已知配对排名的 CDF；不同算法/数据库的 Top-10 识别率范围为 22.6%–100%。 | 跨领域方法先例，支持用已知身份配对的 rank-CDF/Top-K 评估，并说明结果受数据库与算法影响；可支持“目标数据上需单独评估”。 | 动物花纹匹配不同于普通物品外观配对；其数值不能作失物系统的基准或预期。 [PMC 全文](https://pmc.ncbi.nlm.nih.gov/articles/PMC5552938/) · [DOI](https://doi.org/10.1002/ece3.3140)。 |
| Weerakoon et al. (2026), IEEE ICHORA, **AI-Enabled Lost and Found System With Adaptive Retrieval and Intelligent Security Monitoring** | IEEE 摘要描述不确定性感知级联检索，用类别受限 FAISS 检索与 CLIP 语义重排，并整合输入质量检查和安全监测。Crossref 核对作者、会议和 DOI。 | 尚未取得全文；IEEE 记录未提供参考文献。摘要提到的 500 次提交 94% 是输入校验结果，不是失物配对检索指标；安全监测 AUC 也不能说明 Top-K 配对效果。需核实数据、检索基线、身份隔离和消融。 DOI: [10.1109/ICHORA69329.2026.11537024](https://doi.org/10.1109/ICHORA69329.2026.11537024)。 |
| Chinchmalatpure et al. (2026), IEEE ESCI, **Automated Lost & Found Retrieval System Using Deep learning and Geospatial Analysis** | IEEE DOI、会议日程和 JST J-GLOBAL 书目记录确认题名、会议和 2026 年论文记录；本轮 IEEE Xplore 全文页被机器人验证拦截。 | 当前没有可核实的出版方摘要/全文内容，因此不写入任何算法、数据或性能数字。 | 这是新的直接相关工作；“失物图像检索/地理信息搜索”不能作为未被研究的研究空缺。要先取得全文，再决定它与本项目的可比点和本项目还剩下的研究问题。 | 书目线索来自 JST J-GLOBAL，会议日程可证明报告安排；不能替代 IEEE 全文。检索引擎出现的第三方摘要未用作方法证据。 [IEEE DOI](https://doi.org/10.1109/ESCI68015.2026.11493387) · [IEEE Xplore](https://ieeexplore.ieee.org/document/11493387) · [JST J-GLOBAL](https://jglobal.jst.go.jp/en/detail?JGLOBAL_ID=202602258697791670) |
| Liu et al. (2025), IDMR | arXiv 预印本摘要明确定义跨场景的同实例检索，并提出 IDMR-bench。 | 通用视觉检索而非失物系统；仅支持任务定义，不支持 DeepSeek 或本 FYP 的效果结论。 |

## 公开数据集适用性核查（2026-10-11）

LostNet 论文称数据为保密/私有数据，报告 10,499 张图片并描述 70/30 训练/验证拆分，评估主要针对分类；论文数据声明同时链接 Figshare ([PLOS 原文](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0310998)、[Figshare DOI](https://doi.org/10.6084/m9.figshare.24826740.v2))。Figshare API 元数据显示许可为 CC BY 4.0，列有模型代码、权重、技术说明和 138,655,905 字节的 `test.zip`。本次用官方文件链接读取 2.8 KB 技术说明收到 HTTP 403，没有下载或检查图像压缩包。更关键的是，现有出版方文字没有说明该文件提供可用于本项目的同实物 lost-found 配对标签、固定候选池或身份隔离 test split。96.8% 是论文报告的测试准确率，不可解释为同实物 Top-K 检索结果。因此 LostNet 目前**不符合主评估数据的已验证标准**；只有取得可读数据与标签说明后，才能重新审核，不应将类别数据转成配对真值。

筛选时也发现 `LostAndFoundDataset` 和 Fishyscapes Lost & Found 属于道路场景中的遗落货物/异常检测，不等同于日常物品失物招领配对，故不作为本项目的直接配对数据集。

Stanford CUTE ([官方代码与数据说明](https://github.com/s-tian/CUTE)、[Stanford 数据仓储](https://purl.stanford.edu/gj714cj0414)、[NeurIPS 2023 论文](https://papers.nips.cc/paper_files/paper/2023/file/803c6ab3d62346e004ef70211d2d15b8-Paper-Datasets_and_Benchmarks.pdf)) 旨在测量对象内在相似度。官方数据说明称 10,000 张图，目录结构记录同一物件不同姿态/光照图片，许可 CC BY 4.0，且建议作为测试集；NeurIPS 论文称 18,000 张、180 件实物。此前对 Stanford ZIP64 档案的 HTTP Range 清点得到 19,002 个目录条目（17,804 个 JPG、67 个 `.DS_Store`），与 10,000 和 18,000 均不一致，原因未明；没有下载完整 31,446,083,987 字节档案。已读取一张 `instance_1/.../in_the_wild/` 样例，尺寸 4032×3024。CUTE 可作为**冻结方案后的辅助同实例视觉压力测试候选**，只评估图片层面；不可用于调参，不能检验地点/时间/表单融合、失物招领候选池或真实用户找回效果。使用前仍需依据档案内容解析身份分组、核对许可归属，并确认导师认可及是否允许将图片发给 DeepSeek。

`LostAndFoundDataset` 的官方说明将其定义为道路上遗落小障碍检测，具有 112 段立体视频和 2,104 个标注帧；其许可禁止再分发及商业使用 ([数据集卡片及许可](https://huggingface.co/datasets/iis-esslingen/LostAndFoundDataset))。该任务、标注单元及许可都不适合作为本 FYP 日常物品配对主数据。Fishyscapes Lost & Found 同属道路场景异常检测，也不等同日常物品配对。

**数据集决策：** 目前没有确认一个公开且可访问、具有同实物 lost-found 标签、能形成同一候选池并可按实物身份切分的数据集。因此不能开始主研究评估或报告模型效果。导师/学校批准前，继续准备空白模板和匿名数据工具；如导师接受，可在独立说明范围后将 CUTE 用作补充图像压力测试，不将其冒充主数据。GitHub 上的个人原型或合成数据仓库即使 README 声称有真值，也没有完成数据来源、标签与许可审查，本项目不据此引用其结果或使用其数据。

## 暂定结论与检索空缺

已查到多种失物系统采用了图像分类、加权排名、感知哈希、ResNet 欧氏距离加文本余弦相似度、视觉 API、YOLO/LLM/CLIP 级联、SBERT/Siamese 的文字/图片/地点/时间融合，以及包含 Lost & Found 流程的智能交通原型；因此不能声称“首个失物照片配对系统”“首次把视觉与元数据结合”或“首次做端到端 AI 失物服务”。Prawira & Saputri (2024) 的分类准确率和阈值匹配结果不可与 Top-K 检索指标混用；Alruzuq et al. (2026) 报告的 6 个代表性情景也不是固定候选池检索基准。可继续核实的具体比较问题是：在同一组有可靠同实物标签、含困难负例且按物品身份隔离的候选集合上，是否有研究公平比较表单基线、API 提取的结构化视觉属性和照片直接重排，并报告 Hit Rate@K、Recall@K、MRR@K 及运行成本。

本轮读到 Dhanawardhana et al. (2025) 的多模态融合全文，且核对 Alruzuq et al. (2026) 的智能交通原型摘要和可检索页面内容：前者使用合成文字、随机时间相似特征和 170 条融合样本且报告分类；后者有 AI 失物流程及 6 个示例情景，但没有受控候选排序指标。因此“多模态失物检索/融合方法缺失”或“无人实现端到端 AI 失物服务”均不能作为研究空缺。可检验的窄问题仍是：是否有研究在同一人工配对集合、同一候选池上对 A 表单、B API 提取的结构化视觉属性、C 候选照片比较做受控增量排序，并按实物身份隔离、报告 Top-K 指标及运行成本。现有证据尚不足以回答“没有”，必须继续系统检索并请导师确认。

这一点目前只是**待查的问题**，并非已证明的空白。系统检索至少还需要：

1. 在 Scopus/Web of Science 或学校认可数据库、IEEE Xplore、ACM DL、Google Scholar 分别检索，并记录每次完整查询式、日期、结果数和筛选理由。
2. 搜索同义词：`lost property`, `lost item`, `lost-and-found`, `found item`, `object instance retrieval`, `same-instance matching`, `visual re-identification`, `image-based retrieval`, `multimodal ranking`。
3. 回溯 Ghazal 2015/2016、LostNet、IEICE 2022、韩国 2018、Springer 2026、Dhanawardhana et al. 2025、IEEE IRCE/MEDCOM 2025 和 IEEE ICHORA 2026 的参考文献和引用论文，合并重复版本并保留排除理由。
4. 取得付费/日语/韩语论文全文后，抽取数据来源、正例是否同一实物、候选池、基线、测试划分、指标、用户研究人数与限制；若全文无法取得，继续标为摘要级证据。
5. 完成导师确认后，再把证据支持的范围写进 proposal；在此之前不使用“首次”“没有研究过”或“已证明有效”等说法。

## 可复核链接

- [Ghazal et al. (2016) 机构仓储](https://repository.adu.ac.ae/items/50e44846-18b5-4d8b-a629-e9e85abec7c7)
- [LostNet, PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0310998)
- [LostNet Figshare 数据记录](https://doi.org/10.6084/m9.figshare.24826740.v2)
- [LostAndFoundDataset（道路场景数据集）](https://huggingface.co/datasets/iis-esslingen/LostAndFoundDataset)
- [Fishyscapes Lost & Found 验证集](https://zenodo.org/records/6511227)
- [Jeong et al. (2018), DBpia](https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE10088974)
- [Hirose et al. (2022), IEICE](https://ken.ieice.org/ken/paper/20220309ICJm/eng/)
- [Das et al. (2026), Springer](https://link.springer.com/chapter/10.1007/978-981-96-6046-9_32)
- [IEEE IRCE (2025)](https://ieeexplore.ieee.org/document/11203217/)
- [IEEE MEDCOM (2025), AI-Driven Intelligent Communication Framework](https://ieeexplore.ieee.org/document/11405255/)
- [Dhanawardhana et al. (2025), SBERT + Siamese fusion, publisher full text](https://www.oajaiml.com/uploads/archivepdf/299052212.pdf)
- [Weerakoon et al. (2026), IEEE ICHORA](https://doi.org/10.1109/ICHORA69329.2026.11537024)
- [Alruzuq et al. (2026), AI-powered Riyadh Metro digital twin and Lost & Found, MDPI](https://www.mdpi.com/2071-1050/18/15/7688) · [DOI](https://doi.org/10.3390/su18157688)
- [IDMR, arXiv:2504.00954](https://arxiv.org/abs/2504.00954)
