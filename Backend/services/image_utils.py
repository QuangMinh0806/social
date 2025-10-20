"""
Utility functions cho image processing
"""
import os
import re

def get_absolute_path_from_url(url: str) -> str:
    """
    Convert URL to absolute file path
    
    Examples:
        http://localhost:8000/uploads/image/file.png -> /path/to/Backend/uploads/image/file.png
        http://localhost:80000/uploads/image/file.png -> /path/to/Backend/uploads/image/file.png
    """
    # Fix common port issues
    url = url.replace('localhost:80000', 'localhost:8000')
    url = url.replace('127.0.0.1:80000', '127.0.0.1:8000')
    
    # Extract relative path from URL
    match = re.search(r'(?:localhost|127\.0\.0\.1)(?::\d+)?/(.+)', url)
    if not match:
        return None
    
    relative_path = match.group(1)
    
    # Get Backend directory (current file is in Backend/services/ so go up one level)
    current_dir = os.path.dirname(os.path.abspath(__file__))  # Backend/services/
    backend_dir = os.path.dirname(current_dir)  # Backend/
    
    # Construct absolute path
    absolute_path = os.path.join(backend_dir, relative_path)
    
    return absolute_path


def is_localhost_url(url: str) -> bool:
    """Check if URL is localhost"""
    return 'localhost' in url or '127.0.0.1' in url


def normalize_url(url: str) -> str:
    """Normalize URL by fixing common issues"""
    if not url:
        return url
    
    # Fix port issues
    url = url.replace('localhost:80000', 'localhost:8000')
    url = url.replace('127.0.0.1:80000', '127.0.0.1:8000')
    
    return url
