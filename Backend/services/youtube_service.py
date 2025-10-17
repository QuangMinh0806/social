import os
import requests
import googleapiclient.discovery
from google.oauth2.credentials import Credentials
from datetime import datetime, timedelta
from fastapi import HTTPException
from dotenv import load_dotenv as loadenv
loadenv()
class YouTubeService:
    def __init__(self):
        # YouTube API endpoints
        self.auth_url = "https://accounts.google.com/o/oauth2/auth"
        self.token_url = "https://oauth2.googleapis.com/token"
        self.user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        
        # OAuth settings từ environment variables
        self.client_id = os.getenv("YOUTUBE_CLIENT_ID")
        self.client_secret = os.getenv("YOUTUBE_CLIENT_SECRET")
        self.redirect_uri = os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:3000/youtube/callback")
        
        # Kiểm tra có đủ config không
        if not self.client_id or not self.client_secret:
            raise ValueError("Missing YouTube OAuth credentials. Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET environment variables")
        
        self.scopes = [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/userinfo.profile"
        ]

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

    def prepare_page_data(self, token_info, user_info, youtube_channels, platform_id=3, created_by=None):
        """Chuẩn bị dữ liệu để tạo page với refresh token"""
        if created_by is None:
            raise ValueError("created_by is required")
        """Chuẩn bị dữ liệu để tạo page với refresh token"""
        access_token = token_info.get("access_token")
        refresh_token = token_info.get("refresh_token")
        refresh_token = token_info.get("refresh_token")
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
            "refresh_token": refresh_token,  # Thêm refresh token
            "refresh_token": refresh_token,  # Thêm refresh token
            "token_expires_at": token_expires_at.isoformat() if token_expires_at else None,
            "status": "connected",
            "follower_count": subscriber_count,
            "follower_count": subscriber_count,
        }

    def get_channel_profile(self, access_token, refresh_token=None):
        """Lấy thông tin profile YouTube của user"""
        try:
            # Tạo credentials với đầy đủ thông tin nếu có refresh_token
            if refresh_token:
                credentials = Credentials(
                    token=access_token,
                    refresh_token=refresh_token,
                    token_uri=self.token_url,
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    scopes=self.scopes
                )
            else:
                credentials = Credentials(token=access_token)
                
            # Tạo credentials với đầy đủ thông tin nếu có refresh_token
            if refresh_token:
                credentials = Credentials(
                    token=access_token,
                    refresh_token=refresh_token,
                    token_uri=self.token_url,
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    scopes=self.scopes
                )
            else:
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

    def get_channel_videos(self, access_token, max_results=10, refresh_token=None):
        """Lấy danh sách video của channel"""
        try:
            # Tạo credentials với đầy đủ thông tin nếu có refresh_token
            if refresh_token:
                credentials = Credentials(
                    token=access_token,
                    refresh_token=refresh_token,
                    token_uri=self.token_url,
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    scopes=self.scopes
                )
            else:
                credentials = Credentials(token=access_token)
                
            # Tạo credentials với đầy đủ thông tin nếu có refresh_token
            if refresh_token:
                credentials = Credentials(
                    token=access_token,
                    refresh_token=refresh_token,
                    token_uri=self.token_url,
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    scopes=self.scopes
                )
            else:
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

    def upload_video(self, access_token, file_path, title, description, tags=None, category_id=22, privacy_status="private", refresh_token=None):
        """
        Upload video lên YouTube
        
        Parameters:
        - access_token: YouTube access token
        - file_path: Đường dẫn đến file video
        - title: Video title (max 100 characters)
        - description: Video description (max 5000 characters)
        - tags: List of tags (max 15 tags, 500 chars total)
        - category_id: YouTube category ID (default: 22 - People & Blogs)
        - privacy_status: private/unlisted/public
        - refresh_token: YouTube refresh token (optional but recommended)
        - refresh_token: YouTube refresh token (optional but recommended)
        """
        try:
            import os
            from googleapiclient.http import MediaFileUpload
            
            # Validate inputs
            if not title or not title.strip():
                raise ValueError("Title cannot be empty")
            
            if not description:
                description = ""
            
            # Trim title and description to YouTube limits
            title = str(title).strip()[:100]  # YouTube max: 100 chars
            description = str(description).strip()[:5000]  # YouTube max: 5000 chars
            
            # Kiểm tra file tồn tại
            if not os.path.exists(file_path):
                raise Exception(f"File không tồn tại: {file_path}")
            
            print(f"📹 Preparing to upload video:")
            print(f"   File: {file_path}")
            print(f"   Title: {title}")
            print(f"   Description length: {len(description)} chars")
            print(f"   Tags: {tags}")
            
            # Đảm bảo credentials hợp lệ
            print("🔐 Validating credentials...")
            try:
                valid_access_token = self.ensure_valid_credentials(access_token, refresh_token)
                print(f"✓ Credentials validated successfully")
            except Exception as cred_error:
                error_msg = str(cred_error)
                print(f"❌ Credentials validation failed: {error_msg}")
                raise Exception(f"Credentials validation failed: {error_msg}")
            
            # Tạo credentials đầy đủ
            print("🔑 Creating credentials object...")
            try:
                credentials = self.create_full_credentials(valid_access_token, refresh_token)
                print("✓ Credentials object created")
            except Exception as cred_obj_error:
                error_msg = str(cred_obj_error)
                print(f"❌ Failed to create credentials object: {error_msg}")
                raise Exception(f"Failed to create credentials object: {error_msg}")
            
            # Build YouTube service
            print("🔨 Building YouTube API service...")
            try:
                youtube = googleapiclient.discovery.build(
                    "youtube", "v3", 
                    credentials=credentials,
                    cache_discovery=False
                )
                print("✓ YouTube service built successfully")
            except Exception as build_error:
                error_msg = str(build_error)
                print(f"❌ Failed to build YouTube service: {error_msg}")
                raise Exception(f"Failed to build YouTube service: {error_msg}")
            
            # Prepare video metadata
            video_metadata = {
                "snippet": {
                    "title": title,
                    "description": description,
                    "categoryId": str(category_id)
                },
                "status": {
                    "privacyStatus": privacy_status,
                    "selfDeclaredMadeForKids": False
                }
            }
            
            # Add tags if provided
            # YouTube limits: max 500 characters total, recommend max 15 tags
            if tags:
                if isinstance(tags, list) and len(tags) > 0:
                    # Filter valid tags and limit to first 15
                    valid_tags = [str(tag).strip() for tag in tags if tag and str(tag).strip()]
                    valid_tags = valid_tags[:15]  # YouTube recommends max 15 tags
                    if valid_tags:
                        video_metadata["snippet"]["tags"] = valid_tags
            
            # Create media upload object từ file path
            media = MediaFileUpload(
                file_path,
                mimetype="video/*",
                resumable=True
            )
            
            # Execute upload
            insert_request = youtube.videos().insert(
                part=",".join(video_metadata.keys()),
                body=video_metadata,
                media_body=media
            )
            
            # Upload with progress (simplified version)
            response = None
            print("⏳ Starting upload...")
            
            while response is None:
                try:
                    status, response = insert_request.next_chunk()
                    if status:
                        progress = int(status.progress() * 100)
                        print(f"   Upload progress: {progress}%")
                except Exception as chunk_error:
                    error_msg = str(chunk_error)
                    print(f"❌ Upload chunk error: {error_msg}")
                    
                    # Check for common errors
                    if "quota" in error_msg.lower():
                        raise Exception("YouTube API quota exceeded. Please try again tomorrow or request quota increase.")
                    elif "uploadlimitexceeded" in error_msg.lower():
                        raise Exception("YouTube upload limit exceeded. Please verify your YouTube channel at https://www.youtube.com/verify or wait 24 hours.")
                    elif "unauthorized" in error_msg.lower() or "credentials" in error_msg.lower():
                        raise Exception("Invalid credentials. Please reconnect your YouTube channel.")
                    elif "forbidden" in error_msg.lower():
                        raise Exception("Permission denied. Check OAuth scopes and channel permissions.")
                    else:
                        raise
            
            if response:
                video_id = response.get("id")
                video_url = f"https://www.youtube.com/watch?v={video_id}"
                
                print(f"✅ Video uploaded successfully - ID: {video_id}")
                
                return {
                    "success": True,
                    "video_id": video_id,
                    "video_url": video_url,
                    "title": title,
                    "description": description,
                    "privacy_status": privacy_status,
                    "upload_status": "completed",
                    "message": "Video uploaded successfully to YouTube"
                }
            else:
                raise Exception("Upload failed - no response received")
                
        except Exception as e:
            print(f"❌ YouTube upload error: {e}")
            return {
                "success": False,
                "message": f"Upload failed: {str(e)}",
                "error": str(e)
            }

    def refresh_access_token(self, refresh_token):
        """
        Refresh YouTube access token using refresh token
        
        Parameters:
        - refresh_token: The refresh token obtained during initial authentication
        
        Returns:
        - New token information including access_token and expires_in
        """
        try:
            token_data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
            
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            
            response = requests.post(self.token_url, data=token_data, headers=headers)
            token_info = response.json()
            
            if response.status_code != 200:
                error_msg = token_info.get('error_description', token_info.get('error', 'unknown_error'))
                raise Exception(f"Token refresh failed: {error_msg}")
            
            return token_info
            
        except Exception as e:
            raise Exception(f"Token refresh error: {str(e)}")

    def validate_access_token(self, access_token):
        """
        Validate YouTube access token and return token information
        
        Parameters:
        - access_token: The access token to validate
        
        Returns:
        - Token validation information including expiry and scope
        """
        try:
            # Use Google's tokeninfo endpoint to validate token
            tokeninfo_url = "https://oauth2.googleapis.com/tokeninfo"
            params = {"access_token": access_token}
            
            response = requests.get(tokeninfo_url, params=params)
            
            if response.status_code != 200:
                return {
                    "valid": False,
                    "error": "Invalid or expired token",
                    "status_code": response.status_code
                }
            
            token_info = response.json()
            
            # Check if token has required scopes
            token_scope = token_info.get("scope", "")
            required_scopes = [
                "https://www.googleapis.com/auth/youtube.upload",
                "https://www.googleapis.com/auth/youtube.readonly"
            ]
            
            has_required_scopes = all(scope in token_scope for scope in required_scopes)
            
            return {
                "valid": True,
                "expires_in": int(token_info.get("expires_in", 0)),
                "scope": token_scope,
                "has_required_scopes": has_required_scopes,
                "audience": token_info.get("aud"),
                "issued_to": token_info.get("issued_to")
            }
            
        except Exception as e:
            # Return invalid instead of raising exception
            return {
                "valid": False,
                "error": str(e)
            }

    def revoke_access_token(self, access_token):
        """
        Revoke YouTube access token
        
        Parameters:
        - access_token: The access token to revoke
        
        Returns:
        - Revocation result
        """
        try:
            revoke_url = "https://oauth2.googleapis.com/revoke"
            params = {"token": access_token}
            
            response = requests.post(revoke_url, params=params)
            
            if response.status_code == 200:
                return {
                    "revoked": True,
                    "message": "Token revoked successfully"
                }
            else:
                return {
                    "revoked": False,
                    "error": "Failed to revoke token",
                    "status_code": response.status_code
                }
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Token revocation error: {str(e)}")

    def get_token_expiry_info(self, access_token):
        """
        Get detailed token expiry information
        
        Parameters:
        - access_token: The access token to check
        
        Returns:
        - Detailed expiry information
        """
        try:
            validation_info = self.validate_access_token(access_token)
            
            if not validation_info.get("valid"):
                return {
                    "valid": False,
                    "expired": True,
                    "message": "Token is invalid or expired"
                }
            
            expires_in = validation_info.get("expires_in", 0)
            
            return {
                "valid": True,
                "expired": expires_in <= 0,
                "expires_in_seconds": expires_in,
                "expires_in_minutes": round(expires_in / 60, 2),
                "expires_in_hours": round(expires_in / 3600, 2),
                "needs_refresh": expires_in < 300,  # Refresh if less than 5 minutes left
                "message": "Token is valid" if expires_in > 300 else "Token expires soon, consider refreshing"
            }
            
        except Exception as e:
            return {
                "valid": False,
                "expired": True,
                "error": str(e),
                "message": f"Token expiry check error: {str(e)}"
            }

    def auto_refresh_token_if_needed(self, access_token, refresh_token, threshold_minutes=5):
        """
        Automatically refresh token if it's about to expire
        
        Parameters:
        - access_token: Current access token
        - refresh_token: Refresh token
        - threshold_minutes: Refresh if token expires within this many minutes
        
        Returns:
        - Token information (original or refreshed)
        """
        try:
            # Check current token expiry
            expiry_info = self.get_token_expiry_info(access_token)
            
            if not expiry_info.get("valid") or expiry_info.get("expired"):
                # Token is invalid or expired, refresh it
                new_token_info = self.refresh_access_token(refresh_token)
                return {
                    "refreshed": True,
                    "reason": "Token was invalid or expired",
                    "new_access_token": new_token_info.get("access_token"),
                    "expires_in": new_token_info.get("expires_in")
                }
            
            # Check if token expires within threshold
            expires_in_minutes = expiry_info.get("expires_in_minutes", 0)
            
            if expires_in_minutes <= threshold_minutes:
                # Token expires soon, refresh it
                new_token_info = self.refresh_access_token(refresh_token)
                return {
                    "refreshed": True,
                    "reason": f"Token expires in {expires_in_minutes} minutes",
                    "new_access_token": new_token_info.get("access_token"),
                    "expires_in": new_token_info.get("expires_in")
                }
            
            # Token is still valid
            return {
                "refreshed": False,
                "reason": "Token is still valid",
                "current_access_token": access_token,
                "expires_in_minutes": expires_in_minutes
            }
            
        except Exception as e:
            raise Exception(f"Auto refresh error: {str(e)}")

    def ensure_valid_credentials(self, access_token, refresh_token=None):
        """
        Đảm bảo credentials hợp lệ, tự động refresh nếu cần
        
        Parameters:
        - access_token: Current access token
        - refresh_token: Refresh token (optional)
        
        Returns:
        - Valid access token (có thể là token mới sau khi refresh)
        """
        try:
            if not refresh_token:
                # Chỉ có access token, validate và return
                print("⚠️  No refresh_token provided, validating access_token only...")
                validation = self.validate_access_token(access_token)
                if validation.get("valid"):
                    print(f"✓ Access token is valid (expires in {validation.get('expires_in')}s)")
                    return access_token
                else:
                    raise Exception(
                        "Access token is invalid and no refresh token provided. Please reconnect YouTube channel."
                    )
            
            # Có cả access và refresh token, thử auto refresh
            print("✓ Checking if token needs refresh...")
            result = self.auto_refresh_token_if_needed(access_token, refresh_token, threshold_minutes=5)
            
            if result.get("refreshed"):
                print(f"✓ Token refreshed successfully")
                return result.get("new_access_token")
            else:
                print(f"✓ Token is still valid")
                return result.get("current_access_token", access_token)
                
        except HTTPException as http_err:
            # Convert HTTPException to regular Exception for consistency
            raise Exception(str(http_err.detail))
        except Exception as e:
            raise Exception(f"Credentials validation error: {str(e)}")

    def create_full_credentials(self, access_token, refresh_token=None):
        """
        Tạo credentials object đầy đủ cho Google API
        
        Parameters:
        - access_token: Access token
        - refresh_token: Refresh token (optional)
        
        Returns:
        - Credentials object
        """
        if refresh_token:
            return Credentials(
                token=access_token,
                refresh_token=refresh_token,
                token_uri=self.token_url,
                client_id=self.client_id,
                client_secret=self.client_secret,
                scopes=self.scopes
            )
        else:
            return Credentials(token=access_token)

    async def upload_video_async(self, access_token, refresh_token, file_path, title, description, tags=None, category_id=22, privacy_status="private"):
        """
        Async version của upload_video để sử dụng trong controller
        """
        return self.upload_video(
            access_token=access_token,
            file_path=file_path,
            title=title,
            description=description,
            tags=tags,
            category_id=category_id,
            privacy_status=privacy_status,
            refresh_token=refresh_token
        )