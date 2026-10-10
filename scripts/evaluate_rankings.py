#!/usr/bin/env python3
"""Compare form, vision-attribute, and optional direct-photo ranking methods."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matching import match_score, parse_time  # noqa: E402


RECORD_FIELDS = {
    "record_id", "item_group_id", "direction", "title", "category", "color",
    "location_zone", "time_start", "time_end", "description", "vision_category",
    "vision_colors", "vision_brand", "vision_features", "split",
}
PAIR_FIELDS = {"query_record_id", "candidate_record_id", "label", "label_confidence"}
CONFIDENCE_RANK = {"low": 0, "medium": 1, "high": 2}


def read_csv(path: Path, required_fields: set[str]) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = required_fields - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"{path} 缺少字段：{', '.join(sorted(missing))}")
        return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def middle_time(row: dict[str, str]) -> str:
    start_text, end_text = row["time_start"], row["time_end"]
    start = parse_time(start_text) if start_text else None
    end = parse_time(end_text) if end_text else None
    if start_text and start is None:
        raise ValueError(f"记录 {row['record_id']} 的 time_start 格式无效")
    if end_text and end is None:
        raise ValueError(f"记录 {row['record_id']} 的 time_end 格式无效")
    if start and end:
        if end < start:
            raise ValueError(f"记录 {row['record_id']} 的 time_end 早于 time_start")
        return (start + (end - start) / 2).isoformat()
    if start:
        return start.isoformat()
    if end:
        return end.isoformat()
    return ""


def split_values(value: str) -> list[str]:
    return [part.strip() for part in value.split(";") if part.strip()]


def load_records(path: Path) -> dict[str, dict[str, Any]]:
    rows = read_csv(path, RECORD_FIELDS)
    if not rows:
        raise ValueError("记录 CSV 没有数据行")

    records: dict[str, dict[str, Any]] = {}
    group_splits: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        record_id = row["record_id"]
        group_id = row["item_group_id"]
        if not record_id or not group_id:
            raise ValueError("record_id 和 item_group_id 不能为空")
        if record_id in records:
            raise ValueError(f"record_id 重复：{record_id}")
        if row["split"] not in {"development", "test"}:
            raise ValueError(f"记录 {record_id} 的 split 必须是 development 或 test")
        if row["direction"] not in {"lost", "found"}:
            raise ValueError(f"记录 {record_id} 的 direction 必须是 lost 或 found")
        group_splits[group_id].add(row["split"])
        if row["category"] == "unknown":
            category = ""
        else:
            category = row["category"]
        analysis = {
            "category": row["vision_category"],
            "colors": split_values(row["vision_colors"]),
            "brand": row["vision_brand"],
            "features": split_values(row["vision_features"]),
        }
        records[record_id] = {
            "id": record_id,
            "item_group_id": group_id,
            "split": row["split"],
            "kind": row["direction"],
            "title": row["title"],
            "category": category,
            "color": "" if row["color"] == "unknown" else row["color"],
            "location": row["location_zone"],
            "occurred_at": middle_time(row),
            "description": row["description"],
            "analysis": analysis,
        }

    leaked_groups = [group_id for group_id, splits in group_splits.items() if len(splits) > 1]
    if leaked_groups:
        raise ValueError(f"同一 item_group_id 出现在不同 split：{', '.join(leaked_groups[:5])}")
    return records


def load_pairs(
    path: Path,
    records: dict[str, dict[str, Any]],
    selected_split: str,
    min_confidence: str,
) -> tuple[dict[str, list[tuple[str, int]]], int, int]:
    rows = read_csv(path, PAIR_FIELDS)
    pairs_by_query: dict[str, list[tuple[str, int]]] = defaultdict(list)
    seen: set[tuple[str, str]] = set()
    uncertain_count = 0
    confidence_excluded = 0

    for row in rows:
        query_id, candidate_id, label = (
            row["query_record_id"], row["candidate_record_id"], row["label"].lower()
        )
        key = (query_id, candidate_id)
        if key in seen:
            raise ValueError(f"配对标签重复：{query_id}, {candidate_id}")
        seen.add(key)

        if query_id not in records or candidate_id not in records:
            raise ValueError(f"配对引用了不存在的记录：{query_id}, {candidate_id}")
        query, candidate = records[query_id], records[candidate_id]
        if query["split"] != selected_split or candidate["split"] != selected_split:
            continue
        if label == "uncertain":
            uncertain_count += 1
            continue
        if label not in {"0", "1"}:
            raise ValueError(f"配对标签必须是 0、1 或 uncertain：{query_id}, {candidate_id}")
        confidence = row["label_confidence"].lower()
        if confidence not in CONFIDENCE_RANK:
            raise ValueError(f"配对置信度必须是 high、medium 或 low：{query_id}, {candidate_id}")
        if CONFIDENCE_RANK[confidence] < CONFIDENCE_RANK[min_confidence]:
            confidence_excluded += 1
            continue
        if query["kind"] != "lost" or candidate["kind"] != "found":
            raise ValueError(f"配对方向必须是 lost 查询对 found 候选：{query_id}, {candidate_id}")
        pairs_by_query[query_id].append((candidate_id, int(label)))

    if not pairs_by_query:
        raise ValueError(f"在 {selected_split} split 中没有可评估的已标注配对")
    for query_id, pairs in pairs_by_query.items():
        labels = {label for _, label in pairs}
        if 1 not in labels:
            raise ValueError(f"查询 {query_id} 没有确认的正例")
        if 0 not in labels:
            raise ValueError(f"查询 {query_id} 没有确认的负例")
    return pairs_by_query, uncertain_count, confidence_excluded


def load_photo_scores(
    path: Path,
    records: dict[str, dict[str, Any]],
    pairs_by_query: dict[str, list[tuple[str, int]]],
    selected_split: str,
) -> dict[tuple[str, str], int]:
    """Load precomputed model scores for labeled query/candidate photo pairs."""
    rows = read_csv(path, {"query_record_id", "candidate_record_id", "visual_score"})
    evaluated_pairs = {
        (query_id, candidate_id)
        for query_id, pairs in pairs_by_query.items()
        for candidate_id, _ in pairs
    }
    scores: dict[tuple[str, str], int] = {}
    for row in rows:
        query_id, candidate_id = row["query_record_id"], row["candidate_record_id"]
        key = (query_id, candidate_id)
        if key in scores:
            raise ValueError(f"照片比较分数重复：{query_id}, {candidate_id}")
        if query_id not in records or candidate_id not in records:
            raise ValueError(f"照片比较分数引用了不存在的记录：{query_id}, {candidate_id}")
        if key not in evaluated_pairs:
            raise ValueError(f"照片比较分数不属于当前 split 的已评估配对：{query_id}, {candidate_id}")
        if records[query_id]["split"] != selected_split or records[candidate_id]["split"] != selected_split:
            raise ValueError(f"照片比较分数跨越或不属于当前 split：{query_id}, {candidate_id}")
        if records[query_id]["kind"] != "lost" or records[candidate_id]["kind"] != "found":
            raise ValueError(f"照片比较方向必须是 lost 查询对 found 候选：{query_id}, {candidate_id}")
        try:
            visual_score = int(row["visual_score"])
        except ValueError as exc:
            raise ValueError(f"照片比较分数必须是 0 到 100 的整数：{query_id}, {candidate_id}") from exc
        if not 0 <= visual_score <= 100:
            raise ValueError(f"照片比较分数必须是 0 到 100：{query_id}, {candidate_id}")
        scores[key] = visual_score
    if not scores:
        raise ValueError("照片比较分数 CSV 没有可用数据行")
    return scores


def evaluate(
    records: dict[str, dict[str, Any]],
    pairs_by_query: dict[str, list[tuple[str, int]]],
    k: int,
    use_vision: bool,
    photo_scores: dict[tuple[str, str], int] | None = None,
    photo_shortlist_k: int = 5,
) -> tuple[dict[str, float | int], list[dict[str, Any]]]:
    hits = 0
    recall_sum = 0.0
    reciprocal_rank_sum = 0.0
    detail_rows: list[dict[str, Any]] = []
    if photo_scores is not None and not use_vision:
        raise ValueError("候选照片比较方法必须建立在视觉属性排序上")
    if photo_scores is not None:
        method = "with_photo_comparison"
    else:
        method = "with_vision_attributes" if use_vision else "form_only_baseline"

    for query_id, pairs in pairs_by_query.items():
        query = records[query_id]
        source = query if use_vision else {**query, "analysis": {}}
        ranked: list[tuple[str, int, int, list[str]]] = []
        for candidate_id, label in pairs:
            candidate = records[candidate_id]
            candidate_for_scoring = candidate if use_vision else {**candidate, "analysis": {}}
            score, evidence = match_score(source, candidate_for_scoring)
            ranked.append((candidate_id, score, label, evidence))
        ranked.sort(key=lambda item: (-item[1], item[0]))
        if photo_scores is not None:
            shortlist_ids = {candidate_id for candidate_id, _, _, _ in ranked[:photo_shortlist_k]}
            missing_scores = [
                candidate_id for candidate_id in shortlist_ids
                if (query_id, candidate_id) not in photo_scores
            ]
            if missing_scores:
                raise ValueError(
                    f"查询 {query_id} 的属性排序前 {len(shortlist_ids)} 个候选缺少照片比较分数："
                    f"{', '.join(missing_scores[:5])}"
                )
            blended_ranked = []
            for candidate_id, score, label, evidence in ranked:
                if candidate_id in shortlist_ids:
                    visual_score = photo_scores[(query_id, candidate_id)]
                    score = round(score * 0.45 + visual_score * 0.55)
                    evidence = [*evidence, f"照片直接比较参考分：{visual_score}/100"]
                blended_ranked.append((candidate_id, score, label, evidence))
            ranked = sorted(blended_ranked, key=lambda item: (-item[1], item[0]))

        relevant = sum(label for _, _, label, _ in ranked)
        top = ranked[:k]
        retrieved = sum(label for _, _, label, _ in top)
        hits += int(retrieved > 0)
        recall_sum += retrieved / relevant
        first_relevant_rank = next(
            (rank for rank, (_, _, label, _) in enumerate(ranked[:k], start=1) if label == 1),
            None,
        )
        if first_relevant_rank:
            reciprocal_rank_sum += 1 / first_relevant_rank
        for rank, (candidate_id, score, label, evidence) in enumerate(ranked, start=1):
            detail_rows.append({
                "split": records[query_id]["split"],
                "method": method,
                "query_record_id": query_id,
                "candidate_record_id": candidate_id,
                "rank": rank,
                "reference_score": score,
                "label": label,
                "evidence": "；".join(evidence),
            })

    query_count = len(pairs_by_query)
    metrics = {
        f"hit_rate@{k}": round(hits / query_count, 4),
        f"recall@{k}": round(recall_sum / query_count, 4),
        f"mrr@{k}": round(reciprocal_rank_sum / query_count, 4),
        "queries": query_count,
    }
    return metrics, detail_rows


def write_details(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "split", "method", "query_record_id", "candidate_record_id", "rank",
        "reference_score", "label", "evidence",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="比较表单、视觉属性和候选照片比较排序")
    parser.add_argument("--records", required=True, type=Path, help="填写后的 records CSV")
    parser.add_argument("--pairs", required=True, type=Path, help="填写后的配对标签 CSV")
    parser.add_argument("--split", choices=("development", "test"), default="test")
    parser.add_argument("--k", type=int, default=5, help="计算前 K 名指标，默认 5")
    parser.add_argument(
        "--min-confidence", choices=("high", "medium", "low"), default="high",
        help="只纳入达到此置信度的配对，默认 high",
    )
    parser.add_argument(
        "--photo-scores", type=Path,
        help="可选：候选照片比较模型分数 CSV；只调整视觉属性排序前 K 名",
    )
    parser.add_argument(
        "--photo-shortlist-k", type=int, default=5,
        help="先按视觉属性方法选出前 K 个候选进行照片比较，默认 5",
    )
    parser.add_argument("--details-out", type=Path, help="可选：保存逐候选排序结果 CSV")
    args = parser.parse_args()
    if args.k < 1:
        parser.error("--k 必须大于 0")
    if args.photo_shortlist_k < 1:
        parser.error("--photo-shortlist-k 必须大于 0")

    try:
        records = load_records(args.records)
        pairs_by_query, uncertain_count, confidence_excluded = load_pairs(
            args.pairs, records, args.split, args.min_confidence
        )
        labeled_pair_count = sum(len(pairs) for pairs in pairs_by_query.values())
        photo_scores = (
            load_photo_scores(args.photo_scores, records, pairs_by_query, args.split)
            if args.photo_scores else None
        )
        form_metrics, form_details = evaluate(records, pairs_by_query, args.k, use_vision=False)
        vision_metrics, vision_details = evaluate(records, pairs_by_query, args.k, use_vision=True)
        detail_rows = form_details + vision_details
        report: dict[str, Any] = {
            "split": args.split,
            "k": args.k,
            "minimum_confidence": args.min_confidence,
            "labeled_pairs": labeled_pair_count,
            "uncertain_pairs_excluded": uncertain_count,
            "lower_confidence_pairs_excluded": confidence_excluded,
            "form_only_baseline": form_metrics,
            "with_vision_attributes": vision_metrics,
        }
        if photo_scores is not None:
            photo_metrics, photo_details = evaluate(
                records,
                pairs_by_query,
                args.k,
                use_vision=True,
                photo_scores=photo_scores,
                photo_shortlist_k=args.photo_shortlist_k,
            )
            report["photo_comparison_shortlist_k"] = args.photo_shortlist_k
            report["with_photo_comparison"] = photo_metrics
            detail_rows.extend(photo_details)
    except (OSError, csv.Error, ValueError) as exc:
        print(f"数据错误：{exc}", file=sys.stderr)
        return 2
    if args.details_out:
        try:
            write_details(args.details_out, detail_rows)
        except OSError as exc:
            print(f"无法写入详细结果：{exc}", file=sys.stderr)
            return 2
        report["details_csv"] = str(args.details_out)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
