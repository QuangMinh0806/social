from sqlalchemy.ext.asyncio import AsyncSession
from services.video_downloader_service import VideoDownloaderService
from controllers.media_controller import MediaController
from models.model import MediaType
from core.exceptions import CustomException
from pathlib import Path
import os
from typing import List, Dict, Any

class VideoImportController:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.video_service = VideoDownloaderService()
        self.media_controller = MediaController(db)
    
    async def import_videos_from_urls(self, urls: List[str], platform: str, 
                                    user_id: int = 1, auto_remove_watermark: bool = True,
                                    use_proxy: bool = False) -> Dict[str, Any]:
        """Import multiple videos from URLs"""
        
        results = []
        errors = []
        
        for url in urls:
            url = url.strip()
            if not url:
                continue
                
            try:
                result = await self.import_single_video(
                    url, platform, user_id, auto_remove_watermark, use_proxy
                )
                results.append(result)
            except Exception as e:
                errors.append({
                    "url": url,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "imported": len(results),
            "failed": len(errors),
            "data": results,
            "errors": errors
        }
    
    async def import_single_video(self, url: str, platform: str, user_id: int = 1,
                                auto_remove_watermark: bool = True, 
                                use_proxy: bool = False) -> Dict[str, Any]:
        """Import single video from URL"""
        
        try:
            # Validate URL format
            if not self.video_service.validate_url(url, platform):
                raise CustomException(f"URL không hợp lệ cho platform {platform}")
            
            # Download video
            download_result = await self.video_service.download_video_from_url(url, platform)
            
            # Create file URL
            file_path = Path(download_result["file_path"])
            relative_path = file_path.relative_to(Path("uploads"))
            file_url = f"http://localhost:8000/uploads/{str(relative_path).replace(os.sep, '/')}"
            
            # Create thumbnail URL for video
            thumbnail_url = None  # Có thể tạo thumbnail sau
            
            # Prepare media data
            media_data = {
                "user_id": user_id,
                "file_name": download_result["file_name"],
                "file_type": MediaType.video,
                "file_url": file_url,
                "file_size": download_result["file_size"],
                "thumbnail_url": thumbnail_url,
                "duration": download_result.get("duration"),
                "width": download_result.get("width"),
                "height": download_result.get("height"),
                "mime_type": "video/mp4",
                "storage_path": download_result["file_path"],
                "is_processed": True,
                "tags": f"imported,{platform},{download_result.get('platform', platform)}"
            }
            
            # Save to database
            media_record = await self.media_controller.create(media_data)
            
            # Add import metadata
            result = media_record.copy()
            result["import_metadata"] = {
                "original_url": download_result.get("original_url", url),
                "platform": download_result.get("platform", platform),
                "auto_remove_watermark": auto_remove_watermark,
                "use_proxy": use_proxy
            }
            
            return result
            
        except Exception as e:
            # Clean up downloaded file if exists
            if 'download_result' in locals() and 'file_path' in download_result:
                try:
                    file_path = Path(download_result["file_path"])
                    if file_path.exists():
                        file_path.unlink()
                except:
                    pass
            
            raise CustomException(f"Không thể import video từ URL: {str(e)}")
    
    async def get_video_info(self, url: str, platform: str) -> Dict[str, Any]:
        """Get video information without downloading"""
        try:
            # Validate URL
            if not self.video_service.validate_url(url, platform):
                raise CustomException(f"URL không hợp lệ cho platform {platform}")
            
            # This would require a separate method in video service to get info only
            # For now, we'll return basic info
            return {
                "url": url,
                "platform": platform,
                "valid": True,
                "message": "URL hợp lệ và có thể tải xuống"
            }
            
        except Exception as e:
            raise CustomException(f"Không thể lấy thông tin video: {str(e)}")
    
    def get_supported_platforms(self) -> List[Dict[str, str]]:
        """Get list of supported platforms"""
        return [
            {"value": "tiktok", "label": "TikTok", "description": "Hỗ trợ tải video TikTok chất lượng cao (cần yt-dlp)"},
            # Tạm thời comment các platform khác
            {"value": "youtube", "label": "YouTube", "description": "Tải video YouTube (cần yt-dlp)"},
            {"value": "facebook", "label": "Facebook", "description": "Tải video Facebook công khai"},
            {"value": "instagram", "label": "Instagram", "description": "Tải video Instagram Reels/IGTV"},
            {"value": "douyin", "label": "Douyin", "description": "Tải video Douyin (TikTok Trung Quốc)"},
            {"value": "other", "label": "Khác", "description": "Tải từ URL video trực tiếp"}
        ]