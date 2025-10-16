# import asyncio
# from yt_dlp import YoutubeDL
# import os

# def _download_youtube_blocking(url: str, out_dir: str = "uploads/youtube") -> str:
#     """Tải video YouTube (blocking)"""
#     os.makedirs(out_dir, exist_ok=True)
#     out_template = os.path.join(out_dir, "%(title)s [%(id)s].%(ext)s")

#     ydl_opts = {
#         "outtmpl": out_template,
#         # Chọn format đơn (không cần merge) để tránh lỗi ffmpeg
#         "format": "best[ext=mp4]/best",
#         "noplaylist": True,
#         "quiet": False,  # Bật log để debug
#         # Bỏ postprocessors để tránh cần ffmpeg
#     }

#     try:
#         with YoutubeDL(ydl_opts) as ydl:
#             info = ydl.extract_info(url, download=True)
#             filename = ydl.prepare_filename(info)
#             print(f"📁 File đã tải: {filename}")
#             return filename
#     except Exception as e:
#         raise RuntimeError(f"Lỗi tải video YouTube: {e}")

# async def download_youtube_async(url: str, out_dir: str = "uploads/youtube") -> str:
#     """Tải video YouTube (async, chạy trong thread pool)"""
#     return await asyncio.to_thread(_download_youtube_blocking, url, out_dir)

# # ví dụ sử dụng
# async def main():
#     url = "https://youtu.be/bB-WZvo5eOI?si=ALlyNLzqPaD6x__T"  
#     try:
#         saved = await download_youtube_async(url)
#         print("✅ Đã tải:", saved)
#     except Exception as e:
#         print("❌ Lỗi:", e)

# if __name__ == "__main__":
#     asyncio.run(main())

# test_video.py
import aiohttp
import asyncio
import re
import os
import sys

async def resolve_douyin_url(short_url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(short_url, allow_redirects=True) as resp:
            final_url = str(resp.url)
            print(f"🔗 Link thật: {final_url}")
            return final_url

def extract_item_id(url: str) -> str:
    m = re.search(r'/video/(\d+)', url)
    if m:
        return m.group(1)
    raise ValueError("Không tìm thấy item_id trong URL!")

async def get_douyin_playurl(item_id: str) -> str | None:
    api_url = f"https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids={item_id}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://www.douyin.com/",
    }
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(api_url, headers=headers, timeout=15) as resp:
                status = resp.status
                print(f"API status: {status}")
                # Thử parse json; nếu fail, in ra một phần response text để debug
                try:
                    js = await resp.json()
                except Exception:
                    txt = await resp.text()
                    txt_short = txt[:1000].replace("\n", " ")
                    print("⚠️ Không parse được JSON từ API. Response preview:", txt_short)
                    return None

                if not js:
                    print("⚠️ JSON rỗng từ API.")
                    return None

                item_list = js.get("item_list")
                if not item_list:
                    print("⚠️ item_list là None hoặc rỗng. Có thể bị region-lock hoặc API chặn.")
                    return None

                play_addr = item_list[0]["video"]["play_addr"]["url_list"][0]
                # thử thay playwm -> play (bỏ watermark) — không đảm bảo luôn thành công
                play_addr_no_wm = play_addr.replace("playwm", "play")
                print("🎬 Lấy được play url (no-wm candidate).")
                return play_addr_no_wm
        except asyncio.TimeoutError:
            print("⏱️ Request API timeout.")
            return None
        except Exception as e:
            print("‼️ Lỗi khi gọi API:", e)
            return None

async def async_download_url(url: str, out_path: str):
    headers = {"User-Agent": "Mozilla/5.0", "Referer": "https://www.douyin.com/"}
    async with aiohttp.ClientSession(headers=headers) as session:
        async with session.get(url, timeout=60) as resp:
            if resp.status != 200:
                raise RuntimeError(f"Không tải được, status {resp.status}")
            total = 0
            with open(out_path, "wb") as f:
                async for chunk in resp.content.iter_chunked(64 * 1024):
                    if chunk:
                        f.write(chunk)
                        total += len(chunk)
            print(f"✅ Tải xong: {out_path} ({total/1024/1024:.2f} MB)")

def download_with_yt_dlp(url: str, out_dir: str = "downloads"):
    """
    Blocking fallback using yt-dlp (very robust for Douyin public videos).
    Requires: pip install yt-dlp
    """
    try:
        from yt_dlp import YoutubeDL
    except Exception as e:
        print("❌ yt-dlp chưa cài. Cài bằng: pip install yt-dlp")
        raise

    os.makedirs(out_dir, exist_ok=True)
    out_template = os.path.join(out_dir, "%(uploader)s - %(id)s - %(title)s.%(ext)s")
    opts = {
        "outtmpl": out_template,
        "format": "bestvideo+bestaudio/best",
        "merge_output_format": "mp4",
        "noplaylist": True,
        "quiet": False,
    }
    with YoutubeDL(opts) as ydl:
        print("🔁 Chạy yt-dlp fallback — có thể mất vài giây...")
        ydl.download([url])
        print("✅ yt-dlp hoàn tất (kiểm tra thư mục downloads).")

async def main(short_url: str):
    try:
        real = await resolve_douyin_url(short_url)
        item_id = extract_item_id(real)
    except Exception as e:
        print("❌ Lỗi khi resolve/extract id:", e)
        return

    play_url = await get_douyin_playurl(item_id)
    if play_url:
        # thử download direct
        os.makedirs("downloads", exist_ok=True)
        out_file = os.path.join("downloads", f"douyin_{item_id}.mp4")
        try:
            await async_download_url(play_url, out_file)
            return
        except Exception as e:
            print("⚠️ Tải trực tiếp từ play_url thất bại:", e)
            # fallback tiếp xuống yt-dlp

    # Nếu tới đây nghĩa là get_douyin_playurl trả None hoặc tải thất bại -> fallback yt-dlp
    try:
        # dùng blocking yt-dlp trong thread để không block event loop
        await asyncio.to_thread(download_with_yt_dlp, short_url)
    except Exception as e:
        print("❌ yt-dlp fallback thất bại:", e)
        print("Gợi ý tiếp theo: thử dùng VPN/proxy IP Trung Quốc hoặc lấy cookie từ trình duyệt.")
        return

if __name__ == "__main__":
    if len(sys.argv) >= 2:
        url = sys.argv[1]
    else:
        # mặc định link short hoặc full
        url = "https://v.douyin.com/SOWaoF3oUZ8/"
    asyncio.run(main(url))
