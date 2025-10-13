from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.watermark_controller import WatermarkController

router = APIRouter(prefix="/api/watermarks", tags=["Watermarks"])


@router.get("/")
async def get_all_watermarks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all watermarks"""
    controller = WatermarkController(db)
    return await controller.get_all(skip, limit)


@router.get("/default")
async def get_default_watermark(db: AsyncSession = Depends(get_db)):
    """Get default watermark"""
    controller = WatermarkController(db)
    return await controller.get_default()


@router.get("/{watermark_id}")
async def get_watermark_by_id(watermark_id: int, db: AsyncSession = Depends(get_db)):
    """Get watermark by ID"""
    controller = WatermarkController(db)
    return await controller.get_by_id(watermark_id)


@router.post("/")
async def create_watermark(data: dict, db: AsyncSession = Depends(get_db)):
    """Create new watermark"""
    controller = WatermarkController(db)
    return await controller.create(data)


@router.put("/{watermark_id}")
async def update_watermark(watermark_id: int, data: dict, db: AsyncSession = Depends(get_db)):
    """Update watermark"""
    controller = WatermarkController(db)
    return await controller.update(watermark_id, data)


@router.delete("/{watermark_id}")
async def delete_watermark(watermark_id: int, db: AsyncSession = Depends(get_db)):
    """Delete watermark"""
    controller = WatermarkController(db)
    return await controller.delete(watermark_id)
