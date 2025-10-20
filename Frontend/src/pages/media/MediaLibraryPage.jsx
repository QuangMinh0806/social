import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Image as ImageIcon, Video, Music, Eye, Trash2, Download, Grid, List, Upload, Cloud, Film, Import } from 'lucide-react';
import toast from 'react-hot-toast';
import { mediaService } from '../../services/media.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import UploadModal from '../../components/media/UploadModal';
import ImportModal from '../../components/media/ImportModal';

const MediaLibraryPage = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const itemsPerPage = 12;

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await mediaService.getAll();
      setMedia(response.data || []);
    } catch (error) {
      toast.error('Không thể tải thư viện media');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) return;

    try {
      await mediaService.delete(id);
      toast.success('Xóa file thành công');
      fetchMedia();
    } catch (error) {
      toast.error('Không thể xóa file');
    }
  };

  const handlePreview = (item) => {
    setSelectedMedia(item);
    setShowPreview(true);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon size={48} className="text-blue-500" />;
      case 'video':
        return <Video size={48} className="text-purple-500" />;
      case 'gif':
        return <Film size={48} className="text-green-500" />;
      default:
        return <ImageIcon size={48} className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Statistics
  const mediaStats = useMemo(() => {
    const imageCount = media.filter(m => m.file_type === 'image').length;
    const videoCount = media.filter(m => m.file_type === 'video').length;
    const audioCount = media.filter(m => m.file_type === 'audio').length;
    const totalSize = media.reduce((sum, m) => sum + (m.file_size || 0), 0);

    return {
      imageCount,
      videoCount,
      audioCount,
      totalSize: (totalSize / (1024 * 1024 * 1024)).toFixed(1) // GB
    };
  }, [media]);

  // Filtered media
  const filteredMedia = useMemo(() => {
    return media.filter(item => {
      const matchType = typeFilter === 'all' || item.file_type === typeFilter;
      const matchSearch = searchTerm === '' ||
        item.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && JSON.stringify(item.tags).toLowerCase().includes(searchTerm.toLowerCase()));

      return matchType && matchSearch;
    });
  }, [media, typeFilter, searchTerm]);

  const paginatedMedia = filteredMedia.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Thư viện Media' }]} />

      {/* Statistics Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Thư viện Media</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Images */}
          <div
            className={`bg-white rounded-lg p-4 shadow-sm text-center hover:shadow-md transition-shadow cursor-pointer ${typeFilter === 'image' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'image' ? 'all' : 'image')}
          >
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ImageIcon size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mediaStats.imageCount}
            </div>
            <div className="text-sm text-gray-600">
              Hình ảnh
            </div>
          </div>

          {/* Videos */}
          <div
            className={`bg-white rounded-lg p-4 shadow-sm text-center hover:shadow-md transition-shadow cursor-pointer ${typeFilter === 'video' ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'video' ? 'all' : 'video')}
          >
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mediaStats.videoCount}
            </div>
            <div className="text-sm text-gray-600">
              Video
            </div>
          </div>

          {/* Audio */}
          <div
            className={`bg-white rounded-lg p-4 shadow-sm text-center hover:shadow-md transition-shadow cursor-pointer ${typeFilter === 'audio' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setTypeFilter(typeFilter === 'audio' ? 'all' : 'audio')}
          >
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Music size={24} className="text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mediaStats.audioCount}
            </div>
            <div className="text-sm text-gray-600">
              Audio
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Cloud size={24} className="text-gray-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mediaStats.totalSize}
            </div>
            <div className="text-sm text-gray-600">
              GB đã dùng
            </div>
          </div>
        </div>
      </div>

      <Card
        title="Danh sách Media"
        subtitle={`Tổng ${filteredMedia.length}/${media.length} file`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="primary"
              icon={<Import size={20} />}
              onClick={() => setShowImport(true)}
            >
              Tải video từ link
            </Button>
            <Button
              variant="primary"
              icon={<Upload size={20} />}
              onClick={() => setShowUpload(true)}
            >
              Tải video từ thiết bị
            </Button>
          </div>
        }
      >
        {/* Filter Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder=""
              options={[
                { value: 'all', label: 'Tất cả loại' },
                { value: 'image', label: 'Hình ảnh' },
                { value: 'video', label: 'Video' },
                { value: 'audio', label: 'Audio' }
              ]}
            />
          </div>

          <div className="flex-1">
            <Select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              placeholder=""
              options={[
                { value: 'all', label: 'Tất cả thời gian' },
                { value: 'today', label: 'Hôm nay' },
                { value: 'week', label: 'Tuần này' },
                { value: 'month', label: 'Tháng này' }
              ]}
            />
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Tìm kiếm media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              title="Grid View"
            >
              <Grid size={20} className={viewMode === 'grid' ? 'text-blue-600' : 'text-gray-600'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              title="List View"
            >
              <List size={20} className={viewMode === 'list' ? 'text-blue-600' : 'text-gray-600'} />
            </button>
          </div>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm || typeFilter !== 'all'
                ? 'Không tìm thấy file nào phù hợp'
                : 'Chưa có file nào'
              }
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setShowUpload(true)}
            >
              Tải lên file đầu tiên
            </Button>
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
              : 'space-y-2'
            }>
              {paginatedMedia.map((item) => (
                viewMode === 'grid' ? (
                  // Grid View
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {item.thumbnail_url || (item.file_type === 'image' && item.file_url) ? (
                        <img
                          src={item.thumbnail_url || item.file_url}
                          alt={item.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getFileIcon(item.file_type)
                      )}

                      {/* Type Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={item.file_type === 'image' ? 'primary' : item.file_type === 'video' ? 'purple' : 'success'}
                          size="sm"
                          className="uppercase"
                        >
                          {item.file_type}
                        </Badge>
                      </div>

                      {/* Video duration */}
                      {item.file_type === 'video' && item.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePreview(item)}
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                            title="Xem"
                          >
                            <Eye size={16} />
                          </button>
                          <a
                            href={item.file_url}
                            download
                            className="p-2 bg-white rounded-full hover:bg-gray-100"
                            title="Tải xuống"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-white rounded-full hover:bg-red-100 text-red-600"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate" title={item.file_name}>
                        {item.file_name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(item.file_size)}
                        </span>
                        {item.width && item.height && (
                          <span className="text-xs text-gray-500">
                            {item.width} × {item.height}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ) : (
                  // List View
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.thumbnail_url || (item.file_type === 'image' && item.file_url) ? (
                        <img
                          src={item.thumbnail_url || item.file_url}
                          alt={item.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getFileIcon(item.file_type)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.file_name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{formatFileSize(item.file_size)}</span>
                        {item.width && item.height && (
                          <span>{item.width} × {item.height}</span>
                        )}
                        <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={item.file_type === 'image' ? 'primary' : item.file_type === 'video' ? 'purple' : 'success'}
                        size="sm"
                      >
                        {item.file_type}
                      </Badge>
                      <button
                        onClick={() => handlePreview(item)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Xem"
                      >
                        <Eye size={18} className="text-gray-600" />
                      </button>
                      <a
                        href={item.file_url}
                        download
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Tải xuống"
                      >
                        <Download size={18} className="text-gray-600" />
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-red-100 rounded"
                        title="Xóa"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={selectedMedia?.file_name || 'Xem trước'}
        size="large"
      >
        {selectedMedia && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg flex items-center justify-center p-4">
              {selectedMedia.file_type === 'image' || selectedMedia.file_type === 'gif' ? (
                <img
                  src={selectedMedia.file_url}
                  alt={selectedMedia.file_name}
                  className="max-w-full max-h-[500px] object-contain"
                />
              ) : selectedMedia.file_type === 'video' ? (
                <video
                  src={selectedMedia.file_url}
                  controls
                  className="max-w-full max-h-[500px]"
                >
                  Trình duyệt không hỗ trợ video
                </video>
              ) : (
                <div className="text-gray-500">Không thể xem trước file này</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tên file:</span>
                <p className="font-medium">{selectedMedia.file_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Loại:</span>
                <p className="font-medium">{selectedMedia.file_type}</p>
              </div>
              <div>
                <span className="text-gray-600">Kích thước:</span>
                <p className="font-medium">{formatFileSize(selectedMedia.file_size)}</p>
              </div>
              {selectedMedia.width && selectedMedia.height && (
                <div>
                  <span className="text-gray-600">Kích thước:</span>
                  <p className="font-medium">{selectedMedia.width} × {selectedMedia.height}</p>
                </div>
              )}
              {selectedMedia.duration && (
                <div>
                  <span className="text-gray-600">Thời lượng:</span>
                  <p className="font-medium">{selectedMedia.duration}s</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">MIME Type:</span>
                <p className="font-medium">{selectedMedia.mime_type || 'N/A'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                icon={<Download size={20} />}
                as="a"
                href={selectedMedia.file_url}
                download
              >
                Tải xuống
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploadComplete={fetchMedia}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={fetchMedia}
      />
    </div>
  );
};

export default MediaLibraryPage;
