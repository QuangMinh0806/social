from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, Float,
    ForeignKey, BigInteger, Enum as SQLEnum, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


# ==================== MIXIN ====================
class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ==================== ENUMS ====================
class UserStatus(enum.Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class PageStatus(enum.Enum):
    connected = "connected"
    disconnected = "disconnected"
    error = "error"


class WatermarkPosition(enum.Enum):
    top_left = "top-left"
    top_right = "top-right"
    bottom_left = "bottom-left"
    bottom_right = "bottom-right"
    center = "center"


class MediaType(enum.Enum):
    image = "image"
    video = "video"
    gif = "gif"


class PostType(enum.Enum):
    text = "text"
    image = "image"
    video = "video"
    carousel = "carousel"
    story = "story"


class PostStatus(enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    publishing = "publishing"
    published = "published"
    failed = "failed"
    deleted = "deleted"


# ==================== BẢNG PHỤ TRỢ ====================
class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    role = Column(String(50), default='editor', nullable=False)
    status = Column(SQLEnum(UserStatus), default=UserStatus.active, nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    pages = relationship("Page", back_populates="creator")
    page_permissions = relationship("PagePermission", back_populates="user", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="creator")
    watermarks = relationship("Watermark", back_populates="creator")
    media_files = relationship("MediaLibrary", back_populates="user")
    posts = relationship("Post", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    icon_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    pages = relationship("Page", back_populates="platform")

    def __repr__(self):
        return f"<Platform(id={self.id}, name='{self.name}')>"


# ==================== MODULE QUẢN LÝ PAGE ====================
class Page(Base, TimestampMixin):
    __tablename__ = "pages"
    __table_args__ = (
        UniqueConstraint('platform_id', 'page_id', name='uq_platform_page'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    platform_id = Column(Integer, ForeignKey('platforms.id'), nullable=False)
    page_id = Column(String(100), nullable=False)    
    page_name = Column(String(255), nullable=False)
    page_url = Column(String(255), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    status = Column(SQLEnum(PageStatus), default=PageStatus.connected, nullable=False)
    follower_count = Column(Integer, default=0, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    connected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_sync_at = Column(DateTime, nullable=True)

    # Relationships
    platform = relationship("Platform", back_populates="pages")
    creator = relationship("User", back_populates="pages")
    page_permissions = relationship("PagePermission", back_populates="page", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="page")

    def __repr__(self):
        return f"<Page(id={self.id}, page_name='{self.page_name}', platform_id={self.platform_id})>"


class PagePermission(Base, TimestampMixin):
    __tablename__ = "page_permissions"
    __table_args__ = (
        UniqueConstraint('user_id', 'page_id', name='uq_user_page'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    page_id = Column(Integer, ForeignKey('pages.id', ondelete='CASCADE'), nullable=False)
    can_post = Column(Boolean, default=True, nullable=False)
    can_edit = Column(Boolean, default=True, nullable=False)
    can_delete = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="page_permissions")
    page = relationship("Page", back_populates="page_permissions")

    def __repr__(self):
        return f"<PagePermission(id={self.id}, user_id={self.user_id}, page_id={self.page_id})>"


# ==================== MODULE QUẢN LÝ TEMPLATE ====================
class Template(Base, TimestampMixin):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)
    
    # Template Type: 'caption', 'hashtag', 'watermark', 'image_frame', 'video_frame'
    template_type = Column(String(20), nullable=False, default='caption')
    
    # Caption - Nội dung mẫu (for caption type)
    caption = Column(Text, nullable=True)
    
    # Hashtags - Lưu dưới dạng JSON array (for hashtag type)
    hashtags = Column(JSON, nullable=True)  # ["hashtag1", "hashtag2", ...]
    
    # Watermark settings (for watermark type)
    watermark_position = Column(String(20), nullable=True)  # top-left, top-right, etc
    watermark_opacity = Column(Float, nullable=True, default=0.8)
    watermark_image_url = Column(String(255), nullable=True)
    
    # Frame settings (for image_frame and video_frame types)
    frame_type = Column(String(50), nullable=True)  # Frame Video (cho video posts), etc
    aspect_ratio = Column(String(20), nullable=True)  # Vuông (1:1), Instagram, Facebook
    frame_image_url = Column(String(255), nullable=True)
    
    # Legacy fields - deprecated but kept for compatibility
    watermark_id = Column(Integer, ForeignKey('watermarks.id'), nullable=True)
    watermark_enabled = Column(Boolean, default=False, nullable=False)
    image_frame_url = Column(String(255), nullable=True)
    image_frame_enabled = Column(Boolean, default=False, nullable=False)
    video_frame_url = Column(String(255), nullable=True)
    video_frame_enabled = Column(Boolean, default=False, nullable=False)
    
    # Legacy fields
    content_template = Column(Text, nullable=True)  # Keep for backward compatibility
    thumbnail_url = Column(String(255), nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="templates")
    posts = relationship("Post", back_populates="template")
    watermark = relationship("Watermark", foreign_keys=[watermark_id])

    def __repr__(self):
        return f"<Template(id={self.id}, name='{self.name}')>"


class Watermark(Base, TimestampMixin):
    __tablename__ = "watermarks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    image_url = Column(String(255), nullable=False)
    position = Column(SQLEnum(WatermarkPosition), default=WatermarkPosition.bottom_right, nullable=False)
    opacity = Column(Float, default=0.80, nullable=False)
    size = Column(String(20), default='medium', nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="watermarks")
    post_media = relationship("PostMedia", back_populates="watermark")

    def __repr__(self):
        return f"<Watermark(id={self.id}, name='{self.name}')>"


# ==================== MODULE QUẢN LÝ BÀI ĐĂNG ====================
class MediaLibrary(Base, TimestampMixin):
    __tablename__ = "media_library"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(SQLEnum(MediaType), nullable=False)
    file_url = Column(String(255), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    thumbnail_url = Column(String(255), nullable=True)
    duration = Column(Integer, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    storage_path = Column(String(255), nullable=True)
    is_processed = Column(Boolean, default=False, nullable=False)
    tags = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="media_files")
    post_media = relationship("PostMedia", back_populates="media")

    def __repr__(self):
        return f"<MediaLibrary(id={self.id}, file_name='{self.file_name}', file_type='{self.file_type}')>"


class Hashtag(Base):
    __tablename__ = "hashtags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post_hashtags = relationship("PostHashtag", back_populates="hashtag", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Hashtag(id={self.id}, name='{self.name}')>"


class Post(Base, TimestampMixin):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    page_id = Column(Integer, ForeignKey('pages.id'), nullable=False)
    template_id = Column(Integer, ForeignKey('templates.id', ondelete='SET NULL'), nullable=True)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    post_type = Column(SQLEnum(PostType), default=PostType.text, nullable=False)
    status = Column(SQLEnum(PostStatus), default=PostStatus.draft, nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    platform_post_id = Column(String(100), nullable=True)
    platform_post_url = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    post_metadata = Column('metadata', JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="posts")
    page = relationship("Page", back_populates="posts")
    template = relationship("Template", back_populates="posts")
    post_media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")
    post_hashtags = relationship("PostHashtag", back_populates="post", cascade="all, delete-orphan")
    analytics = relationship("PostAnalytics", back_populates="post", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Post(id={self.id}, title='{self.title}', status='{self.status}')>"


class PostMedia(Base):
    __tablename__ = "post_media"
    __table_args__ = (
        UniqueConstraint('post_id', 'position', name='uq_post_position'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)
    media_id = Column(Integer, ForeignKey('media_library.id'), nullable=False)
    watermark_id = Column(Integer, ForeignKey('watermarks.id', ondelete='SET NULL'), nullable=True)
    position = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("Post", back_populates="post_media")
    media = relationship("MediaLibrary", back_populates="post_media")
    watermark = relationship("Watermark", back_populates="post_media")

    def __repr__(self):
        return f"<PostMedia(id={self.id}, post_id={self.post_id}, media_id={self.media_id})>"


class PostHashtag(Base):
    __tablename__ = "post_hashtags"
    __table_args__ = (
        UniqueConstraint('post_id', 'hashtag_id', name='uq_post_hashtag'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)
    hashtag_id = Column(Integer, ForeignKey('hashtags.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post = relationship("Post", back_populates="post_hashtags")
    hashtag = relationship("Hashtag", back_populates="post_hashtags")

    def __repr__(self):
        return f"<PostHashtag(id={self.id}, post_id={self.post_id}, hashtag_id={self.hashtag_id})>"


class PostAnalytics(Base, TimestampMixin):
    __tablename__ = "post_analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey('posts.id', ondelete='CASCADE'), unique=True, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)
    shares_count = Column(Integer, default=0, nullable=False)
    clicks_count = Column(Integer, default=0, nullable=False)
    engagement_rate = Column(Float, default=0.00, nullable=False)
    reach = Column(Integer, default=0, nullable=False)
    impressions = Column(Integer, default=0, nullable=False)
    synced_at = Column(DateTime, nullable=True)

    # Relationships
    post = relationship("Post", back_populates="analytics")

    def __repr__(self):
        return f"<PostAnalytics(id={self.id}, post_id={self.post_id}, likes={self.likes_count})>"


class LLM(Base):
    __tablename__ = "llm" 
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    key = Column(String(150), nullable=False)