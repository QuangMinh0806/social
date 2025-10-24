from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.model import LLM
from typing import List, Optional


class LLMService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 20) -> List[dict]:
        """Get all LLM configurations with pagination"""
        result = await self.db.execute(
            select(LLM).offset(skip).limit(limit)
        )
        llms = result.scalars().all()
        return [
            {
                "id": llm.id,
                "name": llm.name,
                "key": llm.key
            }
            for llm in llms
        ]

    async def get_by_id(self, llm_id: int) -> Optional[dict]:
        """Get LLM by ID"""
        result = await self.db.execute(
            select(LLM).where(LLM.id == llm_id)
        )
        llm = result.scalar_one_or_none()
        
        if not llm:
            return None
        
        return {
            "id": llm.id,
            "name": llm.name,
            "key": llm.key
        }

    async def create(self, llm_data: dict) -> dict:
        """Create new LLM configuration"""
        llm = LLM(**llm_data)
        self.db.add(llm)
        await self.db.commit()
        await self.db.refresh(llm)
        
        return {
            "id": llm.id,
            "name": llm.name,
            "key": llm.key
        }

    async def update(self, llm_id: int, llm_data: dict) -> Optional[dict]:
        """Update LLM configuration"""
        result = await self.db.execute(
            select(LLM).where(LLM.id == llm_id)
        )
        llm = result.scalar_one_or_none()
        
        if not llm:
            return None
        
        # Update fields
        for key, value in llm_data.items():
            if hasattr(llm, key) and value is not None:
                setattr(llm, key, value)
        
        await self.db.commit()
        await self.db.refresh(llm)
        
        return {
            "id": llm.id,
            "name": llm.name,
            "key": llm.key
        }

    async def delete(self, llm_id: int) -> bool:
        """Delete LLM configuration"""
        result = await self.db.execute(
            select(LLM).where(LLM.id == llm_id)
        )
        llm = result.scalar_one_or_none()
        
        if not llm:
            return False
        
        await self.db.delete(llm)
        await self.db.commit()
        
        return True
