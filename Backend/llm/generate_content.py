import sys
from pathlib import Path

# Thêm thư mục Backend vào sys.path để import được các module
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from llm.gen_gpt import generate_with_gpt
from llm.gen_gemini import generate_with_gemini
from sqlalchemy.future import select
from models.model import LLM
from config.database import async_session_maker

# ==================== CẤU HÌNH MODEL =====================
async def get_current_model() -> str:
    
    async with async_session_maker() as session:
        result = await session.execute(select(LLM).where(LLM.id == 1))
        model = result.scalars().first()

        if not model:
            raise ValueError("❌ Không tìm thấy model có id = 1 trong bảng LLM")

        return {"name": model.name, "key": model.key}


# ==================== HÀM CHUNG =====================
async def generate_content(prompt: str) -> str:
    
    model = await get_current_model()
    
    model_name = model["name"].lower()
    api_key = model["key"]
    
    if model_name == "gpt":
        return await generate_with_gpt(prompt, api_key)
    elif model_name == "gemini":
        return await generate_with_gemini(prompt, api_key)
    else:
        raise ValueError(f"Model '{model_name}' không hợp lệ. Chọn 'gpt' hoặc 'gemini'.")


def clean_output(text: str) -> str:
    return text.strip()


async def ask_chatbot(content: str) -> str:

    prompt = f"""Bạn là một chuyên gia sáng tạo nội dung mạng xã hội, có khả năng viết bài thu hút và tự nhiên.
        Nhiệm vụ của bạn là viết một bài đăng hấp dẫn (có thể dùng cho Facebook, Instagram hoặc TikTok caption) về chủ đề: **{content}**.

        Yêu cầu:

        Phong cách: tự nhiên, thân thiện, dễ gần.

        Độ dài: khoảng 100-200 từ.

        Có câu mở thu hút, nội dung chính rõ ràng, và call-to-action (CTA) ở cuối.

        Thêm 2-3 hashtag phù hợp.

        Nếu chủ đề liên quan đến sản phẩm/dịch vụ, hãy khéo léo lồng ghép lợi ích cho người đọc.

        Viết bằng tiếng Việt."""
        
    
    raw_output = await generate_content(prompt)
    return clean_output(raw_output)


