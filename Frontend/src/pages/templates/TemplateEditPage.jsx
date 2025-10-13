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
                    {tag.startsWith('#') ? tag : `#${tag}`}
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
        );

      case 'watermark':
        return (
          <div className="space-y-4">
            <Select
              label="Vị trí"
              name="watermark_position"
              value={formData.watermark_position}
              onChange={handleChange}
            >
              <option value="top-left">Góc trên trái</option>
              <option value="top-right">Góc trên phải</option>
              <option value="bottom-left">Góc dưới trái</option>
              <option value="bottom-right">Góc dưới phải</option>
              <option value="center">Giữa</option>
            </Select>
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
                Upload hình watermark
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'watermark_image_url')}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {formData.watermark_image_url && (
                <img 
                  src={formData.watermark_image_url} 
                  alt="Preview" 
                  className="mt-2 max-w-xs rounded"
                />
              )}
            </div>
          </div>
        );

      case 'image_frame':
      case 'video_frame':
        return (
          <div className="space-y-4">
            <Select
              label="Loại Frame"
              name="frame_type"
              value={formData.frame_type}
              onChange={handleChange}
            >
              <option value="">-- Chọn loại frame --</option>
              <option value={activeTab === 'video_frame' ? 'Frame Video (cho video posts)' : 'Frame Hình ảnh'}>
                {activeTab === 'video_frame' ? 'Frame Video (cho video posts)' : 'Frame Hình ảnh'}
              </option>
            </Select>
            <Select
              label="Aspect Ratio"
              name="aspect_ratio"
              value={formData.aspect_ratio}
              onChange={handleChange}
            >
              <option value="">-- Chọn aspect ratio --</option>
              <option value="1:1">Vuông (1:1) - Instagram, Facebook</option>
              <option value="9:16">Dọc (9:16) - Instagram Stories, TikTok</option>
              <option value="16:9">Ngang (16:9) - YouTube, Facebook Video</option>
              <option value="4:5">4:5 - Instagram Feed</option>
            </Select>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Frame Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'frame_image_url')}
                  className="hidden"
                  id="frame-upload"
                />
                <label htmlFor="frame-upload" className="cursor-pointer">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Click hoặc kéo thả frame image vào đây</p>
                  <p className="text-xs text-gray-500 mt-1">Khuyến dùng PNG với background trong suốt</p>
                  <p className="text-xs text-gray-500">Kích thước tối thiểu: 1080x1080px</p>
                  <Button type="button" variant="primary" className="mt-4">
                    Chọn Frame
                  </Button>
                </label>
              </div>
              {formData.frame_image_url && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview Frame:</p>
                  <img 
                    src={formData.frame_image_url} 
                    alt="Frame Preview" 
                    className="max-w-md rounded border"
                  />
                </div>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800">
                <strong>Hướng dẫn tạo Frame:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Frame Video: Dùng cho các bài đăng video, nền có khoảng trong suốt ở giữa</li>
                <li>Frame Hình ảnh: Dùng cho bài đăng hình ảnh thông thường</li>
                <li>Khuyến dùng PNG với background trong suốt</li>
                <li>Kích thước tối thiểu: 1080x1080px</li>
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
            <Input
              label="Danh mục"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Ví dụ: Marketing, Sự kiện"
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
