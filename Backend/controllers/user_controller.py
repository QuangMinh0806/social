from typing import List, Optional
from models.model import User, UserRole, UserStatus
from services.user_service import UserService
from core.response import success_response, error_response
from core.exceptions import NotFoundException, BadRequestException, ConflictException
from core.schemas import UserResponse, UserUpdate, CreateUserByAdminRequest


class UserController:
    """Controller layer for User operations with role-based access control"""
    
    def __init__(self):
        self.service = UserService()
    
    async def get_users_list(
        self, 
        current_user: User,
        skip: int = 0, 
        limit: int = 20,
        search: Optional[str] = None,
        role_filter: Optional[UserRole] = None,
        status_filter: Optional[UserStatus] = None
    ):
        """Get users list with role-based filtering"""
        try:
            users = await self.service.get_users_list(
                current_user=current_user,
                skip=skip,
                limit=limit,
                role_filter=role_filter,
                status_filter=status_filter,
                search=search
            )
            return success_response(
                data=[self._user_to_dict(user) for user in users],
                message=f"Lấy danh sách {len(users)} users thành công"
            )
        except Exception as e:
            return error_response(f"Lỗi khi lấy danh sách users: {str(e)}")
    
    async def get_user_by_id(self, user_id: int, current_user: User):
        """Get user by ID with permission check"""
        try:
            user = await self.service.get_user_by_id(user_id, current_user)
            if not user:
                raise NotFoundException("Không tìm thấy user hoặc bạn không có quyền xem")
            
            return success_response(
                data=self._user_to_dict(user),
                message="Lấy thông tin user thành công"
            )
        except NotFoundException as e:
            return error_response(str(e), status_code=404)
        except Exception as e:
            return error_response(f"Lỗi khi lấy thông tin user: {str(e)}")
    
    async def create_user(self, user_data: CreateUserByAdminRequest, current_user: User):
        """Create new user with permission check"""
        try:
            # Kiểm tra username đã tồn tại
            if await self.service.check_username_exists(user_data.username):
                raise ConflictException("Tên đăng nhập đã tồn tại")
            
            # Kiểm tra email đã tồn tại
            if await self.service.check_email_exists(user_data.email):
                raise ConflictException("Email đã tồn tại")
            
            new_user = await self.service.create_user(user_data, current_user)
            return success_response(
                data=self._user_to_dict(new_user),
                message="Tạo user thành công"
            )
        except ConflictException as e:
            return error_response(str(e), status_code=409)
        except Exception as e:
            return error_response(f"Lỗi khi tạo user: {str(e)}")
    
    async def update_user(self, user_id: int, user_data: UserUpdate, current_user: User):
        """Update user with permission check"""
        try:
            # Kiểm tra email trùng (nếu có cập nhật email)
            if user_data.email and await self.service.check_email_exists(user_data.email, user_id):
                raise ConflictException("Email đã tồn tại")
            
            updated_user = await self.service.update_user(user_id, user_data, current_user)
            if not updated_user:
                raise NotFoundException("Không tìm thấy user hoặc bạn không có quyền cập nhật")
            
            return success_response(
                data=self._user_to_dict(updated_user),
                message="Cập nhật user thành công"
            )
        except (NotFoundException, ConflictException) as e:
            status_code = 404 if isinstance(e, NotFoundException) else 409
            return error_response(str(e), status_code=status_code)
        except Exception as e:
            return error_response(f"Lỗi khi cập nhật user: {str(e)}")
    
    async def delete_user(self, user_id: int, current_user: User):
        """Delete user (soft delete) with permission check"""
        try:
            success = await self.service.delete_user(user_id, current_user)
            if not success:
                raise NotFoundException("Không tìm thấy user hoặc bạn không có quyền xóa")
            
            return success_response(
                message="Xóa user thành công"
            )
        except NotFoundException as e:
            return error_response(str(e), status_code=404)
        except Exception as e:
            return error_response(f"Lỗi khi xóa user: {str(e)}")
    
    async def change_user_password(self, user_id: int, new_password: str, current_user: User):
        """Change password for another user with permission check"""
        try:
            if len(new_password) < 6:
                raise BadRequestException("Mật khẩu phải có ít nhất 6 ký tự")
            
            success = await self.service.change_user_password(user_id, new_password, current_user)
            if not success:
                raise NotFoundException("Không tìm thấy user hoặc bạn không có quyền đổi mật khẩu")
            
            return success_response(
                message="Đổi mật khẩu thành công"
            )
        except (NotFoundException, BadRequestException) as e:
            status_code = 404 if isinstance(e, NotFoundException) else 400
            return error_response(str(e), status_code=status_code)
        except Exception as e:
            return error_response(f"Lỗi khi đổi mật khẩu: {str(e)}")
    
    async def get_users_count(self, current_user: User):
        """Get users count based on permission"""
        try:
            count = await self.service.get_users_count(current_user)
            return success_response(
                data={"total_users": count},
                message="Lấy số lượng users thành công"
            )
        except Exception as e:
            return error_response(f"Lỗi khi đếm users: {str(e)}")
    
    def _user_to_dict(self, user: User) -> dict:
        """Convert User model to dictionary for response"""
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role.value if user.role else None,
            "status": user.status.value if user.status else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "created_by": user.created_by
        }