import os
from io import BytesIO
from PIL import Image

from google import genai
from google.genai import types

def configure_api(api_key: str):
    """
    Cấu hình API key để dùng Google AI Studio API (không dùng Vertex)
    """
    os.environ["GOOGLE_API_KEY"] = api_key
    # ⚠️ KHÔNG bật dòng dưới, vì sẽ chuyển sang Vertex AI (yêu cầu OAuth2)
    # os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"

    # Tạo client
    client = genai.Client()
    return client


def generate_image(client, prompt: str, model: str = "imagen-4.0-generate-001",
                   num_images: int = 1, aspect_ratio: str = "1:1"):
    """
    Tạo ảnh từ prompt bằng Imagen 4 (Google AI Studio)
    """
    # Cấu hình tham số
    config = types.GenerateImagesConfig(
        number_of_images=num_images,
        aspect_ratio=aspect_ratio
    )

    # Gọi API
    response = client.models.generate_images(
        model=model,
        prompt=prompt,
        config=config
    )

    return response


def save_images(response, base_path="output"):
    """
    Lưu tất cả ảnh trong response ra file
    """
    for idx, gen_img in enumerate(response.generated_images):
        img = gen_img.image  # PIL Image object
        path = f"{base_path}_{idx+1}.png"
        img.save(path)
        print(f"✅ Lưu ảnh: {path}")


def main():
    # 🔑 Thay bằng API key thật từ https://aistudio.google.com/app/apikey
    API_KEY = "AIzaSyBs3UvKKKONRXfIZ1fMRuj0mpr3UKONqI0"

    client = configure_api(API_KEY)

    prompt = "a cute corgi wearing sunglasses, surfing a big wave under the sunset"
    print("🚀 Đang tạo ảnh với prompt:", prompt)

    try:
        resp = generate_image(
            client,
            prompt,
            model="imagen-4.0-generate-001",
            num_images=1,
            aspect_ratio="16:9"
        )
        save_images(resp, base_path="corgi_surfing")
    except Exception as e:
        print("❌ Lỗi khi tạo ảnh:", e)


if __name__ == "__main__":
    main()
