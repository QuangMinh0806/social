import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Hash, Droplet, Image, Video, Search, Edit, Trash2, Eye, Plus } from 'lucide-react';
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

const TemplateListPageNew = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // all, caption, hashtag, watermark, image_frame, video_frame

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
            setTemplates(response.data || []);
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

    const handleView = (templateId) => {
        // TODO: Implement view modal or navigate to detail page
        toast.info('Chức năng xem chi tiết đang được phát triển');
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
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                        <p className="text-sm text-gray-500">{template.category}</p>
                                    </div>
                                    <Badge color={
                                        template.template_type === 'caption' ? 'blue' :
                                            template.template_type === 'hashtag' ? 'green' :
                                                template.template_type === 'watermark' ? 'purple' :
                                                    template.template_type === 'image_frame' ? 'orange' :
                                                        'red'
                                    }>
                                        {template.template_type}
                                    </Badge>
                                </div>

                                {template.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                                )}

                                <div className="flex items-center gap-2 pt-3 border-t">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={<Eye size={16} />}
                                        onClick={() => handleView(template.id)}
                                    >
                                        Xem
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        icon={<Edit size={16} />}
                                        onClick={() => handleEdit(template.id)}
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        icon={<Trash2 size={16} />}
                                        onClick={() => handleDelete(template.id)}
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
        </div>
    );
};

export default TemplateListPageNew;
