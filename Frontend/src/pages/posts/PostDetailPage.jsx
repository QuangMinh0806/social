import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Calendar, User, Hash, Image as ImageIcon, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { postService } from '../../services/post.service';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/dateFormatter';
import { POST_STATUS } from '../../config/constants';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const response = await postService.getById(id);
      const mainPost = response.data;

      // Fetch all posts with same content (created around same time)
      const allPostsResponse = await postService.getAll({ limit: 1000 });
      const relatedPosts = allPostsResponse.data.filter(p => {
        // Same content and created within 1 minute
        const timeDiff = Math.abs(new Date(p.created_at) - new Date(mainPost.created_at));
        return p.content === mainPost.content && timeDiff < 60000; // 60 seconds
      });

      // Combine main post with related posts info
      setPost({
        ...mainPost,
        relatedPosts: relatedPosts,
        totalPages: relatedPosts.length
      });
    } catch (error) {
      toast.error('Không thể tải chi tiết bài viết');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      scheduled: 'warning',
      published: 'success',
      failed: 'danger',
      deleted: 'default',
    };
    return <Badge variant={variants[status]}>{POST_STATUS[status]}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'scheduled':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  if (loading) {
    return (
      <Modal isOpen={true} onClose={() => navigate('/posts')} title="Chi tiết bài đăng" size="xl">
        <Loading />
      </Modal>
    );
  }

  if (!post) {
    return (
      <Modal isOpen={true} onClose={() => navigate('/posts')} title="Chi tiết bài đăng" size="xl">
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy bài viết</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => navigate('/posts')}
      title="Chi tiết bài đăng"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium">ID Bài đăng</label>
              <p className="text-lg font-bold text-gray-900">#{post.id}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Trạng thái</label>
              <div className="mt-1">{getStatusBadge(post.status)}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Tác giả</label>
              <div className="flex items-center gap-2 mt-1">
                <User size={16} className="text-gray-400" />
                <span className="text-sm text-gray-900">{post.user?.full_name || 'Unknown'}</span>
                <span className="text-xs text-gray-500">({post.user?.role || 'admin'})</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Thời gian tạo</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar size={16} className="text-gray-400" />
                <span className="text-sm text-gray-900">{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung bài đăng</label>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>

        {/* Images */}
        {post.post_media && post.post_media.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh ({post.post_media.length})
            </label>
            <div className="grid grid-cols-3 gap-3">
              {post.post_media.map((media, index) => (
                <div key={media.id} className="relative group">
                  <img
                    src={media.media?.file_url || 'https://via.placeholder.com/300'}
                    alt={`Media ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hashtags */}
        {post.post_hashtags && post.post_hashtags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
            <div className="flex flex-wrap gap-2">
              {post.post_hashtags.map((hashtagObj) => (
                <span
                  key={hashtagObj.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  <Hash size={14} />
                  {hashtagObj.hashtag?.name || 'N/A'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Thống kê nền tảng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Thống kê chiến dịch
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {post.relatedPosts?.length || 1}
              </div>
              <div className="text-sm text-gray-600 mt-1">Tổng số trang</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {post.relatedPosts?.filter(p => p.status === 'published').length || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Đã đăng</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {post.relatedPosts?.filter(p => p.status === 'scheduled').length || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Đã lên lịch</div>
            </div>
          </div>
        </div>

        {/* Pages được chọn - Hiển thị tất cả posts cùng campaign */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pages được chọn ({post.relatedPosts?.length || 1} trang)
          </label>
          <div className="bg-white border border-gray-200 rounded-lg divide-y max-h-96 overflow-y-auto">
            {post.relatedPosts && post.relatedPosts.length > 0 ? (
              post.relatedPosts.map((relatedPost, index) => (
                <div key={relatedPost.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {relatedPost.page?.platform?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {relatedPost.page?.page_name || 'Unknown Page'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {relatedPost.page?.platform?.name || 'N/A'} • {relatedPost.page?.follower_count || 0} followers
                      </div>
                      {relatedPost.platform_post_url && (
                        <a
                          href={relatedPost.platform_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 Xem bài đăng
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-2 items-end">
                    {getStatusBadge(relatedPost.status)}
                    <div className="text-xs text-gray-500">
                      ID: #{relatedPost.id}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {post.page?.platform?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {post.page?.page_name || 'Unknown Page'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {post.page?.platform?.name || 'N/A'} • {post.page?.follower_count || 0} followers
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(post.status)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian đăng</label>
          <div className="space-y-2">
            {post.scheduled_at && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="text-yellow-600" size={20} />
                <div>
                  <div className="text-sm font-medium text-yellow-900">Đã lên lịch</div>
                  <div className="text-xs text-yellow-700">{formatDate(post.scheduled_at)}</div>
                </div>
              </div>
            )}
            {post.published_at && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <div className="text-sm font-medium text-green-900">Đã đăng</div>
                  <div className="text-xs text-green-700">{formatDate(post.published_at)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            onClick={() => navigate('/posts')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Đóng
          </button>
          <button
            onClick={() => navigate(`/posts/${post.id}/edit`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ✏️ Chỉnh sửa
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PostDetailPage;
