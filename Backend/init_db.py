"""
Script to initialize the database and create all tables
Run this script once to set up the database schema
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from config.database import init_db, close_db


async def initialize_database():
    """Initialize database and create all tables"""
    print("🔧 Initializing database...")
    print("📦 Creating tables...")
    
    try:
        await init_db()
        print("✅ Database initialized successfully!")
        print("✅ All tables created!")
        
        # Print table list
        print("\n📋 Created tables:")
        tables = [
            "users", "platforms", "pages", "page_permissions",
            "templates", "watermarks", "media_library", "hashtags",
            "posts", "post_media", "post_hashtags", "post_analytics"
        ]
        for table in tables:
            print(f"  ✓ {table}")
        
        print("\n🎉 Setup complete! You can now run the application.")
        print("   Run: python main.py")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)
    finally:
        await close_db()


if __name__ == "__main__":
    print("=" * 60)
    print("Social Media Auto Posting API - Database Setup")
    print("=" * 60)
    print()
    
    # Run initialization
    asyncio.run(initialize_database())
