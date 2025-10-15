import os
import json
import requests
import googleapiclient.discovery
from google.oauth2.credentials import Credentials
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import HTTPException

class YouTubeService:
    def __init__(self):
        self.base_dir = Path(__file__).resolve().parent.parent
        self.client_secrets_file = self.base_dir / "routers" / "client_secret.json"
        self.config = self._load_client_config()
        
        # YouTube API endpoints
        self.auth_url = self.config.get('auth_uri', "https://accounts.google.com/o/oauth2/auth")
        self.token_url = self.config.get('token_uri', "https://oauth2.googleapis.com/token")
        self.user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        
        # OAuth settings
        self.client_id = self.config['client_id']
        self.client_secret = self.config['client_secret']
        self.redirect_uri = "http://localhost:3000/youtube/callback"
        self.scopes = [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/userinfo.profile"
        ]

    def _load_client_config(self):
        """Load client configuration from client_secret.json file"""
        try:
            with open(self.client_secrets_file, 'r') as f:
                config = json.load(f)
                
            # Lấy từ installed app config (Google Cloud Console tạo ra)
            if 'installed' in config:
                client_config = config['installed']
            elif 'web' in config:
                client_config = config['web']
            else:
                raise ValueError("Invalid client_secret.json format")
                
            return {
                'client_id': client_config['client_id'],
                'client_secret': client_config['client_secret'],
                'auth_uri': client_config['auth_uri'],
                'token_uri': client_config['token_uri']
            }
        except FileNotFoundError:
            print("Warning: client_secret.json not found, using environment variables")
            return {
                'client_id': os.getenv("YOUTUBE_CLIENT_ID", "your_client_id_here"),
                'client_secret': os.getenv("YOUTUBE_CLIENT_SECRET", "your_client_secret_here"),
                'auth_uri': "https://accounts.google.com/o/oauth2/auth",
                'token_uri': "https://oauth2.googleapis.com/token"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error loading client config: {str(e)}")

    def get_auth_url(self, state="youtube_auth_state_123"):
        """Tạo URL để user đăng nhập YouTube"""
        try:
            from urllib.parse import urlencode
            
            params = {
                "client_id": self.client_id,
                "redirect_uri": self.redirect_uri,
                "scope": " ".join(self.scopes),
                "response_type": "code",
                "access_type": "offline",
                "prompt": "consent",
                "state": state
            }
            
            auth_url = f"{self.auth_url}?{urlencode(params)}"
            
            return {
                "success": True,
                "message": "Nhấp vào link để kết nối với YouTube",
                "auth_url": auth_url,
                "redirect_uri": self.redirect_uri,
                "scopes": self.scopes
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi tạo URL đăng nhập: {str(e)}")

    def exchange_code_for_token(self, code):
        """Đổi authorization code lấy access token"""
        token_data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }
        
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        
        response = requests.post(self.token_url, data=token_data, headers=headers)
        token_info = response.json()
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400, 
                detail=f"Token exchange failed: {token_info.get('error', 'unknown_error')}"
            )
        
        return token_info

    def get_user_info(self, access_token):
        """Lấy thông tin user từ Google"""
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(self.user_info_url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user information")
        
        return response.json()

    def get_youtube_channels(self, access_token, refresh_token=None):
        """Lấy thông tin channels của user"""
        try:
            credentials = Credentials(
                token=access_token,
                refresh_token=refresh_token,
                token_uri=self.token_url,
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.scopes
            )
            
            youtube_service = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)
            
            channels_response = youtube_service.channels().list(
                part="snippet,contentDetails,statistics",
                mine=True
            ).execute()
            
            return channels_response.get("items", [])
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to get channel information: {str(e)}")

    def prepare_page_data(self, token_info, user_info, youtube_channels, platform_id=3, created_by=1):
        """Chuẩn bị dữ liệu để tạo page"""
        access_token = token_info.get("access_token")
        expires_in = token_info.get("expires_in", 3600)
        
        # Calculate token expiration datetime
        token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in) if expires_in else None
        
        # Extract channel information
        channel_info = youtube_channels[0] if youtube_channels else {}
        channel_id = channel_info.get("id", "")
        channel_title = channel_info.get("snippet", {}).get("title", "YouTube Channel")
        channel_thumbnail = channel_info.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url", "")
        subscriber_count = int(channel_info.get("statistics", {}).get("subscriberCount", 0))
        
        return {
            "platform_id": platform_id,
            "page_id": channel_id,
            "page_name": channel_title,
            "created_by": created_by,
            "page_url": f"https://www.youtube.com/channel/{channel_id}" if channel_id else None,
            "avatar_url": channel_thumbnail,
            "access_token": access_token,
            "token_expires_at": token_expires_at.isoformat() if token_expires_at else None,
            "status": "connected",
            "follower_count": subscriber_count
        }

    def get_channel_profile(self, access_token):
        """Lấy thông tin profile YouTube của user"""
        try:
            credentials = Credentials(token=access_token)
            youtube = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)
            
            channels_response = youtube.channels().list(
                part="snippet,contentDetails,statistics,brandingSettings",
                mine=True
            ).execute()
            
            channels = channels_response.get("items", [])
            
            if not channels:
                return {
                    "success": False,
                    "message": "Không tìm thấy YouTube channel"
                }
            
            channel = channels[0]
            
            return {
                "success": True,
                "channel_info": {
                    "id": channel["id"],
                    "title": channel["snippet"]["title"],
                    "description": channel["snippet"]["description"],
                    "thumbnail": channel["snippet"]["thumbnails"]["default"]["url"],
                    "subscriber_count": channel["statistics"].get("subscriberCount", 0),
                    "video_count": channel["statistics"].get("videoCount", 0),
                    "view_count": channel["statistics"].get("viewCount", 0),
                    "uploads_playlist_id": channel["contentDetails"]["relatedPlaylists"]["uploads"]
                }
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi lấy profile: {str(e)}")

    def get_channel_videos(self, access_token, max_results=10):
        """Lấy danh sách video của channel"""
        try:
            credentials = Credentials(token=access_token)
            youtube = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)
            
            # Lấy uploads playlist ID
            channels_response = youtube.channels().list(
                part="contentDetails",
                mine=True
            ).execute()
            
            uploads_playlist_id = channels_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
            
            # Lấy videos từ uploads playlist
            playlist_response = youtube.playlistItems().list(
                part="snippet,contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=max_results
            ).execute()
            
            videos = []
            for item in playlist_response["items"]:
                videos.append({
                    "video_id": item["contentDetails"]["videoId"],
                    "title": item["snippet"]["title"],
                    "description": item["snippet"]["description"][:200] + "..." if len(item["snippet"]["description"]) > 200 else item["snippet"]["description"],
                    "thumbnail": item["snippet"]["thumbnails"]["default"]["url"],
                    "published_at": item["snippet"]["publishedAt"]
                })
            
            return {
                "success": True,
                "videos": videos,
                "total_results": len(videos)
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi lấy videos: {str(e)}")