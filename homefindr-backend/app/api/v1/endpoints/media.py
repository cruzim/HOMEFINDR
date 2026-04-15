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

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024   # 10 MB
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
    current_user: AgentOrAdmin,
    files: List[UploadFile] = File(...),
) -> dict:
    """
    Upload up to 20 images for a property listing.
    Returns a list of public URLs.
    """
    if len(files) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 files per upload")

    urls: List[str] = []
    s3 = get_s3_client()

    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' is not an allowed image type (JPEG, PNG, WEBP)",
            )

        contents = await file.read()
        if len(contents) > MAX_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File '{file.filename}' exceeds the 10MB limit",
            )

        # Validate and optionally resize with Pillow
        try:
            img = PilImage.open(io.BytesIO(contents))
            img.verify()
            img = PilImage.open(io.BytesIO(contents))  # re-open after verify
        except Exception:
            raise HTTPException(status_code=400, detail=f"'{file.filename}' is not a valid image")

        # Resize if too large (preserving aspect ratio)
        if max(img.size) > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), PilImage.LANCZOS)
            buf = io.BytesIO()
            fmt = "JPEG" if file.content_type == "image/jpeg" else "PNG"
            img.save(buf, format=fmt, quality=88, optimize=True)
            contents = buf.getvalue()

        ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(
            file.content_type, "jpg"
        )
        key = f"properties/{current_user.id}/{uuid.uuid4()}.{ext}"

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