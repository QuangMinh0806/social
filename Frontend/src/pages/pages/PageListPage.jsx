import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Facebook, Instagram, Twitter, Youtube, MessageCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { pageService } from '../../services/page.service';
import { platformService } from '../../services/platform.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Breadcrumb from '../../components/layout/Breadcrumb';
import LoginWithFb from "../../components/LoginWithFb";
import ConnectWithYoutube from '../../components/ConnectWithYoutube';
import ConnectWithTiktok from '../../components/ConnectWithTiktok';

const PageListPage = () => {
    const [pages, setPages] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPage, setEditingPage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [filterPlatform, setFilterPlatform] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [connectType, setConnectType] = useState("");
    const [formData, setFormData] = useState({
        name: '',
        platform_id: '',
        page_id: '',
        access_token: '',
        refesh_token: '',
        avatar_url: '',
        page_url: '',
    });

    const initialFormState = {
        name: '',
        platform_id: '',
        page_id: '',
        access_token: '',
        refesh_token: '',
        avatar_url: '',
        page_url: '',
    };

    useEffect(() => {
        fetchPages();
        fetchPlatforms();
    }, []);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const response = await pageService.getAll();
            setPages(response.data);
        } catch (error) {
            toast.error('Không thể tải danh sách trang');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlatforms = async () => {
        try {
            const response = await platformService.getActive();
            setPlatforms(response.data);
        } catch (error) {
            console.error('Error fetching platforms:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa trang này?')) return;

        try {
            await pageService.delete(id);
            toast.success('Xóa trang thành công');
            fetchPages();
        } catch (error) {
            toast.error('Không thể xóa trang');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.platform_id || !formData.page_id) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setSubmitting(true);

            // SỬA LỖI: Cập nhật apiData để gửi đủ trường
            const apiData = {
                page_name: formData.name,
                platform_id: parseInt(formData.platform_id),
                page_id: formData.page_id,
                access_token: formData.access_token || null,
                refesh_token: formData.refesh_token || null,
                avatar_url: formData.avatar_url || null,
                page_url: formData.page_url || null,
            };

            if (editingPage) {
                await pageService.update(editingPage.id, apiData);
                toast.success('Cập nhật trang thành công');
            } else {
                await pageService.create(apiData);
                toast.success('Thêm trang thành công');
            }

            setShowModal(false);
            setEditingPage(null);
            setFormData(initialFormState); // SỬA LỖI: Reset state
            setConnectType(""); // Reset kiểu kết nối
            fetchPages();
        } catch (error) {
            toast.error(editingPage ? 'Không thể cập nhật trang' : 'Không thể thêm trang');
            console.error('Submit error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getPlatformIcon = (platform, size = 20) => {
        const platformName = platform?.toLowerCase();
        const icons = {
            facebook: <Facebook size={size} className="text-blue-600" />,
            instagram: <Instagram size={size} className="text-pink-600" />,
            twitter: <Twitter size={size} className="text-blue-400" />,
            youtube: <Youtube size={size} className="text-red-600" />,
            tiktok: <MessageCircle size={size} className="text-black" />,
        };
        return icons[platformName] || <Facebook size={size} />;
    };

    // Statistics by platform
    const platformStats = useMemo(() => {
        const stats = {};
        platforms.forEach(platform => {
            const count = pages.filter(page => page.platform_id === platform.id).length;
            stats[platform.id] = {
                name: platform.name,
                count: count,
                icon: getPlatformIcon(platform.name, 32)
            };
        });
        return stats;
    }, [pages, platforms]);

    // Filtered pages
    const filteredPages = useMemo(() => {
        return pages.filter(page => {
            const matchPlatform = filterPlatform === 'all' || page.platform_id === parseInt(filterPlatform);
            const matchStatus = filterStatus === 'all' || page.status === filterStatus;
            const matchSearch = searchQuery === '' ||
                page.page_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                page.page_id?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchPlatform && matchStatus && matchSearch;
        });
    }, [pages, filterPlatform, filterStatus, searchQuery]);

    if (loading) return <Loading fullScreen />;

    return (
        <div>
            <Breadcrumb items={[{ label: 'Quản lý Page' }]} />

            {/* Platform Statistics */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Quản lý Page</h2>
                {/* SỬA RESPONSIVE 1: grid-cols-1 sm:grid-cols-2... */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(platformStats).map(([platformId, stat]) => (
                        <div
                            key={platformId}
                            className={`bg-white rounded-lg p-4 shadow-sm text-center hover:shadow-md transition-shadow cursor-pointer ${filterPlatform === platformId ? 'ring-2 ring-blue-500' : ''}`}
                            onClick={() => setFilterPlatform(filterPlatform === platformId ? 'all' : platformId)}
                        >
                            <div className="flex justify-center mb-2">
                                {stat.icon}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {stat.count}
                            </div>
                            <div className="text-sm text-gray-600">
                                {stat.name}
                            </div>
                            {filterPlatform === platformId && (
                                <Badge variant="success" className="mt-2">Đang lọc</Badge>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Card
                title="Danh sách Trang/Nhóm"
                subtitle={`Tổng ${filteredPages.length}/${pages.length} trang`}
                actions={
                    // SỬA RESPONSIVE 2: w-full sm:w-auto cho div và button
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                            icon={<Plus size={20} />}
                            onClick={() => setShowModal(true)}
                            className="w-full justify-center sm:w-auto"
                        >
                            Kết nối Page mới
                        </Button>
                    </div>
                }
            >
                {/* Filter Controls (Code này đã responsive tốt) */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Tìm kiếm page..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select
                        value={filterPlatform}
                        onChange={(e) => setFilterPlatform(e.target.value)}
                        placeholder=""
                        options={[
                            { value: 'all', label: 'Tất cả nền tảng' },
                            ...platforms.map(platform => ({
                                value: platform.id.toString(),
                                label: platform.name
                            }))
                        ]}
                    />

                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        placeholder=""
                        options={[
                            { value: 'all', label: 'Tất cả trạng thái' },
                            { value: 'connected', label: 'Đã kết nối' },
                            { value: 'disconnected', label: 'Ngắt kết nối' },
                        ]}
                    />
                </div>

                {/* SỬA RESPONSIVE 3: Thêm xl:grid-cols-4 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPages.map((page) => (
                        <div key={page.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {page.avatar_url ? (
                                            <img
                                                src={page.avatar_url}
                                                alt={page.page_name}
                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                                                {getPlatformIcon(page.platform?.name)}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{page.page_name}</h3>
                                            <p className="text-xs text-gray-500">ID: {page.page_id}</p>
                                        </div>
                                    </div>
                                    <Badge variant={page.status === 'connected' ? 'success' : 'default'} className="flex-shrink-0 ml-2">
                                        {page.status === 'connected' ? 'Đã kết nối' : page.status === 'disconnected' ? 'Ngắt kết nối' : 'Lỗi'}
                                    </Badge>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Nền tảng:</span> {page.platform?.name || 'N/A'}
                                    </p>
                                    {page.follower_count > 0 && (
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Người theo dõi:</span> {page.follower_count.toLocaleString()}
                                        </p>
                                    )}
                                    {page.page_url && (
                                        <a
                                            href={page.page_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline block truncate"
                                        >
                                            {page.page_url}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    icon={<Edit size={16} />}
                                    onClick={() => {
                                        setEditingPage(page);
                                        setFormData({
                                            name: page.page_name,
                                            platform_id: page.platform_id,
                                            page_id: page.page_id,
                                            access_token: page.access_token,
                                            refesh_token: page.refesh_token,
                                            avatar_url: page.avatar_url,
                                            page_url: page.page_url,
                                        });
                                        setConnectType("manual"); // Mặc định là manual khi sửa
                                        setShowModal(true);
                                    }}
                                >
                                    Sửa
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => handleDelete(page.id)}
                                >
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPages.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">
                            {searchQuery || filterPlatform !== 'all' || filterStatus !== 'all'
                                ? 'Không tìm thấy trang nào phù hợp'
                                : 'Chưa có trang nào'
                            }
                        </p>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingPage(null);
                    setFormData(initialFormState); // SỬA LỖI: Reset state
                    setConnectType("");
                }}
                title={editingPage ? 'Chỉnh sửa trang' : 'Kết nối trang mới'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Nền tảng *"
                        value={formData.platform_id}
                        onChange={(e) => setFormData({ ...formData, platform_id: e.target.value })}
                        placeholder="Chọn nền tảng"
                        options={platforms.map(platform => ({
                            value: platform.id,
                            label: platform.name
                        }))}
                        required
                    />

                    <Select
                        label="Kiểu kết nối *"
                        value={connectType}
                        onChange={(e) => setConnectType(e.target.value)}
                        placeholder="Chọn kiểu kết nối"
                        options={[
                            { value: "manual", label: "Kết nối thủ công" },
                            { value: "auto", label: "Kết nối trực tiếp" }
                        ]}
                        required
                    />

                    {connectType === "manual" && (
                        <>
                            <Input
                                label="Tên trang *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nhập tên trang"
                                required
                            />

                            <Input
                                label="Page ID *"
                                value={formData.page_id}
                                onChange={(e) => setFormData({ ...formData, page_id: e.target.value })}
                                placeholder="Nhập Page ID"
                                required
                            />

                            <Input
                                label="Access Token"
                                value={formData.access_token}
                                onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                                placeholder="Nhập Access Token (tùy chọn)"
                            />

                            <Input
                                label="Refresh Token"
                                // SỬA LỖI: value={formData.refesh_token}
                                value={formData.refesh_token}
                                onChange={(e) => setFormData({ ...formData, refesh_token: e.target.value })}
                                placeholder="Nhập Refresh Token (tùy chọn)"
                            />

                            <Input
                                label="URL trang"
                                // SỬA LỖI: value={formData.page_url}
                                value={formData.page_url}
                                onChange={(e) => setFormData({ ...formData, page_url: e.target.value })}
                                placeholder="Nhập url trang (tùy chọn)"
                            />


                            <Input
                                label="Avatar URL"
                                // SỬA LỖI: value={formData.avatar_url}
                                value={formData.avatar_url}
                                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                placeholder="Nhập avatar url (tùy chọn)"
                            />
                            {/* SỬA RESPONSIVE 4: flex-col-reverse sm:flex-row và w-full sm:w-auto */}
                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto justify-center"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingPage(null);
                                        setFormData(initialFormState);
                                        setConnectType("");
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto justify-center"
                                >
                                    {submitting ? 'Đang xử lý...' : (editingPage ? 'Cập nhật' : 'Thêm mới')}
                                </Button>
                            </div>
                        </>
                    )}

                    {connectType === "auto" && (
                        <div className='pt-4'>
                            {formData.platform_id == 10 && <LoginWithFb />}
                            {formData.platform_id == 11 && <LoginWithFb />}
                            {formData.platform_id == 14 && <ConnectWithYoutube />}
                            {formData.platform_id == 15 && <ConnectWithTiktok />}
                            {!formData.platform_id && (
                                <p className="text-gray-500 text-center">Vui lòng chọn nền tảng ở trên để bắt đầu kết nối.</p>
                            )}
                        </div>
                    )}
                </form>
            </Modal>
        </div>
    );
};

export default PageListPage;