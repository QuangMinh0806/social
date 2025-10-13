import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Hash, MessageSquare, Droplet, Image, Video, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { templateService } from '../../services/template.service';
import { watermarkService } from '../../services/watermark.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';

const TemplateCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [watermarks, setWatermarks] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    
    // Caption
    caption: '',
    
    // Hashtags
    hashtags: [],
    
    // Watermark
    watermark_id: null,
    watermark_enabled: false,
    
    // Image Frame
    image_frame_url: '',
    image_frame_enabled: false,
    
    // Video Frame
    video_frame_url: '',
    video_frame_enabled: false,
    
    // Legacy
    content_template: '',
    thumbnail_url: '',
    is_public: false,
    created_by: 1, // TODO: Get from auth context
  });

  useEffect(() => {
    fetchWatermarks();
  }, []);

  const fetchWatermarks = async () => {
    try {
      const response = await watermarkService.getAll();
      if (response.success) {
        setWatermarks(response.data);
      }
    } catch (error) {
      console.error('Error fetching watermarks:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addHashtag = () => {
    if (hashtagInput.trim()) {
      const tag = hashtagInput.trim().replace(/^#/, '');
      if (!formData.hashtags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          hashtags: [...prev.hashtags, tag]
        }));
      }
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleHashtagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên mẫu');
      return;
    }

    try {
      setLoading(true);
      await templateService.create(formData);
      toast.success('Tạo mẫu thành công');
      navigate('/templates');
    } catch (error) {
      toast.error('Không thể tạo mẫu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Mẫu nội dung', path: '/templates' },
          { label: 'Tạo mẫu mới' }
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card
          title="Thông tin cơ bản"
          subtitle="Tên và mô tả cho mẫu của bạn"
        >
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
        </Card>

        {/* Caption Section */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={20} />
              <span>Caption - Nội dung bài viết</span>
            </div>
          }
          subtitle="Viết nội dung cho bài đăng của bạn"
        >
          <Textarea
            label="Caption"
            name="caption"
            value={formData.caption}
            onChange={handleChange}
            placeholder="Nhập nội dung caption cho bài viết. Có thể sử dụng biến như {product_name}, {price}..."
            rows={6}
          />
          <p className="mt-2 text-sm text-gray-500">
            💡 Gợi ý: Sử dụng biến trong dấu ngoặc nhọn như {'{'}product_name{'}'}, {'{'}price{'}'} để tạo caption linh hoạt
          </p>
        </Card>

        {/* Hashtags Section */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Hash className="text-purple-600" size={20} />
              <span>Hashtags</span>
            </div>
          }
          subtitle="Thêm các hashtag cho bài đăng"
        >
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                label="Thêm hashtag"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={handleHashtagKeyPress}
                placeholder="Nhập hashtag (không cần dấu #)"
              />
              <Button
                type="button"
                variant="primary"
                icon={<Plus size={18} />}
                onClick={addHashtag}
                className="mt-6"
              >
                Thêm
              </Button>
            </div>

            {formData.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="hover:text-purple-900"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {formData.hashtags.length === 0 && (
              <p className="text-sm text-gray-400 italic">Chưa có hashtag nào</p>
            )}
          </div>
        </Card>

        {/* Watermark Section */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Droplet className="text-cyan-600" size={20} />
              <span>Watermark - Logo đóng dấu</span>
            </div>
          }
          subtitle="Chọn watermark để đóng dấu lên hình ảnh/video"
        >
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="watermark_enabled"
                checked={formData.watermark_enabled}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">
                Bật watermark cho mẫu này
              </span>
            </label>

            {formData.watermark_enabled && (
              <Select
                label="Chọn watermark"
                name="watermark_id"
                value={formData.watermark_id || ''}
                onChange={handleChange}
              >
                <option value="">-- Chọn watermark --</option>
                {watermarks.map((wm) => (
                  <option key={wm.id} value={wm.id}>
                    {wm.name} ({wm.position})
                  </option>
                ))}
              </Select>
            )}
          </div>
        </Card>

        {/* Image Frame Section */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Image className="text-green-600" size={20} />
              <span>Khung ảnh - Image Frame</span>
            </div>
          }
          subtitle="Thêm khung trang trí cho hình ảnh"
        >
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="image_frame_enabled"
                checked={formData.image_frame_enabled}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">
                Bật khung ảnh cho mẫu này
              </span>
            </label>

            {formData.image_frame_enabled && (
              <Input
                label="URL khung ảnh"
                name="image_frame_url"
                value={formData.image_frame_url}
                onChange={handleChange}
                placeholder="https://example.com/image-frame.png"
              />
            )}
          </div>
        </Card>

        {/* Video Frame Section */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Video className="text-red-600" size={20} />
              <span>Khung video - Video Frame</span>
            </div>
          }
          subtitle="Thêm khung trang trí cho video"
        >
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="video_frame_enabled"
                checked={formData.video_frame_enabled}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">
                Bật khung video cho mẫu này
              </span>
            </label>

            {formData.video_frame_enabled && (
              <Input
                label="URL khung video"
                name="video_frame_url"
                value={formData.video_frame_url}
                onChange={handleChange}
                placeholder="https://example.com/video-frame.png"
              />
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={20} />}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu mẫu'}
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={<ArrowLeft size={20} />}
              onClick={() => navigate('/templates')}
              disabled={loading}
            >
              Hủy và quay lại
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default TemplateCreatePage;
