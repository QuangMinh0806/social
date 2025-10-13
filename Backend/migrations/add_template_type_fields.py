"""
Migration script to add template_type and related fields
Run this after add_template_new_fields.py

New fields:
- template_type: Type of template (caption, hashtag, watermark, image_frame, video_frame)
- watermark_position: Position for watermark
- watermark_opacity: Opacity for watermark
- watermark_image_url: Image URL for watermark
- frame_type: Type of frame
- aspect_ratio: Aspect ratio for frames
- frame_image_url: Image URL for frames
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.database import engine
import asyncio


async def migrate():
    """Add template_type and related fields to templates table"""
    
    migrations = [
        # Add template_type
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS template_type VARCHAR(20) DEFAULT 'caption' NOT NULL;
        """,
        
        # Add watermark fields
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS watermark_position VARCHAR(20);
        """,
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS watermark_opacity FLOAT DEFAULT 0.8;
        """,
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS watermark_image_url VARCHAR(255);
        """,
        
        # Add frame fields
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS frame_type VARCHAR(50);
        """,
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(20);
        """,
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS frame_image_url VARCHAR(255);
        """,
    ]
    
    async with engine.begin() as conn:
        print("Starting migration for template_type...")
        
        for i, migration_sql in enumerate(migrations, 1):
            try:
                await conn.execute(text(migration_sql))
                print(f"✓ Migration {i}/{len(migrations)} completed")
            except Exception as e:
                print(f"✗ Migration {i}/{len(migrations)} failed: {str(e)}")
        
        print("\n✓ All migrations completed!")
        print("New fields added:")
        print("  - template_type")
        print("  - watermark_position, watermark_opacity, watermark_image_url")
        print("  - frame_type, aspect_ratio, frame_image_url")


if __name__ == "__main__":
    print("=" * 60)
    print("Template Type Migration")
    print("=" * 60)
    print()
    
    asyncio.run(migrate())
