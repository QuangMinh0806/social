import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Video, Share2, Users, Plus, Upload, UserPlus, Clock } from 'lucide-react';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Badge from '../../components/common/Badge';
import { postService } from '../../services/post.service';
import { pageService } from '../../services/page.service';
import toast from 'react-hot-toast';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPosts: 0,
        postsToday: 0,
        videosProcessed: 0,
        connectedPages: 0,
        totalEmployees: 8,
    });
    const [recentPosts, setRecentPosts] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch tất cả data trong 1 lần để giảm tải
            const [postsResponse, pagesResponse] = await Promise.all([
                postService.getAll(),
                pageService.getAll()
            ]);

            const posts = postsResponse.data || [];
            const pages = pagesResponse.data || [];

            // Calculate stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const postsToday = posts.filter(post => {
                const postDate = new Date(post.created_at);
                postDate.setHours(0, 0, 0, 0);
                return postDate.getTime() === today.getTime();
            }).length;

            const videosProcessed = posts.filter(post =>
                post.post_type === 'video' &&
                (post.status === 'published' || post.status === 'publishing')
            ).length;

            const connectedPages = pages.filter(page => page.status === 'connected').length;

            setStats({
                totalPosts: posts.length,
                postsToday: postsToday,
                videosProcessed: videosProcessed,
                connectedPages: connectedPages,
                totalEmployees: 8, // TODO: Get from API
            });

            // Get 5 recent posts
            const sortedPosts = posts
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            setRecentPosts(sortedPosts);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            published: { variant: 'success', label: 'Thành công' },
            publishing: { variant: 'warning', label: 'Đang xử lý' },
            failed: { variant: 'danger', label: 'Thất bại' },
            draft: { variant: 'default', label: 'Nháp' },
            scheduled: { variant: 'info', label: 'Đã lên lịch' },
        };
        return statusConfig[status] || { variant: 'default', label: status };
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return `${diffDays} ngày trước`;
    };

    if (loading) return <Loading fullScreen />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tổng bài đăng */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/posts')}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng bài đăng</p>
                            <p className="text-3xl font-bold text-blue-600 mb-2">{stats.totalPosts}</p>
                            <p className="text-xs text-green-600">+{stats.postsToday} hôm nay</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="text-blue-600" size={28} />
                        </div>
                    </div>
                </Card>

                {/* Video đã xử lý */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/posts')}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Video đã xử lý</p>
                            <p className="text-3xl font-bold text-green-600 mb-2">{stats.videosProcessed}</p>
                            <p className="text-xs text-green-600">+5 hôm nay</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Video className="text-green-600" size={28} />
                        </div>
                    </div>
                </Card>

                {/* Page kết nối */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/pages')}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Page kết nối</p>
                            <p className="text-3xl font-bold text-purple-600 mb-2">{stats.connectedPages}</p>
                            <p className="text-xs text-blue-600">2 mới kết nối</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Share2 className="text-purple-600" size={28} />
                        </div>
                    </div>
                </Card>

                {/* Nhân viên */}
                <Card className="hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Nhân viên</p>
                            <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalEmployees}</p>
                            <p className="text-xs text-gray-500">Tất cả hoạt động</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <Users className="text-gray-600" size={28} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Thao tác nhanh */}
            <Card title="Thao tác nhanh">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tạo bài đăng */}
                    <button
                        onClick={() => navigate('/posts/create')}
                        className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                        <div className="p-3 bg-blue-500 group-hover:bg-blue-600 rounded-lg transition-colors">
                            <Plus className="text-white" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-900">Tạo bài đăng</p>
                            <p className="text-xs text-gray-600">Đăng bài lên mạng xã hội</p>
                        </div>
                    </button>

                    {/* Upload video */}
                    <button
                        onClick={() => navigate('/media')}
                        className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                    >
                        <div className="p-3 bg-green-500 group-hover:bg-green-600 rounded-lg transition-colors">
                            <Upload className="text-white" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-900">Upload video</p>
                            <p className="text-xs text-gray-600">Tải video lên hệ thống</p>
                        </div>
                    </button>

                    {/* Thêm nhân viên */}
                    <button
                        onClick={() => navigate('/employees')}
                        className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                    >
                        <div className="p-3 bg-purple-500 group-hover:bg-purple-600 rounded-lg transition-colors">
                            <UserPlus className="text-white" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-900">Thêm nhân viên</p>
                            <p className="text-xs text-gray-600">Quản lý người dùng</p>
                        </div>
                    </button>
                </div>
            </Card>

            {/* Hoạt động gần đây */}
            <Card title="Hoạt động gần đây">
                <div className="space-y-3">
                    {recentPosts.length > 0 ? (
                        recentPosts.map((post) => {
                            const statusConfig = getStatusBadge(post.status);
                            return (
                                <div
                                    key={post.id}
                                    className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                    onClick={() => navigate(`/posts`)}
                                >
                                    {/* Icon based on post type */}
                                    <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                                        {post.post_type === 'video' ? (
                                            <Video className="text-gray-600" size={20} />
                                        ) : (
                                            <FileText className="text-gray-600" size={20} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-gray-900 truncate">
                                                {post.title || 'Bài viết không có tiêu đề'}
                                            </p>
                                            <Badge variant={statusConfig.variant} className="flex-shrink-0">
                                                {statusConfig.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate mt-1">
                                            {post.content?.substring(0, 60)}...
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {formatTimeAgo(post.created_at)}
                                            </span>
                                            <span>•</span>
                                            <span className="capitalize">{post.post_type}</span>
                                            {post.scheduled_at && (
                                                <>
                                                    <span>•</span>
                                                    <span>Lên lịch: {new Date(post.scheduled_at).toLocaleString('vi-VN')}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <FileText size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Chưa có hoạt động nào</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;
