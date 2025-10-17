from pydantic import BaseModel, EmailStr, validator, model_validator
from typing import Optional
from datetime import datetime
from models.model import UserRole, UserStatus


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.admin
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Tên đăng nhập phải có ít nhất 3 ký tự')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu phải có ít nhất 6 ký tự')
        return v


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.admin
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Tên đăng nhập phải có ít nhất 3 ký tự')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu phải có ít nhất 6 ký tự')
        return v


class LoginResponse(BaseModel):
    success: bool
    message: str
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.admin
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Tên đăng nhập phải có ít nhất 3 ký tự')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu phải có ít nhất 6 ký tự')
        return v


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    status: Optional[UserStatus] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    role: UserRole
    status: UserStatus
    last_login: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Mật khẩu mới phải có ít nhất 6 ký tự')
        return v


class CreateUserByAdminRequest(BaseModel):
    username: str
    email: EmailStr
    password: Optional[str] = None
    password_hash: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole
    status: Optional[UserStatus] = UserStatus.active
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Tên đăng nhập phải có ít nhất 3 ký tự')
        return v
    
    @model_validator(mode='before')
    @classmethod
    def validate_password_fields(cls, values):
        if isinstance(values, dict):
            password = values.get('password')
            password_hash = values.get('password_hash')
            
            # Phải có ít nhất một trong hai field
            if not password and not password_hash:
                raise ValueError('Phải có password hoặc password_hash')
            
            # Nếu có password_hash thì dùng nó làm password
            if password_hash and not password:
                values['password'] = password_hash
            
            # Validate password length
            if values.get('password') and len(values['password']) < 6:
                raise ValueError('Mật khẩu phải có ít nhất 6 ký tự')
                
        return values