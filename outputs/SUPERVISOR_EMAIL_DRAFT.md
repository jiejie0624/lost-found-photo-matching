# 导师联系邮件草稿

> 用途：帮助学生预约讨论研究范围、数据和伦理要求。发送前请按学校惯例修改称呼、姓名和时间；这是草稿，不是已发送邮件、导师答复或审批记录。

## English draft

**Subject:** FYP discussion: lost-and-found photo matching study

Dear Supervisor,

I am developing my FYP on a lost-and-found photo-matching web prototype. I would like to confirm the research scope and the approvals needed before collecting or processing any research data.

The current study idea is to compare three ranking approaches on the same lost-item queries and found-item candidates: (A) user-provided form details, (B) form details plus structured attributes extracted from photos, and (C) direct comparison of the query photo with a shortlist of candidate photos. I propose one confirmatory primary comparison: C versus A on Hit Rate@5. The component comparisons (B versus A and C versus B), Recall@5, and MRR@5 would be secondary/exploratory; latency, failure rate, and actual API cost would also be recorded. This is a proposal for discussion, not a finalized or approved protocol.

I found a directly related 2025 study combining SBERT text similarity, Siamese image similarity, and location/time features in a lost-and-found PWA ([full text](https://www.oajaiml.com/uploads/archivepdf/299052212.pdf); [DOI](https://doi.org/10.54364/AAIML.2025.52212)). The paper describes template-generated text pairs, a 170-row fusion dataset with randomly simulated time similarity, pairwise classification metrics, and inconsistent fusion-result figures across sections. I also found IEEE abstracts describing an AI lost-and-found service framework (MEDCOM 2025, [DOI](https://doi.org/10.1109/MEDCOM67532.2025.11405255)) and adaptive FAISS-to-CLIP retrieval (ICHORA 2026, [DOI](https://doi.org/10.1109/ICHORA69329.2026.11537024)). I therefore do not claim that an AI or multimodal lost-and-found system is novel. Could a controlled, item-disjoint Top-K ranking evaluation of a DeepSeek API pipeline, including its cost and latency, be a suitable FYP scope? I have not confirmed that this narrower comparison is novel.

A 2024 study also combines ResNet-50 image features and NLP text similarity for lost-item report matching ([paper PDF copy](https://pdfs.semanticscholar.org/5f6b/8c20f604763404a1f51be376d8a528e749bc.pdf); [DOI](https://doi.org/10.32629/jai.v7i2.1381)). It reports classification accuracy separately from threshold-based image/text matching correctness, without enough detail to treat those results as fixed-candidate Top-K retrieval metrics. This further narrows the proposed contribution: a controlled, item-disjoint ranking comparison, rather than combining image and text similarity itself.

Could we discuss:

1. Whether the proposed primary comparison (C versus A on Hit Rate@5), with B-versus-A and C-versus-B as secondary component analyses, is suitable for the FYP; whether the item-disjoint Top-K design or the primary metric should change.
2. Whether controlled photos of the same ordinary item, photographed under different views/backgrounds, are an acceptable data source; how to establish positive and difficult-negative pairs; and what sample size is feasible.
3. Whether ethics review is required, which office/process applies, and what work is allowed before approval.
4. Whether photos and descriptions may be sent to the DeepSeek V4.1 Flash API, and what separate participant consent, storage region, access controls, retention, and deletion process are required.
5. Whether to include a usability study; whether secondary component analyses need a multiple-comparison adjustment if formal hypothesis tests are expected; and the proposal, ethics, and interim-report milestones.

I have not started research-participant recruitment or research-data collection, and I do not yet have ethics approval or authorization to send research photos to a third-party AI service. I will wait for guidance before doing those activities.

I have prepared draft materials for review: the research and evaluation plan, the dataset and annotation guide, the ethics and data-handling draft, and a supervisor checklist. Would you be available for a short meeting to review them?

Kind regards,  
[Your name]  
[Programme / student ID, if appropriate]

## 修改与发送前

- 填写姓名、课程和导师称呼；按导师偏好调整语言。
- 可把 `RESEARCH_AND_EVALUATION_PLAN.md`、`DATASET_AND_ANNOTATION_GUIDE.md`、`ETHICS_AND_DATA_HANDLING_DRAFT.md` 和 `SUPERVISOR_REVIEW_CHECKLIST.md` 作为讨论材料；发送前检查其中没有真实参与者数据、秘密答案或密钥。
- 不要把邮件草稿误作已联系导师。收到回复后，把确认内容、负责人和日期记录在 `SUPERVISOR_REVIEW_CHECKLIST.md` 的讨论记录中；若学校要求正式伦理申请，以学校表格和书面批准为准。
