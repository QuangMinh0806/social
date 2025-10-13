from typing import Any, Optional


def success_response(data: Any = None, message: str = "Success") -> dict:
    """
    Create a standardized success response
    
    Args:
        data: Response data
        message: Success message
        
    Returns:
        Standardized response dictionary
    """
    return {
        "success": True,
        "data": data,
        "message": message,
        "error": None
    }


def error_response(message: str, error: Optional[str] = None) -> dict:
    """
    Create a standardized error response
    
    Args:
        message: Error message
        error: Detailed error information
        
    Returns:
        Standardized error response dictionary
    """
    return {
        "success": False,
        "data": None,
        "message": message,
        "error": error
    }
