import os
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
import googleapiclient.http
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path

router = APIRouter(prefix="/youtube", tags=["YouTube"])

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
BASE_DIR = Path(__file__).resolve().parent
CLIENT_SECRETS_FILE = BASE_DIR / "client_secret.json"
TOKEN_FILE = BASE_DIR / "token.json"

def authenticate_youtube():
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
        CLIENT_SECRETS_FILE, SCOPES
    )
    credentials = flow.run_local_server(port=0)

    youtube = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)
    return youtube


def upload_video_to_youtube(youtube, file_path: str, title: str, description: str):
    request_body = {
        "snippet": {
            "categoryId": "22",
            "title": title,
            "description": description,
            "tags": ["python", "youtube", "api"]
        },
        "status": {
            "privacyStatus": "public"
        }
    }

    media = googleapiclient.http.MediaFileUpload(
        file_path, chunksize=-1, resumable=True, mimetype="video/mp4"
    )

    request = youtube.videos().insert(
        part="snippet,status",
        body=request_body,
        media_body=media
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Đang upload: {int(status.progress() * 100)}%")

    return response


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    title: str = "Uploaded from FastAPI",
    description: str = "Demo upload video using YouTube API"
):
    """
    Upload video lên YouTube qua FastAPI router
    """
    try:
        # Lưu file tạm
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())

        youtube = authenticate_youtube()
        response = upload_video_to_youtube(youtube, temp_path, title, description)

        os.remove(temp_path)

        return {"status": "success", "video_id": response["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
