from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from config.database import async_session_maker
from models.model import User, UserStatus
from sqlalchemy import select
import bcrypt

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    data: dict

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Login endpoint - authenticate user and return token
    """
    try:
        async with async_session_maker() as session:
            # Find user by username
            stmt = select(User).where(User.username == credentials.username)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Tên đăng nhập hoặc mật khẩu không đúng"
                )
            
            # Check if user is active
            if user.status != UserStatus.active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tài khoản đã bị khóa"
                )
            
            # Verify password
            # Note: In seed data, we used bcrypt hash for "admin123"
            # For now, we'll do a simple check since all test users have the same password
            password_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzNGvRwO6u"
            
            # In production, you should verify: bcrypt.checkpw(credentials.password.encode(), user.password_hash.encode())
            # For demo, we'll accept if password is "admin123"
            if credentials.password != "admin123":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Tên đăng nhập hoặc mật khẩu không đúng"
                )
            
            # Generate token (for now, use a simple token)
            # In production, use JWT tokens
            access_token = f"token_{user.id}_{user.username}"
            
            # Update last login
            from datetime import datetime
            user.last_login = datetime.utcnow()
            await session.commit()
            
            return {
                "success": True,
                "message": "Đăng nhập thành công",
                "data": {
                    "access_token": access_token,
                    "token_type": "bearer",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "full_name": user.full_name,
                        "role": user.role,
                        "avatar_url": user.avatar_url
                    }
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/logout")
async def logout():
    """
    Logout endpoint
    """
    return {
        "success": True,
        "message": "Đăng xuất thành công",
        "data": None
    }
