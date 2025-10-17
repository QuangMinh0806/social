import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Hash, Droplet, Image, Video, Search, Edit, Trash2, Eye, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { templateService } from '../../services/template.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';
import Modal from '../../components/common/Modal';

const TemplateListPageNew = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, caption, hashtag, watermark, image_frame, video_frame
    const [viewTemplate, setViewTemplate] = useState(null); // Template đang xem
    const [showViewModal, setShowViewModal] = useState(false);

    const filterButtons = [
        { id: 'all', label: 'Tất cả', icon: null, color: 'gray' },
        { id: 'caption', label: 'Caption', icon: <MessageSquare size={18} />, color: 'blue' },
        { id: 'hashtag', label: 'Hashtag', icon: <Hash size={18} />, color: 'green' },
        { id: 'watermark', label: 'Watermark', icon: <Droplet size={18} />, color: 'purple' },
        { id: 'image_frame', label: 'Khung Ảnh', icon: <Image size={18} />, color: 'orange' },
        { id: 'video_frame', label: 'Khung Video', icon: <Video size={18} />, color: 'red' },
    ];

    const createButtons = [
        { id: 'caption', label: 'Caption', icon: <MessageSquare size={18} />, color: 'blue' },
        { id: 'hashtag', label: 'Hashtag', icon: <Hash size={18} />, color: 'green' },
        { id: 'watermark', label: 'Watermark', icon: <Droplet size={18} />, color: 'purple' },
        { id: 'image_frame', label: 'Khung Ảnh', icon: <Image size={18} />, color: 'orange' },
        { id: 'video_frame', label: 'Khung Video', icon: <Video size={18} />, color: 'red' },
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await templateService.getAll();
            // Sắp xếp theo thời gian tạo, mới nhất trước
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
        // Navigate to create page with type parameter
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

    // Filter templates
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'all' || template.template_type === activeFilter;
        return matchesSearch && matchesFilter;
    });



    if (loading) return <Loading fullScreen />;

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: 'Templates & Watermarks' }]} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Templates & Watermarks</h1>
            </div>

            {/* Filter and Create Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bộ lọc Templates */}
                <Card>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Bộ lọc Templates:</h3>
                        
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {filterButtons.map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleFilterChange(btn.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
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
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm template..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </Card>

                {/* Tạo mới Template */}
                <Card>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Tạo mới Template:</h3>
                        
                        {/* Create Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {createButtons.map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleCreateNew(btn.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg ${
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
                                    <Plus size={18} />
                                    {btn.icon}
                                    {btn.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-800">
                                <strong>💡 Hướng dẫn:</strong> Click vào loại template bạn muốn tạo
                            </p>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
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
            <Card title={`Danh sách templates ${activeFilter !== 'all' ? `(${filterButtons.find(b => b.id === activeFilter)?.label})` : ''}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-lg transition-shadow">
                            <div className="space-y-3">
                                {/* Preview Image for Frame/Watermark */}
                                {(template.frame_image_url || template.watermark_image_url) && (
                                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                        <img 
                                            src={template.frame_image_url || template.watermark_image_url}
                                            alt={template.name}
                                            className="max-w-full max-h-full object-contain"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div class="text-gray-400 text-sm">Không thể tải ảnh</div>';
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                        {template.category && (
                                            <p className="text-sm text-gray-500">{template.category}</p>
                                        )}
                                        {template.aspect_ratio && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                📐 Tỷ lệ: {template.aspect_ratio}
                                            </p>
                                        )}
                                        {template.created_at && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                🕒 {new Date(template.created_at).toLocaleString('vi-VN', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        )}
                                    </div>
                                    <Badge color={
                                        template.template_type === 'caption' ? 'blue' :
                                            template.template_type === 'hashtag' ? 'green' :
                                                template.template_type === 'watermark' ? 'purple' :
                                                    template.template_type === 'image_frame' ? 'orange' :
                                                        'red'
                                    }>
                                        {template.template_type === 'caption' ? 'Caption' :
                                         template.template_type === 'hashtag' ? 'Hashtag' :
                                         template.template_type === 'watermark' ? 'Watermark' :
                                         template.template_type === 'image_frame' ? 'Khung Ảnh' :
                                         'Khung Video'}
                                    </Badge>
                                </div>

                                {/* Content Preview */}
                                {template.caption && (
                                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                        <p className="text-xs text-blue-600 font-medium mb-1">Caption:</p>
                                        <p className="text-sm text-gray-700 line-clamp-3">{template.caption}</p>
                                    </div>
                                )}

                                {template.hashtags && Array.isArray(template.hashtags) && template.hashtags.length > 0 && (
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                        <p className="text-xs text-green-600 font-medium mb-1">Hashtags:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {template.hashtags.slice(0, 5).map((tag, idx) => (
                                                <span key={idx} className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                            {template.hashtags.length > 5 && (
                                                <span className="text-xs text-green-600">+{template.hashtags.length - 5} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {template.watermark_position && (
                                    <div className="text-xs text-gray-500">
                                        <span className="font-medium">Vị trí:</span> {template.watermark_position} • 
                                        <span className="font-medium"> Độ mờ:</span> {template.watermark_opacity}
                                    </div>
                                )}

                                {template.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                                )}

                                <div className="flex items-center gap-2 pt-3 border-t">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={<Eye size={16} />}
                                        onClick={() => handleView(template)}
                                        className="flex-1"
                                    >
                                        Xem
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={<Edit size={16} />}
                                        onClick={() => handleEdit(template.id)}
                                        className="flex-1"
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={<Trash2 size={16} />}
                                        onClick={() => handleDelete(template.id)}
                                        className="flex-1"
                                    >
                                        Xóa
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredTemplates.length === 0 && (
                        <div className="col-span-3 text-center py-12">
                            <p className="text-gray-500">Không tìm thấy template nào</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal xem chi tiết template */}
            {showViewModal && viewTemplate && (
                <Modal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setViewTemplate(null);
                    }}
                    title={`Chi tiết Template: ${viewTemplate.name}`}
                    size="lg"
                >
                    <div className="space-y-6">
                        {/* Type Badge */}
                        <div className="flex items-center gap-3">
                            <Badge color={
                                viewTemplate.template_type === 'caption' ? 'blue' :
                                viewTemplate.template_type === 'hashtag' ? 'green' :
                                viewTemplate.template_type === 'watermark' ? 'purple' :
                                viewTemplate.template_type === 'image_frame' ? 'orange' :
                                'red'
                            }>
                                {viewTemplate.template_type === 'caption' ? '📝 Caption' :
                                 viewTemplate.template_type === 'hashtag' ? '# Hashtag' :
                                 viewTemplate.template_type === 'watermark' ? '💧 Watermark' :
                                 viewTemplate.template_type === 'image_frame' ? '🖼️ Khung Ảnh' :
                                 '🎬 Khung Video'}
                            </Badge>
                            {viewTemplate.category && (
                                <span className="text-sm text-gray-600">
                                    Danh mục: <strong>{viewTemplate.category}</strong>
                                </span>
                            )}
                        </div>

                        {/* Image Preview */}
                        {(viewTemplate.frame_image_url || viewTemplate.watermark_image_url) && (
                            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                                <p className="text-sm font-medium text-gray-700 mb-3">
                                    {viewTemplate.template_type === 'watermark' ? 'Ảnh Watermark:' : 'Ảnh Khung:'}
                                </p>
                                <div className="flex justify-center">
                                    <img 
                                        src={viewTemplate.frame_image_url || viewTemplate.watermark_image_url}
                                        alt={viewTemplate.name}
                                        className="max-w-full max-h-96 object-contain rounded border shadow-sm"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="text-red-500 text-sm">Không thể tải ảnh</div>';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Aspect Ratio */}
                        {viewTemplate.aspect_ratio && (
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-sm font-medium text-orange-800 mb-1">📐 Tỷ lệ khung hình:</p>
                                <p className="text-lg font-bold text-orange-900">{viewTemplate.aspect_ratio}</p>
                            </div>
                        )}

                        {/* Caption Content */}
                        {viewTemplate.caption && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm font-medium text-blue-800 mb-2">📝 Nội dung Caption:</p>
                                <p className="text-gray-800 whitespace-pre-wrap">{viewTemplate.caption}</p>
                            </div>
                        )}

                        {/* Hashtags */}
                        {viewTemplate.hashtags && Array.isArray(viewTemplate.hashtags) && viewTemplate.hashtags.length > 0 && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-sm font-medium text-green-800 mb-2"># Hashtags ({viewTemplate.hashtags.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                    {viewTemplate.hashtags.map((tag, idx) => (
                                        <span key={idx} className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Watermark Settings */}
                        {viewTemplate.template_type === 'watermark' && (
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <p className="text-sm font-medium text-purple-800 mb-3">💧 Cài đặt Watermark:</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-purple-600 mb-1">Vị trí:</p>
                                        <p className="font-semibold text-purple-900">
                                            {viewTemplate.watermark_position === 'top-left' && 'Góc trên trái'}
                                            {viewTemplate.watermark_position === 'top-right' && 'Góc trên phải'}
                                            {viewTemplate.watermark_position === 'bottom-left' && 'Góc dưới trái'}
                                            {viewTemplate.watermark_position === 'bottom-right' && 'Góc dưới phải'}
                                            {viewTemplate.watermark_position === 'center' && 'Giữa'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-600 mb-1">Độ trong suốt:</p>
                                        <p className="font-semibold text-purple-900">{viewTemplate.watermark_opacity}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {viewTemplate.description && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-800 mb-2">📄 Mô tả:</p>
                                <p className="text-gray-700">{viewTemplate.description}</p>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-800 mb-3">ℹ️ Thông tin:</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">ID:</span>
                                    <span className="ml-2 font-mono text-gray-900">{viewTemplate.id}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Lượt sử dụng:</span>
                                    <span className="ml-2 font-semibold text-gray-900">{viewTemplate.usage_count || 0}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-600">Thời gian tạo:</span>
                                    <span className="ml-2 text-gray-900 font-medium">
                                        {viewTemplate.created_at ? new Date(viewTemplate.created_at).toLocaleString('vi-VN', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        }) : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Công khai:</span>
                                    <span className={`ml-2 font-semibold ${viewTemplate.is_public ? 'text-green-600' : 'text-red-600'}`}>
                                        {viewTemplate.is_public ? '✓ Có' : '✗ Không'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t">
                            <Button
                                variant="primary"
                                icon={<Edit size={18} />}
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEdit(viewTemplate.id);
                                }}
                                className="flex-1"
                            >
                                Chỉnh sửa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowViewModal(false);
                                    setViewTemplate(null);
                                }}
                                className="flex-1"
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
