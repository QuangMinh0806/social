from PIL import Image, ImageDraw
import io
import requests
from typing import Optional, Tuple
import tempfile
import os
import subprocess
import re
from services.image_utils import get_absolute_path_from_url, is_localhost_url, normalize_url


class ImageProcessingService:
    """Service for processing images and videos with frames and watermarks"""
    
    @staticmethod
    def download_image_from_url(url: str) -> Image.Image:
        """Download image from URL and return PIL Image"""
        try:
            print(f"📥 Downloading image from: {url}")
            
            # Normalize URL (fix common issues like wrong port)
            url = normalize_url(url)
            print(f"  → Normalized URL: {url}")
            
            # Xử lý localhost URLs - đọc trực tiếp từ disk
            if is_localhost_url(url):
                absolute_path = get_absolute_path_from_url(url)
                if absolute_path and os.path.exists(absolute_path):
                    print(f"  ✅ Reading from disk: {absolute_path}")
                    return Image.open(absolute_path).convert('RGBA')
                else:
                    print(f"  ⚠️ File not found at: {absolute_path}")
                    print(f"  → Current working directory: {os.getcwd()}")
                    print(f"  → Trying HTTP download...")
            
            # Download qua HTTP với timeout dài hơn
            print(f"  → Downloading via HTTP...")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            print(f"  ✅ Downloaded successfully ({len(response.content)} bytes)")
            return Image.open(io.BytesIO(response.content)).convert('RGBA')
            
        except Exception as e:
            print(f"  ❌ Failed: {str(e)}")
            raise Exception(f"Failed to download image from {url}: {str(e)}")
    
    @staticmethod
    def resize_to_aspect_ratio(image: Image.Image, aspect_ratio: str) -> Image.Image:
        """Resize image to match aspect ratio"""
        aspect_map = {
            '1:1': (1, 1),
            '9:16': (9, 16),
            '16:9': (16, 9),
            '4:5': (4, 5)
        }
        
        if aspect_ratio not in aspect_map:
            return image
        
        width_ratio, height_ratio = aspect_map[aspect_ratio]
        
        # Calculate target dimensions
        original_width, original_height = image.size
        target_ratio = width_ratio / height_ratio
        current_ratio = original_width / original_height
        
        if current_ratio > target_ratio:
            # Image is wider, fit to height
            new_height = original_height
            new_width = int(new_height * target_ratio)
        else:
            # Image is taller, fit to width
            new_width = original_width
            new_height = int(new_width / target_ratio)
        
        # Crop to center
        left = (original_width - new_width) // 2
        top = (original_height - new_height) // 2
        right = left + new_width
        bottom = top + new_height
        
        return image.crop((left, top, right, bottom))
    
    @staticmethod
    def apply_frame_to_image(
        content_image: Image.Image,
        frame_image: Image.Image,
        aspect_ratio: Optional[str] = None
    ) -> Image.Image:
        """Apply frame to content image"""
        try:
            # Resize content to match aspect ratio if specified
            if aspect_ratio:
                content_image = ImageProcessingService.resize_to_aspect_ratio(
                    content_image, aspect_ratio
                )
            
            # Ensure both images are RGBA
            content_image = content_image.convert('RGBA')
            frame_image = frame_image.convert('RGBA')
            
            # Resize frame to match content size
            frame_resized = frame_image.resize(content_image.size, Image.Resampling.LANCZOS)
            
            # Create composite: content as base, frame on top
            result = Image.alpha_composite(content_image, frame_resized)
            
            return result
        except Exception as e:
            raise Exception(f"Failed to apply frame: {str(e)}")
    
    @staticmethod
    def apply_watermark_to_image(
        content_image: Image.Image,
        watermark_image: Image.Image,
        position: str = 'bottom-right',
        opacity: float = 0.8,
        margin: int = 20
    ) -> Image.Image:
        """Apply watermark to content image"""
        try:
            # Ensure both images are RGBA
            content_image = content_image.convert('RGBA')
            watermark_image = watermark_image.convert('RGBA')
            
            # Calculate watermark size (max 20% of content width)
            max_wm_width = int(content_image.size[0] * 0.2)
            wm_ratio = watermark_image.size[1] / watermark_image.size[0]
            wm_width = min(watermark_image.size[0], max_wm_width)
            wm_height = int(wm_width * wm_ratio)
            watermark_resized = watermark_image.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
            
            # Apply opacity
            watermark_with_opacity = Image.new('RGBA', watermark_resized.size)
            for x in range(watermark_resized.size[0]):
                for y in range(watermark_resized.size[1]):
                    r, g, b, a = watermark_resized.getpixel((x, y))
                    watermark_with_opacity.putpixel((x, y), (r, g, b, int(a * opacity)))
            
            # Calculate position
            content_width, content_height = content_image.size
            wm_width, wm_height = watermark_with_opacity.size
            
            position_map = {
                'top-left': (margin, margin),
                'top-right': (content_width - wm_width - margin, margin),
                'bottom-left': (margin, content_height - wm_height - margin),
                'bottom-right': (content_width - wm_width - margin, content_height - wm_height - margin),
                'center': ((content_width - wm_width) // 2, (content_height - wm_height) // 2)
            }
            
            x, y = position_map.get(position, position_map['bottom-right'])
            
            # Paste watermark onto content
            result = content_image.copy()
            result.paste(watermark_with_opacity, (x, y), watermark_with_opacity)
            
            return result
        except Exception as e:
            raise Exception(f"Failed to apply watermark: {str(e)}")
    
    @staticmethod
    def process_image_with_template(
        content_image_data: bytes,
        frame_url: Optional[str] = None,
        watermark_url: Optional[str] = None,
        watermark_position: str = 'bottom-right',
        watermark_opacity: float = 0.8,
        aspect_ratio: Optional[str] = None
    ) -> bytes:
        """
        Process image with frame and/or watermark
        Returns processed image as bytes
        """
        try:
            print(f"\n🔧 === IMAGE PROCESSING DEBUG ===")
            print(f"  📁 Input image size: {len(content_image_data)} bytes")
            print(f"  🖼️ Frame URL: {frame_url}")
            print(f"  💧 Watermark URL: {watermark_url}")
            print(f"  📐 Aspect ratio: {aspect_ratio}")
            
            # Load content image
            content_image = Image.open(io.BytesIO(content_image_data)).convert('RGBA')
            print(f"  ✅ Loaded content image: {content_image.size}")
            
            # Apply frame if provided
            if frame_url:
                print(f"  🎨 Applying frame from: {frame_url}")
                frame_image = ImageProcessingService.download_image_from_url(frame_url)
                print(f"  ✅ Frame loaded: {frame_image.size}")
                content_image = ImageProcessingService.apply_frame_to_image(
                    content_image, frame_image, aspect_ratio
                )
                print(f"  ✅ Frame applied successfully!")
            else:
                print(f"  ⚠️ No frame URL provided, skipping frame")
            
            # Apply watermark if provided (and no frame)
            if watermark_url:
                print(f"  💧 Applying watermark from: {watermark_url}")
                watermark_image = ImageProcessingService.download_image_from_url(watermark_url)
                print(f"  ✅ Watermark loaded: {watermark_image.size}")
                content_image = ImageProcessingService.apply_watermark_to_image(
                    content_image, watermark_image, watermark_position, watermark_opacity
                )
                print(f"  ✅ Watermark applied successfully!")
            else:
                print(f"  ⚠️ No watermark URL provided, skipping watermark")
            
            # Convert to RGB for JPEG
            final_image = content_image.convert('RGB')
            print(f"  ✅ Final image size: {final_image.size}")
            
            # Save to bytes
            output = io.BytesIO()
            final_image.save(output, format='JPEG', quality=95)
            output.seek(0)
            print(f"  ✅ Saved to bytes: {output.getbuffer().nbytes} bytes")
            print(f"🔧 === END PROCESSING ===\n")
            
            return output.read()
        except Exception as e:
            print(f"  ❌ ERROR in process_image_with_template: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to process image: {str(e)}")
    
    @staticmethod
    def apply_frame_to_video(
        video_path: str,
        frame_url: str,
        aspect_ratio: Optional[str] = None,
        output_path: Optional[str] = None
    ) -> str:
        """
        Apply frame overlay to video using ffmpeg
        Returns path to processed video
        """
        try:
            if output_path is None:
                output_dir = tempfile.gettempdir()
                output_filename = f"framed_video_{os.path.basename(video_path)}"
                output_path = os.path.join(output_dir, output_filename)
            
            # Download frame image
            frame_image = ImageProcessingService.download_image_from_url(frame_url)
            
            # Save frame to temp file
            frame_temp_path = os.path.join(tempfile.gettempdir(), "frame_overlay.png")
            frame_image.save(frame_temp_path, format='PNG')
            
            # Use ffmpeg to overlay frame on video
            # Get video dimensions first
            probe_cmd = [
                'ffprobe', '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height',
                '-of', 'csv=p=0',
                video_path
            ]
            
            try:
                result = subprocess.run(probe_cmd, capture_output=True, text=True, check=True)
                video_width, video_height = map(int, result.stdout.strip().split(','))
            except:
                # Default dimensions if probe fails
                video_width, video_height = 1080, 1920
            
            # Resize frame to match video dimensions
            frame_resized = frame_image.resize((video_width, video_height), Image.Resampling.LANCZOS)
            frame_resized.save(frame_temp_path, format='PNG')
            
            # Apply overlay using ffmpeg
            ffmpeg_cmd = [
                'ffmpeg', '-i', video_path,
                '-i', frame_temp_path,
                '-filter_complex', '[0:v][1:v]overlay=0:0',
                '-c:a', 'copy',
                '-y',  # Overwrite output
                output_path
            ]
            
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
            
            # Clean up temp frame
            if os.path.exists(frame_temp_path):
                os.remove(frame_temp_path)
            
            return output_path
        except subprocess.CalledProcessError as e:
            raise Exception(f"FFmpeg error: {e.stderr.decode()}")
        except Exception as e:
            raise Exception(f"Failed to apply frame to video: {str(e)}")
