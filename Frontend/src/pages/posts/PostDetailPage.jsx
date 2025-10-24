import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, Hash, CheckCircle, XCircle, Clock } from 'lucide-react';
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

      const allPostsResponse = await postService.getAll({ limit: 1000 });
      const relatedPosts = allPostsResponse.data.filter(p => {
        const timeDiff = Math.abs(new Date(p.created_at) - new Date(mainPost.created_at));
        return p.content === mainPost.content && timeDiff < 60000;
      });

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
          <p className="text-sm md:text-base text-gray-500">Không tìm thấy bài viết</p>
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
      <div className="space-y-4 md:space-y-6">
        {/* Header Info */}
        <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium">ID Bài đăng</label>
              <p className="text-base md:text-lg font-bold text-gray-900">#{post.id}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Trạng thái</label>
              <div className="mt-1">{getStatusBadge(post.status)}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Tác giả</label>
              <div className="flex items-center gap-1 md:gap-2 mt-1">
                <User size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs md:text-sm text-gray-900 truncate">
                  {post.user?.full_name || 'Unknown'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Thời gian tạo</label>
              <div className="flex items-center gap-1 md:gap-2 mt-1">
                <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs md:text-sm text-gray-900">{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
            Nội dung bài đăng
          </label>
          <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 max-h-48 md:max-h-96 overflow-y-auto">
            <p className="text-sm md:text-base text-gray-900 whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>

        {/* Images */}
        {post.post_media && post.post_media.length > 0 && (
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Hình ảnh ({post.post_media.length})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              {post.post_media.map((media, index) => (
                <div key={media.id} className="relative group">
                  <img
                    src={media.media?.file_url || 'https://via.placeholder.com/300'}
                    alt={`Media ${index + 1}`}
                    className="w-full h-24 md:h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 bg-black bg-opacity-60 text-white text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded">
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
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Hashtags</label>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {post.post_hashtags.map((hashtagObj) => (
                <span
                  key={hashtagObj.id}
                  className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs md:text-sm"
                >
                  <Hash size={12} className="md:hidden" />
                  <Hash size={14} className="hidden md:block" />
                  {hashtagObj.hashtag?.name || 'N/A'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
            Thống kê chiến dịch
          </label>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                {post.relatedPosts?.length || 1}
              </div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Tổng trang</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">
                {post.relatedPosts?.filter(p => p.status === 'published').length || 0}
              </div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Đã đăng</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 text-center">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">
                {post.relatedPosts?.filter(p => p.status === 'scheduled').length || 0}
              </div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Lên lịch</div>
            </div>
          </div>
        </div>

        {/* Pages List */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
            Pages được chọn ({post.relatedPosts?.length || 1} trang)
          </label>
          <div className="bg-white border border-gray-200 rounded-lg divide-y max-h-64 md:max-h-96 overflow-y-auto">
            {post.relatedPosts && post.relatedPosts.length > 0 ? (
              post.relatedPosts.map((relatedPost) => (
                <div key={relatedPost.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-base md:text-lg">
                        {relatedPost.page?.platform?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm md:text-base text-gray-900 truncate">
                        {relatedPost.page?.page_name || 'Unknown'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 truncate">
                        {relatedPost.page?.platform?.name || 'N/A'} • {relatedPost.page?.follower_count || 0} followers
                      </div>
                      {relatedPost.platform_post_url && (
                        <a
                          href={relatedPost.platform_post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline inline-block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 Xem bài đăng
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col gap-1 md:gap-2 items-end ml-2">
                    {getStatusBadge(relatedPost.status)}
                    <div className="text-xs text-gray-500">ID: #{relatedPost.id}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 md:p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-base md:text-lg">
                      {post.page?.platform?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm md:text-base text-gray-900">
                      {post.page?.page_name || 'Unknown'}
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
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
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Thời gian đăng</label>
          <div className="space-y-2">
            {post.scheduled_at && (
              <div className="flex items-center gap-2 p-2 md:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="text-yellow-600 flex-shrink-0" size={18} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs md:text-sm font-medium text-yellow-900">Đã lên lịch</div>
                  <div className="text-xs text-yellow-700 truncate">{formatDate(post.scheduled_at)}</div>
                </div>
              </div>
            )}
            {post.published_at && (
              <div className="flex items-center gap-2 p-2 md:p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs md:text-sm font-medium text-green-900">Đã đăng</div>
                  <div className="text-xs text-green-700 truncate">{formatDate(post.published_at)}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 md:pt-6 border-t sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={() => navigate('/posts')}
            className="w-full sm:w-auto px-4 md:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm md:text-base"
          >
            Đóng
          </button>
          <button
            onClick={() => navigate(`/posts/${post.id}/edit`)}
            className="w-full sm:w-auto px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm md:text-base"
          >
            ✏️ Chỉnh sửa
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PostDetailPage;