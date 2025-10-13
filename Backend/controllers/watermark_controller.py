from sqlalchemy.ext.asyncio import AsyncSession
from services.watermark_service import WatermarkService
from core.response import success_response, error_response
from core.exceptions import NotFoundException, BadRequestException


class WatermarkController:
    """Controller layer for Watermark operations"""
    
    def __init__(self, db: AsyncSession):
        self.service = WatermarkService(db)
    
    async def get_all(self, skip: int, limit: int):
        try:
            watermarks = await self.service.get_all(skip, limit)
            return success_response(data=watermarks, message=f"Retrieved {len(watermarks)} watermarks")
        except Exception as e:
            return error_response(message="Failed to retrieve watermarks", error=str(e))
    
    async def get_by_id(self, watermark_id: int):
        try:
            watermark = await self.service.get_by_id(watermark_id)
            if not watermark:
                raise NotFoundException(f"Watermark with ID {watermark_id} not found")
            return success_response(data=watermark, message="Watermark retrieved successfully")
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(message="Failed to retrieve watermark", error=str(e))
    
    async def get_default(self):
        try:
            watermark = await self.service.get_default_watermark()
            if not watermark:
                return success_response(data=None, message="No default watermark set")
            return success_response(data=watermark, message="Default watermark retrieved")
        except Exception as e:
            return error_response(message="Failed to retrieve default watermark", error=str(e))
    
    async def create(self, data: dict):
        try:
            required_fields = ["name", "image_url", "created_by"]
            for field in required_fields:
                if field not in data:
                    raise BadRequestException(f"Missing required field: {field}")
            
            watermark = await self.service.create(data)
            return success_response(data=watermark, message="Watermark created successfully")
        except BadRequestException as e:
            raise e
        except Exception as e:
            return error_response(message="Failed to create watermark", error=str(e))
    
    async def update(self, watermark_id: int, data: dict):
        try:
            existing = await self.service.get_by_id(watermark_id)
            if not existing:
                raise NotFoundException(f"Watermark with ID {watermark_id} not found")
            
            watermark = await self.service.update(watermark_id, data)
            return success_response(data=watermark, message="Watermark updated successfully")
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(message="Failed to update watermark", error=str(e))
    
    async def delete(self, watermark_id: int):
        try:
            success = await self.service.delete(watermark_id)
            if not success:
                raise NotFoundException(f"Watermark with ID {watermark_id} not found")
            return success_response(message="Watermark deleted successfully")
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(message="Failed to delete watermark", error=str(e))
