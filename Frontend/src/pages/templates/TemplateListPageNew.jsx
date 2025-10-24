import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Hash, Droplet, Image, Video, Search, Edit, Trash2, Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { templateService } from '../../services/template.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Modal from '../../components/common/Modal';

const TemplateListPageNew = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [viewTemplate, setViewTemplate] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    const filterButtons = [
        { id: 'all', label: 'Tất cả', icon: null, color: 'gray' },
        { id: 'caption', label: 'Caption', icon: <MessageSquare size={16} />, color: 'blue' },
        { id: 'hashtag', label: 'Hashtag', icon: <Hash size={16} />, color: 'green' },
        { id: 'watermark', label: 'Watermark', icon: <Droplet size={16} />, color: 'purple' },
        { id: 'image_frame', label: 'Khung Ảnh', icon: <Image size={16} />, color: 'orange' },
        { id: 'video_frame', label: 'Khung Video', icon: <Video size={16} />, color: 'red' },
    ];

    const createButtons = [
        { id: 'caption', label: 'Caption', icon: <MessageSquare size={16} />, color: 'blue' },
        { id: 'hashtag', label: 'Hashtag', icon: <Hash size={16} />, color: 'green' },
        { id: 'watermark', label: 'Watermark', icon: <Droplet size={16} />, color: 'purple' },
        { id: 'image_frame', label: 'Khung Ảnh', icon: <Image size={16} />, color: 'orange' },
        { id: 'video_frame', label: 'Khung Video', icon: <Video size={16} />, color: 'red' },
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await templateService.getAll();
            const sortedTemplates = (response.data || []).sort((a, b) => {
                return new Date(b.created_at) - new Date(a.created_at);
            });
            setTemplates(sortedTemplates);
        } catch (error) {
            toast.error('Không thể tải danh sách template');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (type) => {
        setActiveFilter(type);
    };

    const handleCreateNew = (type) => {
        navigate(`/templates/create?type=${type}`);
    };

    const handleEdit = (templateId) => {
        navigate(`/templates/${templateId}/edit`);
    };

    const handleView = (template) => {
        setViewTemplate(template);
        setShowViewModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa template này?')) return;

        try {
            await templateService.delete(id);
            toast.success('Xóa template thành công');
            fetchTemplates();
        } catch (error) {
            toast.error('Không thể xóa template');
        }
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' || template.template_type === activeFilter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <Loading fullScreen />;

    return (
        <div className="space-y-4 md:space-y-6 p-4 md:p-0">
            {/* Breadcrumb - Hide on mobile */}
            <div className="hidden md:block">
                <Breadcrumb items={[{ label: 'Templates & Watermarks' }]} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Templates & Watermarks</h1>
            </div>

            {/* Filter and Create Section - Stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Bộ lọc Templates */}
                <Card>
                    <div className="space-y-3 md:space-y-4">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Bộ lọc:</h3>
                        
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {filterButtons.map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleFilterChange(btn.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                                        activeFilter === btn.id
                                            ? btn.id === 'all'
                                                ? 'bg-gray-700 text-white shadow-md'
                                                : btn.color === 'blue'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : btn.color === 'green'
                                                        ? 'bg-green-600 text-white shadow-md'
                                                        : btn.color === 'purple'
                                                            ? 'bg-purple-600 text-white shadow-md'
                                                            : btn.color === 'orange'
                                                                ? 'bg-orange-600 text-white shadow-md'
                                                                : 'bg-red-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {btn.icon}
                                    <span className="hidden sm:inline">{btn.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </Card>

                {/* Tạo mới Template */}
                <Card>
                    <div className="space-y-3 md:space-y-4">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900">Tạo mới:</h3>
                        
                        {/* Create Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {createButtons.map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleCreateNew(btn.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium text-white transition-all shadow-md hover:shadow-lg ${
                                        btn.color === 'blue'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : btn.color === 'green'
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : btn.color === 'purple'
                                                    ? 'bg-purple-600 hover:bg-purple-700'
                                                    : btn.color === 'orange'
                                                        ? 'bg-orange-600 hover:bg-orange-700'
                                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    <Plus size={16} />
                                    {btn.icon}
                                    <span className="hidden sm:inline">{btn.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Info Box - Hide details on mobile */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                            <p className="text-xs md:text-sm text-blue-800">
                                <strong>💡 Hướng dẫn:</strong> Click vào loại template bạn muốn tạo
                            </p>
                            <ul className="hidden md:block text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                                <li><strong>Caption:</strong> Nội dung bài viết</li>
                                <li><strong>Hashtag:</strong> Bộ hashtag cho bài đăng</li>
                                <li><strong>Watermark:</strong> Logo đóng dấu</li>
                                <li><strong>Khung Ảnh/Video:</strong> Frame trang trí</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Templates Grid */}
            <Card title={
                <span className="text-base md:text-lg">
                    Danh sách templates {activeFilter !== 'all' ? `(${filterButtons.find(b => b.id === activeFilter)?.label})` : ''}
                </span>
            }>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow">
                            <div className="space-y-3">
                                {/* Preview Image */}
                                {(template.frame_image_url || template.watermark_image_url) && (
                                    <div className="w-full h-36 md:h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                        <img 
                                            src={template.frame_image_url || template.watermark_image_url}
                                            alt={template.name}
                                            className="max-w-full max-h-full object-contain"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="text-gray-400 text-xs md:text-sm">Không thể tải ảnh</div>';
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">{template.name}</h3>
                                        {template.category && (
                                            <p className="text-xs md:text-sm text-gray-500 truncate">{template.category}</p>
                                        )}
                                        {template.aspect_ratio && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                📐 {template.aspect_ratio}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            🕒 {new Date(template.created_at).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    <Badge color={
                                        template.template_type === 'caption' ? 'blue' :
                                        template.template_type === 'hashtag' ? 'green' :
                                        template.template_type === 'watermark' ? 'purple' :
                                        template.template_type === 'image_frame' ? 'orange' : 'red'
                                    }>
                                        <span className="hidden md:inline">
                                            {template.template_type === 'caption' ? 'Caption' :
                                             template.template_type === 'hashtag' ? 'Hashtag' :
                                             template.template_type === 'watermark' ? 'Watermark' :
                                             template.template_type === 'image_frame' ? 'Khung Ảnh' : 'Khung Video'}
                                        </span>
                                        <span className="md:hidden">
                                            {template.template_type === 'caption' ? 'C' :
                                             template.template_type === 'hashtag' ? '#' :
                                             template.template_type === 'watermark' ? '💧' :
                                             template.template_type === 'image_frame' ? '🖼️' : '🎬'}
                                        </span>
                                    </Badge>
                                </div>

                                {/* Content Preview - Hide on mobile */}
                                {template.caption && (
                                    <div className="hidden md:block bg-blue-50 p-3 rounded border border-blue-200">
                                        <p className="text-xs text-blue-600 font-medium mb-1">Caption:</p>
                                        <p className="text-sm text-gray-700 line-clamp-3">{template.caption}</p>
                                    </div>
                                )}

                                {template.hashtags && Array.isArray(template.hashtags) && template.hashtags.length > 0 && (
                                    <div className="hidden md:block bg-green-50 p-3 rounded border border-green-200">
                                        <p className="text-xs text-green-600 font-medium mb-1">Hashtags:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {template.hashtags.slice(0, 5).map((tag, idx) => (
                                                <span key={idx} className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                            {template.hashtags.length > 5 && (
                                                <span className="text-xs text-green-600">+{template.hashtags.length - 5}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-3 border-t">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={<Eye size={14} />}
                                        onClick={() => handleView(template)}
                                        className="flex-1 text-xs md:text-sm py-1.5 md:py-2"
                                    >
                                        <span className="hidden sm:inline">Xem</span>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={<Edit size={14} />}
                                        onClick={() => handleEdit(template.id)}
                                        className="flex-1 text-xs md:text-sm py-1.5 md:py-2"
                                    >
                                        <span className="hidden sm:inline">Sửa</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={<Trash2 size={14} />}
                                        onClick={() => handleDelete(template.id)}
                                        className="flex-1 text-xs md:text-sm py-1.5 md:py-2"
                                    >
                                        <span className="hidden sm:inline">Xóa</span>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredTemplates.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <p className="text-sm md:text-base text-gray-500">Không tìm thấy template nào</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* View Modal */}
            {showViewModal && viewTemplate && (
                <Modal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setViewTemplate(null);
                    }}
                    title={<span className="text-base md:text-lg">{viewTemplate.name}</span>}
                    size="lg"
                >
                    <div className="space-y-4 md:space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Type Badge */}
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge color={
                                viewTemplate.template_type === 'caption' ? 'blue' :
                                viewTemplate.template_type === 'hashtag' ? 'green' :
                                viewTemplate.template_type === 'watermark' ? 'purple' :
                                viewTemplate.template_type === 'image_frame' ? 'orange' : 'red'
                            }>
                                {viewTemplate.template_type === 'caption' ? '📝 Caption' :
                                 viewTemplate.template_type === 'hashtag' ? '# Hashtag' :
                                 viewTemplate.template_type === 'watermark' ? '💧 Watermark' :
                                 viewTemplate.template_type === 'image_frame' ? '🖼️ Khung Ảnh' : '🎬 Khung Video'}
                            </Badge>
                            {viewTemplate.category && (
                                <span className="text-xs md:text-sm text-gray-600">
                                    Danh mục: <strong>{viewTemplate.category}</strong>
                                </span>
                            )}
                        </div>

                        {/* Image Preview */}
                        {(viewTemplate.frame_image_url || viewTemplate.watermark_image_url) && (
                            <div className="border-2 border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50">
                                <p className="text-xs md:text-sm font-medium text-gray-700 mb-3">
                                    {viewTemplate.template_type === 'watermark' ? 'Ảnh Watermark:' : 'Ảnh Khung:'}
                                </p>
                                <div className="flex justify-center">
                                    <img 
                                        src={viewTemplate.frame_image_url || viewTemplate.watermark_image_url}
                                        alt={viewTemplate.name}
                                        className="max-w-full max-h-64 md:max-h-96 object-contain rounded border shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Aspect Ratio */}
                        {viewTemplate.aspect_ratio && (
                            <div className="bg-orange-50 p-3 md:p-4 rounded-lg border border-orange-200">
                                <p className="text-xs md:text-sm font-medium text-orange-800 mb-1">📐 Tỷ lệ:</p>
                                <p className="text-base md:text-lg font-bold text-orange-900">{viewTemplate.aspect_ratio}</p>
                            </div>
                        )}

                        {/* Caption */}
                        {viewTemplate.caption && (
                            <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                                <p className="text-xs md:text-sm font-medium text-blue-800 mb-2">📝 Caption:</p>
                                <p className="text-sm md:text-base text-gray-800 whitespace-pre-wrap">{viewTemplate.caption}</p>
                            </div>
                        )}

                        {/* Hashtags */}
                        {viewTemplate.hashtags && Array.isArray(viewTemplate.hashtags) && viewTemplate.hashtags.length > 0 && (
                            <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                                <p className="text-xs md:text-sm font-medium text-green-800 mb-2"># Hashtags ({viewTemplate.hashtags.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                    {viewTemplate.hashtags.map((tag, idx) => (
                                        <span key={idx} className="bg-green-200 text-green-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Watermark Settings */}
                        {viewTemplate.template_type === 'watermark' && (
                            <div className="bg-purple-50 p-3 md:p-4 rounded-lg border border-purple-200">
                                <p className="text-xs md:text-sm font-medium text-purple-800 mb-3">💧 Cài đặt:</p>
                                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                                    <div>
                                        <p className="text-purple-600 mb-1">Vị trí:</p>
                                        <p className="font-semibold text-purple-900">
                                            {viewTemplate.watermark_position === 'top-left' && 'Trên trái'}
                                            {viewTemplate.watermark_position === 'top-right' && 'Trên phải'}
                                            {viewTemplate.watermark_position === 'bottom-left' && 'Dưới trái'}
                                            {viewTemplate.watermark_position === 'bottom-right' && 'Dưới phải'}
                                            {viewTemplate.watermark_position === 'center' && 'Giữa'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-purple-600 mb-1">Độ mờ:</p>
                                        <p className="font-semibold text-purple-900">{viewTemplate.watermark_opacity}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {viewTemplate.description && (
                            <div className="bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
                                <p className="text-xs md:text-sm font-medium text-gray-800 mb-2">📄 Mô tả:</p>
                                <p className="text-sm md:text-base text-gray-700">{viewTemplate.description}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 pt-4 border-t">
                            <Button
                                variant="primary"
                                icon={<Edit size={16} />}
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEdit(viewTemplate.id);
                                }}
                                className="w-full sm:flex-1"
                            >
                                Chỉnh sửa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewTemplate(null);
                                }}
                                className="w-full sm:flex-1"
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default TemplateListPageNew;