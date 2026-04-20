"""
File/media upload endpoint.
Uploads images to Cloudflare R2 (S3-compatible) and returns public URLs.
"""
import uuid
import io
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image as PilImage

from app.core.config import settings
from app.api.v1.deps import CurrentUser, AgentOrAdmin

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"}
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES
MAX_IMAGE_BYTES = 10 * 1024 * 1024    # 10 MB
MAX_VIDEO_BYTES = 200 * 1024 * 1024   # 200 MB
MAX_SIZE_BYTES = MAX_VIDEO_BYTES       # kept for backwards-compat reference
MAX_DIMENSION = 4000


def get_s3_client():
    """Lazy import boto3 to avoid import error if not installed."""
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION,
    )


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_images(
    current_user: CurrentUser,
    files: List[UploadFile] = File(...),
) -> dict:
    """
    Upload images (property photos or profile picture).
    Any authenticated user can upload. Returns a list of public URLs.
    """
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per upload")

    urls: List[str] = []
    s3 = get_s3_client()

    for file in files:
        is_video = file.content_type in ALLOWED_VIDEO_TYPES
        is_image = file.content_type in ALLOWED_IMAGE_TYPES

        if not is_video and not is_image:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' is not an allowed type (JPEG, PNG, WEBP, MP4, MOV, WEBM)",
            )

        contents = await file.read()
        size_limit = MAX_VIDEO_BYTES if is_video else MAX_IMAGE_BYTES
        size_label = "200MB" if is_video else "10MB"
        if len(contents) > size_limit:
            raise HTTPException(
                status_code=413,
                detail=f"File '{file.filename}' exceeds the {size_label} limit",
            )

        if is_image:
            # Validate and optionally resize with Pillow
            try:
                img = PilImage.open(io.BytesIO(contents))
                img.verify()
                img = PilImage.open(io.BytesIO(contents))  # re-open after verify
            except Exception:
                raise HTTPException(status_code=400, detail=f"'{file.filename}' is not a valid image")

            if max(img.size) > MAX_DIMENSION:
                img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), PilImage.LANCZOS)
                buf = io.BytesIO()
                fmt = "JPEG" if file.content_type == "image/jpeg" else "PNG"
                img.save(buf, format=fmt, quality=88, optimize=True)
                contents = buf.getvalue()

        ext_map = {
            "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
            "video/mp4": "mp4", "video/quicktime": "mov",
            "video/webm": "webm", "video/x-msvideo": "avi",
        }
        ext = ext_map.get(file.content_type, "bin")
        folder = "videos" if is_video else "properties"
        key = f"{folder}/{current_user.id}/{uuid.uuid4()}.{ext}"

        try:
            s3.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=key,
                Body=contents,
                ContentType=file.content_type,
                CacheControl="public, max-age=31536000",
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Storage upload failed: {str(e)}")

        urls.append(f"{settings.S3_PUBLIC_URL}/{key}")

    return {"urls": urls}


@router.delete("/delete")
async def delete_media(
    current_user: AgentOrAdmin,
    key: str,
) -> dict:
    """Delete a media file from storage by its storage key."""
    # Ensure the key belongs to this user (security check)
    if not key.startswith(f"properties/{current_user.id}/"):
        raise HTTPException(status_code=403, detail="You can only delete your own media")
    try:
        s3 = get_s3_client()
        s3.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=key)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"deleted": key}