import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
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
import { usePaginatedFetch } from '../../hooks/useFetch';

const PostListPage = React.memo(() => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        skip: (currentPage - 1) * 20,
        limit: 100, // Lấy nhiều hơn để group
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
  }, [currentPage, statusFilter]);

  // Memoized grouped posts calculation
  const groupedPosts = useMemo(() => {
    if (!posts?.length) return [];

    const groups = {};
    
    posts.forEach(post => {
      // Create a key based on content and approximate time
      const contentKey = post.content.substring(0, 100); // First 100 chars
      const timeKey = new Date(post.created_at).toISOString().substring(0, 16); // Group by minute
      const key = `${contentKey}_${timeKey}`;
      
      if (!groups[key]) {
        groups[key] = {
          id: post.id, // Use first post ID as group ID
          content: post.content,
          created_at: post.created_at,
          scheduled_at: post.scheduled_at,
          published_at: post.published_at,
          post_media: post.post_media,
          posts: [], // Array of posts in this group
          pages: [], // Array of pages
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
    
    // Convert to array and sort by created_at
    return Object.values(groups).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }, [posts]);

  // Memoized filtered posts
  const filteredPosts = useMemo(() => {
    if (!searchTerm) return groupedPosts;
    
    return groupedPosts.filter(group =>
      group.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.pages.some(page => 
        page.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.platform?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [groupedPosts, searchTerm]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    
    try {
      await postService.delete(id);
      toast.success('Xóa bài viết thành công');
      fetchPosts();
    } catch (error) {
      toast.error('Không thể xóa bài viết');
    }
  }, [fetchPosts]);

  const getStatusBadge = useCallback((status) => {
    const variants = {
      draft: 'default',
      scheduled: 'warning',
      published: 'success',
      failed: 'danger',
      archived: 'default',
    };
    return <Badge variant={variants[status]}>{POST_STATUS[status]}</Badge>;
  }, []);
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    
    try {
      await postService.delete(id);
      toast.success('Xóa bài viết thành công');
      fetchPosts();
    } catch (error) {
      toast.error('Không thể xóa bài viết');
    }
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
  }, []);

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Quản lý bài viết' }]} />

      <Card
        title="Danh sách bài viết"
        subtitle={`Tổng ${groupedPosts.length} chiến dịch (${posts.length} bài đăng)`}
        actions={
          <Button
            icon={<Plus size={20} />}
            onClick={() => navigate('/posts/create')}
          >
            Tạo bài viết
          </Button>
        }
      >
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(POST_STATUS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số trang đăng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((group) => (
                <tr 
                  key={group.id} 
                  className="hover:bg-blue-50 cursor-pointer transition-colors" 
                  onClick={() => navigate(`/posts/${group.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-blue-600">
                      #{group.id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    {getStatusBadge(group.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {/* Hiển thị tối đa 3 pages */}
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
                      {/* Hiển thị số lượng còn lại */}
                      {group.pages.length > 3 && (
                        <div className="text-xs text-blue-600 font-medium pl-8">
                          +{group.pages.length - 3} trang khác
                        </div>
                      )}
                      {/* Tổng số */}
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        📊 Tổng: {group.pages.length} trang
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {group.scheduled_at ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{formatDate(group.scheduled_at)}</span>
                        <span className="text-xs text-yellow-600">⏱ Đã lên lịch</span>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={16} />}
                        onClick={() => navigate(`/posts/${group.id}`)}
                        title="Xem chi tiết"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => navigate(`/posts/${group.id}/edit`)}
                        title="Chỉnh sửa"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn xóa chiến dịch này? (${group.pages.length} bài đăng sẽ bị xóa)`)) {
                            // Delete all posts in group
                            Promise.all(group.posts.map(p => postService.delete(p.id)))
                              .then(() => {
                                toast.success('Đã xóa chiến dịch thành công');
                                fetchPosts();
                              })
                              .catch(() => toast.error('Không thể xóa chiến dịch'));
                          }
                        }}
                        title="Xóa chiến dịch"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không có bài viết nào</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
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
});

export default PostListPage;
