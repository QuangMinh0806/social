"""
Storage Service - Quản lý lưu trữ media files cho scheduled posts
"""

import os
import sys
sys.path.append('..')

import asyncio
import base64
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import hashlib
import logging

logger = logging.getLogger(__name__)


class StorageService:
    """Service quản lý lưu trữ media files"""
    
    def __init__(self, base_path: str = "uploads/scheduled"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        
    async def save_media_for_post(
        self,
        post_id: int,
        media_files: List[bytes],
        media_type: str
    ) -> List[str]:
        """
        Lưu media files cho scheduled post
        
        Args:
            post_id: ID của post
            media_files: List file data (bytes)
            media_type: 'image' or 'video'
            
        Returns:
            List đường dẫn file đã lưu
        """
        try:
            # Tạo thư mục cho post
            post_dir = self.base_path / str(post_id)
            post_dir.mkdir(parents=True, exist_ok=True)
            
            saved_paths = []
            
            for idx, file_data in enumerate(media_files):
                # Tạo tên file unique
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                ext = 'mp4' if media_type == 'video' else 'jpg'
                filename = f"{media_type}_{idx}_{timestamp}.{ext}"
                file_path = post_dir / filename
                
                # Lưu file (sync I/O in thread pool)
                await asyncio.to_thread(self._save_file_sync, file_path, file_data)
                
                saved_paths.append(str(file_path))
                logger.info(f"✅ Saved media file: {file_path}")
            
            return saved_paths
            
        except Exception as e:
            logger.error(f"❌ Error saving media files for post {post_id}: {str(e)}")
            raise
    
    async def load_media_for_post(
        self,
        post_id: int,
        media_paths: List[str]
    ) -> List[bytes]:
        """
        Load media files từ storage
        
        Args:
            post_id: ID của post
            media_paths: List đường dẫn file
            
        Returns:
            List file data (bytes)
        """
        try:
            media_files = []
            
            for path in media_paths:
                if os.path.exists(path):
                    # Load file (sync I/O in thread pool)
                    file_data = await asyncio.to_thread(self._load_file_sync, path)
                    media_files.append(file_data)
                else:
                    logger.warning(f"⚠️ Media file not found: {path}")
            
            return media_files
            
        except Exception as e:
            logger.error(f"❌ Error loading media files for post {post_id}: {str(e)}")
            raise
    
    async def delete_media_for_post(self, post_id: int):
        """
        Xóa media files của một post
        
        Args:
            post_id: ID của post
        """
        try:
            post_dir = self.base_path / str(post_id)
            if post_dir.exists():
                # Xóa tất cả files trong thư mục
                for file in post_dir.iterdir():
                    file.unlink()
                # Xóa thư mục
                post_dir.rmdir()
                logger.info(f"✅ Deleted media files for post {post_id}")
                
        except Exception as e:
            logger.error(f"❌ Error deleting media files for post {post_id}: {str(e)}")
    
    def _save_file_sync(self, file_path: Path, file_data: bytes):
        """Sync helper để lưu file"""
        with open(file_path, 'wb') as f:
            f.write(file_data)
    
    def _load_file_sync(self, file_path: str) -> bytes:
        """Sync helper để load file"""
        with open(file_path, 'rb') as f:
            return f.read()
    
    def convert_to_base64(self, file_data: bytes) -> str:
        """Convert file data sang base64 string"""
        return base64.b64encode(file_data).decode('utf-8')
    
    def convert_from_base64(self, base64_string: str) -> bytes:
        """Convert base64 string sang file data"""
        return base64.b64decode(base64_string)


# Global instance
storage_service = StorageService()
