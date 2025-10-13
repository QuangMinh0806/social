import asyncio
import sys
sys.path.append('.')

from config.database import async_session_maker
from services.template_service import TemplateService

async def test_template_creation():
    """Test creating different types of templates"""
    
    async with async_session_maker() as db:
        service = TemplateService(db)
        
        # Test 1: Caption template
        print("Testing Caption Template...")
        caption_data = {
            "name": "Caption Test",
            "category": "Marketing",
            "template_type": "caption",
            "caption": "Check out our new product! 🎉",
            "created_by": 1
        }
        try:
            result = await service.create(caption_data)
            print(f"✅ Caption template created: ID={result['id']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 2: Hashtag template with string
        print("\nTesting Hashtag Template (string input)...")
        hashtag_data = {
            "name": "Hashtag Test String",
            "category": "Marketing",
            "template_type": "hashtag",
            "hashtags": "#marketing #sale #2024",
            "created_by": 1
        }
        try:
            result = await service.create(hashtag_data)
            print(f"✅ Hashtag template created: ID={result['id']}")
            print(f"   Hashtags saved: {result['hashtags']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Hashtag template with array
        print("\nTesting Hashtag Template (array input)...")
        hashtag_data2 = {
            "name": "Hashtag Test Array",
            "category": "Marketing",
            "template_type": "hashtag",
            "hashtags": ["#tech", "#innovation", "#ai"],
            "created_by": 1
        }
        try:
            result = await service.create(hashtag_data2)
            print(f"✅ Hashtag template created: ID={result['id']}")
            print(f"   Hashtags saved: {result['hashtags']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 4: Watermark template
        print("\nTesting Watermark Template...")
        watermark_data = {
            "name": "Watermark Test",
            "category": "Branding",
            "template_type": "watermark",
            "watermark_position": "bottom-right",
            "watermark_opacity": 0.8,
            "watermark_image_url": "https://example.com/logo.png",
            "created_by": 1
        }
        try:
            result = await service.create(watermark_data)
            print(f"✅ Watermark template created: ID={result['id']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 5: Image Frame template
        print("\nTesting Image Frame Template...")
        frame_data = {
            "name": "Image Frame Test",
            "category": "Frames",
            "template_type": "image_frame",
            "frame_type": "Frame Hình ảnh",
            "aspect_ratio": "1:1",
            "frame_image_url": "https://example.com/frame.png",
            "created_by": 1
        }
        try:
            result = await service.create(frame_data)
            print(f"✅ Image frame template created: ID={result['id']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 6: Empty hashtags
        print("\nTesting Hashtag Template (empty hashtags)...")
        empty_hashtag_data = {
            "name": "Empty Hashtag Test",
            "category": "Test",
            "template_type": "hashtag",
            "hashtags": "",
            "created_by": 1
        }
        try:
            result = await service.create(empty_hashtag_data)
            print(f"✅ Empty hashtag template created: ID={result['id']}")
            print(f"   Hashtags saved: {result['hashtags']}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_template_creation())
