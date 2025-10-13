from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.template_controller import TemplateController

router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.get("/")
async def get_all_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all templates with pagination"""
    controller = TemplateController(db)
    return await controller.get_all(skip, limit)


@router.get("/public")
async def get_public_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all public templates"""
    controller = TemplateController(db)
    return await controller.get_public_templates(skip, limit)


@router.get("/category/{category}")
async def get_templates_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get templates by category"""
    controller = TemplateController(db)
    return await controller.get_by_category(category, skip, limit)


@router.get("/{template_id}")
async def get_template_by_id(
    template_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get template by ID"""
    controller = TemplateController(db)
    return await controller.get_by_id(template_id)


@router.post("/")
async def create_template(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Create new template
    
    Required fields:
    - **name**: Template name
    - **created_by**: User ID who creates the template
    
    Optional fields:
    - **description**: Template description
    - **category**: Template category
    - **content_template**: Template content
    - **thumbnail_url**: Thumbnail URL
    - **is_public**: Is public (default: False)
    """
    controller = TemplateController(db)
    return await controller.create(data)


@router.put("/{template_id}")
async def update_template(
    template_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Update template"""
    controller = TemplateController(db)
    return await controller.update(template_id, data)


@router.patch("/{template_id}/increment-usage")
async def increment_template_usage(
    template_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Increment template usage count"""
    controller = TemplateController(db)
    return await controller.increment_usage(template_id)


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete template"""
    controller = TemplateController(db)
    return await controller.delete(template_id)
