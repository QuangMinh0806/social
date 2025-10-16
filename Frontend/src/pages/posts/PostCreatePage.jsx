import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, Video, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { postService } from '../../services/post.service';
import { pageService } from '../../services/page.service';
import { platformService } from '../../services/platform.service';
import { mediaService } from '../../services/media.service';
import { youtubeService } from '../../services/youtube.service';
import aiService from '../../services/ai.service';
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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [pages, setPages] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [publishType, setPublishType] = useState('now'); // 'now' or 'schedule'
  const [showAIModal, setShowAIModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(''); // Video URL từ thư viện
  const [videoLibrary, setVideoLibrary] = useState([]); // Danh sách video trong hệ thống
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
    fetchVideoLibrary();
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

  const fetchVideoLibrary = async () => {
    try {
      const response = await mediaService.getByType('video');
      setVideoLibrary(response.data || []);
    } catch (error) {
      console.error('Error fetching video library:', error);
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

    // Kiểm tra nếu có YouTube page được chọn thì phải có video
    const hasYouTubePages = selectedPages.some(pageId => {
      const page = pages.find(p => p.id === pageId);
      return page?.platform?.name?.toLowerCase() === 'youtube';
    });

    if (hasYouTubePages && !selectedVideo && !selectedVideoUrl) {
      toast.error('YouTube yêu cầu video để upload. Vui lòng chọn video từ máy tính hoặc thư viện.');
      return;
    }

    try {
      setLoading(true);

      // Tạo bài viết cho từng page đã chọn
      const promises = selectedPages.map(async (pageId) => {
        // Lấy thông tin page để biết platform
        const page = pages.find(p => p.id === pageId);
        const platformName = page?.platform?.name?.toLowerCase();

        // Xử lý YouTube riêng biệt
        if (platformName === 'youtube') {
          return await handleYouTubeUpload(page);
        }

        // Xử lý các platform khác (Facebook, v.v...)
        return await handleRegularUpload(pageId);
      });

      const results = await Promise.all(promises);

      toast.success(
        <div>
          <div className="font-bold">✅ Tạo bài viết thành công!</div>
          <div className="text-sm">Đã tạo {selectedPages.length} bài đăng trên các nền tảng</div>
        </div>,
        { duration: 3000 }
      );

      navigate('/posts');
    } catch (error) {
      toast.error('Không thể tạo bài viết');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý upload lên YouTube
  const handleYouTubeUpload = async (page) => {
    console.log('=== YouTube Upload Debug ===');
    console.log('Page object:', page);
    console.log('Page ID:', page.id);
    console.log('Page name:', page.page_name);
    console.log('Platform:', page.platform);

    try {
      // Kiểm tra phải có video
      if (!selectedVideo && !selectedVideoUrl) {
        throw new Error('YouTube yêu cầu video để upload');
      }

      // Tạo FormData giống handleRegularUpload
      const formDataToSend = new FormData();

      // Thêm các field bắt buộc
      formDataToSend.append('user_id', '1'); // TODO: Get from auth
      formDataToSend.append('page_id', page.id);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('status', publishType === 'now' ? 'published' : 'scheduled');
      formDataToSend.append('post_type', 'video');
      formDataToSend.append('media_type', 'video');

      // Thêm video
      if (selectedVideo) {
        // Video file từ máy tính
        formDataToSend.append('files', selectedVideo);
      } else if (selectedVideoUrl) {
        // Video từ URL (thư viện media)
        formDataToSend.append('video_url', selectedVideoUrl);
      }

      // Thêm scheduled_at nếu có
      if (publishType === 'schedule' && formData.scheduled_at) {
        formDataToSend.append('scheduled_at', formData.scheduled_at);
      }

      console.log('=== Sending YouTube Post to Backend ===');
      console.log('Page ID:', page.id);
      console.log('Platform:', page.platform?.name);

      // Gọi postService.create - backend sẽ tự động upload lên YouTube
      return await postService.create(formDataToSend);
    } catch (error) {
      console.error('YouTube upload error:', error);
      throw error;
    }
  };

  // Xử lý upload cho các platform khác
  const handleRegularUpload = async (pageId) => {
    // Tạo FormData để gửi file + data
    const formDataToSend = new FormData();

    // Thêm các field bắt buộc
    formDataToSend.append('user_id', 1); // TODO: Get from auth
    formDataToSend.append('page_id', pageId);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('status', publishType === 'now' ? 'published' : 'scheduled');

    // Xác định post_type và media_type
    let postType = 'text';
    let mediaType = 'image';

    if (selectedVideo) {
      // Upload video file từ máy tính
      postType = 'video';
      mediaType = 'video';
      formDataToSend.append('files', selectedVideo);
    } else if (selectedVideoUrl) {
      // Upload video từ URL (thư viện media)
      postType = 'video';
      mediaType = 'video';
      // Gửi URL thay vì file
      formDataToSend.append('video_url', selectedVideoUrl);
    } else if (selectedImages.length > 0) {
      postType = 'image';
      mediaType = 'image';
      // Thêm tất cả image files
      selectedImages.forEach(image => {
        formDataToSend.append('files', image);
      });
    }

    formDataToSend.append('post_type', postType);
    formDataToSend.append('media_type', mediaType);

    // Thêm scheduled_at nếu có
    if (publishType === 'schedule' && formData.scheduled_at) {
      formDataToSend.append('scheduled_at', formData.scheduled_at);
    }

    return postService.create(formDataToSend);
  };

  const handleGenerateContent = async () => {
    if (!aiTopic.trim()) {
      toast.error('Vui lòng nhập chủ đề');
      return;
    }

    try {
      setAiLoading(true);
      const data = await aiService.generateContent(aiTopic);
      console.log('AI Response:', data); // Debug log

      if (!data?.content) {
        toast.error('AI không trả về nội dung. Vui lòng thử lại.');
        return;
      }

      setFormData({ ...formData, content: data.content });
      setAiTopic(''); // Clear topic after success
      toast.success('Đã tạo nội dung thành công!');
    } catch (error) {
      toast.error('Không thể tạo nội dung. Vui lòng thử lại.');
      console.error('Error generating content:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!aiTopic.trim()) {
      toast.error('Vui lòng nhập chủ đề');
      return;
    }

    try {
      setAiLoading(true);
      const data = await aiService.generateHashtags(aiTopic);
      console.log('AI Hashtags Response:', data); // Debug log

      if (!data?.hashtags) {
        toast.error('AI không trả về hashtags. Vui lòng thử lại.');
        return;
      }

      setHashtags(data.hashtags);
      toast.success('Đã tạo hashtags thành công!');
    } catch (error) {
      toast.error('Không thể tạo hashtags. Vui lòng thử lại.');
      console.error('Error generating hashtags:', error);
    } finally {
      setAiLoading(false);
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
            {/* AI Content Generator */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🤖 AI Trợ lý sáng tạo nội dung
              </label>
              <div className="flex gap-2">
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Nhập chủ đề (VD: Quảng cáo sản phẩm cà phê hữu cơ)"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateContent();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Sparkles size={16} />}
                  onClick={handleGenerateContent}
                  disabled={aiLoading || !aiTopic.trim()}
                  className="whitespace-nowrap"
                >
                  {aiLoading ? 'Đang tạo...' : 'Tạo nội dung'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 AI sẽ tạo nội dung bài đăng chuyên nghiệp dựa trên chủ đề của bạn
              </p>
            </div>

            {/* Content Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung bài đăng
              </label>
              <Textarea
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Nhập nội dung bài đăng hoặc sử dụng AI để tạo..."
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
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedPlatforms.includes(platform.id)
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
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedPages.includes(page.id)
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

            {/* YouTube Warning */}
            {selectedPages.some(pageId => {
              const page = pages.find(p => p.id === pageId);
              return page?.platform?.name?.toLowerCase() === 'youtube';
            }) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Video className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        📺 Yêu cầu Video cho YouTube
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        YouTube yêu cầu video để upload. Vui lòng chọn video từ máy tính hoặc thư viện media bên dưới.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                      const files = Array.from(e.target.files);
                      setSelectedImages(files);
                    }}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Chọn hình ảnh</p>
                    <p className="text-xs text-gray-500 mt-1">Hỗ trợ nhiều ảnh</p>
                  </label>
                </div>

                {/* Image Preview */}
                {selectedImages.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-green-600 font-medium">
                        ✓ {selectedImages.length} hình ảnh đã chọn
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedImages([])}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <X size={14} />
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImages(selectedImages.filter((_, i) => i !== index));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    id="video-upload"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedVideo(file);
                        setSelectedVideoUrl(''); // Clear video URL
                        setSelectedImages([]); // Clear images if video is selected
                      }
                    }}
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Video className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Chọn video từ máy tính</p>
                    <p className="text-xs text-gray-500 mt-1">Hoặc chọn từ thư viện bên dưới</p>
                  </label>
                </div>

                {/* Select from Video Library */}
                <div className="mt-3">
                  <Select
                    value={selectedVideoUrl}
                    onChange={(e) => {
                      setSelectedVideoUrl(e.target.value);
                      if (e.target.value) {
                        setSelectedVideo(null); // Clear uploaded file
                        setSelectedImages([]); // Clear images
                      }
                    }}
                    options={[
                      { value: '', label: 'Hoặc chọn video từ thư viện...' },
                      ...videoLibrary.map(video => ({
                        value: video.file_url,
                        label: `${video.file_name} (${(video.file_size / 1024 / 1024).toFixed(2)} MB)`
                      }))
                    ]}
                  />
                </div>

                {/* Video Preview - Uploaded File */}
                {selectedVideo && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          ✓ Video đã chọn: {selectedVideo.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setSelectedVideo(null)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Video preview player */}
                    <div className="mt-4">
                      <video
                        src={URL.createObjectURL(selectedVideo)}
                        controls
                        className="w-full max-h-64 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Video Preview - From Library */}
                {selectedVideoUrl && !selectedVideo && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          ✓ Video từ thư viện
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setSelectedVideoUrl('')}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Video preview player */}
                    <div className="mt-4">
                      <video
                        src={selectedVideoUrl}
                        controls
                        className="w-full max-h-64 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clear both button */}
            {(selectedImages.length > 0 || selectedVideo || selectedVideoUrl) && (
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImages([]);
                    setSelectedVideo(null);
                    setSelectedVideoUrl('');
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  <X className="inline h-4 w-4 mr-1" />
                  Xóa tất cả media
                </button>
              </div>
            )}

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
              <div className="flex gap-2">
                <Input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#hashtag1 #hashtag2"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateHashtags}
                  disabled={aiLoading || !aiTopic.trim()}
                  className="whitespace-nowrap"
                >
                  {aiLoading ? 'Đang tạo...' : '# AI tạo hashtags'}
                </Button>
              </div>
              {hashtags && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    // Add hashtags to content
                    setFormData({ ...formData, content: formData.content + '\n\n' + hashtags });
                    toast.success('Đã thêm hashtags vào nội dung');
                  }}
                >
                  ➕ Thêm hashtags vào nội dung
                </Button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                💡 Sử dụng chủ đề bên trên để AI tạo hashtags phù hợp
              </p>
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
