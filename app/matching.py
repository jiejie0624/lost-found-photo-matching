from __future__ import annotations

import re
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Any


def words(value: str) -> set[str]:
    return {part.lower() for part in re.findall(r"[\w\u3400-\u9fff]+", value) if len(part) > 1}


def parse_time(value: str) -> datetime | None:
    try:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except (TypeError, ValueError):
        return None


def similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    token_a, token_b = words(a), words(b)
    token_score = len(token_a & token_b) / max(1, len(token_a | token_b))
    return max(token_score, SequenceMatcher(None, a.lower(), b.lower()).ratio() * 0.65)


def attribute_text(attributes: dict[str, Any], key: str) -> str:
    value = attributes.get(key, "")
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return " ".join(item.strip() for item in value if isinstance(item, str) and item.strip())
    return ""


def match_score(source: dict[str, Any], candidate: dict[str, Any]) -> tuple[int, list[str]]:
    points = 0.0
    evidence: list[str] = []

    if source["category"] and source["category"] != "unknown" and source["category"] == candidate["category"]:
        points += 22
        evidence.append("物品类别相同")

    location_score = similarity(source["location"], candidate["location"])
    points += 20 * location_score
    if location_score >= 0.45:
        evidence.append("地点描述接近")

    source_time = parse_time(source["occurred_at"])
    candidate_time = parse_time(candidate["occurred_at"])
    if source_time and candidate_time:
        days = abs((source_time - candidate_time).total_seconds()) / 86400
        time_score = max(0.0, 1.0 - days / 30)
        points += 15 * time_score
        if days <= 7:
            evidence.append("时间相近")

    source_attrs = source.get("analysis")
    candidate_attrs = candidate.get("analysis")
    if not isinstance(source_attrs, dict):
        source_attrs = {}
    if not isinstance(candidate_attrs, dict):
        candidate_attrs = {}

    source_visual_category = attribute_text(source_attrs, "category")
    candidate_visual_category = attribute_text(candidate_attrs, "category")
    visual_category_score = similarity(source_visual_category, candidate_visual_category)
    points += 10 * visual_category_score
    if visual_category_score >= 0.45:
        evidence.append("照片分析的物品类别接近")

    source_color = attribute_text(source_attrs, "colors") or source.get("color", "")
    candidate_color = attribute_text(candidate_attrs, "colors") or candidate.get("color", "")
    color_score = similarity(source_color, candidate_color)
    points += 12 * color_score
    if color_score >= 0.45:
        evidence.append("颜色相似")

    brand_score = similarity(attribute_text(source_attrs, "brand"), attribute_text(candidate_attrs, "brand"))
    if brand_score >= 0.7:
        points += 8 * brand_score
        evidence.append("照片中可见品牌相同或相近")

    source_features = " ".join(
        part for part in (
            source.get("title", ""),
            attribute_text(source_attrs, "features"),
            source.get("description", ""),
        ) if part
    )
    candidate_features = " ".join(
        part for part in (
            candidate.get("title", ""),
            attribute_text(candidate_attrs, "features"),
            candidate.get("description", ""),
        ) if part
    )
    feature_score = similarity(source_features, candidate_features)
    points += 13 * feature_score
    if feature_score >= 0.3:
        evidence.append("物品特征有相似描述")

    return round(min(100, points)), evidence or ["类别、地点和时间有部分接近"]
