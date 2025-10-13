import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, Video, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { postService } from '../../services/post.service';
import { pageService } from '../../services/page.service';
import { platformService } from '../../services/platform.service';
import { mediaService } from '../../services/media.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Modal from '../../components/common/Modal';

const PostCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [publishType, setPublishType] = useState('now'); // 'now' or 'schedule'
  const [showAIModal, setShowAIModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [imageFrameTemplate, setImageFrameTemplate] = useState('');
  const [videoFrameTemplate, setVideoFrameTemplate] = useState('');
  const [watermarkTemplate, setWatermarkTemplate] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [formData, setFormData] = useState({
    content: '',
    scheduled_at: '',
    post_type: 'text',
  });

  useEffect(() => {
    fetchPages();
    fetchPlatforms();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await pageService.getAll();
      setPages(response.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách trang');
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await platformService.getActive();
      setPlatforms(response.data || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePageSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value));
      }
    }
    setSelectedPages(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedPages.length === 0) {
      toast.error('Vui lòng chọn ít nhất một trang để đăng');
      return;
    }

    if (!formData.content) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    try {
      setLoading(true);
      
      // Create post for each selected page
      const promises = selectedPages.map(pageId => {
        const postData = {
          user_id: 1, // TODO: Get from auth
          page_id: pageId,
          content: formData.content,
          post_type: selectedVideo ? 'video' : selectedImages.length > 0 ? 'image' : 'text',
          status: publishType === 'now' ? 'published' : 'scheduled',
          scheduled_at: publishType === 'schedule' ? formData.scheduled_at : null,
        };
        return postService.create(postData);
      });

      await Promise.all(promises);
      toast.success(`Đã tạo ${selectedPages.length} bài viết thành công`);
      navigate('/posts');
    } catch (error) {
      toast.error('Không thể tạo bài viết');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPages = () => {
    if (selectedPlatforms.length === 0) return pages;
    return pages.filter(page => selectedPlatforms.includes(page.platform_id));
  };

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Quản lý bài đăng', href: '/posts' },
        { label: 'Thêm bài đăng mới' },
      ]} />

      <form onSubmit={handleSubmit}>
        <Modal
          isOpen={true}
          onClose={() => navigate('/posts')}
          title="Thêm bài đăng mới"
          size="xl"
          closeOnOverlay={false}
        >
          <div className="space-y-5">
            {/* Content Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nội dung bài đăng
                </label>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Sparkles size={16} />}
                  onClick={() => setShowAIModal(true)}
                >
                  AI tạo nội dung
                </Button>
              </div>
              <Textarea
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Nhập nội dung bài đăng..."
                required
              />
            </div>

            {/* Platform & Page Selection - 2 Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn nền tảng
                </label>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {platforms.map(platform => (
                    <label
                      key={platform.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={() => handlePlatformToggle(platform.id)}
                        className="mr-3 h-4 w-4"
                      />
                      <span className="text-sm font-medium">{platform.name}</span>
                    </label>
                  ))}
                  {platforms.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Không có nền tảng nào
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Page Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn Page
                </label>
                {selectedPlatforms.length === 0 ? (
                  <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50 h-[280px] flex items-center justify-center">
                    <p className="text-sm text-gray-500">
                      Vui lòng chọn nền tảng trước
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {getFilteredPages().length === 0 ? (
                      <div className="border border-gray-300 rounded-lg p-8 text-center">
                        <p className="text-sm text-gray-500">
                          Không có page nào cho nền tảng đã chọn
                        </p>
                      </div>
                    ) : (
                      <>
                        {getFilteredPages().map(page => (
                          <label
                            key={page.id}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                              selectedPages.includes(page.id)
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPages.includes(page.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPages([...selectedPages, page.id]);
                                } else {
                                  setSelectedPages(selectedPages.filter(id => id !== page.id));
                                }
                              }}
                              className="mr-3 h-4 w-4"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {page.page_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {page.platform?.name || 'N/A'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                )}
                {selectedPages.length > 0 && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    ✓ Đã chọn {selectedPages.length} trang
                  </p>
                )}
              </div>
            </div>

            {/* Media Upload */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => {
                      // Handle image upload
                      const files = Array.from(e.target.files);
                      setSelectedImages(files);
                    }}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Choose Files</p>
                  </label>
                </div>
                {selectedImages.length > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    {selectedImages.length} hình ảnh đã chọn
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video
                </label>
                <Select
                  value={selectedVideo || ''}
                  onChange={(e) => setSelectedVideo(e.target.value)}
                  placeholder=""
                  options={[
                    { value: '', label: 'Chọn video...' },
                    // Add video options from media library
                  ]}
                />
              </div>
            </div>

            {/* Frame Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎨 Frame Templates (Tùy chọn)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Frame cho Hình ảnh"
                  value={imageFrameTemplate}
                  onChange={(e) => setImageFrameTemplate(e.target.value)}
                  placeholder=""
                  options={[
                    { value: '', label: 'Không sử dụng frame' },
                    { value: 'frame1', label: 'Frame 1' },
                    { value: 'frame2', label: 'Frame 2' },
                  ]}
                />
                <Select
                  label="Frame cho Video"
                  value={videoFrameTemplate}
                  onChange={(e) => setVideoFrameTemplate(e.target.value)}
                  placeholder=""
                  options={[
                    { value: '', label: 'Không sử dụng frame' },
                    { value: 'frame1', label: 'Frame 1' },
                    { value: 'frame2', label: 'Frame 2' },
                  ]}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Áp dụng cho tất cả hình ảnh trong bài đăng
              </p>
              <p className="text-xs text-gray-500">
                Lồng video vào trong frame
              </p>
            </div>

            {/* Watermark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💧 Watermark Templates (Tùy chọn)
              </label>
              <Select
                label="Watermark cho Hình ảnh"
                value={watermarkTemplate}
                onChange={(e) => setWatermarkTemplate(e.target.value)}
                placeholder=""
                options={[
                  { value: '', label: 'Không sử dụng watermark' },
                  { value: 'wm1', label: 'Watermark 1' },
                  { value: 'wm2', label: 'Watermark 2' },
                ]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Chỉ áp dụng cho không sử dụng Frame
              </p>
            </div>

            {/* Publish Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lựa chọn đăng bài
              </label>
              <div className="space-y-2">
                <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    value="now"
                    checked={publishType === 'now'}
                    onChange={(e) => setPublishType(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="text-sm font-semibold text-green-600">Đăng ngay</div>
                    <div className="text-xs text-gray-500 mt-1">Đăng bài liền các nền tảng đã chọn ngay lập tức</div>
                  </div>
                </label>
                <label className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    value="schedule"
                    checked={publishType === 'schedule'}
                    onChange={(e) => setPublishType(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="text-sm font-semibold text-blue-600">Lên lịch đăng</div>
                    <div className="text-xs text-gray-500 mt-1">Đặt thời gian đăng bài trong tương lai</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Schedule Time */}
            {publishType === 'schedule' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian đăng
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  required={publishType === 'schedule'}
                />
              </div>
            )}

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hashtags
              </label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#hashtag1 #hashtag2"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-2"
                onClick={() => {
                  // Add hashtags to content
                  setFormData({ ...formData, content: formData.content + '\n' + hashtags });
                }}
              >
                # AI tạo hashtags
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/posts')}
                className="px-6"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedPages.length === 0}
                className="px-6"
              >
                {loading ? 'Đang xử lý...' : '💾 Lưu bài đăng'}
              </Button>
            </div>
          </div>
        </Modal>
      </form>
    </div>
  );
};

export default PostCreatePage;
