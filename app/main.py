from __future__ import annotations

import base64
import json
import os
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps, UnidentifiedImageError

from .matching import match_score, parse_time


ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
DATA_DIR = PROJECT_ROOT / "work" / "app_data"
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "lost_found.sqlite3"
STATIC_DIR = ROOT / "static"
MAX_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
CATEGORIES = {"电子产品", "证件与卡片", "钥匙", "包袋", "衣物", "水瓶与餐具", "书籍文具", "饰品", "其他"}
KINDS = {"lost", "found"}

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="拾见 · 失物照片配对")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def connect() -> sqlite3.Connection:
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    return db


def init_db() -> None:
    with connect() as db:
        db.execute(
            """CREATE TABLE IF NOT EXISTS records (
                id TEXT PRIMARY KEY,
                kind TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                color TEXT NOT NULL,
                location TEXT NOT NULL,
                occurred_at TEXT NOT NULL,
                description TEXT NOT NULL,
                image_name TEXT NOT NULL,
                image_analysis TEXT NOT NULL,
                analysis_status TEXT NOT NULL,
                created_at TEXT NOT NULL
            )"""
        )


init_db()


def normalize_image(raw: bytes) -> tuple[bytes, str]:
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="图片不能为空，且不能超过 8 MB。")
    try:
        from io import BytesIO

        with Image.open(BytesIO(raw)) as source:
            if source.format not in ALLOWED_FORMATS:
                raise HTTPException(status_code=400, detail="请上传 JPG、PNG 或 WebP 图片。")
            if source.width > 8000 or source.height > 8000:
                raise HTTPException(status_code=400, detail="图片尺寸不能超过 8000 × 8000。")
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((1800, 1800))
            output = BytesIO()
            image.save(output, format="JPEG", quality=86, optimize=True)
            return output.getvalue(), ".jpg"
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="无法读取这张图片，请换一张再试。") from exc


def get_text_content(response: dict[str, Any]) -> str:
    return response["choices"][0]["message"]["content"]


def analyze_image(image_bytes: bytes, title: str, category: str, description: str) -> tuple[dict[str, Any], str]:
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        return {}, "not_configured"

    data_url = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("ascii")
    body = {
        "model": os.getenv("DEEPSEEK_MODEL", "deepseek-flash"),
        "temperature": 0.1,
        "max_tokens": 350,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "你是失物照片特征提取器。只描述图片中可见的物品，不推断所有者、身份或看不清的品牌。"
                    "输出 JSON 对象，字段为 category（从电子产品、证件与卡片、钥匙、包袋、衣物、"
                    "水瓶与餐具、书籍文具、饰品、其他中选择一个）、colors（颜色字符串数组）、"
                    "brand（看得清时填写，否则空字符串）、features（可见的独特特征字符串数组）。"
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": f"用户填写：标题={title}；类别={category}；说明={description or '无'}"},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
    }
    request = Request(
        "https://api.deepseek.com/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=35) as response:
            payload = json.loads(response.read().decode("utf-8"))
        content = get_text_content(payload)
        return json.loads(content), "analyzed"
    except (HTTPError, URLError, TimeoutError, KeyError, IndexError, TypeError, ValueError, UnicodeDecodeError):
        return {}, "unavailable"


def row_to_record(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "kind": row["kind"],
        "title": row["title"],
        "category": row["category"],
        "color": row["color"],
        "location": row["location"],
        "occurred_at": row["occurred_at"],
        "description": row["description"],
        "image_url": f"/uploads/{row['image_name']}",
        "analysis": json.loads(row["image_analysis"]),
        "analysis_status": row["analysis_status"],
        "created_at": row["created_at"],
    }


def find_matches(record: dict[str, Any]) -> list[dict[str, Any]]:
    opposite_kind = "found" if record["kind"] == "lost" else "lost"
    with connect() as db:
        rows = db.execute("SELECT * FROM records WHERE kind = ? AND id != ?", (opposite_kind, record["id"])).fetchall()
    scored = []
    for row in rows:
        candidate = row_to_record(row)
        score, evidence = match_score(record, {**candidate, "analysis": candidate["analysis"]})
        candidate["match_score"] = score
        candidate["match_evidence"] = evidence
        scored.append(candidate)
    return sorted(scored, key=lambda item: (-item["match_score"], item["id"]))[:5]


@app.get("/")
def home() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/uploads/{filename}")
def uploaded_image(filename: str) -> FileResponse:
    if not re.fullmatch(r"[0-9a-f]{32}\.jpg", filename):
        raise HTTPException(status_code=404, detail="找不到图片。")
    path = UPLOAD_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="找不到图片。")
    return FileResponse(path, media_type="image/jpeg")


@app.get("/api/records")
def list_records(kind: str | None = None) -> list[dict[str, Any]]:
    if kind and kind not in KINDS:
        raise HTTPException(status_code=400, detail="无效的记录类型。")
    with connect() as db:
        if kind:
            rows = db.execute("SELECT * FROM records WHERE kind = ? ORDER BY created_at DESC LIMIT 100", (kind,)).fetchall()
        else:
            rows = db.execute("SELECT * FROM records ORDER BY created_at DESC LIMIT 100").fetchall()
    return [row_to_record(row) for row in rows]


@app.post("/api/records")
async def create_record(
    kind: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    color: str = Form(""),
    location: str = Form(...),
    occurred_at: str = Form(...),
    description: str = Form(""),
    image: UploadFile = File(...),
) -> dict[str, Any]:
    if kind not in KINDS:
        raise HTTPException(status_code=400, detail="请选择丢失或拾获。")
    if category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="请选择有效的物品类别。")
    title, location, color, description = title.strip(), location.strip(), color.strip(), description.strip()
    if not (2 <= len(title) <= 80):
        raise HTTPException(status_code=400, detail="标题请填写 2 到 80 个字。")
    if not (2 <= len(location) <= 120):
        raise HTTPException(status_code=400, detail="地点请填写 2 到 120 个字，并使用大概位置。")
    if len(description) > 400:
        raise HTTPException(status_code=400, detail="补充说明最多 400 个字。")
    if not parse_time(occurred_at):
        raise HTTPException(status_code=400, detail="请选择有效的日期和时间。")
    raw = await image.read(MAX_IMAGE_BYTES + 1)
    normalized, _ = normalize_image(raw)
    image_name = uuid.uuid4().hex + ".jpg"
    (UPLOAD_DIR / image_name).write_bytes(normalized)
    attributes, analysis_status = analyze_image(normalized, title, category, description)
    record_id = uuid.uuid4().hex
    created_at = datetime.now(timezone.utc).isoformat()
    with connect() as db:
        db.execute(
            """INSERT INTO records
            (id, kind, title, category, color, location, occurred_at, description,
             image_name, image_analysis, analysis_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (record_id, kind, title, category, color, location, occurred_at, description,
             image_name, json.dumps(attributes, ensure_ascii=False), analysis_status, created_at),
        )
        row = db.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
    record = row_to_record(row)
    record["matches"] = find_matches(record)
    return record


app.mount("/", StaticFiles(directory=STATIC_DIR), name="frontend")
