import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { postService } from '../../services/post.service';
import { POST_STATUS } from '../../config/constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { formatDate } from '../../utils/dateFormatter';

const PostListPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [groupedPosts, setGroupedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    groupPostsByContent();
  }, [posts]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * 20,
        limit: 20,
      };

      let response;
      if (statusFilter) {
        response = await postService.getByStatus(statusFilter, params);
      } else {
        response = await postService.getAll(params);
      }

      setPosts(response.data || []);
      setTotalPages(Math.ceil((response.total || 100) / 20));
    } catch (error) {
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const groupPostsByContent = () => {
    const groups = {};

    posts.forEach(post => {
      const contentKey = post.content.substring(0, 100);
      const timeKey = new Date(post.created_at).toISOString().substring(0, 16);
      const key = `${contentKey}_${timeKey}`;

      if (!groups[key]) {
        groups[key] = {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          scheduled_at: post.scheduled_at,
          published_at: post.published_at,
          post_media: post.post_media,
          posts: [],
          pages: [],
          status: post.status,
        };
      }

      groups[key].posts.push(post);
      groups[key].pages.push({
        id: post.page?.id,
        name: post.page?.page_name,
        platform: post.page?.platform?.name,
        status: post.status,
      });
    });

    const grouped = Object.values(groups).sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );

    setGroupedPosts(grouped);
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      scheduled: 'warning',
      published: 'success',
      failed: 'danger',
      archived: 'default',
    };
    return <Badge variant={variants[status]}>{POST_STATUS[status]}</Badge>;
  };

  const filteredPosts = groupedPosts.filter(group =>
    group.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteCampaign = (group) => {
    if (window.confirm(`Xóa chiến dịch này? (${group.pages.length} bài đăng sẽ bị xóa)`)) {
      Promise.all(group.posts.map(p => postService.delete(p.id)))
        .then(() => {
          toast.success('Đã xóa chiến dịch thành công');
          fetchPosts();
        })
        .catch(() => toast.error('Không thể xóa chiến dịch'));
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen">
      {/* Desktop Breadcrumb */}
      <div className="hidden md:block">
        <Breadcrumb items={[{ label: 'Quản lý bài viết' }]} />
      </div>

      <Card
        title={
          <span className="text-base md:text-lg">Danh sách bài viết</span>
        }
        subtitle={
          <span className="text-xs md:text-sm">
            Tổng {groupedPosts.length} chiến dịch ({posts.length} bài đăng)
          </span>
        }
        actions={
          <Button
            icon={<Plus size={18} className="md:block hidden" />}
            onClick={() => navigate('/posts/create')}
            className="text-xs md:text-sm px-3 md:px-4 py-2"
          >
            <span className="hidden sm:inline">Tạo bài viết</span>
            <span className="sm:hidden">Tạo</span>
          </Button>
        }
      >
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {Object.entries(POST_STATUS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số trang</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((group) => (
                <tr
                  key={group.id}
                  className="hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/posts/${group.id}`)}
                >
                  <td className="px-4 py-4">
                    <div className="text-sm font-bold text-blue-600">#{group.id}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2 max-w-md">
                      {group.content}
                    </div>
                    {group.post_media && group.post_media.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <ImageIcon size={12} />
                        <span>{group.post_media.length} hình ảnh</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">{getStatusBadge(group.status)}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      {group.pages.slice(0, 3).map((page, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                            {page.platform?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs text-gray-700 truncate max-w-[150px]">
                            {page.name || 'Unknown'}
                          </span>
                        </div>
                      ))}
                      {group.pages.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium pl-8">
                          +{group.pages.length - 3} trang khác
                        </div>
                      )}
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        📊 Tổng: {group.pages.length} trang
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {group.scheduled_at ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(group.scheduled_at)}</span>
                        <span className="text-xs text-yellow-600">⏱ Lên lịch</span>
                      </div>
                    ) : group.published_at ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(group.published_at)}</span>
                        <span className="text-xs text-green-600">✓ Đã đăng</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(group.created_at)}</span>
                        <span className="text-xs text-gray-400">📝 Nháp</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={16} />}
                        onClick={() => navigate(`/posts/${group.id}`)}
                        title="Xem"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => navigate(`/posts/${group.id}/edit`)}
                        title="Sửa"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteCampaign(group)}
                        title="Xóa"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-3 md:space-y-4">
          {filteredPosts.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-500 cursor-pointer transition-all"
              onClick={() => navigate(`/posts/${group.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs md:text-sm font-bold text-blue-600">#{group.id}</span>
                    {getStatusBadge(group.status)}
                  </div>
                  <p className="text-sm md:text-base font-medium text-gray-900 line-clamp-2">
                    {group.content}
                  </p>
                  {group.post_media && group.post_media.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <ImageIcon size={12} />
                      <span>{group.post_media.length} hình ảnh</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pages */}
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  📊 {group.pages.length} trang
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.pages.slice(0, 3).map((page, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                        {page.platform?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs text-gray-700 truncate max-w-[100px]">
                        {page.name || 'Unknown'}
                      </span>
                    </div>
                  ))}
                  {group.pages.length > 3 && (
                    <span className="text-xs text-blue-600 font-medium px-2 py-1">
                      +{group.pages.length - 3} khác
                    </span>
                  )}
                </div>
              </div>

              {/* Time & Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-xs md:text-sm text-gray-600">
                  {group.scheduled_at ? (
                    <div>
                      <div className="font-medium">{formatDate(group.scheduled_at)}</div>
                      <div className="text-xs text-yellow-600">⏱ Lên lịch</div>
                    </div>
                  ) : group.published_at ? (
                    <div>
                      <div className="font-medium">{formatDate(group.published_at)}</div>
                      <div className="text-xs text-green-600">✓ Đã đăng</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{formatDate(group.created_at)}</div>
                      <div className="text-xs text-gray-400">📝 Nháp</div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Eye size={16} />}
                    onClick={() => navigate(`/posts/${group.id}`)}
                    className="p-2"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit size={16} />}
                    onClick={() => navigate(`/posts/${group.id}/edit`)}
                    className="p-2"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDeleteCampaign(group)}
                    className="p-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm md:text-base text-gray-500">Không có bài viết nào</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 md:mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default PostListPage;