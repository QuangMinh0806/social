from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from core.auth import verify_token, get_current_user
from models.model import UserRole
import re

security = HTTPBearer()


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware xử lý authentication cho các routes được bảo vệ"""
    
    def __init__(self, app):
        super().__init__(app)
        # Các routes không cần authentication
        self.public_paths = [
            "/docs",
            "/redoc", 
            "/openapi.json",
            "/auth/login",
            "/",
            "/static",
            "/auth/register"
        ]
        
        # Các routes cần authentication
        self.protected_paths = [
            "/auth/me",
            "/auth/change-password", 
            "/auth/create-user",
            "/api/users"
        ]
    
    def is_public_path(self, path: str) -> bool:
        """Kiểm tra xem path có phải là public không"""
        for public_path in self.public_paths:
            if path.startswith(public_path):
                return True
        return False
    
    def is_protected_path(self, path: str) -> bool:
        """Kiểm tra xem path có cần authentication không"""
        for protected_path in self.protected_paths:
            if path.startswith(protected_path):
                return True
        return False
    
    async def dispatch(self, request: Request, call_next):
        """Xử lý request trước khi đến endpoint"""
        
        # Bỏ qua authentication cho public paths
        if self.is_public_path(request.url.path):
            response = await call_next(request)
            return response
        
        # Kiểm tra authentication cho protected paths
        if self.is_protected_path(request.url.path):
            auth_header = request.headers.get("Authorization")
            
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Cần đăng nhập để truy cập",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            try:
                token = auth_header.split(" ")[1]
                payload = verify_token(token)
                
                # Thêm thông tin user vào request state
                request.state.user_id = payload.get("user_id")
                request.state.username = payload.get("sub")
                request.state.role = payload.get("role")
                
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token không hợp lệ",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        response = await call_next(request)
        return response


def require_role_middleware(*allowed_roles: UserRole):
    """Middleware decorator để yêu cầu role cụ thể"""
    def middleware(request: Request):
        if not hasattr(request.state, "role"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Cần đăng nhập để truy cập"
            )
        
        user_role = UserRole(request.state.role)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập chức năng này"
            )
        
        return request
    
    return middleware