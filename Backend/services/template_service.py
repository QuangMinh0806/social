from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import sys
sys.path.append('..')
from models.model import Template
from typing import List, Optional, Dict


class TemplateService:
    """Service layer for Template operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get all templates with pagination"""
        query = select(Template).offset(skip).limit(limit)
        result = await self.db.execute(query)
        templates = result.scalars().all()
        return [self._to_dict(template) for template in templates]
    
    async def get_by_id(self, template_id: int) -> Optional[Dict]:
        """Get template by ID"""
        query = select(Template).where(Template.id == template_id)
        result = await self.db.execute(query)
        template = result.scalar_one_or_none()
        return self._to_dict(template) if template else None
    
    async def get_by_category(self, category: str, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get templates by category"""
        query = (
            select(Template)
            .where(Template.category == category)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        templates = result.scalars().all()
        return [self._to_dict(template) for template in templates]
    
    async def get_public_templates(self, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Get all public templates"""
        query = (
            select(Template)
            .where(Template.is_public == True)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        templates = result.scalars().all()
        return [self._to_dict(template) for template in templates]
    
    async def get_by_user(self, user_id: int) -> List[Dict]:
        """Get templates created by user"""
        query = select(Template).where(Template.created_by == user_id)
        result = await self.db.execute(query)
        templates = result.scalars().all()
        return [self._to_dict(template) for template in templates]
    
    async def create(self, data: dict) -> Dict:
        """Create a new template"""
        # Clean and validate data before creating
        cleaned_data = self._clean_template_data(data)
        
        template = Template(**cleaned_data)
        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        return self._to_dict(template)
    
    async def update(self, template_id: int, data: dict) -> Optional[Dict]:
        """Update template"""
        # Clean and validate data before updating
        cleaned_data = self._clean_template_data(data)
        
        query = (
            update(Template)
            .where(Template.id == template_id)
            .values(**cleaned_data)
            .returning(Template)
        )
        result = await self.db.execute(query)
        await self.db.commit()
        template = result.scalar_one_or_none()
        return self._to_dict(template) if template else None
    
    async def increment_usage(self, template_id: int) -> Optional[Dict]:
        """Increment template usage count"""
        template = await self.get_by_id(template_id)
        if not template:
            return None
        
        new_count = template["usage_count"] + 1
        return await self.update(template_id, {"usage_count": new_count})
    
    async def delete(self, template_id: int) -> bool:
        """Delete a template"""
        query = delete(Template).where(Template.id == template_id)
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount > 0
    
    def _clean_template_data(self, data: dict) -> dict:
        """Clean and validate template data before saving"""
        cleaned = data.copy()
        
        # Handle hashtags - ensure it's a proper list or None
        if 'hashtags' in cleaned:
            if isinstance(cleaned['hashtags'], str):
                # If string, try to parse it
                if cleaned['hashtags'].strip() in ['', '""', '[]']:
                    cleaned['hashtags'] = None
                else:
                    # Split by spaces/commas and clean
                    tags = cleaned['hashtags'].replace('"', '').split()
                    cleaned['hashtags'] = [tag.strip() for tag in tags if tag.strip()]
            elif isinstance(cleaned['hashtags'], list):
                # Already a list, just clean it
                cleaned['hashtags'] = [str(tag).strip() for tag in cleaned['hashtags'] if str(tag).strip()]
            elif not cleaned['hashtags']:
                cleaned['hashtags'] = None
        
        # Set empty strings to None for optional fields
        optional_string_fields = [
            'description', 'category', 'caption', 
            'watermark_position', 'watermark_image_url',
            'frame_type', 'aspect_ratio', 'frame_image_url',
            'content_template', 'thumbnail_url',
            'image_frame_url', 'video_frame_url'
        ]
        
        for field in optional_string_fields:
            if field in cleaned and cleaned[field] == '':
                cleaned[field] = None
        
        # Set default values for numeric fields if empty
        if 'watermark_opacity' in cleaned and cleaned['watermark_opacity'] == '':
            cleaned['watermark_opacity'] = None
        
        # Ensure boolean fields have proper values
        boolean_fields = ['is_public', 'watermark_enabled', 'image_frame_enabled', 'video_frame_enabled']
        for field in boolean_fields:
            if field in cleaned:
                cleaned[field] = bool(cleaned[field])
        
        # Set default usage_count
        if 'usage_count' not in cleaned:
            cleaned['usage_count'] = 0
            
        return cleaned
    
    def _to_dict(self, template: Template) -> Dict:
        """Convert SQLAlchemy Template model to dictionary"""
        if not template:
            return None
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "category": template.category,
            
            # Template type
            "template_type": template.template_type,
            
            # Caption fields
            "caption": template.caption,
            
            # Hashtag fields
            "hashtags": template.hashtags if template.hashtags else [],
            
            # Watermark fields
            "watermark_position": template.watermark_position,
            "watermark_opacity": template.watermark_opacity,
            "watermark_image_url": template.watermark_image_url,
            
            # Frame fields
            "frame_type": template.frame_type,
            "aspect_ratio": template.aspect_ratio,
            "frame_image_url": template.frame_image_url,
            
            # Legacy fields
            "watermark_id": template.watermark_id,
            "watermark_enabled": template.watermark_enabled,
            "image_frame_url": template.image_frame_url,
            "image_frame_enabled": template.image_frame_enabled,
            "video_frame_url": template.video_frame_url,
            "video_frame_enabled": template.video_frame_enabled,
            "content_template": template.content_template,
            "thumbnail_url": template.thumbnail_url,
            "is_public": template.is_public,
            "created_by": template.created_by,
            "usage_count": template.usage_count,
            "created_at": template.created_at.isoformat() if template.created_at else None,
            "updated_at": template.updated_at.isoformat() if template.updated_at else None
        }
