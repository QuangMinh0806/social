import asyncio
import aiohttp
import os
import uuid
import re
from pathlib import Path
from typing import Optional, Dict, Any
from core.exceptions import CustomException

try:
    from yt_dlp import YoutubeDL
    YT_DLP_AVAILABLE = True
except ImportError:
    YT_DLP_AVAILABLE = False
    YoutubeDL = None

class VideoDownloaderService:
    def __init__(self):
        self.max_file_size = 200 * 1024 * 1024  # 200MB
        self.upload_dir = Path("uploads/video")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
    async def check_yt_dlp_availability(self) -> bool:
        """Check if yt-dlp is available - chỉ kiểm tra import"""
        return YT_DLP_AVAILABLE and YoutubeDL is not None
        
    def validate_url(self, url: str, platform: str) -> bool:
        """Validate URL format for specific platform"""
        platform = platform.lower()
        url = url.strip()
        
        if not url:
            return False
            
        # Basic URL validation
        if not (url.startswith('http://') or url.startswith('https://')):
            return False
            
        # Platform-specific validation
        if platform == "tiktok":
            return "tiktok.com" in url or "vm.tiktok.com" in url
        elif platform == "youtube":
            return ("youtube.com" in url or "youtu.be" in url or 
                   "www.youtube.com" in url or "m.youtube.com" in url)
        elif platform == "facebook":
            return "facebook.com" in url or "fb.watch" in url
        elif platform == "instagram":
            return "instagram.com" in url
        elif platform == "douyin":
            return "douyin.com" in url or "iesdouyin.com" in url
        elif platform == "other":
            # For generic video URLs, just check if it's a valid URL
            return True
        else:
            return False
        
    async def download_video_from_url(self, url: str, platform: str) -> Dict[str, Any]:
        """Download video từ URL (TikTok, YouTube, Facebook, Instagram, etc.)"""
        try:
            # Kiểm tra yt-dlp availability đơn giản
            if not YT_DLP_AVAILABLE or YoutubeDL is None:
                raise CustomException("yt-dlp không có sẵn. Vui lòng cài đặt: pip install yt-dlp")
            
            platform = platform.lower()

            if platform == "tiktok":
                return await self._download_tiktok_video(url)
            elif platform == "youtube":
                return await self._download_youtube_video(url)
            elif platform in ["facebook", "instagram", "douyin", "other"]:
                return await self._download_with_ytdlp(url, platform)
            else:
                raise CustomException(f"Hiện tại chưa hỗ trợ platform: {platform}")
        
        except Exception as e:
            raise CustomException(f"Lỗi khi tải video: {str(e)}")

    async def _download_tiktok_video(self, url: str) -> Dict[str, Any]:
        """Download TikTok video using yt-dlp"""
        try:
            if not YT_DLP_AVAILABLE or YoutubeDL is None:
                raise Exception("yt-dlp không có sẵn. Vui lòng cài đặt: pip install yt-dlp")
                
            print(f"🚀 Bắt đầu tải TikTok: {url}")

            # Tạo thư mục lưu file
            upload_dir = self.upload_dir
            upload_dir.mkdir(parents=True, exist_ok=True)
            upload_dir.mkdir(parents=True, exist_ok=True)

            # Tạo id tạm
            temp_id = str(uuid.uuid4())
            out_template = str(upload_dir / f"{temp_id}.%(ext)s")

            # ---- Cấu hình yt-dlp ----
            opts = {
                "outtmpl": out_template,
                "format": "bestvideo+bestaudio/best",
                "merge_output_format": "mp4",
                "noplaylist": True,
                "quiet": False,
                "retries": 3,
                # 👇 Thêm User-Agent để tránh bị TikTok chặn
                "http_headers": {
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    )
                },
                # Nếu bạn có cookies.txt thì thêm dòng này:
                # "cookiefile": "cookies.txt",
            }

            def _download_blocking():
                """Hàm chạy trong thread"""
                try:
                    with YoutubeDL(opts) as ydl:
                        info = ydl.extract_info(url, download=True)
                        return info
                except Exception as e:
                    print(f"❌ Lỗi trong _download_blocking: {e}")
                    raise

            print("⏳ Đang tải video trong thread...")
            info = await asyncio.to_thread(_download_blocking)

            if not info:
                raise Exception("Không lấy được metadata video.")

            file_ext = info.get("ext", "mp4")
            file_path = upload_dir / f"{temp_id}.{file_ext}"

            # Tìm file nếu yt-dlp đổi tên
            if not file_path.exists():
                matches = list(upload_dir.glob(f"{temp_id}.*"))
                if matches:
                    file_path = matches[0]
                else:
                    raise Exception("Không tìm thấy file sau khi tải.")

            # Kiểm tra dung lượng
            size = file_path.stat().st_size
            if size > self.max_file_size:
                file_path.unlink(missing_ok=True)
                raise Exception(f"Video quá lớn ({size/(1024*1024):.1f} MB). Giới hạn {self.max_file_size/(1024*1024):.0f} MB")

            # Trả kết quả
            result = {
                "file_path": str(file_path),
                "file_name": f"{info.get('title', 'TikTok Video')}.{file_ext}",
                "file_size": size,
                "duration": info.get("duration"),
                "width": info.get("width"),
                "height": info.get("height"),
                "platform": "tiktok",
                "original_url": url
            }

            print("✅ Tải thành công:", result["file_path"])
            return result

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise Exception(f"Lỗi tải TikTok video: {e}")
    
    async def _download_youtube_video(self, url: str) -> Dict[str, Any]:
        """Download YouTube video asynchronously using yt-dlp - sử dụng logic từ test_video.py"""
        try:
            out_dir = os.path.join("uploads", "video")
            os.makedirs(out_dir, exist_ok=True)

            out_template = os.path.join(out_dir, "%(title)s [%(id)s].%(ext)s")

            ydl_opts = {
                "outtmpl": out_template,
                # Chọn format đơn (không cần merge) để tránh lỗi ffmpeg
                "format": "best[ext=mp4]/best",
                "noplaylist": True,
                "quiet": False,  # Bật log để debug như trong test_video.py
                # Bỏ postprocessors để tránh cần ffmpeg
            }

            def _download_youtube_blocking():
                """Logic giống test_video.py"""
                try:
                    with YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(url, download=True)
                        filename = ydl.prepare_filename(info)
                        print(f"📁 File đã tải: {filename}")
                        return info, filename
                except Exception as e:
                    raise RuntimeError(f"Lỗi tải video YouTube: {e}")

            # chạy blocking trong thread pool - giống test_video.py
            info, filename = await asyncio.to_thread(_download_youtube_blocking)

            if not os.path.exists(filename):
                raise Exception("Không tìm thấy file đã tải.")

            file_size = os.path.getsize(filename)

            if file_size > getattr(self, "max_file_size", 200 * 1024 * 1024):
                os.remove(filename)
                raise Exception(f"Video quá lớn ({file_size / (1024 * 1024):.1f}MB). Tối đa 200MB")

            return {
                "file_path": filename,
                "file_name": os.path.basename(filename),
                "file_size": file_size,
                "duration": info.get("duration"),
                "width": info.get("width"),
                "height": info.get("height"),
                "platform": "youtube",
                "original_url": url,
            }

        except Exception as e:
            raise Exception(f"Lỗi tải YouTube video: {str(e)}")

    async def _download_douyin_video(self, url: str) -> Dict[str, Any]:
        """Download Douyin video using yt-dlp"""
        try:
            return await self._download_with_ytdlp(url, "douyin")
        except Exception as e:
            raise Exception(f"Lỗi tải Douyin video: {str(e)}")

    async def _download_with_ytdlp(self, url: str, platform: str) -> Dict[str, Any]:
        """Generic method to download video using yt-dlp"""
        try:
            # Tạo file tạm
            temp_filename = f"{uuid.uuid4()}.%(ext)s"
            temp_path = self.upload_dir / temp_filename
            
            # Tải video với giới hạn kích thước
            cmd = [
                "yt-dlp",
                "--no-warnings",
                "--format", "best[filesize<200M]/best",
                "-o", str(temp_path),
                "--print", "after_move:%(filepath)s|||%(title)s|||%(duration)s|||%(width)s|||%(height)s",
                url
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"yt-dlp error: {stderr.decode()}")
            
            # Parse output
            output = stdout.decode().strip()
            if "|||" in output:
                parts = output.split("|||")
                filepath = parts[0]
                title = parts[1] if len(parts) > 1 else f"{platform.capitalize()} Video"
                duration = int(parts[2]) if len(parts) > 2 and parts[2] else None
                width = int(parts[3]) if len(parts) > 3 and parts[3] else None
                height = int(parts[4]) if len(parts) > 4 and parts[4] else None
            else:
                # Fallback: tìm file đã tải
                downloaded_files = list(self.upload_dir.glob(f"{temp_filename.split('.')[0]}.*"))
                if not downloaded_files:
                    raise Exception("Không tìm thấy file đã tải")
                filepath = str(downloaded_files[0])
                title = f"{platform.capitalize()} Video"
                duration = width = height = None
            
            file_path = Path(filepath)
            if not file_path.exists():
                raise Exception("File không tồn tại sau khi tải")
                
            file_size = file_path.stat().st_size
            
            if file_size > self.max_file_size:
                file_path.unlink()  # Xóa file
                raise Exception(f"Video quá lớn ({file_size/(1024*1024):.1f}MB). Tối đa 200MB")
            
            return {
                "file_path": str(file_path),
                "file_name": f"{title}.{file_path.suffix[1:]}",
                "file_size": file_size,
                "duration": duration,
                "width": width,
                "height": height,
                "platform": platform,
                "original_url": url
            }
            
        except Exception as e:
            raise Exception(f"Lỗi tải {platform} video: {str(e)}")
