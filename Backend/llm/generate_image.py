import os
from google import genai
from google.genai import types
import base64
from PIL import Image
from io import BytesIO

def configure_api(api_key: str):
    """Cấu hình client dùng API key từ Google AI Studio"""
    os.environ["GOOGLE_API_KEY"] = api_key
    client = genai.Client(api_key=api_key)
    return client


def generate_image(client, prompt: str, model: str = "imagen-4.0-generate-001",
                   num_images: int = 1, aspect_ratio: str = "1:1"):
    """Tạo ảnh từ prompt bằng Imagen 4"""
    config = types.GenerateImagesConfig(
        number_of_images=num_images,
        aspect_ratio=aspect_ratio
    )

    response = client.models.generate_images(
        model=model,
        prompt=prompt,
        config=config
    )
    return response


def save_images(response, base_path="output"):
    """
    Lưu ảnh từ response ra file
    """
    for idx, gen_img in enumerate(response.generated_images):
        path = f"{base_path}_{idx + 1}.png"
        
        try:
            image_obj = gen_img.image
            
            # Lấy image_bytes
            image_bytes = image_obj.image_bytes
            
            print(f"📦 Đã nhận dữ liệu: {len(image_bytes)} bytes")
            
            # Kiểm tra nếu là bytes chứa base64 string
            if isinstance(image_bytes, bytes):
                # Convert bytes sang string
                try:
                    base64_string = image_bytes.decode('utf-8')
                    print(f"✓ Đã decode bytes thành base64 string")
                    print(f"   Preview: {base64_string[:100]}")
                    
                    # Decode base64 string thành image bytes thực sự
                    actual_image_bytes = base64.b64decode(base64_string)
                    print(f"✓ Đã decode base64 thành image bytes: {len(actual_image_bytes)} bytes")
                    
                    # Kiểm tra magic bytes
                    if actual_image_bytes.startswith(b'\x89PNG'):
                        print("✓ Format: PNG")
                    elif actual_image_bytes.startswith(b'\xff\xd8\xff'):
                        print("✓ Format: JPEG")
                    
                    # Lưu file
                    with open(path, 'wb') as f:
                        f.write(actual_image_bytes)
                    
                    print(f"✅ Ảnh đã lưu thành công tại: {path}")
                    
                    # Mở và hiển thị
                    image = Image.open(path)
                    print(f"   Kích thước: {image.size}, Mode: {image.mode}")
                    image.show()
                    
                except UnicodeDecodeError:
                    # Nếu không phải base64 string trong bytes, thì là raw image bytes
                    print("⚠️ Không phải base64, đang xử lý như raw bytes...")
                    with open(path, 'wb') as f:
                        f.write(image_bytes)
                    image = Image.open(path)
                    image.show()
            
            elif isinstance(image_bytes, str):
                # Nếu đã là string thì decode trực tiếp
                actual_image_bytes = base64.b64decode(image_bytes)
                with open(path, 'wb') as f:
                    f.write(actual_image_bytes)
                print(f"✅ Ảnh đã lưu thành công tại: {path}")
                image = Image.open(path)
                image.show()
                
        except Exception as e:
            print(f"❌ Lỗi khi xử lý ảnh {idx + 1}: {e}")
            import traceback
            traceback.print_exc()


def main():
    API_KEY = "AIzaSyBs3UvKKKONRXfIZ1fMRuj0mpr3UKONqI0"

    client = configure_api(API_KEY)
    prompt = "a futuristic city at night, neon lights reflecting on water, cinematic style"
    print("🚀 Đang tạo ảnh:", prompt)

    try:
        resp = generate_image(
            client,
            prompt,
            model="imagen-4.0-generate-001",
            num_images=1,
            aspect_ratio="16:9"
        )
        save_images(resp, base_path="city_neon")

    except Exception as e:
        print("❌ Lỗi khi tạo ảnh:", e)
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()