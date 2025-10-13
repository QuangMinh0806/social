import asyncio
import sys
sys.path.append('.')

from config.database import async_session_maker
from services.template_service import TemplateService

async def test_template_update():
    """Test updating templates"""
    
    async with async_session_maker() as db:
        service = TemplateService(db)
        
        # First, create a template to update
        print("Creating a test template...")
        create_data = {
            "name": "Test Template for Update",
            "category": "Test",
            "template_type": "caption",
            "caption": "Original caption",
            "created_by": 1
        }
        try:
            template = await service.create(create_data)
            template_id = template['id']
            print(f"✅ Template created: ID={template_id}")
            print(f"   Original caption: {template['caption']}")
        except Exception as e:
            print(f"❌ Error creating template: {e}")
            return
        
        # Test 1: Update caption
        print(f"\nTest 1: Updating caption...")
        update_data = {
            "name": "Updated Caption Template",
            "caption": "This is the updated caption! 🎉",
            "template_type": "caption"
        }
        try:
            updated = await service.update(template_id, update_data)
            print(f"✅ Template updated: ID={updated['id']}")
            print(f"   New name: {updated['name']}")
            print(f"   New caption: {updated['caption']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 2: Change to hashtag template
        print(f"\nTest 2: Converting to hashtag template...")
        update_data = {
            "name": "Converted to Hashtag Template",
            "template_type": "hashtag",
            "hashtags": ["#updated", "#test", "#hashtags"]
        }
        try:
            updated = await service.update(template_id, update_data)
            print(f"✅ Template converted: ID={updated['id']}")
            print(f"   Type: {updated['template_type']}")
            print(f"   Hashtags: {updated['hashtags']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 3: Change to watermark template
        print(f"\nTest 3: Converting to watermark template...")
        update_data = {
            "name": "Converted to Watermark Template",
            "template_type": "watermark",
            "watermark_position": "top-left",
            "watermark_opacity": 0.5,
            "watermark_image_url": "https://example.com/new-logo.png"
        }
        try:
            updated = await service.update(template_id, update_data)
            print(f"✅ Template converted: ID={updated['id']}")
            print(f"   Type: {updated['template_type']}")
            print(f"   Position: {updated['watermark_position']}")
            print(f"   Opacity: {updated['watermark_opacity']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 4: Update with string hashtags (should be converted to array)
        print(f"\nTest 4: Updating with string hashtags...")
        update_data = {
            "name": "String Hashtags Test",
            "template_type": "hashtag",
            "hashtags": "#marketing #digital #2024"
        }
        try:
            updated = await service.update(template_id, update_data)
            print(f"✅ Template updated: ID={updated['id']}")
            print(f"   Type: {updated['template_type']}")
            print(f"   Hashtags: {updated['hashtags']}")
            print(f"   Hashtags type: {type(updated['hashtags'])}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Test 5: Update frame template
        print(f"\nTest 5: Converting to image frame template...")
        update_data = {
            "name": "Image Frame Template",
            "template_type": "image_frame",
            "frame_type": "Frame Hình ảnh",
            "aspect_ratio": "1:1",
            "frame_image_url": "https://example.com/frame.png"
        }
        try:
            updated = await service.update(template_id, update_data)
            print(f"✅ Template converted: ID={updated['id']}")
            print(f"   Type: {updated['template_type']}")
            print(f"   Frame Type: {updated['frame_type']}")
            print(f"   Aspect Ratio: {updated['aspect_ratio']}")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Verify final state
        print(f"\nFinal verification...")
        try:
            final = await service.get_by_id(template_id)
            print(f"✅ Final template state:")
            print(f"   ID: {final['id']}")
            print(f"   Name: {final['name']}")
            print(f"   Type: {final['template_type']}")
            print(f"   Frame Type: {final['frame_type']}")
            print(f"   Aspect Ratio: {final['aspect_ratio']}")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_template_update())
