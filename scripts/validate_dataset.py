#!/usr/bin/env python3
"""Read-only preflight checks for the anonymized FYP CSV dataset."""

from __future__ import annotations

import argparse
import csv
import sys
from collections import Counter, defaultdict
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matching import parse_time  # noqa: E402


RECORD_FIELDS = {
    "record_id", "item_group_id", "contributor_group_id", "direction", "title", "category", "color",
    "location_zone", "time_start", "time_end", "description", "vision_category",
    "vision_colors", "vision_brand", "vision_features", "image_id", "image_consent",
    "external_ai_consent", "split",
}
PAIR_FIELDS = {
    "query_record_id", "candidate_record_id", "label", "label_confidence", "annotator_id", "reason",
}
SPLITS = {"development", "test"}
CONFIDENCE = {"low", "medium", "high"}
CONFIDENCE_RANK = {"low": 0, "medium": 1, "high": 2}
CATEGORIES = {
    "电子产品", "证件与卡片", "钥匙", "包袋", "衣物", "水瓶与餐具", "书籍文具", "饰品", "其他", "unknown",
}


class DatasetError(ValueError):
    pass


def read_csv(path: Path, required_fields: set[str]) -> list[dict[str, str]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                raise DatasetError(f"{path} 没有 CSV 表头")
            if any(not name for name in reader.fieldnames) or len(reader.fieldnames) != len(set(reader.fieldnames)):
                raise DatasetError(f"{path} 的 CSV 表头有空列名或重复字段；请检查表头。")
            missing = required_fields - set(reader.fieldnames)
            if missing:
                raise DatasetError(f"{path} 缺少字段：{', '.join(sorted(missing))}")
            rows = []
            for line_number, row in enumerate(reader, start=2):
                if None in row:
                    raise DatasetError(f"{path} 第 {line_number} 行包含超出表头的字段。")
                if None in row.values():
                    raise DatasetError(f"{path} 第 {line_number} 行字段数少于表头。")
                rows.append({key: (value or "").strip() for key, value in row.items()})
            return rows
    except OSError as exc:
        raise DatasetError(f"无法读取 {path}: {exc}") from exc
    except csv.Error as exc:
        raise DatasetError(f"CSV 格式错误 {path}: {exc}") from exc


def validate(
    records_path: Path,
    pairs_path: Path,
    min_confidence: str = "high",
) -> tuple[list[str], list[str], dict[str, int]]:
    errors: list[str] = []
    warnings: list[str] = []
    records: dict[str, dict[str, str]] = {}
    group_splits: dict[str, set[str]] = defaultdict(set)
    contributor_splits: dict[str, set[str]] = defaultdict(set)
    image_ids: dict[str, list[str]] = defaultdict(list)
    counts: Counter[str] = Counter()
    missing_contributor_ids = 0

    try:
        record_rows = read_csv(records_path, RECORD_FIELDS)
        pair_rows = read_csv(pairs_path, PAIR_FIELDS)
    except DatasetError as exc:
        return [str(exc)], warnings, {}

    if not record_rows:
        errors.append("记录 CSV 没有数据行。")
    if not pair_rows:
        errors.append("配对标签 CSV 没有数据行。")

    for line_number, row in enumerate(record_rows, start=2):
        record_id = row["record_id"]
        group_id = row["item_group_id"]
        prefix = f"records.csv 第 {line_number} 行"
        if not record_id:
            errors.append(f"{prefix}: record_id 不能为空。")
            continue
        if record_id in records:
            errors.append(f"{prefix}: record_id 重复：{record_id}。")
            continue
        records[record_id] = row
        counts[f"records_{row['split'] or 'missing_split'}"] += 1

        if not group_id:
            errors.append(f"{prefix} ({record_id}): item_group_id 不能为空。")
        if row["split"] not in SPLITS:
            errors.append(f"{prefix} ({record_id}): split 必须是 development 或 test。")
        elif group_id:
            group_splits[group_id].add(row["split"])
        contributor_group_id = row.get("contributor_group_id", "")
        if contributor_group_id and row["split"] in SPLITS:
            contributor_splits[contributor_group_id].add(row["split"])
        elif not contributor_group_id:
            missing_contributor_ids += 1
        if row["direction"] not in {"lost", "found"}:
            errors.append(f"{prefix} ({record_id}): direction 必须是 lost 或 found。")
        if not row["title"]:
            errors.append(f"{prefix} ({record_id}): title 不能为空。")
        if row["category"] not in CATEGORIES:
            errors.append(f"{prefix} ({record_id}): category 不在指南所列类别中。")
        if not row["location_zone"]:
            errors.append(f"{prefix} ({record_id}): location_zone 不能为空；不得填精确地址。")
        for field in ("time_start", "time_end"):
            if row[field] and parse_time(row[field]) is None:
                errors.append(f"{prefix} ({record_id}): {field} 时间格式无效。")
        start = parse_time(row["time_start"]) if row["time_start"] else None
        end = parse_time(row["time_end"]) if row["time_end"] else None
        if start and end and end < start:
            errors.append(f"{prefix} ({record_id}): time_end 早于 time_start。")
        if not row["time_start"] and not row["time_end"]:
            warnings.append(f"记录 {record_id} 没有时间信息；确认是否符合研究方案。")

        if not row["image_id"]:
            errors.append(f"{prefix} ({record_id}): image_id 不能为空。")
        else:
            image_ids[row["image_id"]].append(record_id)
        if row["image_consent"] not in {"yes", "no", "not_applicable"}:
            errors.append(f"{prefix} ({record_id}): image_consent 必须是 yes、no 或 not_applicable。")
        elif row["image_consent"] == "no":
            errors.append(f"记录 {record_id} 标为没有图片授权；不得纳入照片评估。")
        elif row["image_consent"] == "not_applicable":
            warnings.append(f"记录 {record_id} 的图片授权标为 not_applicable；请在受限的来源记录中说明理由。")
        has_visual_data = any(
            row[field] for field in ("vision_category", "vision_colors", "vision_brand", "vision_features")
        )
        if has_visual_data and row["image_consent"] != "yes":
            errors.append(f"记录 {record_id} 含视觉分析数据，但 image_consent 不是 yes。")
        if row["external_ai_consent"] not in {"yes", "no", "pending", "not_applicable"}:
            errors.append(f"{prefix} ({record_id}): external_ai_consent 必须是 yes、no、pending 或 not_applicable。")
        elif row["external_ai_consent"] != "yes" and has_visual_data:
            errors.append(f"记录 {record_id} 含视觉分析数据，但 external_ai_consent 不是 yes。")

    for group_id, splits in group_splits.items():
        if len(splits) > 1:
            errors.append(f"item_group_id {group_id} 同时出现在多个 split：{', '.join(sorted(splits))}。")
    for contributor_id, splits in contributor_splits.items():
        if len(splits) > 1:
            errors.append(
                f"contributor_group_id {contributor_id} 同时出现在多个 split：{', '.join(sorted(splits))}。"
            )
    if missing_contributor_ids:
        warnings.append(
            f"{missing_contributor_ids} 条记录没有 contributor_group_id；无法检查同一贡献者是否跨 development/test。"
        )
    for image_id, record_ids in image_ids.items():
        if len(record_ids) > 1:
            warnings.append(f"image_id {image_id} 被多条记录复用：{', '.join(record_ids[:5])}。")

    seen_pairs: set[tuple[str, str]] = set()
    labels_by_query: dict[str, list[str]] = defaultdict(list)
    candidate_ids_by_query: dict[str, set[str]] = defaultdict(set)
    queries_seen: set[str] = set()
    for line_number, row in enumerate(pair_rows, start=2):
        query_id = row["query_record_id"]
        candidate_id = row["candidate_record_id"]
        label = row["label"].lower()
        confidence = row["label_confidence"].lower()
        prefix = f"pair_labels.csv 第 {line_number} 行"
        key = (query_id, candidate_id)

        if not query_id or not candidate_id:
            errors.append(f"{prefix}: query_record_id 和 candidate_record_id 不能为空。")
            continue
        if key in seen_pairs:
            errors.append(f"{prefix}: 配对标签重复：{query_id}, {candidate_id}。")
            continue
        seen_pairs.add(key)
        if query_id not in records or candidate_id not in records:
            errors.append(f"{prefix}: 引用了不存在的记录：{query_id}, {candidate_id}。")
            continue
        queries_seen.add(query_id)
        query, candidate = records[query_id], records[candidate_id]
        if query["split"] not in SPLITS or candidate["split"] not in SPLITS:
            continue
        if query["split"] != candidate["split"]:
            errors.append(f"{prefix}: 配对跨越 development/test：{query_id}, {candidate_id}。")
        if query["direction"] != "lost" or candidate["direction"] != "found":
            errors.append(f"{prefix}: 配对方向必须是 lost 查询对 found 候选：{query_id}, {candidate_id}。")
        if label not in {"0", "1", "uncertain"}:
            errors.append(f"{prefix}: label 必须是 0、1 或 uncertain。")
        if confidence not in CONFIDENCE:
            errors.append(f"{prefix}: label_confidence 必须是 high、medium 或 low。")
        if not row["annotator_id"]:
            errors.append(f"{prefix}: annotator_id 不能为空，请使用匿名编号。")
        if not row["reason"]:
            warnings.append(f"{prefix}: reason 为空；建议记录简短、非敏感的判定依据。")

        candidate_ids_by_query[query_id].add(candidate_id)
        if label in {"0", "1"} and query["item_group_id"] and candidate["item_group_id"]:
            same_item = query["item_group_id"] == candidate["item_group_id"]
            if (label == "1") != same_item:
                errors.append(
                    f"{prefix}: 标签 {label} 与 item_group_id 是否相同不一致；请核对实物分组或标签。"
                )
        counts[f"pairs_{label}"] += 1
        counts[f"pairs_{confidence or 'missing_confidence'}"] += 1
        if label in {"0", "1"} and confidence in CONFIDENCE_RANK:
            if CONFIDENCE_RANK[confidence] >= CONFIDENCE_RANK[min_confidence]:
                labels_by_query[query_id].append(label)

    for query_id in sorted(queries_seen):
        query = records[query_id]
        expected_candidates = {
            record_id
            for record_id, record in records.items()
            if record["split"] == query["split"] and record["direction"] == "found"
        }
        missing_candidates = expected_candidates - candidate_ids_by_query[query_id]
        if missing_candidates:
            errors.append(
                f"查询 {query_id} 的配对表未覆盖同一 split 的全部 found 候选："
                f"{', '.join(sorted(missing_candidates)[:5])}。"
            )
        labels = set(labels_by_query.get(query_id, []))
        if "1" not in labels:
            errors.append(f"查询 {query_id} 没有达到 {min_confidence} 置信度门槛的确认正例。")
        if "0" not in labels:
            errors.append(f"查询 {query_id} 没有达到 {min_confidence} 置信度门槛的确认负例。")
        counts["queries_with_labels"] += 1

    if records and not queries_seen:
        warnings.append("配对标签中没有可用查询；尚不能运行排序评估。")
    missing_queries = {
        record_id
        for record_id, record in records.items()
        if record["split"] in SPLITS and record["direction"] == "lost"
    } - queries_seen
    for query_id in sorted(missing_queries):
        errors.append(f"lost 记录 {query_id} 没有配对标签，未进入评估。")

    warnings.append(
        "预检按 records.csv 中同一 split 的全部 found 记录作为候选池；"
        "它无法发现 records.csv 自身遗漏的候选，也不会验证测试标签是否已冻结。"
    )
    warnings.append("检查通过也不代表获得学校伦理批准、图片授权或第三方 API 处理许可。")
    return errors, warnings, dict(counts)


def main() -> int:
    parser = argparse.ArgumentParser(description="只读检查 FYP 匿名记录与配对标签 CSV")
    parser.add_argument("--records", required=True, type=Path, help="填写后的 records CSV")
    parser.add_argument("--pairs", required=True, type=Path, help="填写后的 pair_labels CSV")
    parser.add_argument(
        "--min-confidence", choices=sorted(CONFIDENCE_RANK), default="high",
        help="每个查询都须有达到此门槛的正例和负例，默认 high",
    )
    args = parser.parse_args()

    errors, warnings, counts = validate(args.records, args.pairs, args.min_confidence)
    print("数据预检统计：")
    for key, value in sorted(counts.items()):
        print(f"  {key}: {value}")
    for warning in warnings:
        print(f"警告：{warning}", file=sys.stderr)
    for error in errors:
        print(f"错误：{error}", file=sys.stderr)
    if errors:
        print(f"预检未通过：{len(errors)} 个错误、{len(warnings)} 个提醒。", file=sys.stderr)
        return 1
    print(f"预检通过：0 个错误、{len(warnings)} 个提醒。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
