from sqlalchemy.ext.asyncio import AsyncSession
from services.user_service import UserService
from core.response import success_response, error_response
from core.exceptions import NotFoundException, BadRequestException, ConflictException


class UserController:
    """Controller layer for User operations"""
    
    def __init__(self, db: AsyncSession):
        self.service = UserService(db)
    
    async def get_all(self, skip: int, limit: int, search: str = None, role: str = None, status: str = None):
        """Get all users with pagination, search and filters"""
        try:
            users = await self.service.get_all(skip, limit, search, role, status)
            return success_response(
                data=users,
                message=f"Retrieved {len(users)} users successfully"
            )
        except Exception as e:
            return error_response(
                message="Failed to retrieve users",
                error=str(e)
            )
    
    async def get_by_id(self, user_id: int):
        """Get user by ID"""
        try:
            user = await self.service.get_by_id(user_id)
            if not user:
                raise NotFoundException(f"User with ID {user_id} not found")
            return success_response(
                data=user,
                message="User retrieved successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to retrieve user",
                error=str(e)
            )
    
    async def get_by_email(self, email: str):
        """Get user by email"""
        try:
            user = await self.service.get_by_email(email)
            if not user:
                raise NotFoundException(f"User with email {email} not found")
            return success_response(
                data=user,
                message="User retrieved successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to retrieve user by email",
                error=str(e)
            )
    
    async def create(self, data: dict):
        """Create a new user"""
        try:
            # Validation
            required_fields = ["username", "email", "password_hash"]
            for field in required_fields:
                if field not in data:
                    raise BadRequestException(f"Missing required field: {field}")
            
            # Check if username already exists
            existing_user = await self.service.get_by_username(data["username"])
            if existing_user:
                raise ConflictException(f"Username '{data['username']}' already exists")
            
            # Check if email already exists
            existing_email = await self.service.get_by_email(data["email"])
            if existing_email:
                raise ConflictException(f"Email '{data['email']}' already exists")
            
            user = await self.service.create(data)
            return success_response(
                data=user,
                message="User created successfully"
            )
        except (BadRequestException, ConflictException) as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to create user",
                error=str(e)
            )
    
    async def update(self, user_id: int, data: dict):
        """Update user information"""
        try:
            # Check if user exists
            existing_user = await self.service.get_by_id(user_id)
            if not existing_user:
                raise NotFoundException(f"User with ID {user_id} not found")
            
            # If updating username, check for conflicts
            if "username" in data and data["username"] != existing_user["username"]:
                conflict_user = await self.service.get_by_username(data["username"])
                if conflict_user:
                    raise ConflictException(f"Username '{data['username']}' already exists")
            
            # If updating email, check for conflicts
            if "email" in data and data["email"] != existing_user["email"]:
                conflict_email = await self.service.get_by_email(data["email"])
                if conflict_email:
                    raise ConflictException(f"Email '{data['email']}' already exists")
            
            user = await self.service.update(user_id, data)
            return success_response(
                data=user,
                message="User updated successfully"
            )
        except (NotFoundException, ConflictException) as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to update user",
                error=str(e)
            )
    
    async def update_last_login(self, user_id: int):
        """Update user's last login timestamp"""
        try:
            user = await self.service.update_last_login(user_id)
            if not user:
                raise NotFoundException(f"User with ID {user_id} not found")
            return success_response(
                data=user,
                message="Last login updated successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to update last login",
                error=str(e)
            )
    
    async def delete(self, user_id: int):
        """Delete a user"""
        try:
            success = await self.service.delete(user_id)
            if not success:
                raise NotFoundException(f"User with ID {user_id} not found")
            return success_response(
                message="User deleted successfully"
            )
        except NotFoundException as e:
            raise e
        except Exception as e:
            return error_response(
                message="Failed to delete user",
                error=str(e)
            )
