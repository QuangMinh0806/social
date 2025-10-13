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
    <div>
      <Breadcrumb items={[
        { label: 'Quản lý bài viết', href: '/posts' },
        { label: 'Chỉnh sửa bài viết' },
      ]} />

      <form onSubmit={handleSubmit}>
        <Card title="Chỉnh sửa bài viết">
          <div className="space-y-4">
            <Select
              label="Chọn trang/nhóm"
              options={pages}
              value={formData.page_id}
              onChange={(e) => setFormData({ ...formData, page_id: e.target.value })}
              required
            />

            <Textarea
              label="Nội dung bài viết"
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Nhập nội dung bài viết..."
              required
            />

            <Input
              type="datetime-local"
              label="Thời gian đăng"
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
            />

            <Select
              label="Loại bài viết"
              options={[
                { value: 'text', label: 'Văn bản' },
                { value: 'image', label: 'Hình ảnh' },
                { value: 'video', label: 'Video' },
                { value: 'link', label: 'Liên kết' },
              ]}
              value={formData.post_type}
              onChange={(e) => setFormData({ ...formData, post_type: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/posts')}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              loading={saving}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default PostEditPage;
