from typing import List, Optional
from sqlalchemy import select, and_, or_, cast, String
from sqlalchemy.orm import selectinload
from config.database import async_session_maker
from models.model import User, UserRole, UserStatus
from core.auth import get_password_hash, can_view_user, can_manage_user
from core.schemas import UserCreate, UserUpdate, CreateUserByAdminRequest


class UserService:
    """Service class for user management operations"""
    
    async def get_user_by_id(self, user_id: int, current_user: User) -> Optional[User]:
        """Lấy user theo ID với kiểm tra quyền xem"""
        async with async_session_maker() as session:
            stmt = select(User).where(User.id == user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return None
            
            # Kiểm tra quyền xem user
            if not can_view_user(current_user, user):
                return None
                
            return user
    
    async def get_users_list(
        self, 
        current_user: User,
        skip: int = 0, 
        limit: int = 20,
        role_filter: Optional[UserRole] = None,
        status_filter: Optional[UserStatus] = None,
        search: Optional[str] = None
    ) -> List[User]:
        """Lấy danh sách users với phân quyền và filter"""
        try:
            async with async_session_maker() as session:
                # Base query
                stmt = select(User)
                
                # Phân quyền: mỗi role chỉ thấy users theo hierarchy
                if current_user.role == UserRole.root:
                    # Root thấy tất cả
                    pass
                elif current_user.role == UserRole.superadmin:
                    # Superadmin không thấy root
                    stmt = stmt.where(cast(User.role, String) != UserRole.root.value)
                elif current_user.role == UserRole.admin:
                    # Admin chỉ thấy admin
                    stmt = stmt.where(cast(User.role, String) == UserRole.admin.value)
                
                # Apply filters
                if role_filter:
                    role_value = role_filter.value if hasattr(role_filter, 'value') else role_filter
                    stmt = stmt.where(cast(User.role, String) == role_value)
                
                if status_filter:
                    status_value = status_filter.value if hasattr(status_filter, 'value') else status_filter
                    stmt = stmt.where(cast(User.status, String) == status_value)
                
                if search:
                    search_term = f"%{search}%"
                    stmt = stmt.where(
                        or_(
                            User.username.ilike(search_term),
                            User.email.ilike(search_term),
                            User.full_name.ilike(search_term)
                        )
                    )
                
                # Add pagination
                stmt = stmt.offset(skip).limit(limit)
                
                result = await session.execute(stmt)
                return result.scalars().all()
        except Exception as e:
            print(f"Error in get_users_list: {str(e)}")
            raise e
    
    async def create_user(self, user_data: CreateUserByAdminRequest, created_by: User) -> User:
        """Tạo user mới"""
        async with async_session_maker() as session:
            # Hash password
            password_hash = get_password_hash(user_data.password)
            
            # Create new user
            new_user = User(
                username=user_data.username,
                email=user_data.email,
                password_hash=password_hash,
                full_name=user_data.full_name,
                avatar_url=user_data.avatar_url,
                role=user_data.role,
                status=user_data.status if user_data.status else UserStatus.active
            )
            
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            
            return new_user
    
    async def update_user(
        self, 
        user_id: int, 
        user_data: UserUpdate, 
        current_user: User
    ) -> Optional[User]:
        """Cập nhật thông tin user"""
        async with async_session_maker() as session:
            stmt = select(User).where(User.id == user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return None
            
            # Kiểm tra quyền sửa user
            if not can_manage_user(current_user, user.role):
                return None
            
            # Update fields
            if user_data.email is not None:
                user.email = user_data.email
            if user_data.full_name is not None:
                user.full_name = user_data.full_name
            if user_data.avatar_url is not None:
                user.avatar_url = user_data.avatar_url
            if user_data.status is not None:
                user.status = user_data.status
            
            await session.commit()
            await session.refresh(user)
            
            return user
    
    async def delete_user(self, user_id: int, current_user: User) -> bool:
        """Xóa user (soft delete bằng cách set status = inactive)"""
        async with async_session_maker() as session:
            stmt = select(User).where(User.id == user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return False
            
            # Kiểm tra quyền xóa user
            if not can_manage_user(current_user, user.role):
                return False
            
            # Không cho phép tự xóa bản thân
            if user.id == current_user.id:
                return False
            
            # Soft delete
            user.status = UserStatus.inactive
            await session.commit()
            
            return True
    
    async def change_user_password(
        self, 
        user_id: int, 
        new_password: str, 
        current_user: User
    ) -> bool:
        """Đổi mật khẩu cho user khác (chỉ admin trở lên)"""
        async with async_session_maker() as session:
            stmt = select(User).where(User.id == user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return False
            
            # Kiểm tra quyền đổi mật khẩu
            if not can_manage_user(current_user, user.role):
                return False
            
            # Update password
            user.password_hash = get_password_hash(new_password)
            await session.commit()
            
            return True
    
    async def get_users_count(self, current_user: User) -> int:
        """Đếm số lượng users theo quyền"""
        async with async_session_maker() as session:
            stmt = select(User)
            
            # Apply role-based filtering
            if current_user.role == UserRole.root:
                pass  # Root sees all
            elif current_user.role == UserRole.superadmin:
                stmt = stmt.where(User.role != UserRole.root)
            elif current_user.role == UserRole.admin:
                stmt = stmt.where(User.role == UserRole.admin)
            
            result = await session.execute(stmt)
            return len(result.scalars().all())
    
    async def check_username_exists(self, username: str, exclude_id: Optional[int] = None) -> bool:
        """Kiểm tra username đã tồn tại"""
        async with async_session_maker() as session:
            stmt = select(User).where(User.username == username)
            if exclude_id:
                stmt = stmt.where(User.id != exclude_id)
            
            result = await session.execute(stmt)
            return result.scalar_one_or_none() is not None
    
    async def check_email_exists(self, email: str, exclude_id: Optional[int] = None) -> bool:
        """Kiểm tra email đã tồn tại"""
        async with async_session_maker() as session:
            stmt = select(User).where(User.email == email)
            if exclude_id:
                stmt = stmt.where(User.id != exclude_id)
            
            result = await session.execute(stmt)
            return result.scalar_one_or_none() is not None