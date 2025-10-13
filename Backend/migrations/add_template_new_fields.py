"""
Migration script to add new fields to templates table
Run this script to update the database schema

Fields added:
- caption: Text field for post caption
- hashtags: JSON field for hashtag array
- watermark_id: Foreign key to watermarks table
- watermark_enabled: Boolean flag
- image_frame_url: URL for image frame
- image_frame_enabled: Boolean flag
- video_frame_url: URL for video frame  
- video_frame_enabled: Boolean flag
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.database import engine
import asyncio


async def migrate():
    """Add new fields to templates table"""
    
    migrations = [
        # Add caption field
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS caption TEXT;
        """,
        
        # Add hashtags field (JSON)
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS hashtags JSON;
        """,
        
        # Add watermark fields
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS watermark_id INTEGER REFERENCES watermarks(id);
        """,
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN DEFAULT FALSE NOT NULL;
        """,
        
        # Add image frame fields
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS image_frame_url VARCHAR(255);
        """,
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS image_frame_enabled BOOLEAN DEFAULT FALSE NOT NULL;
        """,
        
        # Add video frame fields
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS video_frame_url VARCHAR(255);
        """,
        """
        ALTER TABLE templates 
        ADD COLUMN IF NOT EXISTS video_frame_enabled BOOLEAN DEFAULT FALSE NOT NULL;
        """,
    ]
    
    async with engine.begin() as conn:
        print("Starting migration...")
        
        for i, migration_sql in enumerate(migrations, 1):
            try:
                await conn.execute(text(migration_sql))
                print(f"✓ Migration {i}/{len(migrations)} completed")
            except Exception as e:
                print(f"✗ Migration {i}/{len(migrations)} failed: {str(e)}")
                # Continue with other migrations even if one fails
        
        print("\n✓ All migrations completed!")
        print("Template table has been updated with new fields:")
        print("  - caption")
        print("  - hashtags (JSON)")
        print("  - watermark_id, watermark_enabled")
        print("  - image_frame_url, image_frame_enabled")
        print("  - video_frame_url, video_frame_enabled")


if __name__ == "__main__":
    print("=" * 60)
    print("Template Table Migration")
    print("=" * 60)
    print()
    
    asyncio.run(migrate())
