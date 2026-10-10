#!/usr/bin/env python3
"""Compare form, vision-attribute, and optional direct-photo ranking methods."""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from app.matching import match_score, parse_time, stable_tiebreak_key  # noqa: E402


RECORD_FIELDS = {
    "record_id", "item_group_id", "contributor_group_id", "direction", "title", "category", "color",
    "location_zone", "time_start", "time_end", "description", "vision_category",
    "vision_colors", "vision_brand", "vision_features", "external_ai_consent", "split",
}
PAIR_FIELDS = {"query_record_id", "candidate_record_id", "label", "label_confidence"}
CONFIDENCE_RANK = {"low": 0, "medium": 1, "high": 2}


def read_csv(path: Path, required_fields: set[str]) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError(f"{path} 没有 CSV 表头")
        if any(not name for name in reader.fieldnames) or len(reader.fieldnames) != len(set(reader.fieldnames)):
            raise ValueError(f"{path} 的 CSV 表头有空列名或重复字段；请检查表头。")
        missing = required_fields - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"{path} 缺少字段：{', '.join(sorted(missing))}")
        rows = []
        for line_number, row in enumerate(reader, start=2):
            if None in row:
                raise ValueError(f"{path} 第 {line_number} 行包含超出表头的字段。")
            if None in row.values():
                raise ValueError(f"{path} 第 {line_number} 行字段数少于表头。")
            rows.append({key: (value or "").strip() for key, value in row.items()})
        return rows


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


def load_records(path: Path) -> tuple[dict[str, dict[str, Any]], dict[str, int]]:
    rows = read_csv(path, RECORD_FIELDS)
    if not rows:
        raise ValueError("记录 CSV 没有数据行")

    records: dict[str, dict[str, Any]] = {}
    group_splits: dict[str, set[str]] = defaultdict(set)
    contributor_splits: dict[str, set[str]] = defaultdict(set)
    missing_contributor_ids: dict[str, int] = defaultdict(int)
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
        contributor_group_id = row.get("contributor_group_id", "")
        if contributor_group_id:
            contributor_splits[contributor_group_id].add(row["split"])
        else:
            missing_contributor_ids[row["split"]] += 1
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
            "external_ai_consent": row["external_ai_consent"],
        }

    leaked_groups = [group_id for group_id, splits in group_splits.items() if len(splits) > 1]
    if leaked_groups:
        raise ValueError(f"同一 item_group_id 出现在不同 split：{', '.join(leaked_groups[:5])}")
    leaked_contributors = [group_id for group_id, splits in contributor_splits.items() if len(splits) > 1]
    if leaked_contributors:
        raise ValueError(
            f"同一 contributor_group_id 出现在不同 split：{', '.join(sorted(leaked_contributors)[:5])}"
        )
    # Values may be blank, but the column itself must exist so missing IDs are
    # visible in the final report instead of silently disabling this check.
    return records, missing_contributor_ids


def load_pairs(
    path: Path,
    records: dict[str, dict[str, Any]],
    selected_split: str,
    min_confidence: str,
) -> tuple[dict[str, dict[str, dict[str, Any]]], int, int]:
    rows = read_csv(path, PAIR_FIELDS)
    pairs_by_query: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
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
        if query["split"] != candidate["split"]:
            raise ValueError(f"配对跨越 development/test：{query_id}, {candidate_id}")
        if query["split"] != selected_split:
            continue
        if query["kind"] != "lost" or candidate["kind"] != "found":
            raise ValueError(f"配对方向必须是 lost 查询对 found 候选：{query_id}, {candidate_id}")
        if label not in {"0", "1", "uncertain"}:
            raise ValueError(f"配对标签必须是 0、1 或 uncertain：{query_id}, {candidate_id}")
        if label in {"0", "1"}:
            same_item = query["item_group_id"] == candidate["item_group_id"]
            if (label == "1") != same_item:
                raise ValueError(
                    f"配对标签与 item_group_id 是否相同矛盾：{query_id}, {candidate_id}；"
                    "同一实物应标 1，不同实物应标 0"
                )
        confidence = row["label_confidence"].lower()
        if confidence not in CONFIDENCE_RANK:
            raise ValueError(f"配对置信度必须是 high、medium 或 low：{query_id}, {candidate_id}")
        if label == "uncertain":
            uncertain_count += 1
        elif CONFIDENCE_RANK[confidence] < CONFIDENCE_RANK[min_confidence]:
            confidence_excluded += 1
        metric_label = (
            int(label)
            if label in {"0", "1"} and CONFIDENCE_RANK[confidence] >= CONFIDENCE_RANK[min_confidence]
            else None
        )
        pairs_by_query[query_id][candidate_id] = {
            "label": label,
            "confidence": confidence,
            "metric_label": metric_label,
        }

    if not pairs_by_query:
        raise ValueError(f"在 {selected_split} split 中没有配对候选")
    expected_query_ids = {
        record_id
        for record_id, record in records.items()
        if record["split"] == selected_split and record["kind"] == "lost"
    }
    missing_query_ids = expected_query_ids - set(pairs_by_query)
    if missing_query_ids:
        raise ValueError(
            f"以下 lost 记录没有完整配对标签，未进入评估：{', '.join(sorted(missing_query_ids)[:5])}"
        )
    expected_candidate_ids = {
        record_id
        for record_id, record in records.items()
        if record["split"] == selected_split and record["kind"] == "found"
    }
    for query_id, candidates in pairs_by_query.items():
        missing_candidate_ids = expected_candidate_ids - set(candidates)
        if missing_candidate_ids:
            raise ValueError(
                f"查询 {query_id} 的配对表未覆盖同一 split 的全部 found 候选："
                f"{', '.join(sorted(missing_candidate_ids)[:5])}"
            )
        labels = {item["metric_label"] for item in candidates.values()}
        if 1 not in labels:
            raise ValueError(f"查询 {query_id} 没有达到 {min_confidence} 置信度门槛的确认正例")
        if 0 not in labels:
            raise ValueError(f"查询 {query_id} 没有达到 {min_confidence} 置信度门槛的确认负例")
    return pairs_by_query, uncertain_count, confidence_excluded


def load_photo_scores(
    path: Path,
    records: dict[str, dict[str, Any]],
    pairs_by_query: dict[str, dict[str, dict[str, Any]]],
    selected_split: str,
) -> dict[tuple[str, str], int]:
    """Load precomputed model scores for candidates in the fixed judged pool."""
    rows = read_csv(path, {"query_record_id", "candidate_record_id", "visual_score"})
    candidate_pool_pairs = {
        (query_id, candidate_id)
        for query_id, candidates in pairs_by_query.items()
        for candidate_id in candidates
    }
    scores: dict[tuple[str, str], int] = {}
    for row in rows:
        query_id, candidate_id = row["query_record_id"], row["candidate_record_id"]
        key = (query_id, candidate_id)
        if key in scores:
            raise ValueError(f"照片比较分数重复：{query_id}, {candidate_id}")
        if query_id not in records or candidate_id not in records:
            raise ValueError(f"照片比较分数引用了不存在的记录：{query_id}, {candidate_id}")
        if key not in candidate_pool_pairs:
            raise ValueError(f"照片比较分数不属于当前 split 的固定候选集合：{query_id}, {candidate_id}")
        if records[query_id]["split"] != selected_split or records[candidate_id]["split"] != selected_split:
            raise ValueError(f"照片比较分数跨越或不属于当前 split：{query_id}, {candidate_id}")
        if records[query_id]["kind"] != "lost" or records[candidate_id]["kind"] != "found":
            raise ValueError(f"照片比较方向必须是 lost 查询对 found 候选：{query_id}, {candidate_id}")
        if records[query_id].get("external_ai_consent") != "yes" or records[candidate_id].get("external_ai_consent") != "yes":
            raise ValueError(f"照片比较分数涉及未明确同意第三方 AI 处理的记录：{query_id}, {candidate_id}")
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
    pairs_by_query: dict[str, dict[str, dict[str, Any]]],
    k: int,
    use_vision: bool,
    photo_scores: dict[tuple[str, str], int] | None = None,
    photo_shortlist_k: int = 5,
) -> tuple[dict[str, float | int], list[dict[str, Any]], dict[str, dict[str, float]]]:
    hits = 0
    recall_sum = 0.0
    reciprocal_rank_sum = 0.0
    detail_rows: list[dict[str, Any]] = []
    per_query_metrics: dict[str, dict[str, float]] = {}
    if photo_scores is not None and not use_vision:
        raise ValueError("候选照片比较方法必须建立在视觉属性排序上")
    if photo_scores is not None:
        method = "with_photo_comparison"
    else:
        method = "with_vision_attributes" if use_vision else "form_only_baseline"

    for query_id, pairs in pairs_by_query.items():
        query = records[query_id]
        if use_vision and query.get("external_ai_consent") != "yes":
            raise ValueError(f"视觉属性评估包含未明确同意第三方 AI 处理的记录：{query_id}")
        source = query if use_vision else {**query, "analysis": {}}
        ranked: list[tuple[str, int, int | None, dict[str, Any], list[str]]] = []
        for candidate_id, judgment in pairs.items():
            candidate = records[candidate_id]
            if use_vision and candidate.get("external_ai_consent") != "yes":
                raise ValueError(f"视觉属性评估包含未明确同意第三方 AI 处理的记录：{candidate_id}")
            candidate_for_scoring = candidate if use_vision else {**candidate, "analysis": {}}
            score, evidence = match_score(source, candidate_for_scoring)
            ranked.append((candidate_id, score, judgment["metric_label"], judgment, evidence))
        ranked.sort(key=lambda item: (-item[1], stable_tiebreak_key(query_id, item[0])))
        if photo_scores is not None:
            shortlist_ids = {candidate_id for candidate_id, _, _, _, _ in ranked[:photo_shortlist_k]}
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
            for candidate_id, score, metric_label, judgment, evidence in ranked:
                if candidate_id in shortlist_ids:
                    visual_score = photo_scores[(query_id, candidate_id)]
                    score = round(score * 0.45 + visual_score * 0.55)
                    evidence = [*evidence, f"照片直接比较参考分：{visual_score}/100"]
                blended_ranked.append((candidate_id, score, metric_label, judgment, evidence))
            ranked = sorted(
                blended_ranked,
                key=lambda item: (-item[1], stable_tiebreak_key(query_id, item[0])),
            )

        relevant = sum(metric_label == 1 for _, _, metric_label, _, _ in ranked)
        top = ranked[:k]
        retrieved = sum(metric_label == 1 for _, _, metric_label, _, _ in top)
        hit_rate = float(retrieved > 0)
        recall = retrieved / relevant
        hits += int(hit_rate)
        recall_sum += recall
        first_relevant_rank = next(
            (
                rank
                for rank, (_, _, metric_label, _, _) in enumerate(ranked[:k], start=1)
                if metric_label == 1
            ),
            None,
        )
        reciprocal_rank = 0.0
        if first_relevant_rank:
            reciprocal_rank = 1 / first_relevant_rank
            reciprocal_rank_sum += reciprocal_rank
        per_query_metrics[query_id] = {
            f"hit_rate@{k}": hit_rate,
            f"recall@{k}": recall,
            f"mrr@{k}": reciprocal_rank,
        }
        for rank, (candidate_id, score, metric_label, judgment, evidence) in enumerate(ranked, start=1):
            display_label = judgment["label"]
            if metric_label is None and display_label in {"0", "1"}:
                display_label = f"unjudged_{display_label}_confidence_{judgment['confidence']}"
            detail_rows.append({
                "split": records[query_id]["split"],
                "method": method,
                "query_record_id": query_id,
                "candidate_record_id": candidate_id,
                "rank": rank,
                "reference_score": score,
                "label": display_label,
                "label_confidence": judgment["confidence"],
                "judged_for_metrics": metric_label is not None,
                "evidence": "；".join(evidence),
            })

    query_count = len(pairs_by_query)
    metrics = {
        f"hit_rate@{k}": round(hits / query_count, 4),
        f"recall@{k}": round(recall_sum / query_count, 4),
        f"mrr@{k}": round(reciprocal_rank_sum / query_count, 4),
        "queries": query_count,
    }
    return metrics, detail_rows, per_query_metrics


def percentile(sorted_values: list[float], probability: float) -> float:
    """Return a linearly interpolated percentile from an already sorted list."""
    if not sorted_values:
        raise ValueError("无法从空的 bootstrap 样本计算区间")
    position = (len(sorted_values) - 1) * probability
    lower = int(position)
    upper = min(lower + 1, len(sorted_values) - 1)
    fraction = position - lower
    return sorted_values[lower] * (1 - fraction) + sorted_values[upper] * fraction


def uniform_random_expected_metrics(
    pairs_by_query: dict[str, dict[str, dict[str, Any]]],
    k: int,
) -> dict[str, dict[str, float]]:
    """Compute exact expected macro metrics for uniformly random candidate order."""
    per_query: dict[str, dict[str, float]] = {}
    for query_id, pairs in pairs_by_query.items():
        candidate_count = len(pairs)
        relevant_count = sum(item["metric_label"] == 1 for item in pairs.values())
        if candidate_count == 0 or relevant_count == 0:
            raise ValueError(f"查询 {query_id} 缺少候选或确认正例，无法计算随机参考线")
        top_count = min(k, candidate_count)
        hit_denominator = math.comb(candidate_count, top_count)
        misses = candidate_count - relevant_count
        miss_combinations = math.comb(misses, top_count) if misses >= top_count else 0
        hit_rate = 1 - miss_combinations / hit_denominator

        positive_position_denominator = math.comb(candidate_count, relevant_count)
        mrr = sum(
            math.comb(candidate_count - rank, relevant_count - 1)
            / positive_position_denominator
            / rank
            for rank in range(1, top_count + 1)
            if candidate_count - rank >= relevant_count - 1
        )
        per_query[query_id] = {
            f"hit_rate@{k}": hit_rate,
            f"recall@{k}": top_count / candidate_count,
            f"mrr@{k}": mrr,
        }
    return per_query


def summarize_query_metrics(per_query: dict[str, dict[str, float]]) -> dict[str, float | int]:
    query_count = len(per_query)
    if query_count == 0:
        raise ValueError("没有查询，无法汇总随机参考线")
    metric_names = next(iter(per_query.values()))
    summary: dict[str, float | int] = {
        metric: round(sum(values[metric] for values in per_query.values()) / query_count, 4)
        for metric in metric_names
    }
    summary["queries"] = query_count
    return summary


def paired_bootstrap_differences(
    methods: dict[str, dict[str, dict[str, float]]],
    query_clusters: dict[str, str],
    iterations: int,
    seed: int = 42,
) -> dict[str, dict[str, dict[str, Any]]]:
    """Estimate paired method differences with item-group cluster bootstrap intervals."""
    method_names = list(methods)
    if len(method_names) < 2:
        return {}
    query_ids = sorted(set.intersection(*(set(methods[name]) for name in method_names)))
    if not query_ids:
        raise ValueError("方法之间没有相同的查询，不能进行配对 bootstrap")
    queries_by_cluster: dict[str, list[str]] = defaultdict(list)
    for query_id in query_ids:
        queries_by_cluster[query_clusters.get(query_id, query_id)].append(query_id)
    cluster_ids = sorted(queries_by_cluster)

    comparisons: dict[str, dict[str, dict[str, Any]]] = {}
    rng = random.Random(seed)
    metric_names = sorted(methods[method_names[0]][query_ids[0]])
    for left_index, left_name in enumerate(method_names):
        for right_name in method_names[left_index + 1:]:
            differences = {
                metric: {
                    query: methods[right_name][query][metric] - methods[left_name][query][metric]
                    for query in query_ids
                }
                for metric in metric_names
            }
            comparison_name = f"{right_name} - {left_name}"
            comparisons[comparison_name] = {}
            for metric, values_by_query in differences.items():
                sampled_means = []
                for _ in range(iterations):
                    sampled_query_ids = [
                        query_id
                        for cluster_id in (rng.choice(cluster_ids) for _ in cluster_ids)
                        for query_id in queries_by_cluster[cluster_id]
                    ]
                    sampled_means.append(
                        sum(values_by_query[query_id] for query_id in sampled_query_ids)
                        / len(sampled_query_ids)
                    )
                sampled_means.sort()
                comparisons[comparison_name][metric] = {
                    "mean_difference": round(
                        sum(values_by_query.values()) / len(values_by_query), 4
                    ),
                    "ci95": [
                        round(percentile(sampled_means, 0.025), 4),
                        round(percentile(sampled_means, 0.975), 4),
                    ],
                    "queries": len(query_ids),
                    "item_groups": len(cluster_ids),
                }
    return comparisons


def write_details(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "split", "method", "query_record_id", "candidate_record_id", "rank",
        "reference_score", "label", "label_confidence", "judged_for_metrics", "evidence",
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
    parser.add_argument(
        "--bootstrap-iterations", type=int, default=2000,
        help="配对 bootstrap 抽样次数，默认 2000；建议正式报告至少 2000 次",
    )
    parser.add_argument("--details-out", type=Path, help="可选：保存逐候选排序结果 CSV")
    args = parser.parse_args()
    if args.k < 1:
        parser.error("--k 必须大于 0")
    if args.photo_shortlist_k < 1:
        parser.error("--photo-shortlist-k 必须大于 0")
    if args.bootstrap_iterations < 100:
        parser.error("--bootstrap-iterations 至少为 100")

    try:
        records, missing_contributor_ids_by_split = load_records(args.records)
        pairs_by_query, uncertain_count, confidence_excluded = load_pairs(
            args.pairs, records, args.split, args.min_confidence
        )
        candidate_pair_count = sum(len(pairs) for pairs in pairs_by_query.values())
        labeled_pair_count = sum(
            judgment["metric_label"] is not None
            for pairs in pairs_by_query.values()
            for judgment in pairs.values()
        )
        photo_scores = (
            load_photo_scores(args.photo_scores, records, pairs_by_query, args.split)
            if args.photo_scores else None
        )
        form_metrics, form_details, form_query_metrics = evaluate(
            records, pairs_by_query, args.k, use_vision=False
        )
        vision_metrics, vision_details, vision_query_metrics = evaluate(
            records, pairs_by_query, args.k, use_vision=True
        )
        random_query_metrics = uniform_random_expected_metrics(pairs_by_query, args.k)
        detail_rows = form_details + vision_details
        query_metrics_by_method = {
            "form_only_baseline": form_query_metrics,
            "with_vision_attributes": vision_query_metrics,
            "uniform_random_expected": random_query_metrics,
        }
        report: dict[str, Any] = {
            "split": args.split,
            "k": args.k,
            "minimum_confidence": args.min_confidence,
            "candidate_pairs_in_pool": candidate_pair_count,
            "labeled_pairs": labeled_pair_count,
            "records_missing_contributor_group_id": missing_contributor_ids_by_split.get(args.split, 0),
            "contributor_leakage_check_note": (
                "known contributor_group_id values were checked for split leakage; "
                "blank values cannot be checked and are counted above"
            ),
            "uncertain_candidates_ranked_but_not_counted": uncertain_count,
            "lower_confidence_candidates_ranked_but_not_counted": confidence_excluded,
            "unjudged_candidate_metric_note": (
                "uncertain and below-threshold candidates remain in ranks and occupy top-K positions; "
                "they are not treated as confirmed negatives or positives"
            ),
            "form_only_baseline": form_metrics,
            "with_vision_attributes": vision_metrics,
            "uniform_random_ranking_expected": summarize_query_metrics(random_query_metrics),
            "random_baseline_note": (
                "exact expectation for uniform random order over each full candidate pool; "
                "unjudged candidates remain in the pool and confirmed positives define relevance"
            ),
        }
        if photo_scores is not None:
            photo_metrics, photo_details, photo_query_metrics = evaluate(
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
            query_metrics_by_method["with_photo_comparison"] = photo_query_metrics
        report["paired_bootstrap_95ci"] = paired_bootstrap_differences(
            query_metrics_by_method,
            {query_id: records[query_id]["item_group_id"] for query_id in pairs_by_query},
            args.bootstrap_iterations,
        )
        report["bootstrap_iterations"] = args.bootstrap_iterations
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
