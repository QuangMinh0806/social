import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, MessageSquare, Hash, Droplet, Image, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { templateService } from '../../services/template.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';

const TemplateCreatePageNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('caption'); // caption, hashtag, watermark, image_frame, video_frame

  // Get type from URL query params
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && ['caption', 'hashtag', 'watermark', 'image_frame', 'video_frame'].includes(typeParam)) {
      setActiveTab(typeParam);
      setFormData(prev => ({
        ...prev,
        template_type: typeParam
      }));
    }
  }, [searchParams]);

  // Form data cho từng loại
  const [formData, setFormData] = useState({
    template_type: 'caption',
    name: '',
    category: '',
    
    // Caption fields
    caption: '',
    
    // Hashtag fields  
    hashtags: [],
    
    // Watermark fields
    watermark_position: 'bottom-right',
    watermark_opacity: 0.8,
    watermark_image_url: '',
    
    // Frame fields
    frame_type: '',
    aspect_ratio: '',
    frame_image_url: '',
    
    created_by: 1,
  });

  const tabs = [
    { id: 'caption', label: 'Caption', icon: <MessageSquare size={18} />, color: 'blue' },
    { id: 'hashtag', label: 'Hashtag', icon: <Hash size={18} />, color: 'green' },
    { id: 'watermark', label: 'Watermark', icon: <Droplet size={18} />, color: 'purple' },
    { id: 'image_frame', label: 'Khung Ảnh', icon: <Image size={18} />, color: 'orange' },
    { id: 'video_frame', label: 'Khung Video', icon: <Video size={18} />, color: 'red' },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setFormData(prev => ({
      ...prev,
      template_type: tabId
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Vui lòng chọn file ảnh (PNG, JPG, JPEG, WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    // Read file and convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
      toast.success(`Đã chọn ảnh: ${file.name}`);
    };
    reader.onerror = () => {
      toast.error('Lỗi khi đọc file ảnh');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên template');
      return;
    }

    // Validation for image_frame and video_frame
    if (activeTab === 'image_frame' || activeTab === 'video_frame') {
      if (!formData.category) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }
      if (!formData.aspect_ratio) {
        toast.error('Vui lòng chọn aspect ratio');
        return;
      }
      if (!formData.frame_image_url) {
        toast.error('Vui lòng upload ảnh làm khung');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Prepare data based on template type
      const submitData = {
        ...formData,
        template_type: activeTab,
      };

      // Process hashtags field - convert string to array
      if (activeTab === 'hashtag' && formData.hashtags) {
        if (typeof formData.hashtags === 'string') {
          // Split by spaces or commas and filter empty strings
          submitData.hashtags = formData.hashtags
            .split(/[\s,]+/)
            .filter(tag => tag.trim())
            .map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`);
        }
      } else {
        // For non-hashtag types, set hashtags to null or empty array
        submitData.hashtags = activeTab === 'hashtag' ? [] : null;
      }

      // Clean up unused fields based on template type
      if (activeTab !== 'caption') {
        delete submitData.caption;
      }
      if (activeTab !== 'watermark') {
        delete submitData.watermark_position;
        delete submitData.watermark_opacity;
        delete submitData.watermark_image_url;
      }
      if (activeTab !== 'image_frame' && activeTab !== 'video_frame') {
        delete submitData.frame_type;
        delete submitData.aspect_ratio;
        delete submitData.frame_image_url;
      }

      await templateService.create(submitData);
      toast.success('Tạo template thành công');
      navigate('/templates');
    } catch (error) {
      toast.error('Không thể tạo template');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'caption':
      case 'hashtag':
        return (
          <div className="space-y-4">
            <Input
              label="Tên template *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên template"
              required
            />
            <Input
              label="Danh mục"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Ví dụ: Marketing, Sự kiện"
            />
            <Textarea
              label="Nội dung"
              name={activeTab === 'caption' ? 'caption' : 'hashtags'}
              value={activeTab === 'caption' ? formData.caption : (Array.isArray(formData.hashtags) ? formData.hashtags.join(' ') : formData.hashtags || '')}
              onChange={handleChange}
              placeholder={activeTab === 'caption' 
                ? 'Nhập nội dung caption...'
                : 'Nhập hashtags cách nhau bởi dấu cách (ví dụ: #marketing #sale #2024)'}
              rows={8}
            />
          </div>
        );

      case 'watermark':
        return (
          <div className="space-y-4">
            <Input
              label="Tên template *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên template"
              required
            />
            <Input
              label="Danh mục"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Ví dụ: Logo công ty"
            />
            <Select
              label="Vị trí"
              name="watermark_position"
              value={formData.watermark_position}
              onChange={handleChange}
              options={[
                { value: 'top-left', label: 'Góc trên trái' },
                { value: 'top-right', label: 'Góc trên phải' },
                { value: 'bottom-left', label: 'Góc dưới trái' },
                { value: 'bottom-right', label: 'Góc dưới phải' },
                { value: 'center', label: 'Giữa' }
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Độ trong suốt: {formData.watermark_opacity}
              </label>
              <input
                type="range"
                name="watermark_opacity"
                min="0"
                max="1"
                step="0.1"
                value={formData.watermark_opacity}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload hình watermark *
              </label>
              {!formData.watermark_image_url ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleFileUpload(e, 'watermark_image_url')}
                    className="hidden"
                    id="watermark-upload"
                  />
                  <label htmlFor="watermark-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-10 w-10" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Click để chọn ảnh watermark</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, WEBP • Tối đa 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img 
                      src={formData.watermark_image_url} 
                      alt="Watermark Preview" 
                      className="max-w-xs mx-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, watermark_image_url: '' }))}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                      title="Xóa ảnh"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => handleFileUpload(e, 'watermark_image_url')}
                      className="hidden"
                      id="watermark-upload-change"
                    />
                    <label 
                      htmlFor="watermark-upload-change"
                      className="cursor-pointer px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Thay đổi ảnh
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'image_frame':
        return (
          <div className="space-y-4">
            <Input
              label="Tên template *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên template"
              required
            />
            <Select
              label="Danh mục *"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="-- Chọn danh mục --"
              required
              options={[
                { value: 'Sản phẩm', label: 'Sản phẩm' },
                { value: 'Dịch vụ', label: 'Dịch vụ' },
                { value: 'Khuyến mãi', label: 'Khuyến mãi' },
                { value: 'Sự kiện', label: 'Sự kiện' },
                { value: 'Thời trang', label: 'Thời trang' },
                { value: 'Ẩm thực', label: 'Ẩm thực' },
                { value: 'Du lịch', label: 'Du lịch' },
                { value: 'Công nghệ', label: 'Công nghệ' }
              ]}
            />
            <Select
              label="Aspect Ratio *"
              name="aspect_ratio"
              value={formData.aspect_ratio}
              onChange={handleChange}
              placeholder="-- Chọn tỷ lệ khung hình --"
              required
              options={[
                { value: '1:1', label: 'Vuông (1:1)' },
                { value: '9:16', label: 'Dọc (9:16)' },
                { value: '16:9', label: 'Ngang (16:9)' },
                { value: '4:5', label: '4:5' }
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ảnh làm khung *
              </label>
              {!formData.frame_image_url ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleFileUpload(e, 'frame_image_url')}
                    className="hidden"
                    id="frame-upload-image"
                  />
                  <label htmlFor="frame-upload-image" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Click để chọn ảnh từ máy tính</p>
                    <p className="text-xs text-gray-500 mt-2">Hỗ trợ: PNG, JPG, JPEG, WEBP</p>
                    <p className="text-xs text-gray-500">Kích thước tối đa: 5MB</p>
                    <p className="text-xs text-gray-500 mt-1">Khuyến nghị: PNG với nền trong suốt</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img 
                      src={formData.frame_image_url} 
                      alt="Frame Preview" 
                      className="max-w-md mx-auto rounded border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, frame_image_url: '' }))}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                      title="Xóa ảnh"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => handleFileUpload(e, 'frame_image_url')}
                      className="hidden"
                      id="frame-upload-image-change"
                    />
                    <label 
                      htmlFor="frame-upload-image-change"
                      className="cursor-pointer px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Thay đổi ảnh
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                💡 Lưu ý khi tạo khung ảnh:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Sử dụng file PNG với nền trong suốt để có hiệu quả tốt nhất</li>
                <li>Đảm bảo kích thước ảnh phù hợp với tỷ lệ khung hình đã chọn</li>
                <li>Vùng nội dung chính nên để trống ở giữa để chèn ảnh/video</li>
              </ul>
            </div>
          </div>
        );

      case 'video_frame':
        return (
          <div className="space-y-4">
            <Input
              label="Tên template *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập tên template"
              required
            />
            <Select
              label="Danh mục *"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="-- Chọn danh mục --"
              required
              options={[
                { value: 'Sản phẩm', label: 'Sản phẩm' },
                { value: 'Dịch vụ', label: 'Dịch vụ' },
                { value: 'Khuyến mãi', label: 'Khuyến mãi' },
                { value: 'Sự kiện', label: 'Sự kiện' },
                { value: 'Thời trang', label: 'Thời trang' },
                { value: 'Ẩm thực', label: 'Ẩm thực' },
                { value: 'Du lịch', label: 'Du lịch' },
                { value: 'Công nghệ', label: 'Công nghệ' }
              ]}
            />
            <Select
              label="Aspect Ratio *"
              name="aspect_ratio"
              value={formData.aspect_ratio}
              onChange={handleChange}
              placeholder="-- Chọn tỷ lệ khung hình --"
              required
              options={[
                { value: '1:1', label: 'Vuông (1:1)' },
                { value: '9:16', label: 'Dọc (9:16)' },
                { value: '16:9', label: 'Ngang (16:9)' },
                { value: '4:5', label: '4:5' }
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ảnh làm khung video *
              </label>
              {!formData.frame_image_url ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleFileUpload(e, 'frame_image_url')}
                    className="hidden"
                    id="frame-upload-video"
                  />
                  <label htmlFor="frame-upload-video" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Click để chọn ảnh từ máy tính</p>
                    <p className="text-xs text-gray-500 mt-2">Hỗ trợ: PNG, JPG, JPEG, WEBP</p>
                    <p className="text-xs text-gray-500">Kích thước tối đa: 5MB</p>
                    <p className="text-xs text-gray-500 mt-1">Khuyến nghị: PNG với nền trong suốt</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img 
                      src={formData.frame_image_url} 
                      alt="Frame Preview" 
                      className="max-w-md mx-auto rounded border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, frame_image_url: '' }))}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors"
                      title="Xóa ảnh"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => handleFileUpload(e, 'frame_image_url')}
                      className="hidden"
                      id="frame-upload-video-change"
                    />
                    <label 
                      htmlFor="frame-upload-video-change"
                      className="cursor-pointer px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Thay đổi ảnh
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                💡 Lưu ý khi tạo khung video:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Sử dụng file PNG với nền trong suốt để có hiệu quả tốt nhất</li>
                <li>Đảm bảo kích thước ảnh phù hợp với tỷ lệ khung hình đã chọn</li>
                <li>Vùng video chính nên để trống ở giữa để chèn video</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Templates & Watermarks', path: '/templates' },
          { label: 'Tạo template mới' }
        ]}
      />

      {/* Tabs */}
      <Card>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-${tab.color}-600 text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Form */}
      <Card
        title={`Tạo ${tabs.find(t => t.id === activeTab)?.label} Template`}
        subtitle={`Điền thông tin cho ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} template`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderForm()}

          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={20} />}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu template'}
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={<ArrowLeft size={20} />}
              onClick={() => navigate('/templates')}
              disabled={loading}
            >
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TemplateCreatePageNew;
