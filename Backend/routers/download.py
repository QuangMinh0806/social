from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
import subprocess
import json
import os
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any
import asyncio

router = APIRouter(
    prefix="/api/download",
    tags=["download"],
    responses={404: {"description": "Not found"}},
)

class VideoDownloadRequest(BaseModel):
    url: HttpUrl
    quality: Optional[str] = "best"  # best, worst, 720p, 480p, etc.
    audio_only: Optional[bool] = False
    output_format: Optional[str] = "mp4"  # mp4, webm, mkv

class VideoInfo(BaseModel):
    title: str
    duration: Optional[int]
    uploader: Optional[str]
    view_count: Optional[int]
    like_count: Optional[int]
    description: Optional[str]
    thumbnail: Optional[str]
    formats: list

# Tạo thư mục downloads nếu chưa có
DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(exist_ok=True)

def check_yt_dlp():
    """Kiểm tra xem yt-dlp có được cài đặt không"""
    try:
        result = subprocess.run(
            ["yt-dlp", "--version"], 
            capture_output=True, 
            text=True, 
            timeout=10
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def get_video_info(url: str) -> Dict[str, Any]:
    """Lấy thông tin video từ URL"""
    try:
        cmd = [
            "yt-dlp",
            "--dump-json",
            "--no-download",
            str(url)
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Không thể lấy thông tin video: {result.stderr}"
            )
        
        return json.loads(result.stdout)
    
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Timeout khi lấy thông tin video")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Lỗi parse JSON từ yt-dlp")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {str(e)}")

async def download_video_background(url: str, options: list, output_path: str, download_id: str):
    """Download video trong background"""
    try:
        cmd = ["yt-dlp"] + options + [str(url)]
        print(f"[{download_id}] Bắt đầu download với command: {' '.join(cmd)}")
        print(f"[{download_id}] Working directory: {output_path}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=output_path
        )
        
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            error_msg = stderr.decode()
            print(f"[{download_id}] Lỗi download: {error_msg}")
            # Ghi lỗi vào file log
            with open(os.path.join(output_path, "error.log"), "w", encoding="utf-8") as f:
                f.write(f"Error: {error_msg}\n")
                f.write(f"Command: {' '.join(cmd)}\n")
        else:
            success_msg = stdout.decode()
            print(f"[{download_id}] Download thành công: {success_msg}")
            # Ghi thành công vào file log
            with open(os.path.join(output_path, "success.log"), "w", encoding="utf-8") as f:
                f.write(f"Success: {success_msg}\n")
                f.write(f"Command: {' '.join(cmd)}\n")
            
    except Exception as e:
        error_msg = f"Lỗi trong quá trình download: {str(e)}"
        print(f"[{download_id}] {error_msg}")
        # Ghi lỗi exception vào file log
        with open(os.path.join(output_path, "exception.log"), "w", encoding="utf-8") as f:
            f.write(f"Exception: {str(e)}\n")

@router.get("/check")
async def check_downloader():
    """Kiểm tra xem yt-dlp có sẵn không"""
    is_available = check_yt_dlp()
    return {
        "yt_dlp_available": is_available,
        "message": "yt-dlp có sẵn" if is_available else "Cần cài đặt yt-dlp: pip install yt-dlp"
    }

@router.post("/info")
async def get_video_information(request: VideoDownloadRequest):
    """Lấy thông tin chi tiết về video từ URL"""
    if not check_yt_dlp():
        raise HTTPException(
            status_code=500, 
            detail="yt-dlp chưa được cài đặt. Chạy: pip install yt-dlp"
        )
    
    try:
        info = get_video_info(str(request.url))
        
        # Lọc thông tin quan trọng
        video_info = VideoInfo(
            title=info.get("title", "Không có tiêu đề"),
            duration=info.get("duration"),
            uploader=info.get("uploader"),
            view_count=info.get("view_count"),
            like_count=info.get("like_count"),
            description=info.get("description", "")[:500] if info.get("description") else "",
            thumbnail=info.get("thumbnail"),
            formats=[{
                "format_id": f.get("format_id"),
                "ext": f.get("ext"),
                "resolution": f.get("resolution"),
                "filesize": f.get("filesize"),
                "tbr": f.get("tbr")
            } for f in info.get("formats", [])[:10]]  # Chỉ lấy 10 format đầu
        )
        
        return {
            "success": True,
            "data": video_info,
            "platform": info.get("extractor_key", "Unknown")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {str(e)}")

@router.post("/start")
async def start_download(request: VideoDownloadRequest, background_tasks: BackgroundTasks):
    """Bắt đầu download video (background task)"""
    if not check_yt_dlp():
        raise HTTPException(
            status_code=500, 
            detail="yt-dlp chưa được cài đặt. Chạy: pip install yt-dlp"
        )
    
    try:
        # Tạo download_id duy nhất với timestamp
        import time
        timestamp = int(time.time())
        download_id = f"download_{timestamp}"
        output_path = DOWNLOAD_DIR / download_id
        output_path.mkdir(exist_ok=True)
        
        print(f"Tạo download với ID: {download_id}")
        print(f"Output path: {output_path}")
        
        # Cấu hình options cho yt-dlp
        options = ["--no-playlist", "--no-warnings"]
        
        if request.audio_only:
            options.extend(["-f", "bestaudio", "--extract-audio", "--audio-format", "mp3"])
        else:
            if request.quality == "best":
                options.extend(["-f", f"best[ext={request.output_format}]/best"])
            elif request.quality == "worst":
                options.extend(["-f", f"worst[ext={request.output_format}]/worst"])
            else:
                # Specific quality like 720p
                quality_num = request.quality.replace('p', '') if 'p' in request.quality else request.quality
                options.extend(["-f", f"best[height<={quality_num}][ext={request.output_format}]/best[height<={quality_num}]/best"])
        
        # Đặt tên file output với path đầy đủ
        options.extend(["-o", "%(title)s.%(ext)s"])
        
        print(f"Options: {options}")
        
        # Thêm background task
        background_tasks.add_task(
            download_video_background,
            str(request.url),
            options,
            str(output_path),
            download_id
        )
        
        return {
            "success": True,
            "message": "Download đã bắt đầu",
            "download_id": download_id,
            "output_path": str(output_path),
            "url": str(request.url),
            "options": options,
            "note": "Video sẽ được download trong background. Kiểm tra folder downloads."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi bắt đầu download: {str(e)}")

@router.get("/downloads/{download_id}/status")
async def get_download_status(download_id: str):
    """Kiểm tra trạng thái của download"""
    try:
        download_path = DOWNLOAD_DIR / download_id
        
        if not download_path.exists():
            raise HTTPException(status_code=404, detail="Download không tồn tại")
        
        # Kiểm tra các file log
        status = "unknown"
        message = ""
        files = []
        
        # Lấy danh sách file trong folder
        all_files = list(download_path.glob("*"))
        video_files = [f for f in all_files if f.suffix.lower() in ['.mp4', '.webm', '.mkv', '.avi', '.mp3', '.m4a']]
        log_files = [f for f in all_files if f.suffix == '.log']
        
        files = [f.name for f in all_files if f.is_file()]
        
        # Kiểm tra trạng thái
        if download_path.joinpath("success.log").exists():
            status = "completed"
            message = "Download hoàn thành thành công"
        elif download_path.joinpath("error.log").exists():
            status = "failed"
            with open(download_path.joinpath("error.log"), "r", encoding="utf-8") as f:
                message = f.read()
        elif download_path.joinpath("exception.log").exists():
            status = "failed"
            with open(download_path.joinpath("exception.log"), "r", encoding="utf-8") as f:
                message = f.read()
        elif video_files:
            status = "completed"
            message = "Download hoàn thành (có video file)"
        elif len(files) == 0:
            status = "processing"
            message = "Đang xử lý download..."
        else:
            status = "processing"
            message = "Đang download..."
        
        return {
            "success": True,
            "download_id": download_id,
            "status": status,
            "message": message,
            "files": files,
            "video_files": [f.name for f in video_files],
            "file_count": len(files),
            "path": str(download_path)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi kiểm tra status: {str(e)}")

@router.get("/downloads")
async def list_downloads():
    """Liệt kê các file đã download"""
    try:
        downloads = []
        
        for item in DOWNLOAD_DIR.iterdir():
            if item.is_dir():
                files = list(item.glob("*"))
                downloads.append({
                    "folder": item.name,
                    "files": [f.name for f in files if f.is_file()],
                    "file_count": len([f for f in files if f.is_file()])
                })
        
        return {
            "success": True,
            "downloads": downloads,
            "total_folders": len(downloads)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi liệt kê downloads: {str(e)}")

@router.delete("/downloads/{download_id}")
async def delete_download(download_id: str):
    """Xóa folder download"""
    try:
        download_path = DOWNLOAD_DIR / download_id
        
        if not download_path.exists():
            raise HTTPException(status_code=404, detail="Download không tồn tại")
        
        import shutil
        shutil.rmtree(download_path)
        
        return {
            "success": True,
            "message": f"Đã xóa download {download_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xóa download: {str(e)}")

@router.post("/download-sync")
async def download_sync(request: VideoDownloadRequest):
    """Download video đồng bộ (cho test nhanh)"""
    if not check_yt_dlp():
        raise HTTPException(
            status_code=500, 
            detail="yt-dlp chưa được cài đặt. Chạy: pip install yt-dlp"
        )
    
    try:
        # Tạo download_id duy nhất với timestamp
        import time
        timestamp = int(time.time())
        download_id = f"sync_{timestamp}"
        output_path = DOWNLOAD_DIR / download_id
        output_path.mkdir(exist_ok=True)
        
        # Cấu hình options cho yt-dlp
        options = ["--no-playlist", "--no-warnings"]
        
        if request.audio_only:
            options.extend(["-f", "bestaudio", "--extract-audio", "--audio-format", "mp3"])
        else:
            if request.quality == "best":
                options.extend(["-f", f"best[ext={request.output_format}]/best"])
            elif request.quality == "worst":
                options.extend(["-f", f"worst[ext={request.output_format}]/worst"])
            else:
                # Specific quality like 720p
                quality_num = request.quality.replace('p', '') if 'p' in request.quality else request.quality
                options.extend(["-f", f"best[height<={quality_num}][ext={request.output_format}]/best[height<={quality_num}]/best"])
        
        # Đặt tên file output
        options.extend(["-o", "%(title)s.%(ext)s"])
        
        # Download đồng bộ
        cmd = ["yt-dlp"] + options + [str(request.url)]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 phút timeout
            cwd=str(output_path)
        )
        
        # Kiểm tra kết quả
        if result.returncode != 0:
            return {
                "success": False,
                "message": "Download thất bại",
                "error": result.stderr,
                "command": " ".join(cmd),
                "download_id": download_id
            }
        
        # Lấy danh sách file đã download
        files = [f.name for f in output_path.glob("*") if f.is_file()]
        video_files = [f.name for f in output_path.glob("*") if f.suffix.lower() in ['.mp4', '.webm', '.mkv', '.avi', '.mp3', '.m4a']]
        
        return {
            "success": True,
            "message": "Download thành công",
            "download_id": download_id,
            "output_path": str(output_path),
            "files": files,
            "video_files": video_files,
            "stdout": result.stdout,
            "command": " ".join(cmd)
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Timeout khi download video (>5 phút)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi download: {str(e)}")

# Endpoint để test nhanh
@router.get("/test")
async def test_endpoint():
    """Test endpoint để kiểm tra router hoạt động"""
    return {
        "message": "Download router đang hoạt động!",
        "endpoints": [
            "GET /download/check - Kiểm tra yt-dlp",
            "POST /download/info - Lấy thông tin video",
            "POST /download/start - Bắt đầu download (background)",
            "POST /download/download-sync - Download đồng bộ (test nhanh)",
            "GET /download/downloads - Liệt kê downloads",
            "GET /download/downloads/{id}/status - Kiểm tra trạng thái download",
            "DELETE /download/downloads/{id} - Xóa download"
        ],
        "notes": [
            "Sử dụng /download-sync để test nhanh (đồng bộ)",
            "Sử dụng /start cho download background",
            "Kiểm tra status với /downloads/{id}/status"
        ]
    }
