from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from models.model import User, UserRole, UserStatus
from config.database import async_session_maker
from core.config import settings
from sqlalchemy import select

# JWT Security
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token không hợp lệ",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from JWT token"""
    payload = verify_token(credentials.credentials)
    username = payload.get("sub")
    
    async with async_session_maker() as session:
        stmt = select(User).where(User.username == username)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Người dùng không tồn tại",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if user.status != UserStatus.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản đã bị khóa"
            )
        
        return user


def require_role(*allowed_roles: UserRole):
    """Decorator to require specific roles"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập chức năng này"
            )
        return current_user
    return role_checker


def can_manage_user(manager: User, target_role: UserRole) -> bool:
    """Check if a user can manage another user based on role hierarchy"""
    role_hierarchy = {
        UserRole.root: 3,
        UserRole.superadmin: 2,
        UserRole.admin: 1
    }
    
    manager_level = role_hierarchy.get(manager.role, 0)
    target_level = role_hierarchy.get(target_role, 0)
    
    # Root can manage everyone
    if manager.role == UserRole.root:
        return True
    
    # Superadmin can manage admin but not root
    if manager.role == UserRole.superadmin:
        return target_role in [UserRole.admin, UserRole.superadmin]
    
    # Admin can only manage admin
    if manager.role == UserRole.admin:
        return target_role == UserRole.admin
    
    return False


def can_view_user(viewer: User, target_user: User) -> bool:
    """Check if a user can view another user based on role hierarchy"""
    # Root can see everyone
    if viewer.role == UserRole.root:
        return True
    
    # Superadmin can see everyone except root
    if viewer.role == UserRole.superadmin:
        return target_user.role != UserRole.root
    
    # Admin can see everyone except root and superadmin
    if viewer.role == UserRole.admin:
        return target_user.role == UserRole.admin
    
    return False


# Dependency shortcuts for common role requirements
get_root_user = require_role(UserRole.root)
get_superadmin_or_higher = require_role(UserRole.root, UserRole.superadmin)
get_admin_or_higher = require_role(UserRole.root, UserRole.superadmin, UserRole.admin)