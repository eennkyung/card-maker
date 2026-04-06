from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from backend.color_extractor import extract_dominant_colors

app = FastAPI(title="Color Extractor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 10


@app.post("/extract")
async def extract_colors(
    file: UploadFile = File(...),
    count: int = Query(default=6, ge=1, le=20),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="지원하지 않는 이미지 형식입니다.")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"파일 크기는 {MAX_SIZE_MB}MB 이하여야 합니다.")

    colors = extract_dominant_colors(image_bytes, count=count)
    return {"colors": colors, "count": len(colors)}


# 프론트엔드 정적 파일 서빙
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
