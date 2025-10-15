import requests
import os

def download_video_from_url(url: str, save_dir: str = "videos") -> str:
    os.makedirs(save_dir, exist_ok=True)
    response = requests.get(url, stream=True)
    filename = url.split("/")[-1].split("?")[0] or "video.mp4"
    save_path = os.path.join(save_dir, filename)

    with open(save_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    return save_path
