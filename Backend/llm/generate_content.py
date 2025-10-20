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
    """
    Làm sạch output từ AI:
    - Loại bỏ phần giới thiệu thừa (như "Tuyệt vời! Dưới đây là...")
    - Loại bỏ các phần markdown thừa
    - Chỉ giữ lại nội dung chính
    """
    text = text.strip()
    
    # Loại bỏ các câu giới thiệu thừa phổ biến
    intro_phrases = [
        "Tuyệt vời! Dưới đây là",
        "Dưới đây là",
        "Đây là",
        "Sau đây là",
        "Đây là một bài đăng mẫu",
        "bạn có thể tham khảo:",
        "bạn có thể tham khảo",
        "mà bạn có thể tham khảo:",
        "mà bạn có thể tham khảo",
        "một bài đăng mẫu",
    ]
    
    lines = text.split('\n')
    cleaned_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        # Bỏ qua dòng đầu nếu chứa cụm từ giới thiệu
        if i == 0:
            should_skip = False
            for phrase in intro_phrases:
                if phrase.lower() in line_lower:
                    should_skip = True
                    break
            if should_skip:
                continue
        
        # Bỏ qua dòng trống đầu tiên
        if i <= 2 and not line.strip():
            continue
            
        cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines).strip()


async def ask_chatbot(content: str) -> dict:
    """
    Tạo nội dung bài đăng từ AI.
    
    Returns:
        dict: {
            "content": str,  # Nội dung bài viết (không có hashtags)
            "hashtags": str  # Các hashtags, cách nhau bởi khoảng trắng
        }
    """
    prompt = f"""Bạn là một chuyên gia sáng tạo nội dung mạng xã hội, có khả năng viết bài thu hút và tự nhiên.
Nhiệm vụ của bạn là viết một bài đăng hấp dẫn (có thể dùng cho Facebook, Instagram hoặc TikTok caption) về chủ đề: **{content}**.

YÊU CẦU QUAN TRỌNG:
1. KHÔNG ĐƯỢC viết bất kỳ câu giới thiệu nào như "Tuyệt vời!", "Dưới đây là...", "Đây là bài đăng mẫu..."
2. Bắt đầu TRỰC TIẾP vào nội dung bài đăng
3. Phong cách: tự nhiên, thân thiện, dễ gần
4. Độ dài: khoảng 100-200 từ
5. Có câu mở thu hút, nội dung chính rõ ràng, và call-to-action (CTA) ở cuối
6. Đặt 3-5 hashtag phù hợp ở CUỐI CÙNG, mỗi hashtag bắt đầu bằng dấu #
7. Nếu chủ đề liên quan đến sản phẩm/dịch vụ, hãy khéo léo lồng ghép lợi ích cho người đọc
8. Viết bằng tiếng Việt

FORMAT:
[Nội dung bài viết]

[Dòng trống]

#Hashtag1 #Hashtag2 #Hashtag3"""
    
    raw_output = await generate_content(prompt)
    cleaned = clean_output(raw_output)
    
    # Tách nội dung và hashtags
    lines = cleaned.split('\n')
    content_lines = []
    hashtag_lines = []
    
    # Tìm dòng chứa hashtags (thường ở cuối)
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Nếu dòng bắt đầu bằng # hoặc chứa nhiều # thì là hashtag
        if stripped.startswith('#') or stripped.count('#') >= 2:
            hashtag_lines.append(stripped)
        else:
            content_lines.append(line)
    
    # Ghép nội dung (không có hashtags)
    content = '\n'.join(content_lines).strip()
    
    # Ghép hashtags thành chuỗi cách nhau bởi khoảng trắng
    hashtags = ' '.join(hashtag_lines).strip()
    
    # Nếu không tìm thấy hashtags riêng, tìm trong nội dung
    if not hashtags and '#' in content:
        # Tách hashtags từ cuối nội dung
        parts = content.split('#')
        if len(parts) > 1:
            # Phần đầu là nội dung
            content = parts[0].strip()
            # Phần sau là hashtags
            hashtags = '#' + ' #'.join([p.strip() for p in parts[1:] if p.strip()])
    
    return {
        "content": content,
        "hashtags": hashtags
    }


