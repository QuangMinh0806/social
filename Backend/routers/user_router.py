from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi import status as http_status
from typing import List, Optional
from models.model import User, UserRole, UserStatus
from services.user_service import UserService
from core.auth import (
    get_current_user, 
    get_admin_or_higher,
    can_manage_user
)
from core.schemas import (
    UserResponse, 
    UserUpdate, 
    CreateUserByAdminRequest
)

router = APIRouter(prefix="/api/users", tags=["Users"])
user_service = UserService()


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = Query(0, ge=0, description="Số bản ghi bỏ qua"),
    limit: int = Query(100, ge=1, le=1000, description="Số bản ghi tối đa trả về"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên, email, họ tên"),
    role: Optional[UserRole] = Query(None, description="Lọc theo quyền"),
    user_status: Optional[UserStatus] = Query(None, description="Lọc theo trạng thái"),
    current_user: User = Depends(get_admin_or_higher)
):
    """
    Lấy danh sách users với phân trang, tìm kiếm và lọc
    Chỉ admin trở lên mới có quyền xem danh sách users
    """
    try:
        users = await user_service.get_users_list(
            current_user=current_user,
            skip=skip,
            limit=limit,
            role_filter=role,
            status_filter=user_status,
            search=search
        )
        return users
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin user theo ID
    Phân quyền xem theo hierarchy: root > superadmin > admin
    """
    try:
        user = await user_service.get_user_by_id(user_id, current_user)
        if not user:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy user hoặc bạn không có quyền xem"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: CreateUserByAdminRequest,
    current_user: User = Depends(get_admin_or_higher)
):
    """
    Tạo user mới
    Chỉ admin trở lên mới có quyền tạo user
    """
    try:
        # Kiểm tra quyền tạo user với role được yêu cầu
        if not can_manage_user(current_user, user_data.role):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền tạo user với role này"
            )
        
        # Kiểm tra username đã tồn tại
        if await user_service.check_username_exists(user_data.username):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Tên đăng nhập đã tồn tại"
            )
        
        # Kiểm tra email đã tồn tại
        if await user_service.check_email_exists(user_data.email):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Email đã tồn tại"
            )
        
        new_user = await user_service.create_user(user_data, current_user)
        return new_user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_admin_or_higher)
):
    """
    Cập nhật thông tin user
    Chỉ admin trở lên mới có quyền cập nhật user
    """
    try:
        # Kiểm tra email trùng (nếu có cập nhật email)
        if user_data.email and await user_service.check_email_exists(user_data.email, user_id):
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Email đã tồn tại"
            )
        
        updated_user = await user_service.update_user(user_id, user_data, current_user)
        if not updated_user:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy user hoặc bạn không có quyền cập nhật"
            )
        
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_or_higher)
):
    """
    Xóa user (soft delete)
    Chỉ admin trở lên mới có quyền xóa user
    """
    try:
        success = await user_service.delete_user(user_id, current_user)
        if not success:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy user hoặc bạn không có quyền xóa"
            )
        
        return {
            "success": True,
            "message": "Xóa user thành công"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.post("/{user_id}/change-password")
async def change_user_password(
    user_id: int,
    new_password: str,
    current_user: User = Depends(get_admin_or_higher)
):
    """
    Đổi mật khẩu cho user khác
    Chỉ admin trở lên mới có quyền đổi mật khẩu cho user khác
    """
    try:
        if len(new_password) < 6:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu phải có ít nhất 6 ký tự"
            )
        
        success = await user_service.change_user_password(user_id, new_password, current_user)
        if not success:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy user hoặc bạn không có quyền đổi mật khẩu"
            )
        
        return {
            "success": True,
            "message": "Đổi mật khẩu thành công"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )


@router.get("/stats/count")
async def get_users_count(
    current_user: User = Depends(get_admin_or_higher)
):
    """
    Đếm số lượng users theo quyền
    """
    try:
        count = await user_service.get_users_count(current_user)
        return {
            "total_users": count
        }
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống: {str(e)}"
        )
