import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, MessageSquare, Hash, Droplet, Image, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { templateService } from '../../services/template.service';
import { mediaService } from '../../services/media.service';
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
  const [activeTab, setActiveTab] = useState('caption');

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && ['caption', 'hashtag', 'watermark', 'image_frame', 'video_frame'].includes(typeParam)) {
      setActiveTab(typeParam);
      setFormData(prev => ({ ...prev, template_type: typeParam }));
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    template_type: 'caption',
    name: '',
    category: '',
    caption: '',
    hashtags: [],
    watermark_position: 'bottom-right',
    watermark_opacity: 0.8,
    watermark_image_url: '',
    frame_type: '',
    aspect_ratio: '',
    frame_image_url: '',
    created_by: 1,
  });

  const tabs = [
    { id: 'caption', label: 'Caption', icon: <MessageSquare size={16} />, color: 'blue' },
    { id: 'hashtag', label: 'Hashtag', icon: <Hash size={16} />, color: 'green' },
    { id: 'watermark', label: 'Watermark', icon: <Droplet size={16} />, color: 'purple' },
    { id: 'image_frame', label: 'Khung Ảnh', icon: <Image size={16} />, color: 'orange' },
    { id: 'video_frame', label: 'Khung Video', icon: <Video size={16} />, color: 'red' },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setFormData(prev => ({ ...prev, template_type: tabId }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Vui lòng chọn file ảnh (PNG, JPG, JPEG, WEBP)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [`${fieldName}_preview`]: reader.result,
        [`${fieldName}_file`]: file
      }));
    };
    reader.readAsDataURL(file);
    toast.success(`Đã chọn ảnh: ${file.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên template');
      return;
    }

    if (activeTab === 'image_frame' || activeTab === 'video_frame') {
      if (!formData.category) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }
      if (!formData.aspect_ratio) {
        toast.error('Vui lòng chọn aspect ratio');
        return;
      }
      if (!formData.frame_image_url_file) {
        toast.error('Vui lòng upload ảnh làm khung');
        return;
      }
    }

    if (activeTab === 'watermark') {
      if (!formData.category) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }
      if (!formData.watermark_image_url_file) {
        toast.error('Vui lòng upload ảnh watermark');
        return;
      }
    }

    if (activeTab === 'caption' || activeTab === 'hashtag') {
      if (!formData.category) {
        toast.error('Vui lòng chọn danh mục');
        return;
      }
    }

    try {
      setLoading(true);
      const submitData = { ...formData, template_type: activeTab };

      if (formData.frame_image_url_file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.frame_image_url_file);
        uploadFormData.append('user_id', formData.created_by);
        uploadFormData.append('tags', `template,frame,${activeTab}`);

        try {
          const uploadResponse = await mediaService.upload(uploadFormData);
          if (uploadResponse.success && uploadResponse.data) {
            submitData.frame_image_url = uploadResponse.data.file_url;
          } else {
            throw new Error('Upload frame image failed');
          }
        } catch (uploadError) {
          toast.error('Không thể upload ảnh khung');
          setLoading(false);
          return;
        }
      }

      if (formData.watermark_image_url_file) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.watermark_image_url_file);
        uploadFormData.append('user_id', formData.created_by);
        uploadFormData.append('tags', 'template,watermark');

        try {
          const uploadResponse = await mediaService.upload(uploadFormData);
          if (uploadResponse.success && uploadResponse.data) {
            submitData.watermark_image_url = uploadResponse.data.file_url;
          } else {
            throw new Error('Upload watermark image failed');
          }
        } catch (uploadError) {
          toast.error('Không thể upload ảnh watermark');
          setLoading(false);
          return;
        }
      }

      delete submitData.frame_image_url_preview;
      delete submitData.frame_image_url_file;
      delete submitData.watermark_image_url_preview;
      delete submitData.watermark_image_url_file;

      if (activeTab === 'hashtag' && formData.hashtags) {
        if (typeof formData.hashtags === 'string') {
          submitData.hashtags = formData.hashtags
            .split(/[\s,]+/)
            .filter(tag => tag.trim())
            .map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`);
        }
      } else {
        submitData.hashtags = activeTab === 'hashtag' ? [] : null;
      }

      if (activeTab !== 'caption') delete submitData.caption;
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
            <Textarea
              label="Nội dung"
              name={activeTab === 'caption' ? 'caption' : 'hashtags'}
              value={activeTab === 'caption' ? formData.caption : (Array.isArray(formData.hashtags) ? formData.hashtags.join(' ') : formData.hashtags || '')}
              onChange={handleChange}
              placeholder={activeTab === 'caption' 
                ? 'Nhập nội dung caption...'
                : 'Nhập hashtags cách nhau bởi dấu cách'}
              rows={6}
              className="text-sm md:text-base"
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
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Upload hình watermark *
              </label>
              {!formData.watermark_image_url_preview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleFileUpload(e, 'watermark_image_url')}
                    className="hidden"
                    id="watermark-upload"
                  />
                  <label htmlFor="watermark-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-8 w-8 md:h-10 md:w-10" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">Click để chọn ảnh</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG • Max 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative border-2 border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50">
                    <img 
                      src={formData.watermark_image_url_preview} 
                      alt="Preview" 
                      className="max-w-full md:max-w-xs mx-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, watermark_image_url_preview: '', watermark_image_url_file: null }))}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 md:p-2 shadow-lg"
                    >
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => handleFileUpload(e, 'watermark_image_url')}
                      className="hidden"
                      id="watermark-upload-change"
                    />
                    <label 
                      htmlFor="watermark-upload-change"
                      className="cursor-pointer px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm rounded-lg"
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
              placeholder="-- Chọn tỷ lệ --"
              required
              options={[
                { value: '1:1', label: 'Vuông (1:1)' },
                { value: '9:16', label: 'Dọc (9:16)' },
                { value: '16:9', label: 'Ngang (16:9)' },
                { value: '4:5', label: '4:5' }
              ]}
            />
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Upload ảnh làm khung *
              </label>
              {!formData.frame_image_url_preview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => handleFileUpload(e, 'frame_image_url')}
                    className="hidden"
                    id="frame-upload"
                  />
                  <label htmlFor="frame-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-8 w-8 md:h-12 md:w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">Click để chọn ảnh</p>
                    <p className="text-xs text-gray-500 mt-1 md:mt-2">PNG, JPG • Max 5MB</p>
                    <p className="text-xs text-gray-500 hidden md:block">PNG với nền trong suốt</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative border-2 border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50">
                    <img 
                      src={formData.frame_image_url_preview} 
                      alt="Preview" 
                      className="max-w-full md:max-w-md mx-auto rounded border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, frame_image_url_preview: '', frame_image_url_file: null }))}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 md:p-2 shadow-lg"
                    >
                      <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => handleFileUpload(e, 'frame_image_url')}
                      className="hidden"
                      id="frame-upload-change"
                    />
                    <label 
                      htmlFor="frame-upload-change"
                      className="cursor-pointer px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm rounded-lg"
                    >
                      Thay đổi ảnh
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <p className="text-xs md:text-sm font-semibold text-blue-800 mb-2">💡 Lưu ý:</p>
              <ul className="text-xs md:text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>PNG với nền trong suốt</li>
                <li>Vùng nội dung để trống ở giữa</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Breadcrumb - Hide on mobile */}
      <div className="hidden md:block">
        <Breadcrumb
          items={[
            { label: 'Templates & Watermarks', path: '/templates' },
            { label: 'Tạo template mới' }
          ]}
        />
      </div>

      {/* Mobile Back Button */}
      <div className="md:hidden">
        <button
          onClick={() => navigate('/templates')}
          className="flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} className="mr-1" />
          Quay lại
        </button>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-${tab.color}-600 text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Form */}
      <Card
        title={
          <span className="text-base md:text-lg">
            Tạo {tabs.find(t => t.id === activeTab)?.label} Template
          </span>
        }
        subtitle={
          <span className="text-xs md:text-sm">
            Điền thông tin cho {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}
          </span>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {renderForm()}

          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 md:gap-4 pt-4 md:pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              icon={<ArrowLeft size={18} />}
              onClick={() => navigate('/templates')}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={18} />}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Đang lưu...' : 'Lưu template'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TemplateCreatePageNew;