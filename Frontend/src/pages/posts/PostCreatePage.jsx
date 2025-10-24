import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { postService } from '../../services/post.service';
import { pageService } from '../../services/page.service';
import { platformService } from '../../services/platform.service';
import { mediaService } from '../../services/media.service';
import { templateService } from '../../services/template.service';
import aiService from '../../services/ai.service';
import { useAuthStore } from '../../stores/authStore';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Modal from '../../components/common/Modal';

const PostCreatePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [pages, setPages] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]);
  const [publishType, setPublishType] = useState('now');
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [videoLibrary, setVideoLibrary] = useState([]);
  const [instagramMediaUrls, setInstagramMediaUrls] = useState('');
  const [threadsMediaUrls, setThreadsMediaUrls] = useState('');
  const [imageFrameTemplate, setImageFrameTemplate] = useState('');
  const [videoFrameTemplate, setVideoFrameTemplate] = useState('');
  const [watermarkTemplate, setWatermarkTemplate] = useState('');
  const [imageFrameTemplates, setImageFrameTemplates] = useState([]);
  const [videoFrameTemplates, setVideoFrameTemplates] = useState([]);
  const [watermarkTemplates, setWatermarkTemplates] = useState([]);
  const [hashtags, setHashtags] = useState('');
  const [formData, setFormData] = useState({
    content: '',
    scheduled_at: '',
    post_type: 'text',
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      toast.error('Bạn cần đăng nhập để tạo bài viết');
      navigate('/login');
      return;
    }

    fetchPages();
    fetchPlatforms();
    fetchVideoLibrary();
    fetchTemplates();
  }, [isAuthenticated, user, navigate]);

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

  const fetchTemplates = async () => {
    try {
      const response = await templateService.getAll();
      const allTemplates = response.data || [];

      const imageFrames = allTemplates.filter(t => t.template_type === 'image_frame');
      const videoFrames = allTemplates.filter(t => t.template_type === 'video_frame');
      const watermarks = allTemplates.filter(t => t.template_type === 'watermark');

      setImageFrameTemplates(imageFrames);
      setVideoFrameTemplates(videoFrames);
      setWatermarkTemplates(watermarks);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Không thể tải danh sách templates');
    }
  };

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
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

    const hasInstagramOrThreads = selectedPages.some(pageId => {
      const page = pages.find(p => p.id === pageId);
      const platformName = page?.platform?.name?.toLowerCase() || '';
      return platformName === 'instagram' || platformName === 'threads';
    });

    if (hasInstagramOrThreads) {
      const instagramPages = selectedPages.filter(pageId => {
        const page = pages.find(p => p.id === pageId);
        return page?.platform?.name?.toLowerCase() === 'instagram';
      });

      const threadsPages = selectedPages.filter(pageId => {
        const page = pages.find(p => p.id === pageId);
        return page?.platform?.name?.toLowerCase() === 'threads';
      });

      if (instagramPages.length > 0 && !instagramMediaUrls.trim()) {
        toast.error('Instagram yêu cầu phải có Media URLs');
        return;
      }

      if (threadsPages.length > 0 && !threadsMediaUrls.trim()) {
        toast.error('Threads yêu cầu phải có Media URLs');
        return;
      }
    }

    try {
      setLoading(true);

      const loadingToast = toast.loading(
        <div>
          <div className="font-bold">⏳ Đang tạo bài viết...</div>
          <div className="text-sm">Đang đăng lên {selectedPages.length} trang</div>
        </div>
      );

      const promises = selectedPages.map(pageId => {
        const page = pages.find(p => p.id === pageId);
        const platformName = page?.platform?.name || '';
        const isInstagram = platformName.toLowerCase() === 'instagram';
        const isThreads = platformName.toLowerCase() === 'threads';

        const formDataToSend = new FormData();

        let finalContent = formData.content;
        if (hashtags.trim()) {
          finalContent = `${formData.content}\n\n${hashtags}`;
        }

        formDataToSend.append('user_id', user.id);
        formDataToSend.append('page_id', pageId);
        formDataToSend.append('content', finalContent);
        formDataToSend.append('status', publishType === 'now' ? 'published' : 'scheduled');

        let postType = 'text';
        let mediaType = 'image';

        if (isInstagram && instagramMediaUrls.trim()) {
          const urls = instagramMediaUrls.split('\n').filter(url => url.trim());
          if (urls.length === 1) {
            postType = 'image';
            mediaType = 'image';
            formDataToSend.append('media_urls', urls[0].trim());
          } else if (urls.length > 1) {
            postType = 'carousel';
            mediaType = 'image';
            urls.forEach(url => formDataToSend.append('media_urls', url.trim()));
          }
        } else if (isThreads && threadsMediaUrls.trim()) {
          const urls = threadsMediaUrls.split('\n').filter(url => url.trim());
          if (urls.length === 1) {
            postType = 'image';
            mediaType = 'image';
            formDataToSend.append('media_urls', urls[0].trim());
          } else if (urls.length > 1) {
            postType = 'carousel';
            mediaType = 'image';
            urls.forEach(url => formDataToSend.append('media_urls', url.trim()));
          }
        } else if (selectedVideo) {
          postType = 'video';
          mediaType = 'video';
          formDataToSend.append('files', selectedVideo);
        } else if (selectedVideoUrl) {
          postType = 'video';
          mediaType = 'video';
          formDataToSend.append('video_url', selectedVideoUrl);
        } else if (selectedImages.length > 0) {
          postType = 'image';
          mediaType = 'image';
          selectedImages.forEach(image => formDataToSend.append('files', image));
        }

        formDataToSend.append('post_type', postType);
        formDataToSend.append('media_type', mediaType);

        if (imageFrameTemplate) formDataToSend.append('image_frame_template_id', imageFrameTemplate);
        if (videoFrameTemplate) formDataToSend.append('video_frame_template_id', videoFrameTemplate);
        if (watermarkTemplate) formDataToSend.append('watermark_template_id', watermarkTemplate);

        if (publishType === 'schedule' && formData.scheduled_at) {
          formDataToSend.append('scheduled_at', formData.scheduled_at);
        }

        return postService.create(formDataToSend);
      });

      const results = await Promise.all(promises);

      if (imageFrameTemplate) {
        templateService.incrementUsage(imageFrameTemplate).catch(console.error);
      }
      if (videoFrameTemplate) {
        templateService.incrementUsage(videoFrameTemplate).catch(console.error);
      }
      if (watermarkTemplate) {
        templateService.incrementUsage(watermarkTemplate).catch(console.error);
      }

      toast.dismiss(loadingToast);

      const successCount = results.filter(r => r?.success !== false).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        toast.success(`✅ Đã đăng ${selectedPages.length} bài thành công!`, { duration: 4000 });
      } else {
        toast.success(`⚠️ Thành công: ${successCount} | Thất bại: ${failCount}`, { duration: 5000 });
      }

      navigate('/posts');
    } catch (error) {
      toast.error('❌ Không thể tạo bài viết');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!aiTopic.trim()) {
      toast.error('Vui lòng nhập chủ đề');
      return;
    }

    try {
      setAiLoading(true);
      const data = await aiService.generateContent(aiTopic);

      if (!data?.content) {
        toast.error('AI không trả về nội dung');
        return;
      }

      setFormData({ ...formData, content: data.content });
      if (data.hashtags) setHashtags(data.hashtags);
      setAiTopic('');
      toast.success('Đã tạo nội dung thành công!');
    } catch (error) {
      toast.error('Không thể tạo nội dung');
      console.error(error);
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

      if (!data?.hashtags) {
        toast.error('AI không trả về hashtags');
        return;
      }

      setHashtags(data.hashtags);
      toast.success('Đã tạo hashtags thành công!');
    } catch (error) {
      toast.error('Không thể tạo hashtags');
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const getFilteredPages = () => {
    if (selectedPlatforms.length === 0) return pages;
    return pages.filter(page => selectedPlatforms.includes(page.platform_id));
  };

  if (!user && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="hidden md:block">
        <Breadcrumb items={[
          { label: 'Quản lý bài đăng', href: '/posts' },
          { label: 'Thêm bài đăng mới' },
        ]} />
      </div>

      <form onSubmit={handleSubmit}>
        <Modal
          isOpen={true}
          onClose={() => navigate('/posts')}
          title="Thêm bài đăng mới"
          size="xl"
          closeOnOverlay={false}
        >
          <div className="space-y-4 md:space-y-5">
            {/* AI Content Generator */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 md:p-4 rounded-lg border border-purple-200">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                🤖 AI Trợ lý sáng tạo
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Nhập chủ đề..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Sparkles size={16} />}
                  onClick={handleGenerateContent}
                  disabled={aiLoading || !aiTopic.trim()}
                  className="whitespace-nowrap w-full sm:w-auto"
                >
                  {aiLoading ? 'Đang tạo...' : 'Tạo nội dung'}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Nội dung bài đăng *
              </label>
              <Textarea
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Nhập nội dung..."
                required
                className="resize-y min-h-[100px] md:min-h-[150px] text-sm md:text-base"
              />
            </div>

            {/* Platform & Page - Stacked on mobile, 2 cols on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Chọn nền tảng
                </label>
                <div className="space-y-2 max-h-[200px] md:max-h-[280px] overflow-y-auto pr-2 border rounded-lg p-2 md:p-3 bg-gray-50">
                  {platforms.map(platform => (
                    <label
                      key={platform.id}
                      className={`flex items-center p-2 md:p-3 border rounded-lg cursor-pointer ${selectedPlatforms.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={() => handlePlatformToggle(platform.id)}
                        className="mr-2 md:mr-3"
                      />
                      <span className="text-xs md:text-sm">{platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Chọn Page
                </label>
                {selectedPlatforms.length === 0 ? (
                  <div className="border rounded-lg p-8 text-center bg-gray-50 h-[200px] md:h-[280px] flex items-center justify-center">
                    <p className="text-xs md:text-sm text-gray-500">Chọn nền tảng trước</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] md:max-h-[280px] overflow-y-auto pr-2 border rounded-lg p-2 md:p-3 bg-gray-50">
                    {getFilteredPages().map(page => (
                      <label
                        key={page.id}
                        className={`flex items-center p-2 md:p-3 border rounded-lg cursor-pointer ${selectedPages.includes(page.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
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
                          className="mr-2 md:mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs md:text-sm font-medium truncate">{page.page_name}</div>
                          <div className="text-xs text-gray-500">{page.platform?.name}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedPages.length > 0 && (
                  <p className="text-xs md:text-sm text-green-600 mt-2">✓ Đã chọn {selectedPages.length} trang</p>
                )}
              </div>
            </div>

            {/* Media Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
                {selectedPlatforms.some(id => {
                  const platform = platforms.find(p => p.id === id);
                  const name = platform?.name?.toLowerCase() || '';
                  return name === 'instagram' || name === 'threads';
                }) ? (
                  <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-xs md:text-sm text-yellow-700">Instagram/Threads chỉ hỗ trợ URLs</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center hover:border-blue-500 cursor-pointer bg-gray-50">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={(e) => setSelectedImages(Array.from(e.target.files))}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <ImageIcon className="mx-auto h-6 w-6 md:h-8 md:w-8 text-gray-400 mb-2" />
                      <p className="text-xs md:text-sm text-gray-600">Chọn hình ảnh</p>
                    </label>
                  </div>
                )}

                {selectedImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs md:text-sm text-green-600 mb-2">✓ {selectedImages.length} ảnh</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {selectedImages.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-20 md:h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Video</label>
                {selectedPlatforms.some(id => {
                  const platform = platforms.find(p => p.id === id);
                  const name = platform?.name?.toLowerCase() || '';
                  return name === 'instagram' || name === 'threads';
                }) ? (
                  <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-xs md:text-sm text-yellow-700">Instagram/Threads chỉ hỗ trợ URLs</p>
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center hover:border-blue-500 cursor-pointer bg-gray-50">
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        id="video-upload"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSelectedVideo(file);
                            setSelectedVideoUrl('');
                            setSelectedImages([]);
                          }
                        }}
                      />
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <Video className="mx-auto h-6 w-6 md:h-8 md:w-8 text-gray-400 mb-2" />
                        <p className="text-xs md:text-sm text-gray-600">Chọn video</p>
                      </label>
                    </div>

                    <div className="mt-3">
                      <Select
                        value={selectedVideoUrl}
                        onChange={(e) => {
                          setSelectedVideoUrl(e.target.value);
                          if (e.target.value) {
                            setSelectedVideo(null);
                            setSelectedImages([]);
                          }
                        }}
                        options={[
                          { value: '', label: 'Hoặc chọn từ thư viện...' },
                          ...videoLibrary.map(v => ({
                            value: v.file_url,
                            label: `${v.file_name} (${(v.file_size / 1024 / 1024).toFixed(2)}MB)`
                          }))
                        ]}
                      />
                    </div>
                  </>
                )}

                {selectedVideo && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm text-green-700 truncate">{selectedVideo.name}</span>
                      <button type="button" onClick={() => setSelectedVideo(null)} className="text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                    <video src={URL.createObjectURL(selectedVideo)} controls className="w-full max-h-48 rounded" />
                  </div>
                )}
              </div>
            </div>

            {/* Instagram URLs */}
            {selectedPlatforms.some(id => platforms.find(p => p.id === id)?.name?.toLowerCase() === 'instagram') && (
              <div className="p-3 md:p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
                <label className="block text-xs md:text-sm font-bold text-purple-700 mb-2">
                  📸 Instagram Media URLs *
                </label>
                <Textarea
                  rows={4}
                  value={instagramMediaUrls}
                  onChange={(e) => setInstagramMediaUrls(e.target.value)}
                  placeholder="Nhập URL (mỗi dòng 1 URL)..."
                  className="font-mono text-xs md:text-sm"
                  required
                />
              </div>
            )}

            {/* Threads URLs */}
            {selectedPlatforms.some(id => platforms.find(p => p.id === id)?.name?.toLowerCase() === 'threads') && (
              <div className="p-3 md:p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <label className="block text-xs md:text-sm font-bold text-blue-700 mb-2">
                  🧵 Threads Media URLs *
                </label>
                <Textarea
                  rows={4}
                  value={threadsMediaUrls}
                  onChange={(e) => setThreadsMediaUrls(e.target.value)}
                  placeholder="Nhập URL (mỗi dòng 1 URL)..."
                  className="font-mono text-xs md:text-sm"
                  required
                />
              </div>
            )}

            {/* Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Frame Hình ảnh"
                value={imageFrameTemplate}
                onChange={(e) => setImageFrameTemplate(e.target.value)}
                options={[
                  { value: '', label: 'Không sử dụng' },
                  ...imageFrameTemplates.map(t => ({ value: t.id.toString(), label: t.name }))
                ]}
              />
              <Select
                label="Frame Video"
                value={videoFrameTemplate}
                onChange={(e) => setVideoFrameTemplate(e.target.value)}
                options={[
                  { value: '', label: 'Không sử dụng' },
                  ...videoFrameTemplates.map(t => ({ value: t.id.toString(), label: t.name }))
                ]}
              />
            </div>

            <Select
              label="Watermark"
              value={watermarkTemplate}
              onChange={(e) => setWatermarkTemplate(e.target.value)}
              options={[
                { value: '', label: 'Không sử dụng' },
                ...watermarkTemplates.map(t => ({ value: t.id.toString(), label: t.name }))
              ]}
            />

            {/* Publish Type */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Lựa chọn đăng bài</label>
              <div className="space-y-2">
                <label className="flex items-start p-2 md:p-3 border rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    value="now"
                    checked={publishType === 'now'}
                    onChange={(e) => setPublishType(e.target.value)}
                    className="mt-1 mr-2 md:mr-3"
                  />
                  <div>
                    <div className="text-xs md:text-sm font-semibold text-green-600">Đăng ngay</div>
                    <div className="text-xs text-gray-500">Đăng ngay lập tức</div>
                  </div>
                </label>
                <label className="flex items-start p-2 md:p-3 border rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    value="schedule"
                    checked={publishType === 'schedule'}
                    onChange={(e) => setPublishType(e.target.value)}
                    className="mt-1 mr-2 md:mr-3"
                  />
                  <div>
                    <div className="text-xs md:text-sm font-semibold text-blue-600">Lên lịch</div>
                    <div className="text-xs text-gray-500">Đặt thời gian đăng</div>
                  </div>
                </label>
              </div>
            </div>

            {publishType === 'schedule' && (
              <Input
                type="datetime-local"
                label="Thời gian đăng"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                required
              />
            )}

            {/* Hashtags */}
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Hashtags</label>
              <div className="flex flex-col sm:flex-row gap-2">
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
                  className="whitespace-nowrap w-full sm:w-auto text-xs md:text-sm"
                >
                  {aiLoading ? 'Đang tạo...' : '# AI tạo'}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 md:pt-6 border-t sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/posts')}
                className="px-4 md:px-6 w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedPages.length === 0}
                className="px-4 md:px-6 w-full sm:w-auto"
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