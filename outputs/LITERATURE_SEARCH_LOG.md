# 文献检索记录（起步版）

> 状态：定向网络检索记录，不是系统综述，也不证明研究空缺。检索日期：2026-10-10。检索者：FYP 学生。使用一般网络搜索发现论文，再打开出版社、会议、期刊或 arXiv 原始页面核对可见书目信息/摘要；没有系统检索 Scopus、Web of Science、ACM DL、IEEE Xplore 全库或学校订阅数据库，没有执行正式去重。

## 已执行的定向检索

| 检索式 | 用途/结果 | 后续处理 |
| --- | --- | --- |
| `site:ieeexplore.ieee.org lost found object image retrieval lost item matching lost found photo retrieval` | 找到 IEEE IRCE 2025 的 YOLO/LLM/CLIP 级联论文；目前只核实 IEEE 页面摘要。 | 取得全文，抽取数据、基线、Top-K 指标、消融和划分。 |
| `site:ieeexplore.ieee.org "AI-Enabled Lost and Found System With Adaptive Retrieval"` | 发现 Weerakoon et al. (2026) IEEE ICHORA 论文；摘要描述不确定性感知级联检索、FAISS 类别过滤后 CLIP 重排，并包含输入质量/安全监测模块。 | 获取全文核查检索标签、候选池、对照、拆分和检索指标；摘要中的输入校验准确率及安全监测 AUC 不能当作检索效果。 |
| `site:dl.acm.org lost and found image matching retrieval items` | 本轮没有确认 ACM 出版的直接相关论文。 | 之后在 ACM DL 以同义词和引用追踪重查；本结果不能说明 ACM 无相关工作。 |
| `"lost and found" "image retrieval" item matching system` | 找到 LostNet、Ghazal 等失物图片检索工作，以及图像分类/排名与视觉 API 线索。 | 查看引用链，区分实例匹配、类别分类和系统论文。 |
| `2024 2025 lost and found object image matching paper multimodal retrieval` | 找到 IEEE 2025 YOLO/LLM/CLIP 论文；另发现通用实例检索 IDMR (2025)。 | 前者查全文；后者仅用于界定“同一实例”任务，不作为失物领域证据。 |
| `"Deep Learning-Based Image Retrieval System for School Lost and Found"` | 结果主要是非学术汇报材料，没有确认可引用的正式论文。 | 暂不纳入核心证据；若导师提供题名/来源再核查。 |
| `"lost property" image matching dataset retrieval academic paper lost and found benchmark dataset` | 发现 IEICE 2022 只以图片登记/检索论文。 | 目前只核实官方英文摘要；须查全文及其可用性研究设计。 |
| `lost and found item matching dataset paired images public dataset` | 发现 LostNet 论文数据声明链接到 Figshare 公共记录；另筛除道路遗落货物数据集，因为任务不是日常失物配对。 | Figshare 压缩包内容和标签尚未检查，不能视为已确认适用的数据集。 |
| `public paired object instance image dataset different views lighting CC BY` | 找到 Stanford 发布的 CUTE（Common paired objects Under differenT Extrinsics）数据集及其数据说明。 | 可作为同一实物跨视角/光照的辅助视觉压力测试候选；并非失物招领数据，也没有地点/时间元数据。下载包结构和研究适用性仍须核实，不能替代主要失物配对数据。 |
| `site:arxiv.org "lost and found" item retrieval image matching` | 发现 IDMR 等同实例多模态检索工作；也命中与日常失物系统无关的多目标跟踪论文。 | 仅保留任务相关来源；记录排除理由，不把标题中 “Lost and Found” 当作相关性依据。 |
| `"Proposal and Evaluation of a Lost Property Registration and Retrieval System" PDF` / `"MVE2021-52" PDF Hirose` | 搜索到 IEICE 官方技术报告页面，未取得可核实的全文 PDF。 | 通过学校图书馆或作者正式渠道找全文；不要推测其指标。 |
| `"Lost and Found Registration and Inquiry Management System" "19" "25" 2018 pdf` / `"Automatic Image Classification and Ranking System" "Lost and Found" Jeong` | 找到 DBpia 期刊页面，确认 2018 年、作者/期刊页码和摘要，全文访问受限。 | 通过学校图书馆取得全文；补充层级分类数据、排名定义、可用性样本与结果。 |

## 当前筛选出的核心来源

| 来源 | 可核实证据 | 当前限制/待查 |
| --- | --- | --- |
| Ghazal et al. (2016), 多特征失物检索 | 机构仓储/论文摘要列文字、GIS、SURF、L*a*b*；摘要报告小型数据和 accuracy/precision/recall。 | 核对全文指标分母、标签、候选池、划分；与同团队 2015 FiCloud 版本比较是否重复。 |
| Zhou et al. (2024), LostNet | PLOS ONE 全文可读；包含类别分类与感知哈希候选排序。 | 需将分类指标与实例检索排名指标分开；核查测试集物品身份隔离和数据增强描述。 |
| Jeong et al. (2018), 层级分类与加权排名 | DBpia 出版方页面及摘要。 | 无可核实的配对检索数值和数据细节；全文未取得。 |
| Hirose et al. (2022), 只用图片登记的失物检索 | IEICE 出版方页面/英文摘要；使用 Google Cloud Vision API，摘要称进行了 usability study。 | 全文为日语且尚未取得；未知配对标注、检索指标、样本和易用性方法。 |
| Das et al. (2026), MobileNet 嵌入检索 | Springer 出版方摘要。 | 未取得全文；数值、样本和拆分方式未知。 |
| IEEE IRCE (2025), YOLO/LLM/CLIP | IEEE 出版方摘要描述多阶段多模态检索。 | 未取得全文；数据、指标、消融、比较基线未知。 |
| Weerakoon et al. (2026), IEEE ICHORA, **AI-Enabled Lost and Found System With Adaptive Retrieval and Intelligent Security Monitoring** | IEEE 摘要描述不确定性感知级联检索，用类别受限 FAISS 检索与 CLIP 语义重排，并整合输入质量检查和安全监测。Crossref 核对作者、会议和 DOI。 | 尚未取得全文；IEEE 记录未提供参考文献。摘要提到的 500 次提交 94% 是输入校验结果，不是失物配对检索指标；安全监测 AUC 也不能说明 Top-K 配对效果。需核实数据、检索基线、身份隔离和消融。 DOI: [10.1109/ICHORA69329.2026.11537024](https://doi.org/10.1109/ICHORA69329.2026.11537024)。 |
| Liu et al. (2025), IDMR | arXiv 预印本摘要明确定义跨场景的同实例检索，并提出 IDMR-bench。 | 通用视觉检索而非失物系统；仅支持任务定义，不支持 DeepSeek 或本 FYP 的效果结论。 |

## 公开数据集候选（待核验）

LostNet 论文的数据可用性声明链接到 Figshare 记录 [10.6084/m9.figshare.24826740.v2](https://doi.org/10.6084/m9.figshare.24826740.v2)。Figshare API 元数据显示许可为 CC BY 4.0，并列出约 139 MB 的 `test.zip`，以及模型代码、权重和技术说明文件；API 描述称研究做照片匹配，但报告的 96.8% 是准确率，不能由此推断有供本项目使用的同实物配对标签。本次尝试读取小型技术说明文件收到 HTTP 403，且没有下载或检查压缩包内容，因此尚不知道它是否包含同一实物的失物—拾获配对、可用身份标签或适合本研究的划分。不得据此声称数据集已可直接用于本项目。下一步应从可访问渠道取得并检查文件说明、许可条件、标签结构和样本来源，并请导师确认是否可用于研究及第三方 API。当前结论应写作：**本轮没有确认一个公开且已验证适用于同一实物配对评估的数据集；LostNet 的公开文件是待核验候选。**

筛选时也发现 `LostAndFoundDataset` 和 Fishyscapes Lost & Found 属于道路场景中的遗落货物/异常检测，不等同于日常物品失物招领配对，故不作为本项目的直接配对数据集。

另发现 Stanford 的 CUTE 数据集（[官方代码/数据说明仓库](https://github.com/s-tian/CUTE)，[Stanford 数据仓储下载页](https://purl.stanford.edu/gj714cj0414)）。维护者数据说明称其含 10,000 张常见物品图片，物品按相似配对收集，目录关系可表示相同物品的不同方向/光照；数据不涉及人物，发布许可为 CC BY 4.0，且数据整体被设计为测试集。论文补充材料说明 ZIP 解压后按语义类别分目录，再以 `instance_1` / `instance_2` 区分同类的两个具体物品，含受控角度、光照及带任意编号的 in-the-wild 图片；应以[论文补充材料](https://papers.nips.cc/paper_files/paper/2023/file/803c6ab3d62346e004ef70211d2d15b8-Supplemental-Datasets_and_Benchmarks.pdf)和实际归档内容复核配对解释。Stanford 公共 XML 元数据报告 `CUTE.zip` 大小为 31,446,083,987 字节（约 31.4 GB），许可链接为 CC BY 4.0；仓储文件服务支持 HTTP Range。完整下载不应作为默认步骤，可进一步评估是否能仅按字节范围读取 ZIP 目录并抽取少量文件；目前没有验证部分归档读取或实际解压。若可行，它适合做**冻结方法的补充同实例视觉压力测试**，而其整体是测试集，不能用来调参；它没有失物/拾获方向、地点、时间或用户描述，不能回答完整多模态失物检索问题，也不能替代主要研究集或据其结果推断真实应用效果。使用前还须核对映射、许可、导师认可及 DeepSeek 第三方处理安排。

## 暂定结论与检索空缺

已查到多种失物系统采用了图像分类、加权排名、感知哈希、局部特征或视觉 API；因此不能声称“首个失物照片配对系统”或“首次把视觉与元数据结合”。可继续核实的具体比较问题是：在同一组有可靠同实物标签、含困难负例且按物品身份隔离的候选集合上，是否有研究公平比较表单基线、结构化视觉属性和直接照片重排，并报告 Hit Rate@K、Recall@K、MRR@K 及运行成本。

本轮又发现 2026 年 IEEE ICHORA 的自适应级联检索系统。因此“多模态失物检索/级联方法缺失”不能作为研究空缺；可检验的窄问题仍是：是否存在在同一人工配对集合、同一候选池上对 A 表单、B 结构化视觉属性、C 候选照片比较做受控增量比较，并按物品身份隔离、报告 Top-K 指标及调用成本的工作。现有证据尚不足以回答“没有”，必须查该论文全文和系统检索。

这一点目前只是**待查的问题**，并非已证明的空白。系统检索至少还需要：

1. 在 Scopus/Web of Science 或学校认可数据库、IEEE Xplore、ACM DL、Google Scholar 分别检索，并记录每次完整查询式、日期、结果数和筛选理由。
2. 搜索同义词：`lost property`, `lost item`, `lost-and-found`, `found item`, `object instance retrieval`, `same-instance matching`, `visual re-identification`, `image-based retrieval`, `multimodal ranking`。
3. 回溯 Ghazal 2015/2016、LostNet、IEICE 2022、韩国 2018、Springer 2026、IEEE 2025 的参考文献和引用论文，合并重复版本并保留排除理由。
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
- [Weerakoon et al. (2026), IEEE ICHORA](https://doi.org/10.1109/ICHORA69329.2026.11537024)
- [IDMR, arXiv:2504.00954](https://arxiv.org/abs/2504.00954)
