"""
Script to seed sample employee data for testing
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import sys
sys.path.append('..')

from models.model import User, UserStatus
from config.database import SQLALCHEMY_DATABASE_URL

# Sample employees data
SAMPLE_EMPLOYEES = [
    {
        "username": "superadmin",
        "email": "superadmin@techcorp.com",
        "password_hash": "hashed_password_super_admin",
        "full_name": "Super Admin",
        "role": "Super Admin",
        "status": UserStatus.active,
        "avatar_url": "https://ui-avatars.com/api/?name=Super+Admin&background=ef4444&color=fff"
    },
    {
        "username": "admin",
        "email": "minh.nguyen@techcorp.com",
        "password_hash": "hashed_password_admin",
        "full_name": "Nguyễn Văn Minh",
        "role": "Admin",
        "status": UserStatus.active,
        "avatar_url": "https://ui-avatars.com/api/?name=Nguyen+Van+Minh&background=3b82f6&color=fff"
    },
    {
        "username": "huong.tran",
        "email": "huong.tran@techcorp.com",
        "password_hash": "hashed_password_content_editor",
        "full_name": "Trần Thị Hương",
        "role": "Content Editor",
        "status": UserStatus.active,
        "avatar_url": "https://ui-avatars.com/api/?name=Tran+Thi+Huong&background=8b5cf6&color=fff"
    },
    {
        "username": "duc.le",
        "email": "duc.le@techcorp.com",
        "password_hash": "hashed_password_social_media",
        "full_name": "Lê Hoàng Đức",
        "role": "Social Media Specialist",
        "status": UserStatus.active,
        "avatar_url": "https://ui-avatars.com/api/?name=Le+Hoang+Duc&background=10b981&color=fff"
    },
    {
        "username": "linh.pham",
        "email": "linh.pham@techcorp.com",
        "password_hash": "hashed_password_video_producer",
        "full_name": "Phạm Thị Linh",
        "role": "Video Producer",
        "status": UserStatus.active,
        "avatar_url": "https://ui-avatars.com/api/?name=Pham+Thi+Linh&background=f59e0b&color=fff"
    },
    {
        "username": "nam.vo",
        "email": "nam.vo@techcorp.com",
        "password_hash": "hashed_password_editor",
        "full_name": "Võ Minh Nam",
        "role": "editor",
        "status": UserStatus.inactive,
        "avatar_url": "https://ui-avatars.com/api/?name=Vo+Minh+Nam&background=6b7280&color=fff"
    },
    {
        "username": "thao.nguyen",
        "email": "thao.nguyen@techcorp.com",
        "password_hash": "hashed_password_content_editor2",
        "full_name": "Nguyễn Thị Thảo",
        "role": "Content Editor",
        "status": UserStatus.active,
        "avatar_url": "https://ui-avatars.com/api/?name=Nguyen+Thi+Thao&background=ec4899&color=fff"
    },
    {
        "username": "hung.dang",
        "email": "hung.dang@techcorp.com",
        "password_hash": "hashed_password_video_producer2",
        "full_name": "Đặng Văn Hùng",
        "role": "Video Producer",
        "status": UserStatus.suspended,
        "avatar_url": "https://ui-avatars.com/api/?name=Dang+Van+Hung&background=dc2626&color=fff"
    }
]

async def seed_employees():
    """Seed sample employee data"""
    
    # Create async engine and session
    engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            print("Starting to seed employee data...")
            
            for i, emp_data in enumerate(SAMPLE_EMPLOYEES, 1):
                # Check if user already exists
                from sqlalchemy import select
                stmt = select(User).where(User.username == emp_data["username"])
                result = await session.execute(stmt)
                existing_user = result.scalar_one_or_none()
                
                if existing_user:
                    print(f"[{i}/{len(SAMPLE_EMPLOYEES)}] User '{emp_data['username']}' already exists, skipping...")
                    continue
                
                # Create new user
                user = User(
                    username=emp_data["username"],
                    email=emp_data["email"],
                    password_hash=emp_data["password_hash"],
                    full_name=emp_data["full_name"],
                    role=emp_data["role"],
                    status=emp_data["status"],
                    avatar_url=emp_data.get("avatar_url"),
                    last_login=datetime.utcnow() - timedelta(days=i),
                    created_at=datetime.utcnow() - timedelta(days=30-i*3),
                    updated_at=datetime.utcnow() - timedelta(days=5)
                )
                
                session.add(user)
                print(f"[{i}/{len(SAMPLE_EMPLOYEES)}] Created user: {emp_data['username']} - {emp_data['full_name']}")
            
            # Commit all changes
            await session.commit()
            print("\n✅ Successfully seeded employee data!")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error seeding data: {str(e)}")
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    print("=" * 60)
    print("SEEDING SAMPLE EMPLOYEE DATA")
    print("=" * 60)
    print()
    
    asyncio.run(seed_employees())
    
    print()
    print("=" * 60)
    print("SEED COMPLETED")
    print("=" * 60)
