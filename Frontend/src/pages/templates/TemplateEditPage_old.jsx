import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { templateService } from '../../services/template.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Loading from '../../components/common/Loading';

const TemplateEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    content_template: '',
    thumbnail_url: '',
    is_public: false,
  });

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await templateService.getById(id);
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        category: response.data.category || '',
        content_template: response.data.content_template || '',
        thumbnail_url: response.data.thumbnail_url || '',
        is_public: response.data.is_public || false,
      });
    } catch (error) {
      toast.error('Không thể tải thông tin mẫu');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên mẫu');
      return;
    }

    try {
      setSaving(true);
      await templateService.update(id, formData);
      toast.success('Cập nhật mẫu thành công');
      navigate('/templates');
    } catch (error) {
      toast.error('Không thể cập nhật mẫu');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Mẫu nội dung', path: '/templates' },
          { label: 'Chỉnh sửa mẫu' }
        ]}
      />

      <Card
        title="Chỉnh sửa mẫu"
        actions={
          <Button
            variant="outline"
            icon={<ArrowLeft size={20} />}
            onClick={() => navigate('/templates')}
          >
            Quay lại
          </Button>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Tên mẫu *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên mẫu"
                required
              />
            </div>

            <Input
              label="Danh mục"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Ví dụ: Marketing, Sự kiện, Khuyến mãi"
            />

            <Input
              label="URL Thumbnail"
              name="thumbnail_url"
              value={formData.thumbnail_url}
              onChange={handleChange}
              placeholder="https://example.com/thumbnail.jpg"
            />

            <div className="md:col-span-2">
              <Textarea
                label="Mô tả"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả về mẫu này"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Nội dung mẫu"
                name="content_template"
                value={formData.content_template}
                onChange={handleChange}
                placeholder="Nhập nội dung mẫu. Có thể sử dụng biến như {product_name}, {price}, {description}..."
                rows={8}
              />
              <p className="mt-2 text-sm text-gray-500">
                💡 Gợi ý: Sử dụng biến trong dấu ngoặc nhọn như {'{'}product_name{'}'}, {'{'}price{'}'} để tạo mẫu linh hoạt
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Công khai mẫu này cho tất cả người dùng
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={20} />}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/templates')}
              disabled={saving}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TemplateEditPage;
