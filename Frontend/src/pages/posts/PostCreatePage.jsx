import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, Video, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { postService } from '../../services/post.service';
import { pageService } from '../../services/page.service';
import { platformService } from '../../services/platform.service';
import { mediaService } from '../../services/media.service';
import { youtubeService } from '../../services/youtube.service';
import { templateService } from '../../services/template.service';
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
  const [instagramMediaUrls, setInstagramMediaUrls] = useState(''); // URLs cho Instagram (mỗi dòng 1 URL)
  const [threadsMediaUrls, setThreadsMediaUrls] = useState(''); // URLs cho Threads (mỗi dòng 1 URL)
  const [imageFrameTemplate, setImageFrameTemplate] = useState('');
  const [videoFrameTemplate, setVideoFrameTemplate] = useState('');
  const [watermarkTemplate, setWatermarkTemplate] = useState('');
  const [imageFrameTemplates, setImageFrameTemplates] = useState([]); // Danh sách frame cho ảnh
  const [videoFrameTemplates, setVideoFrameTemplates] = useState([]); // Danh sách frame cho video
  const [watermarkTemplates, setWatermarkTemplates] = useState([]); // Danh sách watermark
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
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const response = await templateService.getAll();
      const allTemplates = response.data || [];
      
      // Lọc templates theo loại
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

    // Kiểm tra xem có page nào là Instagram hoặc Threads không
    const hasInstagramOrThreads = selectedPages.some(pageId => {
      const page = pages.find(p => p.id === pageId);
      const platformName = page?.platform?.name?.toLowerCase() || '';
      return platformName === 'instagram' || platformName === 'threads';
    });

    // Validation cho Instagram và Threads
    if (hasInstagramOrThreads) {
      const instagramPages = selectedPages.filter(pageId => {
        const page = pages.find(p => p.id === pageId);
        return page?.platform?.name?.toLowerCase() === 'instagram';
      });

      const threadsPages = selectedPages.filter(pageId => {
        const page = pages.find(p => p.id === pageId);
        return page?.platform?.name?.toLowerCase() === 'threads';
      });

      // Kiểm tra Instagram phải có URLs
      if (instagramPages.length > 0 && !instagramMediaUrls.trim()) {
        toast.error('Instagram yêu cầu phải có Media URLs. Vui lòng nhập ít nhất 1 URL ảnh/video.');
        return;
      }

      // Kiểm tra Threads phải có URLs
      if (threadsPages.length > 0 && !threadsMediaUrls.trim()) {
        toast.error('Threads yêu cầu phải có Media URLs. Vui lòng nhập ít nhất 1 URL ảnh/video.');
        return;
      }
    }

    try {
      setLoading(true);

      // Hiển thị loading message với số lượng pages
      const loadingToast = toast.loading(
        <div>
          <div className="font-bold">⏳ Đang tạo bài viết...</div>
          <div className="text-sm">
            Đang đăng lên {selectedPages.length} trang.
            {selectedPages.length > 1 && ' Có thể mất vài phút...'}
          </div>
        </div>
      );

      // Tạo bài viết cho từng page đã chọn
      const promises = selectedPages.map(pageId => {
        // Lấy thông tin page để biết platform
        const page = pages.find(p => p.id === pageId);
        const platformName = page?.platform?.name || '';
        const isInstagram = platformName.toLowerCase() === 'instagram';
        const isThreads = platformName.toLowerCase() === 'threads';

        // Tạo FormData để gửi file + data
        const formDataToSend = new FormData();

        // Thêm các field bắt buộc
        formDataToSend.append('user_id', 13); // TODO: Get from auth
        formDataToSend.append('page_id', pageId);
        formDataToSend.append('content', formData.content);
        formDataToSend.append('status', publishType === 'now' ? 'published' : 'scheduled');

        // Xác định post_type và media_type
        let postType = 'text';
        let mediaType = 'image';

        // Nếu là Instagram và có Instagram URLs
        if (isInstagram && instagramMediaUrls.trim()) {
          // Parse URLs (mỗi dòng 1 URL)
          const urls = instagramMediaUrls.split('\n').filter(url => url.trim());
          
          if (urls.length === 1) {
            // Single image/video
            postType = 'image';
            mediaType = 'image';
            formDataToSend.append('media_urls', urls[0].trim());
          } else if (urls.length > 1) {
            // Carousel (nhiều ảnh)
            postType = 'carousel';
            mediaType = 'image';
            urls.forEach(url => {
              formDataToSend.append('media_urls', url.trim());
            });
          }
        } else if (isThreads && threadsMediaUrls.trim()) {
          // Parse URLs (mỗi dòng 1 URL) cho Threads
          const urls = threadsMediaUrls.split('\n').filter(url => url.trim());
          
          if (urls.length === 1) {
            // Single image/video
            postType = 'image';
            mediaType = 'image';
            formDataToSend.append('media_urls', urls[0].trim());
          } else if (urls.length > 1) {
            // Multiple images
            postType = 'carousel';
            mediaType = 'image';
            urls.forEach(url => {
              formDataToSend.append('media_urls', url.trim());
            });
          }
        } else if (selectedVideo) {
          // Upload video file từ máy tính (Facebook, TikTok, YouTube)
          postType = 'video';
          mediaType = 'video';
          formDataToSend.append('files', selectedVideo);
        } else if (selectedVideoUrl) {
          // Upload video từ URL (thư viện media)
          postType = 'video';
          mediaType = 'video';
          formDataToSend.append('video_url', selectedVideoUrl);
        } else if (selectedImages.length > 0) {
          // Upload images từ máy tính (Facebook)
          postType = 'image';
          mediaType = 'image';
          selectedImages.forEach(image => {
            formDataToSend.append('files', image);
          });
        }

        formDataToSend.append('post_type', postType);
        formDataToSend.append('media_type', mediaType);

        // Thêm template IDs nếu có
        if (imageFrameTemplate) {
          formDataToSend.append('image_frame_template_id', imageFrameTemplate);
        }
        if (videoFrameTemplate) {
          formDataToSend.append('video_frame_template_id', videoFrameTemplate);
        }
        if (watermarkTemplate) {
          formDataToSend.append('watermark_template_id', watermarkTemplate);
        }

        // Thêm scheduled_at nếu có
        if (publishType === 'schedule' && formData.scheduled_at) {
          formDataToSend.append('scheduled_at', formData.scheduled_at);
        }

        return postService.create(formDataToSend);
      });

      const results = await Promise.all(promises);

      // Increment usage count cho các templates được sử dụng
      const templateIncrementPromises = [];
      
      if (imageFrameTemplate) {
        templateIncrementPromises.push(
          templateService.incrementUsage(imageFrameTemplate).catch(err => 
            console.error('Error incrementing image frame usage:', err)
          )
        );
      }
      
      if (videoFrameTemplate) {
        templateIncrementPromises.push(
          templateService.incrementUsage(videoFrameTemplate).catch(err => 
            console.error('Error incrementing video frame usage:', err)
          )
        );
      }
      
      if (watermarkTemplate) {
        templateIncrementPromises.push(
          templateService.incrementUsage(watermarkTemplate).catch(err => 
            console.error('Error incrementing watermark usage:', err)
          )
        );
      }

      // Chạy increment usage (không chờ vì không ảnh hưởng tới kết quả)
      if (templateIncrementPromises.length > 0) {
        Promise.all(templateIncrementPromises);
      }

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Hiển thị kết quả chi tiết
      const successCount = results.filter(r => r?.success !== false).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        toast.success(
          <div>
            <div className="font-bold">✅ Tạo bài viết thành công!</div>
            <div className="text-sm">
              Đã đăng {selectedPages.length} bài lên các nền tảng
              {publishType === 'schedule' && ' (đã lên lịch)'}
            </div>
          </div>,
          { duration: 4000 }
        );
      } else {
        toast.success(
          <div>
            <div className="font-bold">⚠️ Hoàn thành với một số lỗi</div>
            <div className="text-sm">
              Thành công: {successCount} | Thất bại: {failCount}
            </div>
          </div>,
          { duration: 5000 }
        );
      }

      navigate('/posts');
    } catch (error) {
      toast.error(
        <div>
          <div className="font-bold">❌ Không thể tạo bài viết</div>
          <div className="text-sm">{error.message || 'Vui lòng thử lại sau'}</div>
        </div>
      );
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

            {/* Media Upload */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh
                </label>
                {/* Kiểm tra xem có chọn Instagram/Threads không */}
                {selectedPlatforms.some(id => {
                  const platform = platforms.find(p => p.id === id);
                  const name = platform?.name?.toLowerCase() || '';
                  return name === 'instagram' || name === 'threads';
                }) ? (
                  <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-6 text-center">
                    <div className="text-yellow-600 mb-2">
                      <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm text-yellow-700 font-medium">Upload file không khả dụng</p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Instagram & Threads chỉ hỗ trợ Media URLs
                    </p>
                    <p className="text-xs text-yellow-600">
                      Vui lòng nhập URLs bên dưới ↓
                    </p>
                  </div>
                ) : (
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
                )}

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
                {/* Kiểm tra xem có chọn Instagram/Threads không */}
                {selectedPlatforms.some(id => {
                  const platform = platforms.find(p => p.id === id);
                  const name = platform?.name?.toLowerCase() || '';
                  return name === 'instagram' || name === 'threads';
                }) ? (
                  <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-6 text-center">
                    <div className="text-yellow-600 mb-2">
                      <svg className="mx-auto h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm text-yellow-700 font-medium">Upload file không khả dụng</p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Instagram & Threads chỉ hỗ trợ Media URLs
                    </p>
                    <p className="text-xs text-yellow-600">
                      Vui lòng nhập URLs bên dưới ↓
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}

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

            {/* Instagram Media URLs */}
            {selectedPlatforms.some(id => {
              const platform = platforms.find(p => p.id === id);
              return platform?.name?.toLowerCase() === 'instagram';
            }) && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📸</span>
                    <label className="block text-sm font-bold text-purple-700">
                      Instagram Media URLs (Bắt buộc) *
                    </label>
                  </div>
                  <Textarea
                    rows={5}
                    value={instagramMediaUrls}
                    onChange={(e) => setInstagramMediaUrls(e.target.value)}
                    placeholder="Nhập URL công khai của ảnh/video (HTTPS)&#10;Mỗi dòng 1 URL:&#10;&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/video1.mp4"
                    className="font-mono text-sm border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                  <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                    <p className="text-xs font-bold text-purple-800 mb-2">⚠️ LƯU Ý QUAN TRỌNG:</p>
                    <div className="text-xs text-purple-700 space-y-1.5">
                      <p>✅ <strong>1 URL = 1 ảnh/video</strong> (Single post)</p>
                      <p>✅ <strong>2-10 URLs = Carousel</strong> (Nhiều ảnh trong 1 bài)</p>
                      <p>🔗 URL phải là <strong>HTTPS</strong> và truy cập công khai</p>
                      <p>📤 Upload ảnh lên: <a href="https://imgur.com" target="_blank" className="text-blue-600 underline">Imgur</a>, <a href="https://cloudinary.com" target="_blank" className="text-blue-600 underline">Cloudinary</a>, hoặc hosting của bạn</p>
                      <p>📝 Mỗi dòng 1 URL, không có dấu cách thừa</p>
                    </div>
                  </div>
                </div>
              )}

            {/* Threads Media URLs */}
            {selectedPlatforms.some(id => {
              const platform = platforms.find(p => p.id === id);
              return platform?.name?.toLowerCase() === 'threads';
            }) && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🧵</span>
                    <label className="block text-sm font-bold text-blue-700">
                      Threads Media URLs (Bắt buộc) *
                    </label>
                  </div>
                  <Textarea
                    rows={5}
                    value={threadsMediaUrls}
                    onChange={(e) => setThreadsMediaUrls(e.target.value)}
                    placeholder="Nhập URL công khai của ảnh/video (HTTPS)&#10;Mỗi dòng 1 URL:&#10;&#10;https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/video1.mp4"
                    className="font-mono text-sm border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                    <p className="text-xs font-bold text-blue-800 mb-2">⚠️ LƯU Ý QUAN TRỌNG:</p>
                    <div className="text-xs text-blue-700 space-y-1.5">
                      <p>✅ <strong>1 URL = 1 ảnh/video</strong> (Single post)</p>
                      <p>✅ <strong>Nhiều URLs = Nhiều ảnh</strong> trong 1 bài</p>
                      <p>🔗 URL phải là <strong>HTTPS</strong> và truy cập công khai</p>
                      <p>� Upload ảnh lên: <a href="https://imgur.com" target="_blank" className="text-blue-600 underline">Imgur</a>, <a href="https://cloudinary.com" target="_blank" className="text-blue-600 underline">Cloudinary</a>, hoặc hosting của bạn</p>
                      <p>� Mỗi dòng 1 URL, không có dấu cách thừa</p>
                    </div>
                  </div>
                </div>
              )}

            {/* Frame Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎨 Frame Templates (Tùy chọn)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    label="Frame cho Hình ảnh"
                    value={imageFrameTemplate}
                    onChange={(e) => setImageFrameTemplate(e.target.value)}
                    placeholder=""
                    options={[
                      { value: '', label: 'Không sử dụng frame' },
                      ...imageFrameTemplates.map(template => ({
                        value: template.id.toString(),
                        label: `${template.name}${template.category ? ` - ${template.category}` : ''}${template.aspect_ratio ? ` (${template.aspect_ratio})` : ''}`
                      }))
                    ]}
                  />
                  {imageFrameTemplate && imageFrameTemplates.find(t => t.id.toString() === imageFrameTemplate)?.frame_image_url && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img 
                        src={imageFrameTemplates.find(t => t.id.toString() === imageFrameTemplate).frame_image_url}
                        alt="Frame Preview"
                        className="w-full max-h-32 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Select
                    label="Frame cho Video"
                    value={videoFrameTemplate}
                    onChange={(e) => setVideoFrameTemplate(e.target.value)}
                    placeholder=""
                    options={[
                      { value: '', label: 'Không sử dụng frame' },
                      ...videoFrameTemplates.map(template => ({
                        value: template.id.toString(),
                        label: `${template.name}${template.category ? ` - ${template.category}` : ''}${template.aspect_ratio ? ` (${template.aspect_ratio})` : ''}`
                      }))
                    ]}
                  />
                  {videoFrameTemplate && videoFrameTemplates.find(t => t.id.toString() === videoFrameTemplate)?.frame_image_url && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img 
                        src={videoFrameTemplates.find(t => t.id.toString() === videoFrameTemplate).frame_image_url}
                        alt="Frame Preview"
                        className="w-full max-h-32 object-contain rounded"
                      />
                    </div>
                  )}
                </div>
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
                  ...watermarkTemplates.map(template => ({
                    value: template.id.toString(),
                    label: `${template.name}${template.category ? ` - ${template.category}` : ''} (Vị trí: ${template.watermark_position || 'bottom-right'})`
                  }))
                ]}
              />
              {watermarkTemplate && watermarkTemplates.find(t => t.id.toString() === watermarkTemplate)?.watermark_image_url && (
                <div className="mt-2 p-2 bg-gray-50 rounded border">
                  <p className="text-xs text-gray-600 mb-1">Preview watermark:</p>
                  <div className="flex items-center gap-2">
                    <img 
                      src={watermarkTemplates.find(t => t.id.toString() === watermarkTemplate).watermark_image_url}
                      alt="Watermark Preview"
                      className="w-24 h-24 object-contain rounded border bg-white"
                    />
                    <div className="text-xs text-gray-600">
                      <p>Vị trí: <strong>{watermarkTemplates.find(t => t.id.toString() === watermarkTemplate).watermark_position}</strong></p>
                      <p>Độ mờ: <strong>{watermarkTemplates.find(t => t.id.toString() === watermarkTemplate).watermark_opacity}</strong></p>
                    </div>
                  </div>
                </div>
              )}
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
