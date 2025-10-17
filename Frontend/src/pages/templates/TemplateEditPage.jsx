import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import Loading from '../../components/common/Loading';

const TemplateEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [watermarks, setWatermarks] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [activeTab, setActiveTab] = useState('caption'); // caption, hashtag, watermark, image_frame, video_frame
  
  const [formData, setFormData] = useState({
    template_type: 'caption',
    name: '',
    description: '',
    category: '',
    
    // Caption
    caption: '',
    
    // Hashtags
    hashtags: [],
    
    // Watermark fields
    watermark_position: 'bottom-right',
    watermark_opacity: 0.8,
    watermark_image_url: '',
    
    // Frame fields
    frame_type: '',
    aspect_ratio: '',
    frame_image_url: '',
    
    // Legacy Watermark
    watermark_id: null,
    watermark_enabled: false,
    
    // Legacy Image Frame
    image_frame_url: '',
    image_frame_enabled: false,
    
    // Legacy Video Frame
    video_frame_url: '',
    video_frame_enabled: false,
    
    // Legacy
    content_template: '',
    thumbnail_url: '',
    is_public: false,
  });

  const tabs = [
    { id: 'caption', label: 'Caption', icon: <MessageSquare size={18} />, color: 'blue' },
    { id: 'hashtag', label: 'Hashtag', icon: <Hash size={18} />, color: 'green' },
    { id: 'watermark', label: 'Watermark', icon: <Droplet size={18} />, color: 'purple' },
    { id: 'image_frame', label: 'Khung Ảnh', icon: <Image size={18} />, color: 'orange' },
    { id: 'video_frame', label: 'Khung Video', icon: <Video size={18} />, color: 'red' },
  ];

  useEffect(() => {
    fetchTemplate();
    fetchWatermarks();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await templateService.getById(id);
      const data = response.data;
      
      // Set active tab based on template_type
      if (data.template_type) {
        setActiveTab(data.template_type);
      }
      
      setFormData({
        template_type: data.template_type || 'caption',
        name: data.name || '',
        description: data.description || '',
        category: data.category || '',
        
        // Caption
        caption: data.caption || '',
        
        // Hashtags
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        
        // Watermark fields
        watermark_position: data.watermark_position || 'bottom-right',
        watermark_opacity: data.watermark_opacity || 0.8,
        watermark_image_url: data.watermark_image_url || '',
        
        // Frame fields
        frame_type: data.frame_type || '',
        aspect_ratio: data.aspect_ratio || '',
        frame_image_url: data.frame_image_url || '',
        
        // Legacy fields
        watermark_id: data.watermark_id || null,
        watermark_enabled: data.watermark_enabled || false,
        image_frame_url: data.image_frame_url || '',
        image_frame_enabled: data.image_frame_enabled || false,
        video_frame_url: data.video_frame_url || '',
        video_frame_enabled: data.video_frame_enabled || false,
        content_template: data.content_template || '',
        thumbnail_url: data.thumbnail_url || '',
        is_public: data.is_public || false,
      });
    } catch (error) {
      toast.error('Không thể tải thông tin mẫu');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

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

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setFormData(prev => ({
      ...prev,
      template_type: tabId
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: Upload to server and get URL
    // For now, use FileReader for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
      toast.success('Upload thành công');
    };
    reader.readAsDataURL(file);
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

    if (!formData.category.trim()) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare data based on template type
      const submitData = {
        ...formData,
        template_type: activeTab,
      };

      // Process hashtags field - ensure it's an array
      if (activeTab === 'hashtag') {
        if (typeof formData.hashtags === 'string') {
          submitData.hashtags = formData.hashtags
            .split(/[\s,]+/)
            .filter(tag => tag.trim())
            .map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`);
        } else if (!Array.isArray(formData.hashtags)) {
          submitData.hashtags = [];
        }
      } else {
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

      await templateService.update(id, submitData);
      toast.success('Cập nhật mẫu thành công');
      navigate('/templates');
    } catch (error) {
      toast.error('Không thể cập nhật mẫu');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'caption':
        return (
          <div className="space-y-4">
            <Textarea
              label="Nội dung Caption"
              name="caption"
              value={formData.caption}
              onChange={handleChange}
              placeholder="Nhập nội dung caption..."
              rows={8}
            />
            <p className="text-sm text-gray-500">
              💡 Gợi ý: Sử dụng biến trong dấu ngoặc nhọn như {'{'}product_name{'}'}, {'{'}price{'}'} để tạo caption linh hoạt
            </p>
          </div>
        );

      case 'hashtag':
        return (
          <div className="space-y-4">
            <Textarea
              label="Nội dung Hashtags"
              name="hashtags"
              value={Array.isArray(formData.hashtags) ? formData.hashtags.join(' ') : formData.hashtags || ''}
              onChange={handleChange}
              placeholder="Nhập hashtags cách nhau bởi dấu cách (ví dụ: #marketing #sale #2024)"
              rows={8}
            />
            <p className="text-sm text-gray-500">
              💡 Gợi ý: Nhập các hashtag cách nhau bởi dấu cách, không cần dấu # (sẽ tự động thêm)
            </p>
            
            {formData.hashtags && Array.isArray(formData.hashtags) && formData.hashtags.length > 0 && (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-xs text-green-600 font-medium mb-2">Hashtags hiện tại:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'watermark':
        return (
          <div className="space-y-4">
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
                Hình watermark hiện tại
              </label>
              {formData.watermark_image_url && (
                <div className="mb-3">
                  <img 
                    src={formData.watermark_image_url} 
                    alt="Current Watermark" 
                    className="max-w-xs rounded border shadow-sm"
                  />
                </div>
              )}
              <p className="text-sm text-gray-500 mb-2">
                💡 Lưu ý: Hiện tại chức năng upload ảnh mới chưa được hỗ trợ trong trang chỉnh sửa
              </p>
            </div>
          </div>
        );

      case 'image_frame':
      case 'video_frame':
        return (
          <div className="space-y-4">
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
                Ảnh khung hiện tại
              </label>
              {formData.frame_image_url && (
                <div className="mb-3 border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img 
                    src={formData.frame_image_url} 
                    alt="Current Frame" 
                    className="max-w-md mx-auto rounded border shadow-sm"
                  />
                </div>
              )}
              <p className="text-sm text-gray-500 mb-2">
                💡 Lưu ý: Hiện tại chức năng upload ảnh mới chưa được hỗ trợ trong trang chỉnh sửa
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800">
                <strong>Hướng dẫn:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>{activeTab === 'video_frame' ? 'Khung Video: Dùng cho các bài đăng video' : 'Khung Ảnh: Dùng cho bài đăng hình ảnh'}</li>
                <li>Sử dụng file PNG với nền trong suốt để có hiệu quả tốt nhất</li>
                <li>Đảm bảo kích thước phù hợp với tỷ lệ khung hình đã chọn</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Templates & Watermarks', path: '/templates' },
          { label: 'Chỉnh sửa template' }
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card
          title={`Chỉnh sửa ${tabs.find(t => t.id === activeTab)?.label} Template`}
          subtitle="Cập nhật thông tin template của bạn"
        >
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
              label="Mô tả"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn gọn về template này"
              rows={3}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Công khai template này cho tất cả người dùng
              </span>
            </label>
          </div>
        </Card>

        {/* Dynamic Form based on Tab */}
        <Card
          title={`Nội dung ${tabs.find(t => t.id === activeTab)?.label}`}
          subtitle={`Chỉnh sửa ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`}
        >
          {renderForm()}
        </Card>

        {/* Action Buttons */}
        <Card>
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={20} />}
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Cập nhật mẫu'}
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={<ArrowLeft size={20} />}
              onClick={() => navigate('/templates')}
              disabled={saving}
            >
              Hủy và quay lại
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default TemplateEditPage;
