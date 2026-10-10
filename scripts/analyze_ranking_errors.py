#!/usr/bin/env python3
"""Prepare a human-review worksheet from ranking evaluator detail CSV."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any


REQUIRED_FIELDS = {
    "split", "method", "query_record_id", "candidate_record_id", "rank",
    "label", "label_confidence", "judged_for_metrics", "evidence",
}
METHOD_NAME = re.compile(r"^[A-Za-z0-9_-]+$")


def read_details(path: Path) -> list[dict[str, str]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                raise ValueError(f"{path} 没有 CSV 表头")
            if any(not name for name in reader.fieldnames) or len(reader.fieldnames) != len(set(reader.fieldnames)):
                raise ValueError(f"{path} 的 CSV 表头有空列名或重复字段；请检查表头。")
            missing = REQUIRED_FIELDS - set(reader.fieldnames)
            if missing:
                raise ValueError(f"{path} 缺少字段：{', '.join(sorted(missing))}")
            rows = []
            for line_number, row in enumerate(reader, start=2):
                if None in row:
                    raise ValueError(f"{path} 第 {line_number} 行包含超出表头的字段。")
                if None in row.values():
                    raise ValueError(f"{path} 第 {line_number} 行字段数少于表头。")
                rows.append({key: (value or "").strip() for key, value in row.items() if key})
            return rows
    except OSError as exc:
        raise ValueError(f"无法读取 {path}: {exc}") from exc
    except csv.Error as exc:
        raise ValueError(f"CSV 格式错误 {path}: {exc}") from exc


def analyze(rows: list[dict[str, str]], k: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if k < 1:
        raise ValueError("K 必须大于 0。")
    if not rows:
        raise ValueError("排名详情 CSV 没有数据行。")

    rankings: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    splits: set[str] = set()
    methods: set[str] = set()
    seen: set[tuple[str, str, str, str]] = set()
    for line, raw in enumerate(rows, start=2):
        split, method = raw["split"], raw["method"]
        query, candidate = raw["query_record_id"], raw["candidate_record_id"]
        if not split or not method or not query or not candidate:
            raise ValueError(f"第 {line} 行的 split/method/query/candidate 不能为空。")
        if not METHOD_NAME.fullmatch(method):
            raise ValueError(f"第 {line} 行 method 含不支持字符：{method}")
        try:
            rank = int(raw["rank"])
        except ValueError as exc:
            raise ValueError(f"第 {line} 行 rank 必须为正整数。") from exc
        if rank < 1:
            raise ValueError(f"第 {line} 行 rank 必须为正整数。")
        key = (split, method, query, candidate)
        if key in seen:
            raise ValueError(f"第 {line} 行候选重复：{method}/{query}/{candidate}")
        seen.add(key)
        label = raw["label"].lower()
        judged = raw["judged_for_metrics"].lower()
        if judged not in {"true", "false"}:
            raise ValueError(f"第 {line} 行 judged_for_metrics 必须为 true 或 false。")
        if judged == "true" and label not in {"0", "1"}:
            raise ValueError(f"第 {line} 行已纳入指标的标签必须是 0 或 1。")
        if judged == "false" and label not in {
            "uncertain", "0", "1", "unjudged_0_confidence_low",
            "unjudged_0_confidence_medium", "unjudged_1_confidence_low",
            "unjudged_1_confidence_medium",
        }:
            raise ValueError(f"第 {line} 行未判定标签格式无法识别：{label}")
        rankings[(split, method, query)].append({
            "candidate": candidate,
            "rank": rank,
            "label": label,
            "confidence": raw["label_confidence"],
            "judged": judged == "true",
            "evidence": raw["evidence"],
        })
        splits.add(split)
        methods.add(method)

    if len(splits) != 1:
        raise ValueError("输入详情必须只包含一个 split；请分别分析 development 和 test。")
    split = next(iter(splits))
    methods_ordered = sorted(methods)
    query_sets = {
        method: {query for row_split, row_method, query in rankings
                 if row_split == split and row_method == method}
        for method in methods_ordered
    }
    if len({frozenset(queries) for queries in query_sets.values()}) != 1:
        raise ValueError("不同方法的查询集合不一致，不能做并列错误复核。")
    query_ids = sorted(next(iter(query_sets.values())))

    worksheet: list[dict[str, Any]] = []
    summary: dict[str, Any] = {"split": split, "k": k, "queries": len(query_ids), "methods": {}}
    candidate_sets_by_method: dict[str, dict[str, set[str]]] = defaultdict(dict)
    for method in methods_ordered:
        method_summary = {
            "queries": len(query_ids), "queries_without_confirmed_hit_at_k": 0,
            "queries_with_unjudged_candidate_in_top_k": 0,
            "confirmed_positive_pairs": 0, "confirmed_positive_pairs_in_top_k": 0,
            "confirmed_negative_pairs_in_top_k": 0,
        }
        for query in query_ids:
            items = rankings[(split, method, query)]
            ranks = [item["rank"] for item in items]
            if len(ranks) != len(set(ranks)) or set(ranks) != set(range(1, len(items) + 1)):
                raise ValueError(f"{method}/{query} 的 rank 必须从 1 开始且连续、唯一。")
            items.sort(key=lambda item: item["rank"])
            candidate_sets_by_method[method][query] = {item["candidate"] for item in items}
            top = items[:k]
            positives = [item for item in items if item["judged"] and item["label"] == "1"]
            missed = [item for item in positives if item["rank"] > k]
            top_unjudged = [item for item in top if not item["judged"]]
            top_negative = [item for item in top if item["judged"] and item["label"] == "0"]
            top_positives = [item for item in top if item["judged"] and item["label"] == "1"]
            hit = bool(top_positives)
            method_summary["queries_without_confirmed_hit_at_k"] += int(not hit)
            method_summary["queries_with_unjudged_candidate_in_top_k"] += int(bool(top_unjudged))
            method_summary["confirmed_positive_pairs"] += len(positives)
            method_summary["confirmed_positive_pairs_in_top_k"] += len(top_positives)
            method_summary["confirmed_negative_pairs_in_top_k"] += len(top_negative)

            worksheet_row: dict[str, Any] = {
                "split": split,
                "query_record_id": query,
                "method": method,
                "k": k,
                "hit_at_k": hit,
                "first_confirmed_positive_rank": min((p["rank"] for p in positives), default=""),
                "confirmed_positive_count": len(positives),
                "confirmed_positive_in_top_k": len(top_positives),
                "missed_confirmed_positive_ids": ";".join(p["candidate"] for p in missed),
                "confirmed_negative_in_top_k_ids": ";".join(n["candidate"] for n in top_negative),
                "unjudged_in_top_k_ids": ";".join(u["candidate"] for u in top_unjudged),
                "top_k_candidates": " | ".join(
                    f"{item['rank']}:{item['candidate']}[{item['label']};{item['confidence']}]"
                    for item in top
                ),
                "top_k_evidence": " | ".join(
                    f"{item['candidate']}: {item['evidence']}" for item in top if item["evidence"]
                ),
                "manual_error_cause": "",
                "manual_review_notes": "",
            }
            worksheet.append(worksheet_row)
        summary["methods"][method] = method_summary

    for method in methods_ordered[1:]:
        for query in query_ids:
            reference = candidate_sets_by_method[methods_ordered[0]][query]
            if candidate_sets_by_method[method][query] != reference:
                raise ValueError(f"不同方法的候选集合不一致：{query}")
    summary["note"] = (
        "这是人工复核工作表，不会自动推断错配原因。未判定候选可能占据前 K 名；"
        "不要把它们当成已确认负例。"
    )
    return worksheet, summary


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    fields = [
        "split", "query_record_id", "method", "k", "hit_at_k",
        "first_confirmed_positive_rank", "confirmed_positive_count",
        "confirmed_positive_in_top_k", "missed_confirmed_positive_ids",
        "confirmed_negative_in_top_k_ids", "unjudged_in_top_k_ids",
        "top_k_candidates", "top_k_evidence", "manual_error_cause", "manual_review_notes",
    ]
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
    except OSError as exc:
        raise ValueError(f"无法写入 {path}: {exc}") from exc


def main() -> int:
    parser = argparse.ArgumentParser(description="从逐候选排名生成错配人工复核工作表")
    parser.add_argument("--details", required=True, type=Path, help="evaluate_rankings.py 的 details CSV")
    parser.add_argument("--out", required=True, type=Path, help="人工复核工作表 CSV 输出路径")
    parser.add_argument("--k", type=int, default=5, help="复核前 K 名，默认 5")
    args = parser.parse_args()
    try:
        rows, summary = analyze(read_details(args.details), args.k)
        write_csv(args.out, rows)
    except ValueError as exc:
        print(f"排名错误分析失败：{exc}", file=sys.stderr)
        return 2
    print(json.dumps({**summary, "worksheet_csv": str(args.out)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
