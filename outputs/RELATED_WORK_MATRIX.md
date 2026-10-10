# 相关工作对照表（初稿）

> 整理日期：2026-10-10。此表用于确定 FYP 的比较范围，不是系统综述。部分付费论文目前只根据出版方公开的摘要整理；正式引用前应通过学校图书馆取得全文并核对方法、数据和实验细节。

| 工作 | 问题与方法 | 数据/评估（公开摘要或页面所述） | 与本 FYP 的关系 | 阅读时要留意 |
| --- | --- | --- | --- | --- |
| Ghazal et al. (2016), **Archival and Retrieval of Lost Objects using Multi-feature Image Matching in Mobile Applications**，IJCDS | 多平台失物系统；摘要列出文字搜索、GIS 过滤、SURF 图像匹配和 L*a*b* 颜色验证。 | 大学仓储摘要报告 40 件失物对 50 件拾获记录，准确率 95%、precision 100%、recall 90%。 | 与本项目的“文字/时空元数据＋照片特征”组合很接近；研究动机不能写成该组合尚未用于失物检索。 | 目前依据机构仓储摘要；指标定义、候选生成、标注规则和划分方式未核实全文。同一团队有 2015 年标题相近的 FiCloud 论文；应比对全文，确定内容/数据是否重叠，不能当成两份独立证据。[大学仓储记录](https://repository.adu.ac.ae/items/50e44846-18b5-4d8b-a629-e9e85abec7c7) · [DOI](https://doi.org/10.12785/IJCDS/050107) |
| **Mobile-Based Archival and Retrieval of Missing Objects Using Image Matching** (2015)，FiCloud | 手机失物/拾获系统，后端使用 SURF 匹配照片。 | 当前可读摘要没有可核实的样本数和排序指标。 | 是 2016 年相近工作的潜在早期版本；说明失物照片匹配已有传统计算机视觉路线。 | 作者重叠、题目相近，可能有内容重叠；取得 IEEE 全文比对后再决定是否作为独立系统计数。[IEEE DOI](https://doi.org/10.1109/FiCloud.2015.80) |
| Zhou et al. (2024), **LostNet**，PLOS ONE | MobileNetV2 与 CBAM 做失物类别识别；系统先按预测类别取候选照片，再用感知哈希按相似度排序。 | 论文称数据为私有数据集，报告 10 类、10,499 张照片和 70%/30% 训练/验证划分；最高 96.8% 是类别分类准确率。论文的数据声明另链接公开 Figshare 文件。 | 最直接的领域工作，证明已有失物图像分类与照片候选检索系统。 | 不能把它简化成“只有分类”；但论文公开描述没有报告同一实物配对标签、Top-K 配对检索指标或独立测试集身份隔离。公开 Figshare 压缩包尚未审查，不能当作本 FYP 已验证可用的数据集。 [PLOS ONE 全文](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0310998) · [Figshare 数据记录](https://doi.org/10.6084/m9.figshare.24826740.v2) |
| Das et al. (2026), **Building a Smarter Lost and Found Systems: Leveraging TensorFlow.js for Image-Based Item Matching**，Springer 会议论文 | 用 TensorFlow.js 和预训练 MobileNet 生成图像嵌入，以欧氏距离检索，并可按阈值过滤。 | 公开摘要没有可核实的数据量和具体排序数字。Springer 正式引用年份为 2026；首次在线日期为 2025-10-02；论文集系列为 ICDMIS 2024。 | 与本 FYP 同属查询照片检索；提供客户端嵌入检索的路线参照。 | 目前只读到出版方摘要，不能据此断言优于文本基线。需取得全文核实配对定义、候选集合、数据划分和指标。 [Springer 页面](https://link.springer.com/chapter/10.1007/978-981-96-6046-9_32) |
| **Cascaded YOLO-LLM-CLIP Model for Robust Multimodal Retrieval in Intelligent Lost & Found System** (2025)，IEEE IRCE | 摘要提出级联 YOLOv12、LLM 与 CLIP：检测小物体、改善文字描述，再做跨模态检索。 | IEEE 页面摘要称方法针对杂乱背景并采用模块融合；摘要未给出可核实的数据量、数字指标和消融结果。 | 说明近期也有多模态 lost-and-found 检索研究；因此不能把“使用视觉语言模型做失物匹配”作为新颖性。 | 当前依据 IEEE 摘要；需全文核实数据、基线、评估协议和数字结果。 [IEEE Xplore 页面](https://ieeexplore.ieee.org/document/11203217/) |
| **An AI-Driven Intelligent Communication Framework for Lost-and-Found Services in Smart Cities** (2025)，IEEE MEDCOM | 摘要描述 Android 前端、Flask 后端、MongoDB，以及以图片和描述登记、检索/找回；提到 dlib 人脸识别库。 | 摘要声称初步实验改善找回时间、可扩展性和用户满意度，但没有提供样本数、数字或可复核的配对检索指标。摘要未说明人脸识别是否用于物品配对。 | 又一个端到端 AI 失物服务框架，进一步表明“实现一个带图片/文字和 AI 的网站/应用”本身不足以构成新颖性。 | 仅核实 IEEE 摘要与 Crossref 书目；须读全文确认研究对象、dlib 用途、数据/标签和评估。 [IEEE Xplore](https://ieeexplore.ieee.org/document/11405255/) · [DOI](https://doi.org/10.1109/MEDCOM67532.2025.11405255) |
| **Enhancing Lost and Found Systems with Multi-Modal Deep Learning: Integrating SBERT and Siamese Networks for Improved Semantic Matching** (2025)，AAIML | 已读全文。以 SBERT 描述相似度、MobileNetV2 Siamese 包袋图片相似度和融合模型组合地点/时间特征，并实现 PWA。 | 文中称文字数据为 2,600 对模板生成描述；图像集含 848 张包袋图、283 个袋子身份；融合样本共 170 条，时间相似度由随机值模拟。论文报告不同段落的 fusion validation/confusion-matrix/F1 数字不一致，需谨慎对待。报告的是配对分类，不是固定候选池 Top-K 排名。 | 已有工作直接实现“文字+图片+地点/时间”融合，故该组合和多模态应用本身不是本 FYP 的新颖点。可考虑研究 API 视觉功能在受控同实物检索排序中的增量，并报告 Top-K、成本和延迟；是否构成研究空缺待导师和系统检索确认。 | 全文已核实数据生成和评估局限；样本仅袋类，融合标签/划分可复现细节有限，结果报告有内部矛盾。不可把论文所报准确率当作可靠基准或与本项目 Top-K 直接比较。 [出版方全文 PDF](https://www.oajaiml.com/uploads/archivepdf/299052212.pdf) · [DOI](https://doi.org/10.54364/AAIML.2025.52212) |
| Prawira & Saputri (2024), **Lost item identification model development using similarity prediction method with CNN ResNet algorithm**，*Journal of Autonomous Intelligence, 7*(2) | ResNet-50 提取图像特征并用欧氏距离比较；NLP 处理说明文字，以余弦相似度计算文字匹配；系统把图像和文字匹配结合。 | 全文称数据共 3,400 张四类物品图片，部分样本做旋转/翻转/亮度增强；80/20 训练/验证描述未说明按具体物品身份切分。报告 ResNet 分类验证准确率 96.4%，但阈值图像匹配“正确率”是 29.96%，文字阈值匹配正确率 97.92%；模型分类与检索配对不是同一指标。原型用户测试只有 2 人。 | 已有工作直接组合 CNN 图像相似度和文字相似度做失物配对；不能把“图像加文字相似度”称为新颖。该文没有充分报告固定候选集 Top-K 检索和实物身份隔离协议；可作为本 FYP 评估设计的对照背景，而不是效果基准。 | 配对正确率的分母、负例定义和候选排名没有充分说明；96.4% 是分类验证结果，不能当成同一实物配对检索效果。全文副本：[PDF](https://pdfs.semanticscholar.org/5f6b/8c20f604763404a1f51be376d8a528e749bc.pdf) · [DOI](https://doi.org/10.32629/jai.v7i2.1381) |
| Weerakoon et al. (2026), **AI-Enabled Lost and Found System With Adaptive Retrieval and Intelligent Security Monitoring**，IEEE ICHORA | IEEE 摘要提出不确定性感知级联检索：类别受限 FAISS 检索后做 CLIP 语义重排，并组合质量验证和安全监测。 | 摘要报告 500 次提交的 94% 属于输入校验，不是配对检索指标；安全监测的 AUC 也不代表匹配效果。IEEE 书目记录未列参考文献。 | 再次说明自适应、多模态失物检索是已有方向；本 FYP 只能把贡献定位为受控、同候选池的 A/B/C 增量排序评估候选，而不能宣称首创系统或多模态级联。 | 目前只有 IEEE 摘要与 Crossref 书目信息，作者/方法细节和数据协议待全文核对。 [IEEE Xplore](https://ieeexplore.ieee.org/abstract/document/11537024) · [DOI](https://doi.org/10.1109/ICHORA69329.2026.11537024) |
| Jeong et al. (2018), **Lost and Found Registration and Inquiry Management System…**，韩国融合安全学会期刊 | 层级深度学习图像分类与加权排名；摘要称从照片识别类别、品牌和标签。 | DBpia 出版方页面可核实期刊、作者、卷期和摘要；可读摘要未列配对排序指标。 | 证明图像分类、品牌/标签提取与排名用于失物系统已有先例。 | 目前只有摘要；取全文核查数据来源、指标和基线。[DBpia](https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE10088974) |
| Hirose, Hara, & Saito (2022), **Proposal and Evaluation of a Lost Property Registration and Retrieval System in Which Only Images Are Registered**，IEICE | 拾获者只提交图片；使用 Google Cloud Vision API 分析，再排序失物候选；报告做过可用性研究。 | IEICE 官方摘要和技术报告书目信息；可读摘要未提供 Top-K 配对数值、标签细节或候选规模。 | 与减少手动描述、用视觉 API 检索失物直接相关，避免把此类功能写成首创。 | 摘要是日文论文的英文概要；需取得全文了解可用性设计与检索评估。[IEICE](https://ken.ieice.org/ken/paper/20220309ICJm/eng/) |
| Liu et al. (2025), **IDMR: Towards Instance-Driven Precise Visual Correspondence in Multimodal Retrieval**，arXiv | 定义跨场景的同一实例多模态检索任务，区别类别/全局相似度；提出基于真实追踪与第一人称视频的 IDMR-bench。 | 预印本摘要称含 557K 合成训练样本，测试跨域实例级检索；不是失物数据集。 | 支持把“同一件实物”作为正例定义，并把同类别不同实物设为困难负例。 | 通用检索论文，不能证明具体 API 或失物系统在此任务上有效；预印本状态。[arXiv](https://arxiv.org/abs/2504.00954) |
| Radenović et al. (2018), **Revisiting Oxford and Paris: Large-Scale Image Retrieval Benchmarking**，CVPR | 研究图像检索评估基准，更新标注，设置不同难度协议并加入困难干扰图像。 | 论文重点是基准、标注和检索评估设计。 | 虽非失物领域，但可借鉴评估实验：可靠标签、固定测试集和困难负例对可信比较很重要。 | Oxford/Paris 是地点图像检索任务，不能直接拿来代表日常物品照片。 [CVF 论文页](https://openaccess.thecvf.com/content_cvpr_2018/html/Radenovic_Revisiting_Oxford_and_CVPR_2018_paper.html) |

## 比较后形成的 FYP 设计

建议把本科研究范围定在**公平评估不同检索排序方法，而非重新训练大型视觉模型**，并把类别识别与同一实物身份区分开：

1. 建立经过人工确认的查询—候选配对集合，包含真正配对、确认不匹配以及标为不确定的记录。
2. **基线 A：** 用户表单类别、描述、地点和时间排序。
3. **方法 B：** 相同表单信息，加上照片分析得到的类别、颜色、品牌（可见时）和显著特征。
4. 对同一批查询与候选记录比较 Hit Rate@5、Recall@5、MRR@5，并记录响应时间、失败率和实际 API 用量。
5. 以物品身份划分开发集和测试集；不让同一物品或近重复照片同时进入两边。

本项目的研究重点暂定为：在相同且人工确认的候选配对上，比较表单基线、加入 DeepSeek API 提取的结构化视觉属性、以及对初筛候选做照片直接比较这三种方法。Dhanawardhana et al. 已实现 SBERT/Siamese 的文字、照片、地点/时间融合；其他工作也已覆盖视觉 API 检索与 YOLO/LLM/CLIP 级联。因此不能声称“首次融合照片与元数据”或“此前没有失物照片匹配”。**目前没有足够证据确认研究空缺**；需查全文并系统检索，重点核实公开工作是否在同一人工配对集合上比较 API 视觉属性和照片直接比较的 Top-K 排序增量，是否按物品身份隔离测试集，以及是否报告实际调用成本。这个候选空缺只是一项待验证的比较设计，不是已证实的新颖性。

## 后续阅读顺序

1. 先精读 LostNet 全文，抽取数据来源、划分、标签规则、指标和复现限制。
2. 通过学校图书馆读取 Springer 和 IEEE 全文，核实模型细节与实验结果；此表当前仅能依据公开摘要。
3. 阅读 CLIP 原论文和标准图像检索评估文献，作为方法背景，避免把通用图文相似度误当作同一物品识别。
4. 完成文献检索记录后，再把研究空缺写进正式 proposal，并请导师确认范围。
