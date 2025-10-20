from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select
from config.database import async_session_maker
from models.model import User, UserStatus, UserRole
from core.auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    get_current_user,
    get_admin_or_higher,
    can_manage_user
)
from core.schemas import (
    LoginRequest, 
    RegisterRequest,
    LoginResponse, 
    UserResponse, 
    ChangePasswordRequest,
    CreateUserByAdminRequest
)
from datetime import timedelta, datetime

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    Đăng nhập hệ thống với JWT authentication
    """
    try:
        async with async_session_maker() as session:
            # Tìm user theo username
            stmt = select(User).where(User.username == credentials.username)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Tên đăng nhập hoặc mật khẩu không đúng"
                )
            
            # Kiểm tra trạng thái user
            if user.status != UserStatus.active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tài khoản đã bị khóa"
                )
            
            # Xác thực mật khẩu
            if not verify_password(credentials.password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Tên đăng nhập hoặc mật khẩu không đúng"
                )
            
            # Tạo JWT token
            access_token = create_access_token(
                data={"sub": user.username, "role": user.role.value, "user_id": user.id}
            )
            
            # Cập nhật last_login
            user.last_login = datetime.utcnow()
            await session.commit()
            
            return LoginResponse(
                success=True,
                message="Đăng nhập thành công",
                access_token=access_token,
                user={
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value,
                    "avatar_url": user.avatar_url
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.post("/register", response_model=LoginResponse)
async def register(user_data: RegisterRequest):
    """
    Đăng ký tài khoản mới
    """
    try:
        async with async_session_maker() as session:
            # Kiểm tra username đã tồn tại
            stmt = select(User).where(User.username == user_data.username)
            result = await session.execute(stmt)
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tên đăng nhập đã tồn tại"
                )
            
            # Kiểm tra email đã tồn tại
            stmt = select(User).where(User.email == user_data.email)
            result = await session.execute(stmt)
            existing_email = result.scalar_one_or_none()
            
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email đã tồn tại"
                )
            
            # Tạo user mới
            new_user = User(
                username=user_data.username,
                email=user_data.email,
                password_hash=get_password_hash(user_data.password),
                full_name=user_data.full_name,
                role=user_data.role,
                status=UserStatus.active,
                created_at=datetime.utcnow()
            )
            
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            
            # Tạo JWT token
            access_token = create_access_token(
                data={"sub": new_user.username, "role": new_user.role.value, "user_id": new_user.id}
            )
            
            return LoginResponse(
                success=True,
                message="Đăng ký thành công",
                access_token=access_token,
                user={
                    "id": new_user.id,
                    "username": new_user.username,
                    "email": new_user.email,
                    "full_name": new_user.full_name,
                    "role": new_user.role.value,
                    "avatar_url": new_user.avatar_url
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    print("Current user:", current_user)
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Đổi mật khẩu của user hiện tại
    """
    try:
        async with async_session_maker() as session:
            # Verify current password
            if not verify_password(password_data.current_password, current_user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mật khẩu hiện tại không đúng"
                )
            
            # Update password
            new_password_hash = get_password_hash(password_data.new_password)
            stmt = select(User).where(User.id == current_user.id)
            result = await session.execute(stmt)
            user = result.scalar_one()
            
            user.password_hash = new_password_hash
            await session.commit()
            
            return {
                "success": True,
                "message": "Đổi mật khẩu thành công"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.post("/create-user", response_model=UserResponse)
async def create_user_by_admin(
    user_data: CreateUserByAdminRequest,
    current_user: User = Depends(get_admin_or_higher)
):
    """
    Tạo user mới (chỉ dành cho admin trở lên)
    """
    try:
        # Kiểm tra quyền tạo user với role được yêu cầu
        if not can_manage_user(current_user, user_data.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền tạo user với role này"
            )
        
        async with async_session_maker() as session:
            # Kiểm tra username đã tồn tại
            stmt = select(User).where(User.username == user_data.username)
            result = await session.execute(stmt)
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tên đăng nhập đã tồn tại"
                )
            
            # Kiểm tra email đã tồn tại
            stmt = select(User).where(User.email == user_data.email)
            result = await session.execute(stmt)
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email đã tồn tại"
                )
            
            # Tạo user mới
            password_hash = get_password_hash(user_data.password)
            new_user = User(
                username=user_data.username,
                email=user_data.email,
                password_hash=password_hash,
                full_name=user_data.full_name,
                role=user_data.role,
                created_by=current_user.id
            )
            
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            
            return new_user
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )