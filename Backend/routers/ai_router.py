from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from llm.generate_content import ask_chatbot
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from controllers.llm_controller import LLMController
from typing import Optional

router = APIRouter(
    prefix="/api/ai",
    tags=["AI"]
)


class GenerateContentRequest(BaseModel):
    topic: str


class GenerateContentResponse(BaseModel):
    content: str
    hashtags: str = ""  # Thêm field hashtags


class LLMCreate(BaseModel):
    name: str
    key: str


class LLMUpdate(BaseModel):
    name: Optional[str] = None
    key: Optional[str] = None


# ==================== LLM Configuration Endpoints ====================
@router.get("/llm")
async def get_all_llm(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
):
    """Get all LLM configurations"""
    controller = LLMController(db)
    return await controller.get_all(skip, limit)


@router.get("/llm/{llm_id}")
async def get_llm_by_id(
    llm_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get LLM configuration by ID"""
    controller = LLMController(db)
    return await controller.get_by_id(llm_id)


@router.post("/llm")
async def create_llm(
    llm: LLMCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create new LLM configuration"""
    controller = LLMController(db)
    return await controller.create(llm.dict())


@router.put("/llm/{llm_id}")
async def update_llm(
    llm_id: int,
    llm: LLMUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update LLM configuration"""
    controller = LLMController(db)
    return await controller.update(llm_id, llm.dict(exclude_unset=True))


@router.delete("/llm/{llm_id}")
async def delete_llm(
    llm_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete LLM configuration"""
    controller = LLMController(db)
    return await controller.delete(llm_id)


# ==================== Content Generation Endpoints ====================
@router.post("/generate-content", response_model=GenerateContentResponse)
async def generate_content_endpoint(request: GenerateContentRequest):
    """
    Generate social media content using AI based on given topic.
    Returns content and hashtags separately.
    """
    try:
        
        if not request.topic or not request.topic.strip():
            raise HTTPException(status_code=400, detail="Topic không được để trống")
        
        # Gọi hàm AI để tạo nội dung (trả về dict với content và hashtags)
        result = await ask_chatbot(request.topic)
        
        return GenerateContentResponse(
            content=result["content"],
            hashtags=result["hashtags"]
        )
    
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo nội dung: {str(e)}")


@router.post("/generate-hashtags")
async def generate_hashtags(request: GenerateContentRequest):
    """
    Generate hashtags for given topic
    """
    try:
        if not request.topic or not request.topic.strip():
            raise HTTPException(status_code=400, detail="Topic không được để trống")
        
        # Prompt đặc biệt cho hashtags
        from llm.generate_content import generate_content
        
        prompt = f"""Hãy tạo 5-10 hashtag phù hợp cho chủ đề: {request.topic}
        
        Yêu cầu:
        - Hashtag bằng tiếng Việt không dấu hoặc tiếng Anh
        - Phổ biến và dễ tìm kiếm
        - Liên quan trực tiếp đến chủ đề
        - Chỉ trả về danh sách hashtag, mỗi hashtag cách nhau bởi dấu cách
        - Ví dụ: #marketing #kinh_doanh #startup
        """
        
        hashtags = await generate_content(prompt)
        
        return {"hashtags": hashtags.strip()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tạo hashtags: {str(e)}")
