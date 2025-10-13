from sqlalchemy.ext.asyncio import AsyncSession
from services.template_service import TemplateService
from core.response import success_response, error_response
from core.exceptions import NotFoundException, BadRequestException


class TemplateController:
    """Controller layer for Template operations"""
    
    def __init__(self, db: AsyncSession):
        self.service = TemplateService(db)
    
    async def get_all(self, skip: int, limit: int):
        """Get all templates"""
        try:
            templates = await self.service.get_all(skip, limit)
            return success_response(
                data=templates,
                message=f"Retrieved {len(templates)} templates successfully"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve templates",
                error=str(e)
            )
    
    async def get_by_id(self, template_id: int):
        """Get template by ID"""
        try:
            template = await self.service.get_by_id(template_id)
            if not template:
                raise NotFoundException(f"Template with ID {template_id} not found")
            return success_response(
                data=template,
                message="Template retrieved successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to retrieve template",
                error=str(e)
            )
    
    async def get_by_category(self, category: str, skip: int, limit: int):
        """Get templates by category"""
        try:
            templates = await self.service.get_by_category(category, skip, limit)
            return success_response(
                data=templates,
                message=f"Retrieved {len(templates)} templates in category '{category}'"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve templates by category",
                error=str(e)
            )
    
    async def get_public_templates(self, skip: int, limit: int):
        """Get public templates"""
        try:
            templates = await self.service.get_public_templates(skip, limit)
            return success_response(
                data=templates,
                message=f"Retrieved {len(templates)} public templates"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve public templates",
                error=str(e)
            )
    
    async def create(self, data: dict):
        """Create new template"""
        try:
            required_fields = ["name", "created_by"]
            for field in required_fields:
                if field not in data:
                    raise BadRequestException(f"Missing required field: {field}")
            
            template = await self.service.create(data)
            return success_response(
                data=template,
                message="Template created successfully"
            )
        except BadRequestException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to create template",
                error=str(e)
            )
    
    async def update(self, template_id: int, data: dict):
        """Update template"""
        try:
            existing = await self.service.get_by_id(template_id)
            if not existing:
                raise NotFoundException(f"Template with ID {template_id} not found")
            
            template = await self.service.update(template_id, data)
            return success_response(
                data=template,
                message="Template updated successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to update template",
                error=str(e)
            )
    
    async def increment_usage(self, template_id: int):
        """Increment template usage count"""
        try:
            template = await self.service.increment_usage(template_id)
            if not template:
                raise NotFoundException(f"Template with ID {template_id} not found")
            return success_response(
                data=template,
                message="Template usage count incremented"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to increment usage count",
                error=str(e)
            )
    
    async def delete(self, template_id: int):
        """Delete template"""
        try:
            success = await self.service.delete(template_id)
            if not success:
                raise NotFoundException(f"Template with ID {template_id} not found")
            return success_response(
                message="Template deleted successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to delete template",
                error=str(e)
            )
