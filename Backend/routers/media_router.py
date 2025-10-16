from fastapi import APIRouter, Depends, Query, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.media_controller import MediaController
from models.model import MediaType
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import shutil
from pathlib import Path
from PIL import Image
import mimetypes


router = APIRouter(prefix="/api/media", tags=["Media"])


class MediaCreate(BaseModel):
    user_id: int
    file_name: str
    file_type: str
    file_url: str
    file_size: int
    thumbnail_url: Optional[str] = None
    duration: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mime_type: Optional[str] = None
    storage_path: str
    is_processed: bool = False
    tags: Optional[str] = None


class MediaUpdate(BaseModel):
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_processed: Optional[bool] = None
    tags: Optional[str] = None


@router.get("/")
async def get_all_media(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all media items with pagination"""
    controller = MediaController(db)
    return await controller.get_all(skip, limit)


@router.get("/{media_id}")
async def get_media_by_id(
    media_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get media by ID"""
    controller = MediaController(db)
    return await controller.get_by_id(media_id)


@router.get("/user/{user_id}")
async def get_media_by_user(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all media items for a specific user"""
    controller = MediaController(db)
    return await controller.get_by_user(user_id, skip, limit)


@router.get("/type/{file_type}")
async def get_media_by_type(
    file_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get media by type (image, video, etc.)"""
    controller = MediaController(db)
    return await controller.get_by_type(file_type, skip, limit)


@router.post("/")
async def create_media(
    media: MediaCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new media item"""
    controller = MediaController(db)
    return await controller.create(media.dict())


@router.put("/{media_id}")
async def update_media(
    media_id: int,
    media: MediaUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update media item"""
    controller = MediaController(db)
    return await controller.update(media_id, media.dict(exclude_unset=True))


@router.delete("/{media_id}")
async def delete_media(
    media_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete media item"""
    controller = MediaController(db)
    return await controller.delete(media_id)


@router.patch("/{media_id}/mark-processed")
async def mark_media_as_processed(
    media_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Mark media as processed"""
    controller = MediaController(db)
    return await controller.mark_as_processed(media_id)


# Thư mục lưu trữ uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Cấu hình file types cho phép
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def get_file_type(mime_type: str) -> str:
    """Xác định loại file từ MIME type"""
    if mime_type in ALLOWED_IMAGE_TYPES:
        return "image"
    elif mime_type in ALLOWED_VIDEO_TYPES:
        return "video"
    elif mime_type == "image/gif":
        return "gif"
    return "unknown"


def get_image_dimensions(file_path: str):
    """Lấy kích thước ảnh"""
    try:
        with Image.open(file_path) as img:
            return img.width, img.height
    except Exception:
        return None, None


@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    user_id: int = Form(13),  # Default user_id = 13
    tags: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """Upload media file (image or video)"""
    
    # Validate MIME type
    mime_type = file.content_type
    if mime_type not in ALLOWED_IMAGE_TYPES and mime_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, MPEG, MOV, AVI)"
        )
    
    # Xác định file type
    file_type = get_file_type(mime_type)
    
    # Tạo tên file unique
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Tạo thư mục theo loại file
    file_type_dir = UPLOAD_DIR / file_type
    file_type_dir.mkdir(exist_ok=True)
    
    file_path = file_type_dir / unique_filename
    
    # Lưu file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    # Lấy file size
    file_size = os.path.getsize(file_path)
    
    # Validate file size
    if file_size > MAX_FILE_SIZE:
        os.remove(file_path)  # Xóa file nếu quá lớn
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    # Lấy dimensions cho ảnh
    width, height = None, None
    thumbnail_url = None
    
    if file_type == "image" or file_type == "gif":
        width, height = get_image_dimensions(str(file_path))
        thumbnail_url = f"http://localhost:8000/uploads/{file_type}/{unique_filename}"
    
    # Tạo URL cho file
    file_url = f"http://localhost:8000/uploads/{file_type}/{unique_filename}"
    
    # Xử lý tags - convert string to None nếu rỗng hoặc 'null'
    processed_tags = None
    if tags and tags.lower() not in ['null', 'none', '']:
        processed_tags = tags
    
    # Convert file_type string to MediaType enum
    try:
        media_type_enum = MediaType[file_type]
    except KeyError:
        media_type_enum = MediaType.image  # Default to image if unknown
    
    # Tạo record trong database
    media_data = {
        "user_id": 13,  # Fixed user_id
        "file_name": file.filename,
        "file_type": media_type_enum,  # Use enum instead of string
        "file_url": file_url,
        "file_size": file_size,
        "thumbnail_url": thumbnail_url,
        "width": width,
        "height": height,
        "mime_type": mime_type,
        "storage_path": str(file_path),
        "is_processed": True,
        "tags": processed_tags
    }
    
    controller = MediaController(db)
    return await controller.create(media_data)


@router.post("/upload/multiple")
async def upload_multiple_media(
    files: List[UploadFile] = File(...),
    user_id: int = Form(13),  # Default user_id = 13
    tags: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """Upload multiple media files"""
    
    results = []
    errors = []
    
    # Xử lý tags - convert string to None nếu rỗng hoặc 'null'
    processed_tags = None
    if tags and tags.lower() not in ['null', 'none', '']:
        processed_tags = tags
    
    for file in files:
        try:
            # Validate MIME type
            mime_type = file.content_type
            if mime_type not in ALLOWED_IMAGE_TYPES and mime_type not in ALLOWED_VIDEO_TYPES:
                errors.append({
                    "filename": file.filename,
                    "error": "File type not allowed"
                })
                continue
            
            # Xác định file type
            file_type = get_file_type(mime_type)
            
            # Tạo tên file unique
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Tạo thư mục theo loại file
            file_type_dir = UPLOAD_DIR / file_type
            file_type_dir.mkdir(exist_ok=True)
            
            file_path = file_type_dir / unique_filename
            
            # Lưu file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Lấy file size
            file_size = os.path.getsize(file_path)
            
            # Validate file size
            if file_size > MAX_FILE_SIZE:
                os.remove(file_path)
                errors.append({
                    "filename": file.filename,
                    "error": f"File size exceeds {MAX_FILE_SIZE / (1024*1024)}MB"
                })
                continue
            
            # Lấy dimensions cho ảnh
            width, height = None, None
            thumbnail_url = None
            
            if file_type == "image" or file_type == "gif":
                width, height = get_image_dimensions(str(file_path))
                thumbnail_url = f"http://localhost:8000/uploads/{file_type}/{unique_filename}"
            
            # Tạo URL cho file
            file_url = f"http://localhost:8000/uploads/{file_type}/{unique_filename}"
            
            # Convert file_type string to MediaType enum
            try:
                media_type_enum = MediaType[file_type]
            except KeyError:
                media_type_enum = MediaType.image  # Default to image if unknown
            
            # Tạo record trong database
            media_data = {
                "user_id": 13,  # Fixed user_id
                "file_name": file.filename,
                "file_type": media_type_enum,  # Use enum instead of string
                "file_url": file_url,
                "file_size": file_size,
                "thumbnail_url": thumbnail_url,
                "width": width,
                "height": height,
                "mime_type": mime_type,
                "storage_path": str(file_path),
                "is_processed": True,
                "tags": processed_tags
            }
            
            controller = MediaController(db)
            result = await controller.create(media_data)
            results.append(result)
            
        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "success": True,
        "uploaded": len(results),
        "failed": len(errors),
        "data": results,
        "errors": errors
    }
