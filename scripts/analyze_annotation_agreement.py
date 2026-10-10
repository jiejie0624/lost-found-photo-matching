#!/usr/bin/env python3
"""Summarize independent pair-label agreement for two annotators."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


LABELS = ("0", "1", "uncertain")
CONFIDENCE = {"low", "medium", "high"}
REQUIRED_FIELDS = {
    "query_record_id", "candidate_record_id", "label", "label_confidence", "annotator_id",
}


class AnnotationError(ValueError):
    pass


def read_annotations(path: Path) -> list[dict[str, str]]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                raise AnnotationError(f"{path} 没有 CSV 表头")
            missing = REQUIRED_FIELDS - set(reader.fieldnames)
            if missing:
                raise AnnotationError(f"{path} 缺少字段：{', '.join(sorted(missing))}")
            return [
                {key: (value or "").strip() for key, value in row.items() if key is not None}
                for row in reader
            ]
    except OSError as exc:
        raise AnnotationError(f"无法读取 {path}: {exc}") from exc
    except csv.Error as exc:
        raise AnnotationError(f"CSV 格式错误 {path}: {exc}") from exc


def analyze(
    path: Path,
    annotator_a: str,
    annotator_b: str,
) -> dict[str, Any]:
    if not annotator_a or not annotator_b or annotator_a == annotator_b:
        raise AnnotationError("请提供两个不同且非空的匿名 annotator ID。")

    rows = read_annotations(path)
    if not rows:
        raise AnnotationError("标注 CSV 没有数据行。")

    labels_by_annotator: dict[str, dict[tuple[str, str], str]] = {
        annotator_a: {},
        annotator_b: {},
    }
    row_counts: Counter[str] = Counter()
    other_annotator_rows = 0

    for line_number, row in enumerate(rows, start=2):
        annotator_id = row["annotator_id"]
        if not annotator_id:
            raise AnnotationError(f"第 {line_number} 行的 annotator_id 不能为空。")
        if annotator_id not in labels_by_annotator:
            other_annotator_rows += 1
            continue
        pair = (row["query_record_id"], row["candidate_record_id"])
        if not pair[0] or not pair[1]:
            raise AnnotationError(f"第 {line_number} 行的 query/candidate ID 不能为空。")
        if pair[0] == pair[1]:
            raise AnnotationError(f"第 {line_number} 行的查询和候选不能是同一条记录。")
        if pair in labels_by_annotator[annotator_id]:
            raise AnnotationError(
                f"第 {line_number} 行重复：标注者 {annotator_id} 对配对 {pair[0]}, {pair[1]} 有多条标签。"
            )
        label = row["label"].lower()
        if label not in LABELS:
            raise AnnotationError(f"第 {line_number} 行的 label 必须是 0、1 或 uncertain。")
        confidence = row["label_confidence"].lower()
        if confidence not in CONFIDENCE:
            raise AnnotationError(f"第 {line_number} 行的 label_confidence 必须是 high、medium 或 low。")
        labels_by_annotator[annotator_id][pair] = label
        row_counts[annotator_id] += 1

    labels_a = labels_by_annotator[annotator_a]
    labels_b = labels_by_annotator[annotator_b]
    common_pairs = sorted(set(labels_a) & set(labels_b))
    only_a = len(set(labels_a) - set(labels_b))
    only_b = len(set(labels_b) - set(labels_a))
    if not common_pairs:
        raise AnnotationError("两位指定标注者没有任何共同标注的配对。")

    confusion = {a: {b: 0 for b in LABELS} for a in LABELS}
    agreements = 0
    counts_a: Counter[str] = Counter()
    counts_b: Counter[str] = Counter()
    for pair in common_pairs:
        label_a, label_b = labels_a[pair], labels_b[pair]
        confusion[label_a][label_b] += 1
        counts_a[label_a] += 1
        counts_b[label_b] += 1
        agreements += int(label_a == label_b)

    n = len(common_pairs)
    observed = agreements / n
    expected = sum(counts_a[label] * counts_b[label] for label in LABELS) / (n * n)
    kappa = None if expected == 1 else (observed - expected) / (1 - expected)

    return {
        "annotator_a": annotator_a,
        "annotator_b": annotator_b,
        "rows_for_annotator_a": row_counts[annotator_a],
        "rows_for_annotator_b": row_counts[annotator_b],
        "other_annotator_rows_ignored": other_annotator_rows,
        "pairs_annotated_by_both": n,
        "pairs_only_annotator_a": only_a,
        "pairs_only_annotator_b": only_b,
        "label_order": list(LABELS),
        "confusion_matrix_rows_a_columns_b": confusion,
        "observed_agreement": round(observed, 4),
        "expected_agreement_by_chance": round(expected, 4),
        "cohen_kappa": None if kappa is None else round(kappa, 4),
        "kappa_note": (
            "undefined because both annotators use the same single label on all shared pairs"
            if kappa is None else
            "nominal Cohen's kappa includes uncertain as a third category; adjudication is still required"
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="计算两位标注者在共同配对上的原始一致率和 Cohen's kappa"
    )
    parser.add_argument("--annotations", required=True, type=Path, help="逐标注者原始标注 CSV")
    parser.add_argument("--annotator-a", required=True, help="第一位标注者的匿名 ID")
    parser.add_argument("--annotator-b", required=True, help="第二位标注者的匿名 ID")
    args = parser.parse_args()

    try:
        report = analyze(args.annotations, args.annotator_a, args.annotator_b)
    except (OSError, csv.Error, AnnotationError) as exc:
        print(f"标注数据错误：{exc}", file=sys.stderr)
        return 2
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
