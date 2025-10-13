from fastapi import HTTPException


class NotFoundException(HTTPException):
    """Exception raised when a resource is not found"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)


class BadRequestException(HTTPException):
    """Exception raised when request data is invalid"""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=400, detail=detail)


class ConflictException(HTTPException):
    """Exception raised when there's a conflict (e.g., duplicate entry)"""
    def __init__(self, detail: str = "Conflict occurred"):
        super().__init__(status_code=409, detail=detail)


class UnauthorizedException(HTTPException):
    """Exception raised when user is not authorized"""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=401, detail=detail)


class ForbiddenException(HTTPException):
    """Exception raised when user doesn't have permission"""
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=403, detail=detail)


class InternalServerException(HTTPException):
    """Exception raised for internal server errors"""
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(status_code=500, detail=detail)
