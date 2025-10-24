import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { postService } from '../../services/post.service';
import { pageService } from '../../services/page.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Loading from '../../components/common/Loading';
import Breadcrumb from '../../components/layout/Breadcrumb';

const PostEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState([]);
  const [formData, setFormData] = useState({
    page_id: '',
    content: '',
    scheduled_time: '',
    post_type: 'text',
  });

  useEffect(() => {
    fetchPost();
    fetchPages();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await postService.getById(id);
      const post = response.data;
      setFormData({
        page_id: post.page_id,
        content: post.content,
        scheduled_time: post.scheduled_time?.slice(0, 16) || '',
        post_type: post.post_type,
      });
    } catch (error) {
      toast.error('Không thể tải thông tin bài viết');
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await pageService.getAll();
      setPages(response.data.map(page => ({
        value: page.id,
        label: `${page.name} (${page.platform.name})`,
      })));
    } catch (error) {
      toast.error('Không thể tải danh sách trang');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.page_id || !formData.content) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSaving(true);
      await postService.update(id, formData);
      toast.success('Cập nhật bài viết thành công');
      navigate('/posts');
    } catch (error) {
      toast.error('Không thể cập nhật bài viết');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Mobile: Hide breadcrumb or make it compact */}
      <div className="hidden md:block mb-4">
        <Breadcrumb items={[
          { label: 'Quản lý bài viết', href: '/posts' },
          { label: 'Chỉnh sửa bài viết' },
        ]} />
      </div>

      {/* Mobile breadcrumb - simplified */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => navigate('/posts')}
          className="flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title={
          <span className="text-base md:text-lg">Chỉnh sửa bài viết</span>
        }>
          <div className="space-y-4">
            {/* Page Selection */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Chọn trang/nhóm
              </label>
              <Select
                options={pages}
                value={formData.page_id}
                onChange={(e) => setFormData({ ...formData, page_id: e.target.value })}
                required
                className="text-sm md:text-base"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Nội dung bài viết
              </label>
              <Textarea
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Nhập nội dung bài viết..."
                required
                className="resize-y min-h-[150px] max-h-[500px] text-sm md:text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Kéo góc dưới bên phải để mở rộng ô nhập liệu
              </p>
            </div>

            {/* Scheduled Time */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Thời gian đăng (Tùy chọn)
              </label>
              <Input
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="text-sm md:text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu muốn đăng ngay
              </p>
            </div>

            {/* Post Type */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Loại bài viết
              </label>
              <Select
                options={[
                  { value: 'text', label: 'Văn bản' },
                  { value: 'image', label: 'Hình ảnh' },
                  { value: 'video', label: 'Video' },
                  { value: 'link', label: 'Liên kết' },
                ]}
                value={formData.post_type}
                onChange={(e) => setFormData({ ...formData, post_type: e.target.value })}
                className="text-sm md:text-base"
              />
            </div>
          </div>

          {/* Action Buttons - Stacked on mobile, inline on desktop */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/posts')}
              className="w-full sm:w-auto text-sm md:text-base"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              loading={saving}
              className="w-full sm:w-auto text-sm md:text-base"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default PostEditPage;