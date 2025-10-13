import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, statusFilter]);

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
      
      setPosts(response.data);
      setTotalPages(Math.ceil((response.total || 100) / 20));
    } catch (error) {
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
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
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Quản lý bài viết' }]} />

      <Card
        title="Danh sách bài viết"
        subtitle={`Tổng ${posts.length} bài viết`}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nền tảng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2">
                      {post.content}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(post.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {post.page?.platform?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {post.scheduled_at ? formatDate(post.scheduled_at) : 'Ngay lập tức'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={16} />}
                        onClick={() => navigate(`/posts/${post.id}`)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => navigate(`/posts/${post.id}/edit`)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete(post.id)}
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
};

export default PostListPage;
