"""
Timezone Utilities - Xử lý múi giờ GMT+7
"""

from datetime import datetime, timezone, timedelta
from typing import Optional
from core.config import settings


# Định nghĩa GMT+7 timezone
GMT7 = timezone(timedelta(hours=7))


def get_current_time() -> datetime:
    """
    Lấy thời gian hiện tại theo múi giờ GMT+7
    
    Returns:
        datetime object với timezone GMT+7
    """
    return datetime.now(GMT7)


def utc_to_gmt7(utc_time: datetime) -> datetime:
    """
    Convert UTC time sang GMT+7
    
    Args:
        utc_time: datetime object (UTC hoặc naive)
        
    Returns:
        datetime object với timezone GMT+7
    """
    if utc_time is None:
        return None
    
    # Nếu naive datetime, giả sử là UTC
    if utc_time.tzinfo is None:
        utc_time = utc_time.replace(tzinfo=timezone.utc)
    
    # Convert sang GMT+7
    return utc_time.astimezone(GMT7)


def gmt7_to_utc(gmt7_time: datetime) -> datetime:
    """
    Convert GMT+7 time sang UTC
    
    Args:
        gmt7_time: datetime object (GMT+7 hoặc naive)
        
    Returns:
        datetime object với timezone UTC
    """
    if gmt7_time is None:
        return None
    
    # Nếu naive datetime, giả sử là GMT+7
    if gmt7_time.tzinfo is None:
        gmt7_time = gmt7_time.replace(tzinfo=GMT7)
    
    # Convert sang UTC
    return gmt7_time.astimezone(timezone.utc)


def format_datetime_gmt7(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format datetime theo GMT+7
    
    Args:
        dt: datetime object
        format_str: format string (default: YYYY-MM-DD HH:MM:SS)
        
    Returns:
        Formatted string với timezone GMT+7
    """
    if dt is None:
        return None
    
    gmt7_time = utc_to_gmt7(dt)
    return gmt7_time.strftime(format_str) + " GMT+7"


def parse_datetime_from_frontend(dt_string: str) -> datetime:
    """
    Parse datetime string từ Frontend (local time) và convert sang UTC để lưu DB
    
    Args:
        dt_string: ISO format datetime string (e.g., "2025-10-20T15:30:00")
        
    Returns:
        datetime object UTC (để lưu vào database)
    """
    if not dt_string:
        return None
    
    # Parse ISO format
    if 'T' in dt_string:
        # Format: "2025-10-20T15:30:00" hoặc "2025-10-20T15:30:00Z"
        dt_string = dt_string.replace('Z', '')
        dt = datetime.fromisoformat(dt_string)
    else:
        # Format: "2025-10-20 15:30:00"
        dt = datetime.strptime(dt_string, "%Y-%m-%d %H:%M:%S")
    
    # Giả sử input là GMT+7 (local time từ Frontend)
    dt_gmt7 = dt.replace(tzinfo=GMT7)
    
    # Convert sang UTC để lưu vào database
    dt_utc = gmt7_to_utc(dt_gmt7)
    
    # Return naive UTC datetime (vì DB lưu naive)
    return dt_utc.replace(tzinfo=None)


def datetime_to_iso_gmt7(dt: datetime) -> str:
    """
    Convert datetime sang ISO format với GMT+7 timezone
    
    Args:
        dt: datetime object
        
    Returns:
        ISO format string với GMT+7 (e.g., "2025-10-20T22:30:00+07:00")
    """
    if dt is None:
        return None
    
    gmt7_time = utc_to_gmt7(dt)
    return gmt7_time.isoformat()


# Helper functions để dùng trong services
def now_gmt7() -> datetime:
    """Lấy thời gian hiện tại GMT+7 (naive, để so sánh với DB)"""
    return datetime.now(GMT7).replace(tzinfo=None)


def now_utc() -> datetime:
    """Lấy thời gian hiện tại UTC (naive, để lưu DB)"""
    return datetime.utcnow()
