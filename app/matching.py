from __future__ import annotations

import hashlib
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


def stable_tiebreak_key(query_id: str, candidate_id: str) -> str:
    """Return a stable, ID-order-independent key for equal-score candidates."""
    pair = f"{query_id}\0{candidate_id}".encode("utf-8")
    return hashlib.sha256(pair).hexdigest()


def similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    token_a, token_b = words(a), words(b)
    token_score = len(token_a & token_b) / max(1, len(token_a | token_b))
    return max(token_score, SequenceMatcher(None, a.lower(), b.lower()).ratio() * 0.65)


_LOCATION_CONTEXT_WORDS = {
    "southern", "university", "college", "campus", "school", "within", "inside",
    "southernuniversitycollege", "exact", "place", "location", "unknown", "area",
}
_RESTROOM_ALIASES = re.compile(r"\b(toilet|bathroom|washroom|lavatory|restroom|tandas|bilik air)\b", re.I)


def normalize_campus_location(value: str) -> str:
    """Normalize common campus and restroom wording without inventing a building."""
    text = value.strip().lower()
    text = _RESTROOM_ALIASES.sub("restroom", text)
    tokens = [token for token in words(text) if token not in _LOCATION_CONTEXT_WORDS]
    return " ".join(sorted(tokens))


def explicitly_off_campus(record: dict[str, Any]) -> bool:
    location = matching_text(record, "location").lower()
    return bool(re.search(
        r"\b(?:off[ -]?campus|offsite|outside (?:the )?(?:southern university college )?campus|not (?:within|on) (?:the )?campus)\b",
        location,
    ))


def english_category(value: str) -> str:
    return {
        "电子产品": "electronics",
        "证件与卡片": "identity cards and documents",
        "钥匙": "keys",
        "包袋": "bags",
        "衣物": "clothing",
        "水瓶与餐具": "drinkware and utensils",
        "书籍文具": "books and stationery",
        "饰品": "accessories and jewelry",
        "其他": "other item",
    }.get(value, "")


def canonical_category(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    if value in {
        "electronics", "identity cards and documents", "keys", "bags", "clothing",
        "drinkware and utensils", "books and stationery", "accessories and jewelry", "other item",
    }:
        return {
            "electronics": "电子产品",
            "identity cards and documents": "证件与卡片",
            "keys": "钥匙",
            "bags": "包袋",
            "clothing": "衣物",
            "drinkware and utensils": "水瓶与餐具",
            "books and stationery": "书籍文具",
            "accessories and jewelry": "饰品",
            "other item": "其他",
        }[value]
    return value


def attribute_text(attributes: dict[str, Any], key: str) -> str:
    value = attributes.get(key, "")
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return " ".join(item.strip() for item in value if isinstance(item, str) and item.strip())
    return ""


def matching_text(record: dict[str, Any], key: str) -> str:
    """Return the English semantic field generated for cross-language matching."""
    analysis = record.get("analysis")
    if not isinstance(analysis, dict):
        return ""
    translated = analysis.get("matching_text")
    if not isinstance(translated, dict):
        return ""
    value = translated.get(key, "")
    return value.strip() if isinstance(value, str) else ""


def pair_similarity(source: dict[str, Any], candidate: dict[str, Any], key: str, left: str, right: str) -> float:
    """Compare canonical English only; never mix untranslated originals into a score."""
    shared_left = matching_text(source, key)
    shared_right = matching_text(candidate, key)
    if not shared_left or not shared_right:
        return 0.0
    if key == "location":
        campus_left = normalize_campus_location(shared_left)
        campus_right = normalize_campus_location(shared_right)
        if not campus_left or not campus_right:
            return 0.25
        return similarity(campus_left, campus_right)
    return similarity(shared_left, shared_right)


def match_score(source: dict[str, Any], candidate: dict[str, Any]) -> tuple[int, list[str]]:
    points = 0.0
    evidence: list[str] = []

    if source["category"] and source["category"] != "unknown" and source["category"] == candidate["category"]:
        points += 22
        evidence.append("物品类别相同")

    location_score = pair_similarity(source, candidate, "location", source["location"], candidate["location"])
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
    color_score = pair_similarity(source, candidate, "color", source_color, candidate_color)
    points += 12 * color_score
    if color_score >= 0.45:
        evidence.append("颜色相似")

    brand_score = similarity(attribute_text(source_attrs, "brand"), attribute_text(candidate_attrs, "brand"))
    if brand_score >= 0.7:
        points += 8 * brand_score
        evidence.append("照片中可见品牌相同或相近")

    shared_source_description = matching_text(source, "description")
    shared_candidate_description = matching_text(candidate, "description")
    source_features = " ".join(
        part for part in (matching_text(source, "title"), shared_source_description, attribute_text(source_attrs, "features")) if part
    )
    candidate_features = " ".join(
        part for part in (matching_text(candidate, "title"), shared_candidate_description, attribute_text(candidate_attrs, "features")) if part
    )
    feature_score = similarity(source_features, candidate_features)
    points += 13 * feature_score
    if feature_score >= 0.3:
        evidence.append("物品特征有相似描述")

    return round(min(100, points)), evidence or ["类别、地点和时间有部分接近"]
