from sqlalchemy.ext.asyncio import AsyncSession
from services.llm_service import LLMService
from core.response import success_response, error_response


class LLMController:
    def __init__(self, db: AsyncSession):
        self.service = LLMService(db)

    async def get_all(self, skip: int = 0, limit: int = 20):
        """Get all LLM configurations"""
        try:
            llms = await self.service.get_all(skip, limit)
            return success_response(data=llms, message="LLM configurations retrieved successfully")
        except Exception as e:
            return error_response(message=f"Failed to retrieve LLM configurations: {str(e)}")

    async def get_by_id(self, llm_id: int):
        """Get LLM by ID"""
        try:
            llm = await self.service.get_by_id(llm_id)
            if not llm:
                return error_response(message="LLM configuration not found", status_code=404)
            return success_response(data=llm, message="LLM configuration retrieved successfully")
        except Exception as e:
            return error_response(message=f"Failed to retrieve LLM configuration: {str(e)}")

    async def create(self, llm_data: dict):
        """Create new LLM configuration"""
        try:
            llm = await self.service.create(llm_data)
            return success_response(data=llm, message="LLM configuration created successfully", status_code=201)
        except Exception as e:
            return error_response(message=f"Failed to create LLM configuration: {str(e)}")

    async def update(self, llm_id: int, llm_data: dict):
        """Update LLM configuration"""
        try:
            llm = await self.service.update(llm_id, llm_data)
            if not llm:
                return error_response(message="LLM configuration not found", status_code=404)
            return success_response(data=llm, message="LLM configuration updated successfully")
        except Exception as e:
            return error_response(message=f"Failed to update LLM configuration: {str(e)}")

    async def delete(self, llm_id: int):
        """Delete LLM configuration"""
        try:
            success = await self.service.delete(llm_id)
            if not success:
                return error_response(message="LLM configuration not found", status_code=404)
            return success_response(message="LLM configuration deleted successfully")
        except Exception as e:
            return error_response(message=f"Failed to delete LLM configuration: {str(e)}")
