#!/usr/bin/env python3
"""Create an exhaustive, ID-only annotation sheet for each lost/found pair."""

from __future__ import annotations

import argparse
import csv
import re
import sys
from collections import defaultdict
from pathlib import Path


SPLITS = {"development", "test"}
FIELDS = [
    "query_record_id",
    "candidate_record_id",
    "query_image_id",
    "candidate_image_id",
    "label",
    "label_confidence",
    "annotator_id",
    "reason",
]


def load_records(
    path: Path,
) -> tuple[
    dict[str, dict[str, str]],
    dict[str, list[dict[str, str]]],
    dict[str, list[dict[str, str]]],
]:
    try:
        handle = path.open("r", encoding="utf-8-sig", newline="")
    except OSError as exc:
        raise ValueError(f"无法读取 {path}: {exc}") from exc

    with handle:
        reader = csv.DictReader(handle)
        required = {
            "record_id", "item_group_id", "contributor_group_id", "direction", "split", "image_id"
        }
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"records CSV 缺少字段：{', '.join(sorted(missing))}")

        records: dict[str, dict[str, str]] = {}
        lost_by_split: dict[str, list[dict[str, str]]] = defaultdict(list)
        found_by_split: dict[str, list[dict[str, str]]] = defaultdict(list)
        item_splits: dict[str, set[str]] = defaultdict(set)
        contributor_splits: dict[str, set[str]] = defaultdict(set)
        for line_number, raw in enumerate(reader, start=2):
            row = {key: (value or "").strip() for key, value in raw.items() if key is not None}
            record_id = row["record_id"]
            direction = row["direction"]
            split = row["split"]
            if not record_id:
                raise ValueError(f"第 {line_number} 行 record_id 不能为空")
            if not row["item_group_id"]:
                raise ValueError(f"记录 {record_id} 的 item_group_id 不能为空")
            if record_id in records:
                raise ValueError(f"record_id 重复：{record_id}")
            if direction not in {"lost", "found"}:
                raise ValueError(f"记录 {record_id} 的 direction 必须是 lost 或 found")
            if split not in SPLITS:
                raise ValueError(f"记录 {record_id} 的 split 必须是 development 或 test")
            if not row["image_id"]:
                raise ValueError(f"记录 {record_id} 的 image_id 不能为空")
            item_splits[row["item_group_id"]].add(split)
            contributor_group_id = row.get("contributor_group_id", "")
            if contributor_group_id:
                contributor_splits[contributor_group_id].add(split)
            records[record_id] = row
            (lost_by_split if direction == "lost" else found_by_split)[split].append(row)

        leaking_items = [group_id for group_id, splits in item_splits.items() if len(splits) > 1]
        if leaking_items:
            raise ValueError(f"item_group_id 跨 split：{', '.join(sorted(leaking_items)[:5])}")
        leaking_contributors = [group_id for group_id, splits in contributor_splits.items() if len(splits) > 1]
        if leaking_contributors:
            raise ValueError(f"contributor_group_id 跨 split：{', '.join(sorted(leaking_contributors)[:5])}")

    if not records:
        raise ValueError("records CSV 没有数据行")
    return records, lost_by_split, found_by_split


def main() -> int:
    parser = argparse.ArgumentParser(
        description="按 split 为每条 lost 查询生成同一 split 内全部 found 候选的匿名标注行。"
    )
    parser.add_argument("--records", required=True, type=Path, help="已匿名化且已分组的 records CSV")
    parser.add_argument("--out", required=True, type=Path, help="新建的标注表路径；不会覆盖已有文件")
    parser.add_argument("--annotator-id", required=True, help="标注者匿名编号，不要使用姓名或邮箱")
    parser.add_argument(
        "--split", choices=["all", "development", "test"], default="all",
        help="要生成的 split；默认 development 和 test 都生成",
    )
    parser.add_argument(
        "--max-pairs", type=int, default=50000,
        help="超过此配对数时停止，避免意外生成过大的标注表（默认 50000）",
    )
    args = parser.parse_args()

    annotator_id = args.annotator_id.strip()
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,32}", annotator_id):
        parser.error("--annotator-id 须为 1–32 位匿名字母、数字、下划线或连字符编号，例如 A01")
    if args.max_pairs < 1:
        parser.error("--max-pairs 必须大于 0")
    if args.out.exists():
        parser.error(f"输出文件已存在，为保护标注数据不覆盖：{args.out}")
    if not args.out.parent.exists():
        parser.error(f"输出目录不存在：{args.out.parent}；请先建立研究工作目录")

    try:
        _, lost_by_split, found_by_split = load_records(args.records)
    except ValueError as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 2

    selected_splits = sorted(SPLITS) if args.split == "all" else [args.split]
    pair_count = sum(
        len(lost_by_split[split]) * len(found_by_split[split])
        for split in selected_splits
    )
    if pair_count == 0:
        print("错误：所选 split 没有可生成的 lost × found 配对。", file=sys.stderr)
        return 2
    if pair_count > args.max_pairs:
        print(
            f"错误：将生成 {pair_count} 行，超过上限 {args.max_pairs}。 "
            "请检查候选池，或在确认规模后显式提高 --max-pairs。",
            file=sys.stderr,
        )
        return 2

    try:
        with args.out.open("x", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS)
            writer.writeheader()
            for split in selected_splits:
                for query in sorted(lost_by_split[split], key=lambda row: row["record_id"]):
                    for candidate in sorted(found_by_split[split], key=lambda row: row["record_id"]):
                        writer.writerow({
                            "query_record_id": query["record_id"],
                            "candidate_record_id": candidate["record_id"],
                            "query_image_id": query["image_id"],
                            "candidate_image_id": candidate["image_id"],
                            "label": "",
                            "label_confidence": "",
                            "annotator_id": annotator_id,
                            "reason": "",
                        })
    except OSError as exc:
        print(f"错误：无法写入 {args.out}: {exc}", file=sys.stderr)
        return 2

    print(f"已生成 {pair_count} 行匿名配对表：{args.out}")
    print("label、label_confidence 和 reason 留空，须由标注者独立填写；本工具不会推断标签。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
